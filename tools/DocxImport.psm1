#requires -version 5.1
<#
Modulo de importacion de examenes Oracle desde documentos .docx.

Reglas de negocio (ver AUDIT_REPORT.md, seccion 4, para la evidencia real que las justifica):
  - El texto original NUNCA se modifica, traduce ni recorta. Se concatenan los "runs" de Word
    tal cual, incluyendo saltos de linea manuales (<w:br/>) y tabulaciones (<w:tab/>).
  - El resaltado amarillo es la senal PRIMARIA de respuesta correcta (confirmado en los 4 documentos).
  - La negrita es SOLO una senal secundaria/reforzante: en Examen 1 aparece sobre el enunciado
    (no sobre respuestas), y en Examen 2 aparece tanto en la respuesta correcta como en un distractor
    sin resaltar. Por eso nunca se usa negrita en solitario como prueba suficiente; cuando es la unica
    senal disponible, la pregunta se marca "pending_review" con confianza reducida.
  - Las opciones se identifican por tener numeracion/lista real de Word (w:numPr). Los "Given:" o listas
    de hechos dentro del enunciado usan saltos de linea manuales con un caracter "•" literal, no w:numPr
    (verificado en Examen 4), asi que no se confunden con opciones.
#>

Set-StrictMode -Version Latest

# ---------------------------------------------------------------------------
# Utilidades XML de bajo nivel (usan local-name() para no depender del prefijo)
# ---------------------------------------------------------------------------

function Get-LocalNodes {
    param([System.Xml.XmlNode]$Node, [string]$LocalName)
    $Node.SelectNodes(".//*[local-name()='$LocalName']")
}

function Get-DirectLocalChild {
    param([System.Xml.XmlNode]$Node, [string]$LocalName)
    $Node.SelectSingleNode("./*[local-name()='$LocalName']")
}

function Get-LocalAttr {
    param([System.Xml.XmlNode]$Node, [string]$LocalName)
    if (-not $Node) { return $null }
    $attr = $Node.Attributes | Where-Object { $_.LocalName -eq $LocalName } | Select-Object -First 1
    if ($attr) { $attr.Value } else { $null }
}

# ---------------------------------------------------------------------------
# Apertura del paquete .docx (zip) y lectura de document.xml + relaciones
# ---------------------------------------------------------------------------

function Open-DocxPackage {
    param([Parameter(Mandatory)][string]$Path)

    Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction SilentlyContinue
    $zip = [System.IO.Compression.ZipFile]::OpenRead($Path)
    try {
        # Nota: algunos escritores de zip (incl. System.IO.Compression en Windows al empaquetar
        # un directorio) generan nombres de entrada con "\" en vez de "/". Los .docx reales usan
        # "/" (convencion OPC), pero normalizamos por si acaso para no depender de eso.
        $docEntry = $zip.Entries | Where-Object { ($_.FullName -replace '\\', '/') -eq 'word/document.xml' } | Select-Object -First 1
        if (-not $docEntry) { throw "El archivo '$Path' no contiene word/document.xml (no es un .docx valido)." }

        $reader = New-Object System.IO.StreamReader($docEntry.Open(), [System.Text.Encoding]::UTF8)
        $xmlText = $reader.ReadToEnd()
        $reader.Close()

        $xmlDoc = New-Object System.Xml.XmlDocument
        $xmlDoc.PreserveWhitespace = $true
        $xmlDoc.LoadXml($xmlText)

        # Mapa rId -> ruta de media (word/media/imageN.png) via word/_rels/document.xml.rels
        $relMap = @{}
        $relsEntry = $zip.Entries | Where-Object { ($_.FullName -replace '\\', '/') -eq 'word/_rels/document.xml.rels' } | Select-Object -First 1
        if ($relsEntry) {
            $relsReader = New-Object System.IO.StreamReader($relsEntry.Open(), [System.Text.Encoding]::UTF8)
            $relsXmlText = $relsReader.ReadToEnd()
            $relsReader.Close()
            $relsDoc = New-Object System.Xml.XmlDocument
            $relsDoc.LoadXml($relsXmlText)
            foreach ($rel in $relsDoc.SelectNodes("//*[local-name()='Relationship']")) {
                $id = Get-LocalAttr $rel 'Id'
                $target = Get-LocalAttr $rel 'Target'
                if ($id) { $relMap[$id] = $target }
            }
        }

        [PSCustomObject]@{
            Path       = $Path
            FileName   = Split-Path $Path -Leaf
            XmlDoc     = $xmlDoc
            RelMap     = $relMap
            ZipEntries = $zip.Entries
        }
    }
    finally {
        $zip.Dispose()
    }
}

function Export-DocxMedia {
    <# Copia a $OutDir las imagenes de word/media/* referenciadas por los rIds indicados. Devuelve rId -> ruta relativa exportada. #>
    param(
        [Parameter(Mandatory)][string]$DocxPath,
        [Parameter(Mandatory)][hashtable]$RelMap,
        [Parameter(Mandatory)][string[]]$RIds,
        [Parameter(Mandatory)][string]$OutDir
    )
    $result = @{}
    if (-not $RIds -or $RIds.Count -eq 0) { return $result }
    if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Force -Path $OutDir | Out-Null }

    Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction SilentlyContinue
    $zip = [System.IO.Compression.ZipFile]::OpenRead($DocxPath)
    try {
        foreach ($rid in ($RIds | Select-Object -Unique)) {
            $target = $RelMap[$rid]
            if (-not $target) { continue }
            $entryName = "word/" + ($target -replace '^\.?/*', '')
            $entry = $zip.Entries | Where-Object { ($_.FullName -replace '\\', '/') -eq $entryName } | Select-Object -First 1
            if (-not $entry) { continue }
            $destName = Split-Path $entryName -Leaf
            $destPath = Join-Path $OutDir $destName
            $in = $entry.Open()
            $out = [System.IO.File]::Create($destPath)
            try { $in.CopyTo($out) } finally { $out.Close(); $in.Close() }
            $result[$rid] = $destPath
        }
    }
    finally { $zip.Dispose() }
    $result
}

# ---------------------------------------------------------------------------
# Modelo de parrafo: runs con su texto y formato, mas referencias a imagenes
# ---------------------------------------------------------------------------

function ConvertTo-RunText {
    <# Reconstruye el texto de un <w:r>, preservando saltos de linea (w:br) y tabs (w:tab). #>
    param([System.Xml.XmlNode]$RunNode)
    $sb = New-Object System.Text.StringBuilder
    foreach ($child in $RunNode.ChildNodes) {
        switch ($child.LocalName) {
            't'   { [void]$sb.Append($child.InnerText) }
            'br'  { [void]$sb.Append("`n") }
            'tab' { [void]$sb.Append("`t") }
            default { }
        }
    }
    $sb.ToString()
}

function Test-RunBold {
    param([System.Xml.XmlNode]$RunNode)
    $rPr = Get-DirectLocalChild $RunNode 'rPr'
    if (-not $rPr) { return $false }
    $b = Get-DirectLocalChild $rPr 'b'
    if (-not $b) { return $false }
    $val = Get-LocalAttr $b 'val'
    if ($null -eq $val) { return $true }
    return $val -notin @('0', 'false', 'off')
}

function Get-RunHighlightColor {
    param([System.Xml.XmlNode]$RunNode)
    $rPr = Get-DirectLocalChild $RunNode 'rPr'
    if (-not $rPr) { return $null }
    $hl = Get-DirectLocalChild $rPr 'highlight'
    if (-not $hl) { return $null }
    Get-LocalAttr $hl 'val'
}

function Get-ParagraphModel {
    <#
      Convierte un <w:p> en un objeto:
        Text      - texto reconstruido completo del parrafo (concatenacion literal de sus runs)
        Runs      - lista de {Text, Bold, Highlight}
        NumId     - id de lista (w:numPr/w:numId/@w:val) o $null si el parrafo no es un item de lista
        ImageRIds - r:embed encontrados dentro del parrafo (drawings/imagenes)
    #>
    param([System.Xml.XmlNode]$ParagraphNode)

    $pPr = Get-DirectLocalChild $ParagraphNode 'pPr'
    $numId = $null
    if ($pPr) {
        $numPr = Get-DirectLocalChild $pPr 'numPr'
        if ($numPr) {
            $numIdNode = Get-DirectLocalChild $numPr 'numId'
            if ($numIdNode) { $numId = Get-LocalAttr $numIdNode 'val' }
        }
    }

    $runs = @()
    foreach ($runNode in $ParagraphNode.SelectNodes("./*[local-name()='r']")) {
        $runs += [PSCustomObject]@{
            Text      = ConvertTo-RunText $runNode
            Bold      = Test-RunBold $runNode
            Highlight = Get-RunHighlightColor $runNode
        }
    }

    $imageRIds = @()
    foreach ($blip in (Get-LocalNodes $ParagraphNode 'blip')) {
        $embed = $blip.Attributes | Where-Object { $_.LocalName -eq 'embed' } | Select-Object -First 1
        if ($embed) { $imageRIds += $embed.Value }
    }

    [PSCustomObject]@{
        Text      = ($runs | ForEach-Object { $_.Text }) -join ''
        Runs      = $runs
        NumId     = $numId
        ImageRIds = $imageRIds
    }
}

function Get-DocumentParagraphs {
    param([System.Xml.XmlDocument]$XmlDoc)
    $body = $XmlDoc.SelectSingleNode("//*[local-name()='body']")
    if (-not $body) { return @() }
    $paras = $body.SelectNodes("./*[local-name()='p']")
    $result = @()
    foreach ($p in $paras) { $result += Get-ParagraphModel $p }
    $result
}

# ---------------------------------------------------------------------------
# Segmentacion en preguntas
# ---------------------------------------------------------------------------

function Split-IntoQuestionBlocks {
    <# Agrupa los parrafos en bloques delimitados por "<numero>. Question". #>
    param([Parameter(Mandatory)][object[]]$Paragraphs)

    $markerPattern = '^\s*(\d+)\s*\.\s*Question\s*[:.]?\s*$'
    $blocks = @()
    $current = $null

    foreach ($p in $Paragraphs) {
        $trimmed = $p.Text.Trim()
        if ($trimmed -match $markerPattern) {
            if ($current) { $blocks += $current }
            $current = [PSCustomObject]@{
                QuestionNumber = [int]$Matches[1]
                Paragraphs     = New-Object System.Collections.Generic.List[object]
            }
            continue
        }
        if ($current) { $current.Paragraphs.Add($p) }
    }
    if ($current) { $blocks += $current }
    $blocks
}

# ---------------------------------------------------------------------------
# Clasificacion de tema y dificultad (heuristicas, documentadas y auditables)
# ---------------------------------------------------------------------------

# Nombres alineados literalmente con la lista minima de temas de la Fase 3.
$script:TopicKeywords = [ordered]@{
    'JOINS'                   = @('JOIN', 'INNER JOIN', 'OUTER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'CARTESIAN', 'CROSS JOIN', 'SELF JOIN')
    'Subqueries'              = @('SUBQUERY', 'NESTED', '(SELECT', 'CORRELATED')
    'GROUP BY'                = @('GROUP BY', 'ROLLUP', 'CUBE', 'GROUPING SETS')
    'HAVING'                  = @('HAVING')
    'Aggregate Functions'     = @('SUM(', 'AVG(', 'COUNT(', 'MAX(', 'MIN(')
    'Analytic Functions'      = @('OVER (', 'OVER(', 'PARTITION BY', 'RANK(', 'DENSE_RANK', 'ROW_NUMBER', 'LAG(', 'LEAD(')
    'Set Operators'           = @('UNION', 'INTERSECT', 'MINUS')
    'Constraints'             = @('CONSTRAINT', 'PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE', 'CHECK (', 'NOT NULL', 'REFERENCES')
    'Views'                   = @('CREATE VIEW', 'CREATE OR REPLACE VIEW')
    'Sequences'               = @('SEQUENCE', 'NEXTVAL', 'CURRVAL')
    'Synonyms'                = @('SYNONYM')
    'Indexes'                 = @('CREATE INDEX', 'INDEX')
    'Data Dictionary'         = @('USER_TABLES', 'ALL_TABLES', 'DBA_', 'USER_TAB_COLUMNS', 'DATA DICTIONARY')
    'DDL'                     = @('CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'TRUNCATE')
    'DML'                     = @('INSERT INTO', 'UPDATE ', 'DELETE FROM', 'MERGE INTO')
    'Transactions'            = @('COMMIT', 'ROLLBACK', 'SAVEPOINT')
    'Privileges'              = @('GRANT ', 'REVOKE ', 'PRIVILEGE')
    'Roles'                   = @('ROLE ')
    'Date Functions'          = @('SYSDATE', 'TO_DATE', 'MONTHS_BETWEEN', 'ADD_MONTHS', 'LAST_DAY', 'NEXT_DAY')
    'Character Functions'     = @('SUBSTR(', 'CONCAT(', 'INITCAP(', 'UPPER(', 'LOWER(', 'LPAD(', 'RPAD(', 'TRIM(', 'REPLACE(')
    'Numeric Functions'       = @('ROUND(', 'TRUNC(', 'MOD(', 'CEIL(', 'FLOOR(', 'POWER(')
    'Conversion Functions'    = @('TO_CHAR(', 'TO_NUMBER(', 'TO_DATE(', 'CAST(')
    'NULL Handling'           = @('NVL(', 'NVL2(', 'COALESCE(', 'NULLIF(', 'IS NULL', 'IS NOT NULL')
    'Conditional Expressions' = @('CASE WHEN', 'DECODE(')
    'ORDER BY'                = @('ORDER BY')
    'WHERE'                   = @('WHERE ')
    'Functions'               = @('LENGTH(', 'INSTR(', 'GREATEST(', 'LEAST(', 'USERENV(', 'SYS_CONTEXT(')
    'SELECT'                  = @('SELECT ')
}

function Get-QuestionTopics {
    <#
      Version multi-etiqueta: una pregunta puede tocar varios dominios Oracle a la vez
      (por ejemplo un JOIN con WHERE y ORDER BY). Devuelve todos los temas con al menos
      una coincidencia de palabra clave, ordenados por relevancia, limitados a 5 para
      evitar sobre-etiquetado. Si no hay ninguna coincidencia, devuelve @('Otros').
    #>
    param([string]$FullText)
    $upper = $FullText.ToUpperInvariant()
    $scored = @()
    foreach ($topicName in $script:TopicKeywords.Keys) {
        $score = 0
        foreach ($kw in $script:TopicKeywords[$topicName]) {
            if ($upper.Contains($kw)) { $score++ }
        }
        if ($score -gt 0) { $scored += [PSCustomObject]@{ Topic = $topicName; Score = $score } }
    }
    if ($scored.Count -eq 0) { return @('Otros') }
    @($scored | Sort-Object -Property Score -Descending | Select-Object -First 5 | ForEach-Object { $_.Topic })
}

function Get-ExpectedAnswerCount {
    <# Busca "Choose two/three/four/N" o "Select N" en el enunciado. Devuelve 1 si no encuentra nada. #>
    param([string]$StemText)
    $numberWords = @{ 'one' = 1; 'two' = 2; 'three' = 3; 'four' = 4; 'five' = 5 }
    if ($StemText -match '(?i)choose\s+(one|two|three|four|five|\d+)') {
        $word = $Matches[1].ToLowerInvariant()
        if ($numberWords.ContainsKey($word)) { return $numberWords[$word] }
        return [int]$word
    }
    if ($StemText -match '(?i)select\s+(one|two|three|four|five|\d+)\s+(option|answer|statement)') {
        $word = $Matches[1].ToLowerInvariant()
        if ($numberWords.ContainsKey($word)) { return $numberWords[$word] }
        return [int]$word
    }
    1
}

function Get-InitialDifficulty {
    <#
      Heuristica documentada (ver AUDIT_REPORT.md / especificacion):
      combina longitud del enunciado, num. de opciones, num. de respuestas correctas,
      presencia de SQL, similitud entre distractores y uso de "Choose N".
      Devuelve {Level:1-5, Rationale:string} - nunca modifica el texto original.
    #>
    param(
        [string]$StemText,
        [string[]]$OptionTexts,
        [int]$CorrectCount,
        [int]$ExpectedAnswerCount
    )
    $score = 0
    $reasons = New-Object System.Collections.Generic.List[string]

    if ($StemText.Length -gt 400) { $score += 1; $reasons.Add('enunciado largo') }
    if ($OptionTexts.Count -ge 5) { $score += 1; $reasons.Add('5+ opciones') }
    if ($ExpectedAnswerCount -gt 1) { $score += 2; $reasons.Add("requiere $ExpectedAnswerCount respuestas (Choose $ExpectedAnswerCount)") }

    $sqlIndicators = @('SELECT ', 'FROM ', 'WHERE ', 'JOIN', 'GROUP BY', 'ORDER BY', 'UPDATE ', 'DELETE ', 'INSERT ')
    $combined = ($StemText + ' ' + ($OptionTexts -join ' ')).ToUpperInvariant()
    $sqlHits = @($sqlIndicators | Where-Object { $combined.Contains($_) }).Count
    if ($sqlHits -ge 1) { $score += 1; $reasons.Add('contiene codigo SQL') }
    if ($sqlHits -ge 3) { $score += 1; $reasons.Add('combina varias clausulas SQL') }

    # Distractores muy parecidos entre si (mismo prefijo largo) sugieren mayor dificultad.
    if ($OptionTexts.Count -ge 2) {
        $prefixLen = 12
        $prefixes = @($OptionTexts | ForEach-Object { if ($_.Length -ge $prefixLen) { $_.Substring(0, $prefixLen) } else { $_ } })
        $uniquePrefixes = @($prefixes | Select-Object -Unique)
        if ($uniquePrefixes.Count -lt $OptionTexts.Count) { $score += 1; $reasons.Add('distractores muy similares entre si') }
    }

    $level = 1 + [Math]::Min(4, $score)
    if ($level -lt 1) { $level = 1 }
    if ($level -gt 5) { $level = 5 }

    [PSCustomObject]@{
        Level     = $level
        Rationale = ($reasons -join '; ')
    }
}

# ---------------------------------------------------------------------------
# Deteccion de respuestas correctas (resaltado amarillo = primario, negrita = secundario)
# ---------------------------------------------------------------------------

function Get-OptionSignal {
    <# Calcula, para una opcion (parrafo), la cobertura de resaltado amarillo y de negrita sobre su texto. #>
    param([object]$OptionParagraph)

    $totalChars = 0
    $highlightChars = 0
    $boldChars = 0
    foreach ($run in $OptionParagraph.Runs) {
        $len = ($run.Text -replace '\s', '').Length
        if ($len -eq 0) { continue }
        $totalChars += $len
        if ($run.Highlight -and $run.Highlight.ToLowerInvariant() -eq 'yellow') { $highlightChars += $len }
        if ($run.Bold) { $boldChars += $len }
    }
    $highlightRatio = if ($totalChars -gt 0) { $highlightChars / $totalChars } else { 0 }
    $boldRatio = if ($totalChars -gt 0) { $boldChars / $totalChars } else { 0 }

    [PSCustomObject]@{
        HighlightRatio = $highlightRatio
        BoldRatio      = $boldRatio
        IsHighlighted  = $highlightRatio -ge 0.6
        IsBold         = $boldRatio -ge 0.6
    }
}

function Resolve-CorrectAnswers {
    <#
      Aplica la regla documentada: el resaltado amarillo es autoritativo cuando existe en el bloque.
      La negrita solo se usa si NINGUNA opcion del bloque tiene resaltado, y en ese caso el resultado
      queda marcado como confianza reducida ("bold-only") en lugar de asumirse como seguro.
    #>
    param([object[]]$OptionSignals)

    $anyHighlight = @($OptionSignals | Where-Object { $_.IsHighlighted })
    if ($anyHighlight.Count -gt 0) {
        $method = @('yellow-highlight')
        $anyBoldToo = @($OptionSignals | Where-Object { $_.IsHighlighted -and $_.IsBold })
        if ($anyBoldToo.Count -gt 0) { $method += 'bold' }
        return [PSCustomObject]@{
            CorrectIndexes = @($OptionSignals | ForEach-Object { $_ } | Where-Object { $_.IsHighlighted } | ForEach-Object { [array]::IndexOf($OptionSignals, $_) })
            Method         = $method
            BoldOnly       = $false
        }
    }

    $anyBold = @($OptionSignals | Where-Object { $_.IsBold })
    if ($anyBold.Count -gt 0) {
        return [PSCustomObject]@{
            CorrectIndexes = @($OptionSignals | ForEach-Object { $_ } | Where-Object { $_.IsBold } | ForEach-Object { [array]::IndexOf($OptionSignals, $_) })
            Method         = @('bold')
            BoldOnly       = $true
        }
    }

    [PSCustomObject]@{ CorrectIndexes = @(); Method = @(); BoldOnly = $false }
}

# ---------------------------------------------------------------------------
# Hash de contenido (duplicados exactos / normalizados)
# ---------------------------------------------------------------------------

function Get-ContentHash {
    param([string]$Text)
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
        $hashBytes = $sha.ComputeHash($bytes)
        -join ($hashBytes | ForEach-Object { $_.ToString('x2') })
    }
    finally { $sha.Dispose() }
}

function Get-NormalizedText {
    param([string]$Text)
    ($Text.Trim() -replace '\s+', ' ').ToLowerInvariant()
}

# ---------------------------------------------------------------------------
# contentBlocks: representacion ordenada del enunciado (texto / sql / imagen),
# tal como aparece en el documento original -- nunca se reconstruye solo con
# el texto plano. No genera bloques "table": las tablas del examen solo
# existen como imagen (ver AUDIT_REPORT.md), asi que se representan como
# bloques "image" en vez de fingir una estructura de filas/columnas que no
# se ha extraido.
# ---------------------------------------------------------------------------

function Test-LooksLikeSql {
    <#
      Ojo: enunciados en ingles perfectamente normales contienen las palabras sueltas
      "from" y "where" (p.ej. "Display X from the table where Y = Z"). Contarlas como
      palabras clave de SQL sin mas produce falsos positivos reales (confirmado con los
      documentos originales: "Display PRODUCT_NAME from the table where the CATEGORY_ID..."
      se clasificaba como bloque SQL sin serlo). Por eso el patron combinado SELECT...FROM
      y los marcadores multi-palabra inequivocos son el criterio, nunca una palabra suelta.
    #>
    param([string]$Text)
    $trimmedUpper = $Text.Trim().ToUpperInvariant()
    $starters = @('SELECT ', 'INSERT ', 'UPDATE ', 'DELETE ', 'CREATE ', 'ALTER ', 'DROP ', 'MERGE ', 'GRANT ', 'REVOKE ', 'TRUNCATE ')
    foreach ($s in $starters) { if ($trimmedUpper.StartsWith($s)) { return $true } }
    if ($trimmedUpper -match 'SELECT\b.*\bFROM\b') { return $true }
    $unambiguous = @('GROUP BY', 'ORDER BY', 'INSERT INTO', 'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE', 'MERGE INTO')
    foreach ($kw in $unambiguous) { if ($trimmedUpper.Contains($kw)) { return $true } }
    $false
}

function Get-StemContentBlocks {
    <#
      Recorre los parrafos del enunciado en su orden real y produce una lista de bloques
      {type: text|sql|image, text|path}. type=image usa las rutas ya exportadas por
      Export-DocxMedia (mapa rId -> ruta). Si una pregunta no tiene imagenes, solo se
      generan bloques text/sql.
    #>
    param(
        [Parameter(Mandatory)][object[]]$StemParagraphs,
        [hashtable]$ExportedImageMap
    )
    $blocks = @()
    foreach ($p in $StemParagraphs) {
        $text = $p.Text.Trim()
        if ($text.Length -gt 0) {
            $type = if (Test-LooksLikeSql $text) { 'sql' } else { 'text' }
            $blocks += [PSCustomObject]@{ type = $type; text = $text }
        }
        if ($p.ImageRIds -and $p.ImageRIds.Count -gt 0 -and $ExportedImageMap) {
            foreach ($rid in $p.ImageRIds) {
                if ($ExportedImageMap.ContainsKey($rid)) {
                    $blocks += [PSCustomObject]@{
                        type = 'image'
                        path = $ExportedImageMap[$rid]
                        note = 'Captura original del documento (posible tabla/exhibit). No se ha reconstruido como tabla estructurada; ver AUDIT_REPORT.md.'
                    }
                }
            }
        }
    }
    @($blocks)
}

# ---------------------------------------------------------------------------
# Pipeline principal: construccion de objetos "Question" a partir de un bloque
# ---------------------------------------------------------------------------

function ConvertTo-QuestionObject {
    param(
        [Parameter(Mandatory)][object]$Block,
        [Parameter(Mandatory)][string]$SourceFile,
        [Parameter(Mandatory)][int]$SourcePosition,
        [string]$DocxPath,
        [hashtable]$RelMap,
        [string]$MediaOutDir
    )

    $stemParagraphs = @($Block.Paragraphs | Where-Object { -not $_.NumId })
    $optionParagraphs = @($Block.Paragraphs | Where-Object { $_.NumId -and $_.Text.Trim().Length -gt 0 })

    $stemText = (($stemParagraphs | ForEach-Object { $_.Text }) -join "`n").Trim()
    $optionTexts = @($optionParagraphs | ForEach-Object { $_.Text.Trim() })

    $warnings = New-Object System.Collections.Generic.List[string]

    $optionSignals = @($optionParagraphs | ForEach-Object { Get-OptionSignal $_ })
    $resolution = Resolve-CorrectAnswers -OptionSignals $optionSignals

    $expectedCount = Get-ExpectedAnswerCount -StemText $stemText

    $letters = @()
    for ($i = 0; $i -lt $optionTexts.Count; $i++) { $letters += [char](65 + $i) }

    $correctLetters = @($resolution.CorrectIndexes | Sort-Object | ForEach-Object { $letters[$_] })

    $options = @()
    for ($i = 0; $i -lt $optionTexts.Count; $i++) {
        $options += [PSCustomObject]@{
            id        = $letters[$i]
            text      = $optionTexts[$i]
            isCorrect = ($i -in $resolution.CorrectIndexes)
        }
    }

    $confidence = 0.98
    $reviewReasons = New-Object System.Collections.Generic.List[string]

    if ($optionTexts.Count -eq 0) {
        $confidence = 0.05
        $reviewReasons.Add('no se detectaron opciones con formato de lista (posible pregunta basada solo en imagen/exhibit)')
    }
    elseif ($resolution.CorrectIndexes.Count -eq 0) {
        $confidence = 0.05
        $reviewReasons.Add('no se detecto ninguna marca de solucion (ni resaltado amarillo ni negrita)')
    }
    else {
        if ($resolution.BoldOnly) {
            $confidence -= 0.35
            $reviewReasons.Add('la unica senal de solucion es negrita, sin resaltado amarillo (confianza reducida)')
        }
        if ($resolution.CorrectIndexes.Count -ne $expectedCount) {
            $confidence -= 0.25
            $reviewReasons.Add("el enunciado indica $expectedCount respuesta(s) pero se detectaron $($resolution.CorrectIndexes.Count)")
        }
        if ($optionTexts.Count -lt 2 -or $optionTexts.Count -gt 8) {
            $confidence -= 0.2
            $reviewReasons.Add("numero de opciones inusual ($($optionTexts.Count))")
        }
    }

    $imageRIds = @($Block.Paragraphs | ForEach-Object { $_.ImageRIds } | Where-Object { $_ })
    $exported = @{}
    if ($imageRIds.Count -gt 0) {
        $reviewReasons.Add('la pregunta incluye una imagen (tabla/exhibit); verificar manualmente que el contenido visual es correcto')
        $confidence -= 0.1
        if ($DocxPath -and $RelMap -and $MediaOutDir) {
            $exported = Export-DocxMedia -DocxPath $DocxPath -RelMap $RelMap -RIds $imageRIds -OutDir $MediaOutDir
        }
    }

    $contentBlocks = @(Get-StemContentBlocks -StemParagraphs $stemParagraphs -ExportedImageMap $exported)
    # exhibitImages se deriva de los bloques (orden real del documento) en vez de enumerar
    # un hashtable, cuyo orden no esta garantizado.
    $exhibitImages = @($contentBlocks | Where-Object { $_.type -eq 'image' } | ForEach-Object { $_.path })
    # Imagenes que pudieran colgar de una opcion en vez del enunciado (raro, pero no se descarta).
    foreach ($optPara in $optionParagraphs) {
        foreach ($rid in $optPara.ImageRIds) {
            if ($exported.ContainsKey($rid) -and ($exhibitImages -notcontains $exported[$rid])) {
                $exhibitImages += $exported[$rid]
            }
        }
    }

    if ($confidence -lt 0) { $confidence = 0 }
    $confidence = [Math]::Round($confidence, 2)

    $questionType = 'single-choice'
    if ($expectedCount -gt 1) { $questionType = 'multiple-choice' }
    elseif ($optionTexts.Count -eq 2 -and ($optionTexts | ForEach-Object { $_.ToLowerInvariant() }) -contains 'true' -and ($optionTexts | ForEach-Object { $_.ToLowerInvariant() }) -contains 'false') {
        $questionType = 'true-false'
    }
    elseif ($optionTexts.Count -eq 0) {
        $questionType = 'unclassified'
        $warnings.Add('sin opciones detectables: posible pregunta de tipo output-prediction/exhibit no representable como opcion multiple')
    }

    $topics = @(Get-QuestionTopics -FullText ($stemText + ' ' + ($optionTexts -join ' ')))
    $difficulty = Get-InitialDifficulty -StemText $stemText -OptionTexts $optionTexts -CorrectCount $resolution.CorrectIndexes.Count -ExpectedAnswerCount $expectedCount

    $reviewStatus = if ($confidence -ge 0.75 -and $reviewReasons.Count -eq 0) { 'validated' } else { 'pending_review' }

    $fileSlug = ($SourceFile -replace '\.docx$', '') -replace '[^a-zA-Z0-9]+', '-'
    $fileSlug = $fileSlug.Trim('-').ToLowerInvariant()
    $id = "$fileSlug-q$SourcePosition"

    $normalizedForHash = (Get-NormalizedText $stemText) + '||' + (($optionTexts | ForEach-Object { Get-NormalizedText $_ }) -join '||')

    [PSCustomObject]@{
        id                      = $id
        sourceFile              = $SourceFile
        sourcePosition          = $SourcePosition
        questionNumber          = $Block.QuestionNumber
        questionText            = $stemText
        contentBlocks           = $contentBlocks
        options                 = $options
        correctAnswers          = $correctLetters
        solutionDetectionMethod = $resolution.Method
        expectedAnswerCount     = $expectedCount
        extractionConfidence    = $confidence
        questionType            = $questionType
        topic                   = $topics[0]
        topics                  = $topics
        initialDifficulty       = $difficulty.Level
        dynamicDifficulty       = $difficulty.Level
        difficultyRationale     = $difficulty.Rationale
        reviewStatus            = $reviewStatus
        reviewReasons           = @($reviewReasons)
        warnings                = @($warnings)
        exhibitImages           = $exhibitImages
        contentHash             = Get-ContentHash $normalizedForHash
        importedAt              = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
        duplicateOf             = $null
    }
}

# ---------------------------------------------------------------------------
# Deteccion de duplicados (exactos por hash normalizado)
# ---------------------------------------------------------------------------

function Mark-Duplicates {
    param([Parameter(Mandatory)][object[]]$Questions)

    $seen = @{}
    foreach ($q in $Questions) {
        if ($seen.ContainsKey($q.contentHash)) {
            $q.reviewStatus = 'duplicate'
            $q.duplicateOf = $seen[$q.contentHash]
            if (-not $q.reviewReasons) { $q.reviewReasons = @() }
            $q.reviewReasons += "duplicado de '$($seen[$q.contentHash])' (mismo texto normalizado)"
        }
        else {
            $seen[$q.contentHash] = $q.id
        }
    }
    $Questions
}

# ---------------------------------------------------------------------------
# Importacion de un archivo completo
# ---------------------------------------------------------------------------

function Import-ExamDocx {
    param(
        [Parameter(Mandatory)][string]$Path,
        [string]$MediaOutDir
    )

    $pkg = Open-DocxPackage -Path $Path
    $paragraphs = @(Get-DocumentParagraphs -XmlDoc $pkg.XmlDoc)
    $blocks = @(Split-IntoQuestionBlocks -Paragraphs $paragraphs)

    $fileMediaDir = $null
    if ($MediaOutDir) {
        $fileSlug = ($pkg.FileName -replace '\.docx$', '') -replace '[^a-zA-Z0-9]+', '-'
        $fileMediaDir = Join-Path $MediaOutDir $fileSlug.Trim('-').ToLowerInvariant()
    }

    $questions = @()
    $pos = 0
    foreach ($block in $blocks) {
        $pos++
        $questions += ConvertTo-QuestionObject -Block $block -SourceFile $pkg.FileName -SourcePosition $pos `
            -DocxPath $pkg.Path -RelMap $pkg.RelMap -MediaOutDir $fileMediaDir
    }

    [PSCustomObject]@{
        FileName      = $pkg.FileName
        Path          = $pkg.Path
        QuestionCount = $questions.Count
        Questions     = $questions
    }
}

Export-ModuleMember -Function *

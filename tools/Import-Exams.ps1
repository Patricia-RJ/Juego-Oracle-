#requires -version 5.1
<#
Importador de examenes Oracle desde Exámenes/*.docx.

Uso:
  powershell -File tools/Import-Exams.ps1

Se puede volver a ejecutar en cualquier momento (por ejemplo tras anadir documentos nuevos a
Exámenes/): vuelve a procesar todos los .docx presentes y regenera la salida al completo.

Salida (todo bajo data/certification-bank/, fuera de data.js/script.js -- no toca la interfaz):
  data/certification-bank/raw/<archivo>.json      - preguntas crudas de cada documento
  data/certification-bank/certification-bank.json - banco combinado de todas las preguntas
  data/certification-bank/certification-bank.js   - mismo banco como variable JS (para <script>, sin fetch/servidor)
  data/certification-bank/media/<archivo>/...      - imagenes (tablas/exhibits) extraidas, con ruta relativa al proyecto
  data/certification-bank/import-report.json      - informe de la importacion (para el panel admin)
  data/certification-bank/import-report.js        - mismo informe como variable JS
  data/certification-bank/import-report.md        - mismo informe en formato legible
#>

param(
    [string]$SourceDir,
    [string]$OutDir = (Join-Path $PSScriptRoot '..\data\certification-bank')
)

$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'DocxImport.psm1') -Force

$projectRoot = Split-Path $PSScriptRoot -Parent

if (-not $SourceDir) {
    # Se resuelve por patron (en vez de escribir el nombre acentuado en el .ps1) para no depender
    # de la codificacion con la que se guarde/lea este script en distintos equipos.
    $candidate = Get-ChildItem -Path $projectRoot -Directory | Where-Object { $_.Name -like 'Ex?menes' } | Select-Object -First 1
    if ($candidate) { $SourceDir = $candidate.FullName } else { $SourceDir = Join-Path $projectRoot 'Examenes' }
}

function ConvertTo-WebPath {
    <# Convierte una ruta absoluta de disco (dentro del proyecto) en una ruta relativa
       con "/" para usar en <img src="..."> desde index.html (que vive en la raiz del proyecto). #>
    param([string]$AbsolutePath)
    $full = (Resolve-Path -LiteralPath $AbsolutePath).Path
    $rootFull = (Resolve-Path -LiteralPath $projectRoot).Path
    if ($full.StartsWith($rootFull, [StringComparison]::OrdinalIgnoreCase)) {
        $rel = $full.Substring($rootFull.Length).TrimStart('\', '/')
        return ($rel -replace '\\', '/')
    }
    ($full -replace '\\', '/')
}

function Write-Section($title) {
    Write-Host ''
    Write-Host "== $title ==" -ForegroundColor Cyan
}

if (-not (Test-Path $SourceDir)) {
    throw "No se encuentra la carpeta de examenes: $SourceDir"
}

$rawDir = Join-Path $OutDir 'raw'
$mediaDir = Join-Path $OutDir 'media'
New-Item -ItemType Directory -Force -Path $rawDir | Out-Null
New-Item -ItemType Directory -Force -Path $mediaDir | Out-Null

# Diff frente a una importacion previa, si existe, para el informe ("nuevas" vs "sin cambios" vs "cambiadas").
$previousHashes = @{}
$previousBankPath = Join-Path $OutDir 'certification-bank.json'
if (Test-Path $previousBankPath) {
    try {
        $prev = Get-Content $previousBankPath -Raw | ConvertFrom-Json
        foreach ($q in $prev) { $previousHashes[$q.id] = $q.contentHash }
    }
    catch { Write-Warning "No se pudo leer la importacion previa para comparar cambios: $_" }
}

$docxFiles = @(Get-ChildItem -Path $SourceDir -Filter '*.docx' -File | Where-Object { $_.Name -notlike '~$*' })
if ($docxFiles.Count -eq 0) {
    Write-Warning "No se encontraron archivos .docx en $SourceDir"
}

Write-Section "Archivos encontrados"
$docxFiles | ForEach-Object { Write-Host " - $($_.Name)" }

$allQuestions = @()
$fileErrors = @()
$fileResults = @()

foreach ($file in $docxFiles) {
    Write-Section "Procesando $($file.Name)"
    try {
        $result = Import-ExamDocx -Path $file.FullName -MediaOutDir $mediaDir
        foreach ($q in $result.Questions) {
            $q.exhibitImages = @($q.exhibitImages | ForEach-Object { ConvertTo-WebPath $_ })
            foreach ($block in $q.contentBlocks) {
                if ($block.type -eq 'image') { $block.path = ConvertTo-WebPath $block.path }
            }
        }
        $fileResults += $result
        $allQuestions += $result.Questions
        Write-Host " -> $($result.QuestionCount) preguntas detectadas" -ForegroundColor Green

        $rawPath = (Join-Path $rawDir ($file.BaseName -replace '[^a-zA-Z0-9\- ]', '_')) + '.json'
        $result.Questions | ConvertTo-Json -Depth 8 | Set-Content -Path $rawPath -Encoding UTF8
    }
    catch {
        Write-Host " -> ERROR: $_" -ForegroundColor Red
        $fileErrors += [PSCustomObject]@{ file = $file.Name; error = $_.ToString() }
    }
}

Write-Section "Deteccion de duplicados"
$allQuestions = @(Mark-Duplicates -Questions $allQuestions)
$dupCount = @($allQuestions | Where-Object { $_.reviewStatus -eq 'duplicate' }).Count
Write-Host " -> $dupCount preguntas marcadas como duplicadas"

# Comparacion con la importacion anterior (si existia)
$newCount = 0; $unchangedCount = 0; $changedCount = 0
foreach ($q in $allQuestions) {
    if (-not $previousHashes.ContainsKey($q.id)) { $newCount++ }
    elseif ($previousHashes[$q.id] -eq $q.contentHash) { $unchangedCount++ }
    else { $changedCount++ }
}

Write-Section "Guardando banco combinado"
$allQuestions | ConvertTo-Json -Depth 8 | Set-Content -Path (Join-Path $OutDir 'certification-bank.json') -Encoding UTF8
Write-Host " -> $(Join-Path $OutDir 'certification-bank.json')"

# ---------------------------------------------------------------------------
# Informe de importacion
# ---------------------------------------------------------------------------

$withYellow = @($allQuestions | Where-Object { $_.solutionDetectionMethod -contains 'yellow-highlight' }).Count
$withBold = @($allQuestions | Where-Object { $_.solutionDetectionMethod -contains 'bold' }).Count
$withBoth = @($allQuestions | Where-Object { $_.solutionDetectionMethod -contains 'yellow-highlight' -and $_.solutionDetectionMethod -contains 'bold' }).Count
$multiAnswer = @($allQuestions | Where-Object { $_.correctAnswers.Count -gt 1 }).Count
$pendingReview = @($allQuestions | Where-Object { $_.reviewStatus -eq 'pending_review' }).Count
$noSolution = @($allQuestions | Where-Object { $_.correctAnswers.Count -eq 0 }).Count

$byDifficulty = @($allQuestions | Group-Object initialDifficulty | Sort-Object Name | ForEach-Object {
    [PSCustomObject]@{ level = $_.Name; count = $_.Count }
})
$byTopic = @($allQuestions | Group-Object topic | Sort-Object Count -Descending | ForEach-Object {
    [PSCustomObject]@{ topic = $_.Name; count = $_.Count }
})

# ---------------------------------------------------------------------------
# Validaciones (no se ocultan silenciosamente: se listan en el informe para
# que el panel de administracion las pueda mostrar).
# ---------------------------------------------------------------------------

$noOptions = @($allQuestions | Where-Object { $_.options.Count -eq 0 } | ForEach-Object { $_.id })
$noContentBlocks = @($allQuestions | Where-Object { $_.contentBlocks.Count -eq 0 } | ForEach-Object { $_.id })
$missingImages = @()
foreach ($q in $allQuestions) {
    foreach ($img in $q.exhibitImages) {
        if (-not (Test-Path -LiteralPath $img)) { $missingImages += [PSCustomObject]@{ id = $q.id; path = $img } }
    }
}
$countMismatch = @($allQuestions | Where-Object { $_.correctAnswers.Count -gt 0 -and $_.correctAnswers.Count -ne $_.expectedAnswerCount } | ForEach-Object { $_.id })

$report = [PSCustomObject]@{
    generatedAt         = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
    filesFound          = $docxFiles.Count
    filesProcessedOk     = $fileResults.Count
    filesWithErrors      = $fileErrors.Count
    totalQuestions       = $allQuestions.Count
    withYellowHighlight  = $withYellow
    withBold             = $withBold
    withBothMethods      = $withBoth
    multiAnswerQuestions = $multiAnswer
    duplicateQuestions   = $dupCount
    pendingReview        = $pendingReview
    withoutSolution      = $noSolution
    newSinceLastImport      = $newCount
    unchangedSinceLastImport = $unchangedCount
    changedSinceLastImport  = $changedCount
    byDifficulty         = $byDifficulty
    byTopic              = $byTopic
    errors               = $fileErrors
    validation           = [PSCustomObject]@{
        questionsWithoutOptions       = $noOptions
        questionsWithoutContentBlocks = $noContentBlocks
        missingImages                 = $missingImages
        answerCountMismatch           = $countMismatch
    }
}

$report | ConvertTo-Json -Depth 8 | Set-Content -Path (Join-Path $OutDir 'import-report.json') -Encoding UTF8

$md = New-Object System.Text.StringBuilder
[void]$md.AppendLine("# Informe de importacion de examenes Oracle")
[void]$md.AppendLine("")
[void]$md.AppendLine("Generado: $($report.generatedAt)")
[void]$md.AppendLine("")
[void]$md.AppendLine("| Metrica | Valor |")
[void]$md.AppendLine("|---|---|")
[void]$md.AppendLine("| Archivos encontrados | $($report.filesFound) |")
[void]$md.AppendLine("| Archivos procesados sin error | $($report.filesProcessedOk) |")
[void]$md.AppendLine("| Archivos con error | $($report.filesWithErrors) |")
[void]$md.AppendLine("| Total de preguntas | $($report.totalQuestions) |")
[void]$md.AppendLine("| Con resaltado amarillo | $($report.withYellowHighlight) |")
[void]$md.AppendLine("| Con negrita | $($report.withBold) |")
[void]$md.AppendLine("| Con ambos metodos | $($report.withBothMethods) |")
[void]$md.AppendLine("| Con varias respuestas correctas | $($report.multiAnswerQuestions) |")
[void]$md.AppendLine("| Duplicadas | $($report.duplicateQuestions) |")
[void]$md.AppendLine("| Pendientes de revision | $($report.pendingReview) |")
[void]$md.AppendLine("| Sin solucion detectada | $($report.withoutSolution) |")
[void]$md.AppendLine("| Nuevas desde la ultima importacion | $($report.newSinceLastImport) |")
[void]$md.AppendLine("| Sin cambios desde la ultima importacion | $($report.unchangedSinceLastImport) |")
[void]$md.AppendLine("| Cambiadas desde la ultima importacion | $($report.changedSinceLastImport) |")
[void]$md.AppendLine("")
[void]$md.AppendLine("## Distribucion por dificultad")
[void]$md.AppendLine("")
foreach ($d in $byDifficulty) { [void]$md.AppendLine("- Nivel $($d.level): $($d.count) preguntas") }
[void]$md.AppendLine("")
[void]$md.AppendLine("## Distribucion por tema")
[void]$md.AppendLine("")
foreach ($t in $byTopic) { [void]$md.AppendLine("- $($t.topic): $($t.count) preguntas") }
if ($fileErrors.Count -gt 0) {
    [void]$md.AppendLine("")
    [void]$md.AppendLine("## Errores")
    [void]$md.AppendLine("")
    foreach ($e in $fileErrors) { [void]$md.AppendLine("- **$($e.file)**: $($e.error)") }
}
[void]$md.AppendLine("")
[void]$md.AppendLine("## Validaciones")
[void]$md.AppendLine("")
[void]$md.AppendLine("- Preguntas sin opciones: $($noOptions.Count)")
[void]$md.AppendLine("- Preguntas sin contentBlocks: $($noContentBlocks.Count)")
[void]$md.AppendLine("- Imagenes referenciadas que no existen en disco: $($missingImages.Count)")
[void]$md.AppendLine("- Preguntas donde el numero de respuestas detectadas no coincide con 'Choose N': $($countMismatch.Count)")
$md.ToString() | Set-Content -Path (Join-Path $OutDir 'import-report.md') -Encoding UTF8

# ---------------------------------------------------------------------------
# Espejos .js (para poder abrir index.html con doble clic, sin servidor ni
# fetch() -- igual que data.js -- en vez de depender de fetch() sobre file://,
# que la mayoria de navegadores bloquea por CORS).
# ---------------------------------------------------------------------------

Write-Section "Generando espejos .js para la interfaz"
$bankJson = $allQuestions | ConvertTo-Json -Depth 8
"const CERTIFICATION_BANK = $bankJson;" | Set-Content -Path (Join-Path $OutDir 'certification-bank.js') -Encoding UTF8
Write-Host " -> $(Join-Path $OutDir 'certification-bank.js')"

$reportJson = $report | ConvertTo-Json -Depth 8
"const CERTIFICATION_IMPORT_REPORT = $reportJson;" | Set-Content -Path (Join-Path $OutDir 'import-report.js') -Encoding UTF8
Write-Host " -> $(Join-Path $OutDir 'import-report.js')"

Write-Section "Resumen"
Write-Host " Preguntas totales:        $($report.totalQuestions)"
Write-Host " Con resaltado amarillo:   $($report.withYellowHighlight)"
Write-Host " Con negrita:              $($report.withBold)"
Write-Host " Con varias respuestas:    $($report.multiAnswerQuestions)"
Write-Host " Duplicadas:               $($report.duplicateQuestions)"
Write-Host " Pendientes de revision:   $($report.pendingReview)"
Write-Host " Sin solucion detectada:   $($report.withoutSolution)"
Write-Host ""
Write-Host "Informe completo en: $(Join-Path $OutDir 'import-report.md')"

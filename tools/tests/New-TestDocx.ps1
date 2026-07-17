#requires -version 5.1
<#
Construye un .docx minimo valido a partir de un fragmento de <w:body> ya escrito a mano,
para poder probar el parser (DocxImport.psm1) con casos pequenos y controlados sin
depender de los examenes reales. Ver "Pruebas obligatorias" / "Crea casos de prueba con
documentos pequenos antes de procesar toda la carpeta" en la especificacion de la Fase 2.
#>

function New-TestDocx {
    param(
        [Parameter(Mandatory)][string]$BodyXml,
        [Parameter(Mandatory)][string]$Path
    )

    $tmp = Join-Path ([System.IO.Path]::GetTempPath()) ("docxtest_" + [System.Guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Force -Path $tmp | Out-Null
    New-Item -ItemType Directory -Force -Path (Join-Path $tmp '_rels') | Out-Null
    New-Item -ItemType Directory -Force -Path (Join-Path $tmp 'word') | Out-Null
    New-Item -ItemType Directory -Force -Path (Join-Path $tmp 'word\_rels') | Out-Null

    $contentTypes = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>
'@
    Set-Content -LiteralPath (Join-Path $tmp '[Content_Types].xml') -Value $contentTypes -Encoding UTF8

    $rootRels = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
'@
    Set-Content -LiteralPath (Join-Path $tmp '_rels\.rels') -Value $rootRels -Encoding UTF8

    $docRels = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>
'@
    Set-Content -LiteralPath (Join-Path $tmp 'word\_rels\document.xml.rels') -Value $docRels -Encoding UTF8

    $document = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
$BodyXml
  </w:body>
</w:document>
"@
    Set-Content -LiteralPath (Join-Path $tmp 'word\document.xml') -Value $document -Encoding UTF8

    if (Test-Path $Path) { Remove-Item $Path -Force }
    Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction SilentlyContinue
    [System.IO.Compression.ZipFile]::CreateFromDirectory($tmp, $Path, [System.IO.Compression.CompressionLevel]::Fastest, $false)
    Remove-Item $tmp -Recurse -Force
}

function New-Paragraph {
    <# Helper para construir un <w:p> a partir de una lista de runs {Text, Bold, Highlight} y, opcionalmente, un NumId. #>
    param(
        [Parameter(Mandatory)][object[]]$Runs,
        [string]$NumId = $null
    )
    $pPr = ''
    if ($NumId) {
        $pPr = "<w:pPr><w:numPr><w:ilvl w:val=`"0`"/><w:numId w:val=`"$NumId`"/></w:numPr></w:pPr>"
    }
    $runsXml = ($Runs | ForEach-Object {
        $rPrParts = @()
        if ($_.Bold) { $rPrParts += '<w:b/>' }
        if ($_.Highlight) { $rPrParts += "<w:highlight w:val=`"$($_.Highlight)`"/>" }
        $rPr = if ($rPrParts.Count -gt 0) { "<w:rPr>$($rPrParts -join '')</w:rPr>" } else { '' }
        $textXml = if ($_.Break) { '<w:br/>' } else { "<w:t xml:space=`"preserve`">$([System.Security.SecurityElement]::Escape($_.Text))</w:t>" }
        "<w:r>$rPr$textXml</w:r>"
    }) -join ''
    "<w:p>$pPr$runsXml</w:p>"
}

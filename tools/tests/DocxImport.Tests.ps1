#requires -version 5.1
<#
Pruebas unitarias del importador (DocxImport.psm1) usando documentos .docx pequenos
generados en memoria (no los examenes reales). Ejecutar con:
  Invoke-Pester tools/tests
#>

$moduleRoot = Split-Path $PSScriptRoot -Parent
Import-Module (Join-Path $moduleRoot 'DocxImport.psm1') -Force
. (Join-Path $PSScriptRoot 'New-TestDocx.ps1')

$script:TestDocxDir = Join-Path ([System.IO.Path]::GetTempPath()) 'oracle-quest-import-tests'
New-Item -ItemType Directory -Force -Path $TestDocxDir | Out-Null

function Build-And-Import {
    param([string]$Body, [string]$Name)
    $path = Join-Path $TestDocxDir "$Name.docx"
    New-TestDocx -BodyXml $Body -Path $path
    Import-ExamDocx -Path $path
}

Describe 'Conservacion literal del texto' {
    It 'no modifica ni una palabra del enunciado ni la puntuacion/mayusculas' {
        $body = (New-Paragraph -Runs @(@{ Text = '1. Question' })) +
                (New-Paragraph -Runs @(@{ Text = 'View, and examine; the ORDER_ITEMS Table!' })) +
                (New-Paragraph -Runs @(@{ Text = 'Option Uno' }) -NumId '1') +
                (New-Paragraph -Runs @(@{ Text = 'Option Dos'; Highlight = 'yellow' }) -NumId '1')
        $result = Build-And-Import -Body $body -Name 'literal'
        $result.Questions[0].questionText | Should Be 'View, and examine; the ORDER_ITEMS Table!'
        $result.Questions[0].options[0].text | Should Be 'Option Uno'
        $result.Questions[0].options[1].text | Should Be 'Option Dos'
    }
}

Describe 'Deteccion por resaltado amarillo' {
    It 'marca como correcta la opcion resaltada en amarillo' {
        $body = (New-Paragraph -Runs @(@{ Text = '1. Question' })) +
                (New-Paragraph -Runs @(@{ Text = 'Pick the right one.' })) +
                (New-Paragraph -Runs @(@{ Text = 'Wrong answer' }) -NumId '1') +
                (New-Paragraph -Runs @(@{ Text = 'Right answer'; Highlight = 'yellow' }) -NumId '1') +
                (New-Paragraph -Runs @(@{ Text = 'Another wrong one' }) -NumId '1')
        $result = Build-And-Import -Body $body -Name 'highlight-basic'
        $q = $result.Questions[0]
        $q.correctAnswers | Should Be @('B')
        $q.solutionDetectionMethod | Should Be @('yellow-highlight')
        $q.reviewStatus | Should Be 'validated'
    }

    It 'detecta dos respuestas correctas cuando el enunciado dice Choose two' {
        $body = (New-Paragraph -Runs @(@{ Text = '1. Question' })) +
                (New-Paragraph -Runs @(@{ Text = 'Identify two SQL statements which would execute successfully. (Choose two)' })) +
                (New-Paragraph -Runs @(@{ Text = 'First correct'; Highlight = 'yellow' }) -NumId '1') +
                (New-Paragraph -Runs @(@{ Text = 'Wrong option' }) -NumId '1') +
                (New-Paragraph -Runs @(@{ Text = 'Second correct'; Highlight = 'yellow' }) -NumId '1') +
                (New-Paragraph -Runs @(@{ Text = 'Another wrong option' }) -NumId '1')
        $result = Build-And-Import -Body $body -Name 'choose-two'
        $q = $result.Questions[0]
        $q.correctAnswers | Should Be @('A', 'C')
        $q.expectedAnswerCount | Should Be 2
        $q.reviewStatus | Should Be 'validated'
        $q.questionType | Should Be 'multiple-choice'
    }
}

Describe 'La negrita nunca es la unica prueba suficiente' {
    It 'no confunde la negrita del enunciado (titulo) con una respuesta' {
        $body = (New-Paragraph -Runs @(@{ Text = '1. Question' })) +
                (New-Paragraph -Runs @(@{ Text = 'View and examine the structure of the PROGRAMS table.'; Bold = $true })) +
                (New-Paragraph -Runs @(@{ Text = 'Option A text' }) -NumId '1') +
                (New-Paragraph -Runs @(@{ Text = 'Option B text'; Highlight = 'yellow' }) -NumId '1')
        $result = Build-And-Import -Body $body -Name 'bold-heading'
        $q = $result.Questions[0]
        # La negrita esta en el enunciado (que no tiene NumId), nunca llega a evaluarse como opcion.
        $q.correctAnswers | Should Be @('B')
        $q.solutionDetectionMethod | Should Be @('yellow-highlight')
    }

    It 'si la unica senal es negrita en una opcion, la marca pending_review con confianza reducida' {
        $body = (New-Paragraph -Runs @(@{ Text = '1. Question' })) +
                (New-Paragraph -Runs @(@{ Text = 'Pick one.' })) +
                (New-Paragraph -Runs @(@{ Text = 'Plain option' }) -NumId '1') +
                (New-Paragraph -Runs @(@{ Text = 'Bold option'; Bold = $true }) -NumId '1')
        $result = Build-And-Import -Body $body -Name 'bold-only'
        $q = $result.Questions[0]
        $q.correctAnswers | Should Be @('B')
        $q.solutionDetectionMethod | Should Be @('bold')
        $q.reviewStatus | Should Be 'pending_review'
        $q.extractionConfidence | Should BeLessThan 0.75
        ($q.reviewReasons -join ' ') | Should Match 'negrita'
    }

    It 'usa negrita + resaltado juntos como metodo reforzado sin penalizar la confianza' {
        $body = (New-Paragraph -Runs @(@{ Text = '1. Question' })) +
                (New-Paragraph -Runs @(@{ Text = 'Pick one.' })) +
                (New-Paragraph -Runs @(@{ Text = 'Plain option' }) -NumId '1') +
                (New-Paragraph -Runs @(@{ Text = 'Bold and highlighted'; Bold = $true; Highlight = 'yellow' }) -NumId '1')
        $result = Build-And-Import -Body $body -Name 'bold-and-highlight'
        $q = $result.Questions[0]
        $q.correctAnswers | Should Be @('B')
        $q.solutionDetectionMethod | Should Be @('yellow-highlight', 'bold')
        $q.reviewStatus | Should Be 'validated'
    }
}

Describe 'Preguntas sin solucion detectable' {
    It 'no inventa una respuesta cuando no hay ninguna marca' {
        $body = (New-Paragraph -Runs @(@{ Text = '1. Question' })) +
                (New-Paragraph -Runs @(@{ Text = 'Pick one.' })) +
                (New-Paragraph -Runs @(@{ Text = 'Option A' }) -NumId '1') +
                (New-Paragraph -Runs @(@{ Text = 'Option B' }) -NumId '1')
        $result = Build-And-Import -Body $body -Name 'no-signal'
        $q = $result.Questions[0]
        $q.correctAnswers | Should BeNullOrEmpty
        $q.reviewStatus | Should Be 'pending_review'
        $q.extractionConfidence | Should BeLessThan 0.5
    }
}

Describe 'Consistencia entre Choose N y respuestas detectadas' {
    It 'marca revision cuando el numero detectado no coincide con Choose two' {
        $body = (New-Paragraph -Runs @(@{ Text = '1. Question' })) +
                (New-Paragraph -Runs @(@{ Text = 'Identify two options. (Choose two)' })) +
                (New-Paragraph -Runs @(@{ Text = 'Only one highlighted'; Highlight = 'yellow' }) -NumId '1') +
                (New-Paragraph -Runs @(@{ Text = 'Not highlighted' }) -NumId '1')
        $result = Build-And-Import -Body $body -Name 'mismatch-count'
        $q = $result.Questions[0]
        $q.expectedAnswerCount | Should Be 2
        $q.correctAnswers.Count | Should Be 1
        $q.reviewStatus | Should Be 'pending_review'
        ($q.reviewReasons -join ' ') | Should Match 'respuesta'
    }
}

Describe 'Preservacion de saltos de linea (codigo SQL)' {
    It 'conserva un salto de linea manual dentro de una opcion' {
        $body = (New-Paragraph -Runs @(@{ Text = '1. Question' })) +
                (New-Paragraph -Runs @(@{ Text = 'Which query is valid?' })) +
                (New-Paragraph -Runs @(
                    @{ Text = 'SELECT * FROM dual' },
                    @{ Break = $true },
                    @{ Text = 'WHERE 1=1;' }
                ) -NumId '1') +
                (New-Paragraph -Runs @(@{ Text = 'SELECT 1 FROM wrong;'; Highlight = 'yellow' }) -NumId '1')
        $result = Build-And-Import -Body $body -Name 'linebreak'
        $result.Questions[0].options[0].text | Should Be "SELECT * FROM dual`nWHERE 1=1;"
    }
}

Describe 'Tipo de pregunta True/False' {
    It 'detecta una pregunta True/False por sus opciones' {
        $body = (New-Paragraph -Runs @(@{ Text = '1. Question' })) +
                (New-Paragraph -Runs @(@{ Text = 'ROWNUM is a pseudocolumn. True or False?' })) +
                (New-Paragraph -Runs @(@{ Text = 'True'; Highlight = 'yellow' }) -NumId '1') +
                (New-Paragraph -Runs @(@{ Text = 'False' }) -NumId '1')
        $result = Build-And-Import -Body $body -Name 'truefalse'
        $result.Questions[0].questionType | Should Be 'true-false'
    }
}

Describe 'Deteccion de duplicados' {
    It 'marca como duplicada una pregunta con texto identico' {
        $q1 = (New-Paragraph -Runs @(@{ Text = '1. Question' })) +
              (New-Paragraph -Runs @(@{ Text = 'Same question text.' })) +
              (New-Paragraph -Runs @(@{ Text = 'Opt A'; Highlight = 'yellow' }) -NumId '1') +
              (New-Paragraph -Runs @(@{ Text = 'Opt B' }) -NumId '1')
        $q2 = (New-Paragraph -Runs @(@{ Text = '2. Question' })) +
              (New-Paragraph -Runs @(@{ Text = 'Same question text.' })) +
              (New-Paragraph -Runs @(@{ Text = 'Opt A'; Highlight = 'yellow' }) -NumId '2') +
              (New-Paragraph -Runs @(@{ Text = 'Opt B' }) -NumId '2')
        $result = Build-And-Import -Body ($q1 + $q2) -Name 'dup'
        $marked = Mark-Duplicates -Questions $result.Questions
        $marked[0].reviewStatus | Should Not Be 'duplicate'
        $marked[1].reviewStatus | Should Be 'duplicate'
        $marked[1].duplicateOf | Should Be $marked[0].id
    }

    It 'considera duplicadas dos preguntas que solo difieren en espacios/formato' {
        $q1 = (New-Paragraph -Runs @(@{ Text = '1. Question' })) +
              (New-Paragraph -Runs @(@{ Text = 'Pick the right value.' })) +
              (New-Paragraph -Runs @(@{ Text = 'Opt A'; Highlight = 'yellow' }) -NumId '1') +
              (New-Paragraph -Runs @(@{ Text = 'Opt B' }) -NumId '1')
        $q2 = (New-Paragraph -Runs @(@{ Text = '2. Question' })) +
              (New-Paragraph -Runs @(@{ Text = '  Pick   the right value.  ' })) +
              (New-Paragraph -Runs @(@{ Text = 'Opt A'; Highlight = 'yellow' }) -NumId '2') +
              (New-Paragraph -Runs @(@{ Text = 'Opt B' }) -NumId '2')
        $result = Build-And-Import -Body ($q1 + $q2) -Name 'dup-format'
        $marked = Mark-Duplicates -Questions $result.Questions
        $marked[1].reviewStatus | Should Be 'duplicate'
    }
}

Describe 'Clasificacion tematica multi-etiqueta' {
    It 'clasifica una pregunta con JOIN y WHERE con varias etiquetas, incluyendo JOINS' {
        $body = (New-Paragraph -Runs @(@{ Text = '1. Question' })) +
                (New-Paragraph -Runs @(@{ Text = 'Examine this query: SELECT * FROM a INNER JOIN b ON a.id = b.id WHERE a.id > 1;' })) +
                (New-Paragraph -Runs @(@{ Text = 'Correct'; Highlight = 'yellow' }) -NumId '1') +
                (New-Paragraph -Runs @(@{ Text = 'Incorrect' }) -NumId '1')
        $result = Build-And-Import -Body $body -Name 'topic-join'
        $q = $result.Questions[0]
        ($q.topics -contains 'JOINS') | Should Be $true
        ($q.topics -contains 'WHERE') | Should Be $true
        $q.topic | Should Be $q.topics[0]
    }

    It 'usa Otros cuando no reconoce ningun dominio' {
        $body = (New-Paragraph -Runs @(@{ Text = '1. Question' })) +
                (New-Paragraph -Runs @(@{ Text = 'What color is the sky in this made-up scenario?' })) +
                (New-Paragraph -Runs @(@{ Text = 'Blue'; Highlight = 'yellow' }) -NumId '1') +
                (New-Paragraph -Runs @(@{ Text = 'Green' }) -NumId '1')
        $result = Build-And-Import -Body $body -Name 'topic-otros'
        $result.Questions[0].topics | Should Be @('Otros')
    }
}

Describe 'Prueba de integracion sobre un examen real (Examen 4.docx, el mas pequeno)' {
    $projectRoot = Split-Path $moduleRoot -Parent
    $examDir = Get-ChildItem -Path $projectRoot -Directory | Where-Object { $_.Name -like 'Ex?menes' } | Select-Object -First 1
    $realFile = if ($examDir) { Join-Path $examDir.FullName 'Examen 4.docx' } else { $null }

    It 'procesa el documento real sin excepciones y produce preguntas validas' {
        Test-Path $realFile | Should Be $true
        $result = Import-ExamDocx -Path $realFile
        $result.Questions.Count | Should BeGreaterThan 5
        foreach ($q in $result.Questions) {
            $q.id | Should Not BeNullOrEmpty
            $q.questionText | Should Not BeNullOrEmpty
            $q.contentBlocks.Count | Should BeGreaterThan 0
            $q.contentHash | Should Not BeNullOrEmpty
        }
    }

    It 'genera al menos un bloque de tipo image enlazado a un archivo que existe en disco' {
        $mediaOut = Join-Path $TestDocxDir 'media-examen4'
        $result = Import-ExamDocx -Path $realFile -MediaOutDir $mediaOut
        $withImage = @($result.Questions | Where-Object { ($_.contentBlocks | Where-Object { $_.type -eq 'image' }).Count -gt 0 })
        $withImage.Count | Should BeGreaterThan 0
        $firstImageBlock = $withImage[0].contentBlocks | Where-Object { $_.type -eq 'image' } | Select-Object -First 1
        Test-Path $firstImageBlock.path | Should Be $true
    }

    It 'conserva literalmente el texto conocido de la primera pregunta (PROGRAMS, Choose two)' {
        $result = Import-ExamDocx -Path $realFile
        $q1 = $result.Questions | Where-Object { $_.sourcePosition -eq 1 }
        $q1.questionText | Should Match 'PROGRAMS'
        $q1.expectedAnswerCount | Should Be 2
        $q1.correctAnswers.Count | Should Be 2
    }
}

Describe 'contentBlocks: representacion ordenada del enunciado' {
    It 'genera un bloque de texto por cada parrafo del enunciado, en orden' {
        $body = (New-Paragraph -Runs @(@{ Text = '1. Question' })) +
                (New-Paragraph -Runs @(@{ Text = 'View and examine the structure of the FOO table.' })) +
                (New-Paragraph -Runs @(@{ Text = 'Identify the correct statement.' })) +
                (New-Paragraph -Runs @(@{ Text = 'Right'; Highlight = 'yellow' }) -NumId '1') +
                (New-Paragraph -Runs @(@{ Text = 'Wrong' }) -NumId '1')
        $result = Build-And-Import -Body $body -Name 'blocks-text-order'
        $blocks = $result.Questions[0].contentBlocks
        $blocks.Count | Should Be 2
        $blocks[0].type | Should Be 'text'
        $blocks[0].text | Should Be 'View and examine the structure of the FOO table.'
        $blocks[1].type | Should Be 'text'
        $blocks[1].text | Should Be 'Identify the correct statement.'
    }

    It 'marca como bloque sql un parrafo del enunciado que contiene una sentencia SQL' {
        $body = (New-Paragraph -Runs @(@{ Text = '1. Question' })) +
                (New-Paragraph -Runs @(@{ Text = 'Examine the following statement.' })) +
                (New-Paragraph -Runs @(@{ Text = 'SELECT * FROM employees WHERE salary > 1000 ORDER BY salary;' })) +
                (New-Paragraph -Runs @(@{ Text = 'What does it return?' })) +
                (New-Paragraph -Runs @(@{ Text = 'Right'; Highlight = 'yellow' }) -NumId '1') +
                (New-Paragraph -Runs @(@{ Text = 'Wrong' }) -NumId '1')
        $result = Build-And-Import -Body $body -Name 'blocks-sql'
        $blocks = $result.Questions[0].contentBlocks
        $blocks.Count | Should Be 3
        $blocks[1].type | Should Be 'sql'
        $blocks[1].text | Should Be 'SELECT * FROM employees WHERE salary > 1000 ORDER BY salary;'
    }

    It 'no confunde una frase en ingles con "from"/"where" sueltos con una sentencia SQL' {
        $body = (New-Paragraph -Runs @(@{ Text = '1. Question' })) +
                (New-Paragraph -Runs @(@{ Text = 'Required: Display PRODUCT_NAME from the table where the CATEGORY_ID column has values 12 or 13.' })) +
                (New-Paragraph -Runs @(@{ Text = 'Right'; Highlight = 'yellow' }) -NumId '1') +
                (New-Paragraph -Runs @(@{ Text = 'Wrong' }) -NumId '1')
        $result = Build-And-Import -Body $body -Name 'blocks-not-sql'
        $result.Questions[0].contentBlocks[0].type | Should Be 'text'
    }

    It 'conserva questionText igual que antes (compatibilidad) ademas de contentBlocks' {
        $body = (New-Paragraph -Runs @(@{ Text = '1. Question' })) +
                (New-Paragraph -Runs @(@{ Text = 'Line one.' })) +
                (New-Paragraph -Runs @(@{ Text = 'Line two.' })) +
                (New-Paragraph -Runs @(@{ Text = 'Right'; Highlight = 'yellow' }) -NumId '1') +
                (New-Paragraph -Runs @(@{ Text = 'Wrong' }) -NumId '1')
        $result = Build-And-Import -Body $body -Name 'blocks-compat'
        $result.Questions[0].questionText | Should Be "Line one.`nLine two."
    }
}

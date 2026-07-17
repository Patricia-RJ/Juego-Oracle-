# Importador de examenes Oracle (Fase 2)

Convierte los `.docx` de `Exámenes/` en un banco de preguntas reutilizable, sin tocar la interfaz
de la app (`index.html`, `script.js`, `data.js`, `styles.css` no se modifican en esta fase).

## Como ejecutarlo

```powershell
powershell -File tools/Import-Exams.ps1
```

Se puede volver a ejecutar en cualquier momento (por ejemplo al anadir un `Examen 5.docx` a
`Exámenes/`): vuelve a procesar todos los `.docx` presentes y regenera la salida al completo. El
informe indica cuantas preguntas son nuevas, cuantas no han cambiado y cuantas han cambiado de
contenido desde la ultima ejecucion (comparando `contentHash` por `id`).

No requiere Node ni ninguna dependencia externa: usa PowerShell 5.1 + .NET (incluido en Windows).

## Salida

Todo bajo `data/certification-bank/`:

- `certification-bank.json` — banco combinado de las preguntas de los 4 documentos, con el
  esquema de trazabilidad completo (ver mas abajo).
- `raw/<archivo>.json` — preguntas de cada documento por separado.
- `media/<archivo>/imageN.png` — imagenes (tablas/"exhibits") incrustadas, copiadas y enlazadas a
  su pregunta via `exhibitImages`.
- `import-report.json` / `import-report.md` — metricas de la importacion (para el futuro panel de
  administración de la Fase 5).

## Reglas de deteccion (resumen; la evidencia completa esta en `AUDIT_REPORT.md` seccion 4)

- **El resaltado amarillo es la senal primaria y autoritativa** de respuesta correcta.
- **La negrita nunca decide por si sola.** Si una opcion tiene negrita pero ninguna opcion del
  bloque tiene resaltado, se marca correcta igualmente pero con `solutionDetectionMethod: ["bold"]`,
  confianza reducida y `reviewStatus: "pending_review"` — nunca se asume "segura".
- **Las opciones se identifican por tener numeracion/lista real de Word** (`w:numPr`), no por texto
  literal "A./B./C.". Las listas de hechos dentro del enunciado (p. ej. "Given: • ...") usan saltos
  de linea manuales con un caracter "•" literal, no `w:numPr`, así que no se confunden con opciones
  (verificado contra los 4 documentos reales).
- El texto **nunca se traduce, corrige ni recorta**: se concatenan los "runs" de Word tal cual,
  incluyendo saltos de linea manuales (`<w:br/>`) dentro de una misma opcion (código SQL en varias
  líneas).

## Resultado de la ultima ejecucion sobre los 4 documentos reales

| Métrica | Valor |
|---|---|
| Preguntas importadas | 145 |
| Con resaltado amarillo | 139 |
| Con negrita | 18 (siempre junto a resaltado o marcadas de baja confianza) |
| Con varias respuestas correctas | 80 |
| Duplicadas exactas detectadas | 2 |
| Sin solucion detectable (no inventada) | 6 |
| Pendientes de revision manual | 111 (la mayoría por incluir una imagen/tabla no verificable automáticamente) |

Todas las cifras se pueden reproducir ejecutando el script; están también en
`data/certification-bank/import-report.md`.

## Limitaciones conocidas (documentadas, no ocultas)

1. **Preguntas con imagen ("exhibit")**: cuando la pregunta depende de una tabla de datos o un
   resultado que solo existe como imagen, el importador extrae y enlaza la imagen pero **no valida
   su contenido** (no se hace OCR, ver AUDIT_REPORT.md). Estas preguntas siempre quedan en
   `pending_review`, aunque la deteccion de la respuesta correcta haya sido perfecta.
2. **Listas de opciones inusualmente largas (>8)**: en unos pocos casos (12 de 145 preguntas) el
   bloque de opciones detectado por `w:numPr` incluye contenido adicional despues de las opciones
   reales (por ejemplo notas explicativas con su propia numeracion). El importador no lo intenta
   adivinar: simplemente lo senala como anomalia (`"numero de opciones inusual (N)"`) y fuerza
   revision manual. No se ha descartado ninguna pregunta por esto, solo se ha marcado.
3. **Clasificacion de tema**: es un emparejamiento de palabras clave (SQL), no un clasificador
   entrenado. Preguntas sin vocabulario SQL reconocible caen en "Sin clasificar" (14 de 145).
4. **Duplicados**: se detectan duplicados con texto identico tras normalizar espacios/mayúsculas.
   No se ha implementado deteccion de duplicados parafraseados (dos preguntas con el mismo fondo
   pero palabras distintas) — quedaría para una fase posterior si se necesita.

## Pruebas

```powershell
Import-Module Pester -RequiredVersion 3.4.0 -Force
Invoke-Pester -Script tools/tests/DocxImport.Tests.ps1
```

13 pruebas unitarias sobre documentos `.docx` sintéticos generados en memoria (no sobre los
exámenes reales), cubriendo: conservación literal del texto, detección por resaltado amarillo,
detección de "Choose two", no confundir negrita de título con respuesta, negrita como única señal
(confianza reducida), negrita+resaltado combinados, preguntas sin solución detectable,
inconsistencia entre "Choose two" y respuestas detectadas, preservación de saltos de línea en SQL,
detección de True/False, detección de duplicados (exactos y con diferencias de formato), y
clasificación temática básica.

## Que NO hace todavía esta fase

- No modifica `index.html`, `script.js`, `data.js` ni `styles.css`.
- No integra estas preguntas en ningún modo de estudio de la app.
- No implementa el panel de administración (Fase 5) — el `import-report` esta pensado para
  alimentarlo, no lo sustituye.
- No calcula estadísticas de uso real ni dificultad dinámica (Fase 7).

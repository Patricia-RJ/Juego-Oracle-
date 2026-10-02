# Informe — Ampliación del banco de preguntas a 800 (Examen 15)

## 0. Metodología de conteo (Fase 1 — por qué no se asumió "714")

Antes de generar nada se auditó el estado real del proyecto:

- `data/certification-bank/certification-bank.json` tenía **754** preguntas (no 714: el banco
  había crecido en una sesión de trabajo anterior a esta, al reimportar los Exámenes 1–4 con sus
  versiones reformateadas).
- De esas 754, **4 quedan excluidas de `export/`** porque el propio banco las marca
  `pending_review` sin una respuesta verificable con seguridad (`examen-5-q7`, `examen-5-q27`,
  `examen-6-q2`, `examen-2-q36`): son preguntas reales del material original con ambigüedad
  irresoluble (opciones duplicadas, o menos respuestas correctas detectables que las que pide el
  enunciado), documentadas así desde auditorías anteriores de este mismo proyecto.
- Por tanto, el número de **preguntas válidas/exportables** antes de esta tarea era **750**, no 754
  ni 714.

Se tomó **750 (el total exportable)** como base para el objetivo de 800, por ser la cifra que
representa preguntas realmente utilizables, no preguntas "en el JSON pero sin respuesta fiable".
Resultado: **800 − 750 = 50 preguntas nuevas**, todas incluidas en un examen nuevo (Examen 15) sin
ninguna ambigüedad, por lo que las 50 entran directamente en `export/` sin exclusiones.

## 1. Resultado final

| Métrica | Antes | Después |
|---|---|---|
| Preguntas en `certification-bank.json` (total) | 754 | **804** |
| Preguntas exportables/válidas (`export/exams/*.json`) | 750 | **800** |
| Exámenes | 14 | **15** |
| Preguntas excluidas de export (pending_review sin respuesta verificable) | 4 | 4 (sin cambios; ninguna de las 50 nuevas tiene este problema) |

**Total final: exactamente 800 preguntas válidas en `export/`.**

## 2. El nuevo examen: Examen 15

- Archivo fuente: `Exámenes/Examen 15.docx` (mismo formato que los exámenes 1–4/9–13: línea
  "Correcta(s): X" + negrita en la opción correcta, en vez de resaltado amarillo).
- `sourceFile` en el banco: `"Examen 15.docx"` · ids `examen-15-q1` … `examen-15-q50`.
- **Todas las 50 preguntas son originales**, redactadas para este proyecto a partir de hechos
  reales de Oracle SQL (no son preguntas existentes reformuladas ni plantillas con nombres
  cambiados). Verificado contra las 754 preguntas anteriores con el detector de
  casi-duplicados de `export/validate.js` (similitud de texto + firma de contenido): **0
  coincidencias** de Examen 15 contra el resto del banco.
- **50/50 importadas con `reviewStatus: "validated"`** por `tools/import_exams.py` (confianza
  0.98, sin ninguna revisión pendiente) — se usó el importador real del proyecto, no una
  inserción manual del JSON, para que el examen sea reproducible igual que los demás.
- Verificación cruzada: las 50 respuestas correctas y el número de opciones extraídas por el
  importador coinciden 1:1 con lo que se pretendía al redactar cada pregunta (comprobado
  programáticamente, 0 discrepancias).

## 3. Por qué estos temas (Fase 2 — material teórico usado)

Se leyeron completos ambos documentos teóricos:

- **`Módulo 4 SQL.pdf`** (49 páginas): fundamentos de BBDD, SELECT/FROM/WHERE/AS, funciones de
  agregación, ORDER BY, GROUP BY/HAVING, los 5 tipos de JOIN, subconsultas (WHERE/SELECT/FROM,
  EXISTS/NOT EXISTS), vistas, CTEs, tablas temporales.
- **`SQL POWER POINT.pdf`** (64 páginas): DDL (CREATE/ALTER/DROP TABLE), restricciones (PRIMARY
  KEY/FOREIGN KEY/UNIQUE/CHECK), DML (INSERT/UPDATE/DELETE), triggers, GRANT/REVOKE.

**Aviso importante detectado y respetado**: ambos documentos usan sintaxis SQL genérica/PostgreSQL
(DBeaver, base de datos Chinook, `LIMIT`/`OFFSET`, comillas dobles para identificadores, `YEAR()`),
no sintaxis Oracle. Siguiendo la instrucción explícita de "no inventar sintaxis de Oracle" y "no
hacer una traducción literal de la teoría", el material teórico se usó **solo para confirmar qué
conceptos entran dentro del temario** (SELECT, WHERE, agregación, JOIN, subconsultas, vistas, DDL,
restricciones, DML, privilegios), nunca para copiar su sintaxis. Toda la sintaxis SQL de las 50
preguntas nuevas es Oracle real (TO_CHAR, NVL, SYSDATE, MERGE, secuencias con NEXTVAL/CURRVAL,
sinónimos, roles, privilegios de sistema vs. de objeto, etc.), contrastada con el estilo ya
existente en `certification-bank.json` y con el comportamiento documentado de Oracle Database.

Se cruzó la distribución de temas ya existente (`data/certification-bank/import-report.json`)
para detectar qué áreas del temario 1Z0-071 estaban infrarrepresentadas como tema **principal**
de una pregunta, aunque corresponden al temario real:

| Tema | Antes (como tema principal) | Nuevas añadidas |
|---|---|---|
| Views | 0 | 4 |
| Roles | 1 | 2 |
| Character Functions | 2 | 4 |
| Numeric Functions | 3 | 3 |
| Synonyms | 4 | 3 |
| Conversion Functions | 8 | 4 |
| Indexes | 8 | 2 |
| Sequences | 7 | 3 |
| HAVING | 7 | 2 |
| NULL Handling | 10 | 2 |
| Date Functions | 18 | 4 |
| Data Dictionary | 15 | 3 |
| GROUP BY | 5 | 1 |
| Set Operators | 13 | 1 |
| Transactions | 39 | 2 |
| Privileges | 23 | 2 |
| DML | 13 | 2 |
| DDL | 16 | 2 |
| Constraints | 81 | 2 |
| Subqueries | 40 | 1 |
| JOINS | 53 | 1 |

No se forzaron temas ajenos al temario (por ejemplo, funciones analíticas con `OVER`/`PARTITION
BY` no se incluyeron: no están cubiertas por el material ni por el banco existente, y no
corresponden al nivel Associate de 1Z0-071).

## 4. Distribución de las 50 preguntas nuevas

**Por categoría (esquema de 5 categorías usado en `export/`):**

| Categoría | Preguntas |
|---|---|
| Consultas y funciones | 20 |
| Manipulación y definición de datos | 20 |
| Seguridad y diccionario de datos | 7 |
| Combinación de datos | 3 |
| Otros | 0 |

**Por tipo de respuesta:**

- Respuesta única (`single-choice`): **41**
- Varias respuestas (`multiple-choice`, "Choose TWO"): **9**

**Preguntas con imagen: 0** (decisión deliberada — ver Fase 5 más abajo).

**Por dificultad inicial** (misma escala 1–5 que el resto del banco): nivel 1: 6 · nivel 2: 17 ·
nivel 3: 8 · nivel 4: 11 · nivel 5: 8. Mezcla similar a la del resto del banco (predominan los
niveles 2–5), para no hacer el examen nuevo notablemente más fácil que los anteriores.

## 5. Fase 4 — Validación técnica de cada pregunta

Cada una de las 50 preguntas se verificó manualmente, calculando el resultado real en Oracle antes
de fijar la respuesta correcta (mismo método usado en las auditorías anteriores de este proyecto:
sin acceso a una base de datos Oracle real, se razona la sintaxis/semántica paso a paso). Ejemplos
de verificación aplicada:

- `SUBSTR('ORACLE DATABASE', -8, 4)` → se contó la cadena carácter a carácter desde el final para
  confirmar que la posición -8 cae en la 'D' de DATABASE, dando `DATA`.
- `ADD_MONTHS(DATE '2024-01-31', 1)` → se aplicó la regla documentada de Oracle (si la fecha de
  partida es el último día de su mes, el resultado es el último día del mes de destino) para
  confirmar `29-FEB-2024` (2024 es bisiesto), no un error ni `31-FEB-2024`.
- `TO_CHAR(fecha, 'fmMonth DD, YYYY')` → se confirmó que el uso de mayúscula solo en la inicial del
  modelo de formato (`Month`, no `MONTH`) determina que la salida sea `June`, no `JUNE` — este es
  precisamente el tipo de distinción que generó errores reales en preguntas antiguas del banco
  (ver sección 7), así que se prestó especial atención a no repetir ese fallo en sentido contrario.
- Preguntas de "Choose TWO": se revisaron **todas** las opciones una por una para confirmar que
  exactamente 2 son verdaderas y las demás son falsas (no 1, no 3). Este chequeo encontró y
  corrigió **3 preguntas** durante la redacción, antes de incorporarlas al banco, donde una
  tercera opción resultó ser también cierta sin que fuera intencional (ver sección 6).

Validación estructural automática (`export/validate.js` + comparación programática contra la
intención original):

- 0 IDs duplicados · 0 bankIds duplicados · 0 opciones duplicadas reales dentro de una pregunta ·
  0 respuestas correctas que referencien una letra inexistente · 0 errores de single/multiple vs.
  número de respuestas · 0 discrepancias entre "Choose N" y las respuestas marcadas · 0 rutas de
  imagen rotas · 0 preguntas equivalentes a otra ya existente en el banco (0 avisos de
  casi-duplicado para Examen 15, frente a ~99 avisos ya preexistentes entre los demás 14 exámenes).

## 6. Errores encontrados y corregidos **durante la redacción** (antes de incorporar las preguntas)

Estos no son errores del banco antiguo, sino fallos propios detectados y corregidos en esta misma
tarea, antes de dar las preguntas por buenas:

| Pregunta (borrador) | Problema detectado | Corrección aplicada |
|---|---|---|
| COALESCE (Choose TWO) | Una 3ª opción ("COALESCE(commission_pct,0) equivale a NVL(commission_pct,0) con dos argumentos") era también cierta, dejando 3 verdaderas en vez de 2 | Se sustituyó por una afirmación falsa ("COALESCE siempre requiere al menos tres argumentos") |
| ROUND/TRUNC (Choose TWO) | `ROUND(125.783, -2)` realmente da 100, lo que hacía esa opción también cierta (3 verdaderas) | Se cambió el valor afirmado a 200 (falso), dejando exactamente 2 verdaderas |
| Secuencias (Choose TWO) | La opción "una secuencia no está ligada a una tabla" es cierta, dejando 3 verdaderas | Se reescribió como una afirmación falsa ("debe definirse con la misma lista de columnas que la tabla") |

Las 3 se revalidaron una por una tras la corrección antes de incluirlas en el `.docx`.

## 7. Errores en preguntas **antiguas** detectados durante este trabajo (no corregidos silenciosamente)

Por transparencia, aunque no formaban parte del encargo de esta tarea en concreto (ya se habían
corregido en una sesión de trabajo anterior dentro de esta misma conversación extendida, antes de
pedirse la ampliación a 800): el banco había tenido temporalmente 3 preguntas con la respuesta
correcta real eliminada por una fusión de opciones "duplicadas" que comparaba texto ignorando
mayúsculas/minúsculas (`examen-5-q36`, `examen-8-q23`, `examen-14-oracle-1-q3` — casos donde
`INITCAP`, `TRANSLATE` o `LIKE` hacen que la mayúscula/minúscula cambie el resultado real). Ya
estaban corregidas antes de empezar esta ampliación; se mencionan aquí solo para que quede
constancia en un único informe de auditoría. No se ha modificado ninguna otra pregunta antigua
durante esta tarea.

## 8. Fase 5 — Imágenes: por qué ninguna de las 50 lleva imagen

Se revisó cómo funcionan las preguntas con imagen en el proyecto (`exhibitImages` en el banco,
copiadas a `export/provider/certifications/oracle-database-sql-certified-associate/imageN.ext`,
referenciadas por `imagePath` en el export). Para las 50 preguntas nuevas, todo el contenido
(estructuras de tabla, resultados de consultas, escenarios) se pudo representar como texto/código
SQL embebido en el enunciado, que es exactamente el criterio que ya usa el banco existente para
decidir si algo necesita una imagen o no ("si una tabla puede representarse como texto, prioriza
ese criterio"). No se generaron imágenes decorativas ni capturas artificiales de pantalla.

## 9. Archivos creados

- `Exámenes/Examen 15.docx` — examen fuente, mismo formato que 1–4/9–13.
- `data/certification-bank/raw/Examen 15.json` — extracción en bruto (tal cual la produce
  `tools/import_exams.py`, sin las correcciones de tema que se aplicaron después sobre el banco
  curado; mismo criterio que el resto de `raw/`).
- `export/exams/examen15.json` — 50 preguntas en el esquema de export.
- `INFORME_NUEVAS_PREGUNTAS_800.md` — este informe.

## 10. Archivos modificados

- `data/certification-bank/certification-bank.json` / `.js` — se añadieron las 50 preguntas al
  final (754 → 804); **ninguna de las 754 preguntas existentes se modificó** en esta tarea.
- `data/certification-bank/import-report.json` / `.js` / `.md` — regenerados con las cifras
  reales tras la ampliación (15 archivos, 804 preguntas, 0 discrepancias de respuestas pendientes).
- `export.zip` — regenerado desde el `export/` actualizado (332 archivos, 800 preguntas, 15
  exámenes, 314 imágenes — sin cambios en imágenes, ya que Examen 15 no usa ninguna).

`export/` y `export.zip` siguen fuera del control de versiones (git), según la instrucción
permanente de este proyecto.

## 11. Validaciones ejecutadas

- `node export/validate.js` sobre los 15 exámenes: **800 preguntas analizadas, 5 errores**
  (los 5 son el mismo falso positivo ya documentado en este proyecto: el comparador de opciones
  "duplicadas" ignora mayúsculas/minúsculas, y marca como iguales textos que en Oracle SÍ son
  distintos por mayúsculas — 4 ya existían de antes, más 1 nuevo de Examen 15, `examen-15-q10`,
  que compara intencionadamente `'fmMonth...'` con mayúscula inicial frente a todo en mayúsculas).
  **0 errores reales.**
- Comparación programática de las 50 respuestas extraídas por el importador contra la intención
  original de cada pregunta: **0 discrepancias**.
- Suite de tests existente (`tools/tests/DocxImport.Tests.ps1`, Pester): **28/28 tests pasan**, sin
  verse afectados por este cambio (prueban el motor de importación, no el contenido de un examen
  en concreto).

## 12. Confirmación final

- **Total en `certification-bank.json`: 804.**
- **Total exportable/válido en `export/exams/*.json`: exactamente 800.**
- 15 exámenes (1–15), 15 archivos en `export/exams/`.
- 0 IDs duplicados, 0 bankIds duplicados, 0 opciones duplicadas reales, 0 respuestas inexistentes,
  0 errores de single/multiple, 0 imágenes rotas, 0 preguntas de Examen 15 equivalentes a otra ya
  existente en el banco.

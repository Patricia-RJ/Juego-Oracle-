# Progreso hacia 1000 preguntas

Objetivo: ampliar el banco de preguntas de Oracle SQL (1Z0-071) hasta llegar a **1000 preguntas
válidas/exportables**, generando tandas de preguntas originales poco a poco (no todas de golpe),
verificando cada una a mano contra el comportamiento real de Oracle, sin inventar sintaxis, y
basándose en el estilo y el temario ya presentes en el banco y en el material teórico del proyecto.

## Estado actual — OBJETIVO ALCANZADO

| Métrica | Valor |
|---|---|
| Preguntas en `certification-bank.json` (total) | **1004** |
| Preguntas exportables/válidas (`export/exams/*.json`) | **1000** ✅ |
| Exámenes | 19 |
| Faltan para llegar a 1000 (exportables) | **0** |

## Tandas completadas

### Tanda 1 — Examen 15 (50 preguntas)
- Temas reforzados: NULL Handling, Character Functions, Numeric Functions, Conversion Functions,
  Date Functions, GROUP BY, HAVING, Views, Sequences, Synonyms, Roles, Indexes, Data Dictionary,
  Set Operators, Transactions, Privileges, DML, DDL, Constraints, Subqueries, JOINS.
- Detalle completo: `INFORME_NUEVAS_PREGUNTAS_800.md`.
- 50/50 `validated` por `tools/import_exams.py`, 0 casi-duplicados contra el resto del banco en el
  momento de añadirse.

### Tanda 2 — Examen 16 (50 preguntas)
- Mismo proceso exacto que la Tanda 1: preguntas redactadas en inglés, verificadas a mano,
  convertidas a `Exámenes/Examen 16.docx` (mismo formato "Correcta(s): X" + negrita) e importadas
  con `tools/import_exams.py` (no insertadas a mano en el JSON).
- Temas: se repasó la distribución de temas tras la Tanda 1 y se reforzaron los que seguían más
  bajos como tema principal, con hechos **distintos** a los ya usados en Examen 15 para no generar
  contenido redundante:
  - Aggregate Functions (5): COUNT(*) vs COUNT(columna), COUNT(DISTINCT), MIN/MAX con texto, AVG
    ignorando NULL, mezclar columna no agregada sin GROUP BY.
  - GROUP BY (3): columna fuera de GROUP BY, CUBE vs ROLLUP, agrupar por una expresión.
  - Character Functions (4): CONCAT (2 argumentos), REPLACE, LENGTH(NULL), LTRIM con conjunto de
    caracteres.
  - Numeric Functions (3): ABS, POWER, SIGN.
  - Views (3): CREATE OR REPLACE, lista de alias de columnas, vista dependiente de otra vista.
  - Sequences (3): ALTER SEQUENCE no puede cambiar START WITH, secuencia descendente, independencia
    respecto a las filas de la tabla.
  - Synonyms (2): precedencia privado vs público, sinónimo "colgante" tras borrar el objeto.
  - Roles (3): roles predefinidos (CONNECT/RESOURCE/DBA), REVOKE de un rol, SET ROLE.
  - Indexes (3): índice compuesto, índice basado en función, DROP INDEX no borra datos.
  - HAVING (2): varias condiciones con AND, referenciar una columna agrupada directamente.
  - NULL Handling (3): NULLIF, NULLS FIRST/LAST, concatenación vs aritmética con NULL.
  - Conversion Functions (3): CAST, error de conversión implícita, TO_CHAR de un número.
  - Set Operators (2): nombres de columna del primer SELECT, INTERSECT.
  - DML (3): DELETE sin WHERE, UPDATE con subconsulta en SET, INSERT con DEFAULT.
  - DDL (3): RENAME, TRUNCATE vs DELETE, ADD CONSTRAINT sobre una tabla existente.
  - Data Dictionary (3): USER_VIEWS, USER_SEQUENCES (LAST_NUMBER), USER_SYNONYMS vs ALL_SYNONYMS.
  - Privileges (2): REVOKE, GRANT ... TO PUBLIC.
- **50/50 `validated`**, 0 discrepancias entre la respuesta pretendida y la extraída por el
  importador.
- Validación (`export/validate.js` sobre los 16 exámenes, 850 preguntas): **5 errores**, los mismos
  5 falsos positivos ya documentados del comparador de opciones insensible a mayúsculas (ninguno
  nuevo de Examen 16). **2 avisos nuevos revisados y descartados**:
  - `examen-16-q22` (sinónimos): el clasificador de categoría por palabras clave sugiere
    "Combinación de datos" porque el texto contiene las palabras inglesas sueltas "exists" y
    "UNION" (una en la frase "a synonym... exists", la otra dentro de una opción incorrecta) sin
    ser realmente about joins/subconsultas. Categoría correcta confirmada: Manipulación y
    definición de datos.
  - `examen-16-q13/14/15` (ABS/POWER/SIGN): marcadas como "posible misma pregunta" entre sí por el
    detector de casi-duplicados, por compartir el mismo patrón corto de enunciado
    ("View and examine... SELECT función(...) FROM dual; What is the result?"). Revisadas una por
    una: son tres funciones distintas sin relación real entre sí, falso positivo por plantilla
    compartida en preguntas muy cortas.
- Tests existentes (`tools/tests/DocxImport.Tests.ps1`): 28/28 pasan.
- Archivos creados: `Exámenes/Examen 16.docx`, `data/certification-bank/raw/Examen 16.json`,
  `export/exams/examen16.json`.
- Archivos modificados: `certification-bank.json`/`.js`, `import-report.json`/`.js`/`.md`,
  `export.zip` (regenerado, 333 archivos).

### Tanda 3 — Examen 17 (50 preguntas)
- Mismo proceso exacto: redactadas en inglés, verificadas a mano, `Exámenes/Examen 17.docx`
  importado con `tools/import_exams.py` (50/50 `validated`, 0 discrepancias respuesta
  pretendida/extraída).
- Antes de redactar se volvió a revisar la distribución de temas tras la Tanda 2 para elegir temas
  todavía poco representados, con hechos nuevos:
  - Functions — genérico GREATEST/LEAST/SYS_CONTEXT/INSTR (4): esta categoría interna del
    importador (distinta de "Character Functions") seguía en solo 4 preguntas; se cerró el hueco
    de verdad en vez de seguir agrupando estas funciones bajo Character Functions como en tandas
    anteriores.
  - Roles (4): DROP ROLE, rol protegido con IDENTIFIED BY, roles activos por defecto al conectar,
    no se puede conceder un rol a sí mismo.
  - Views (4): CREATE FORCE VIEW, no se puede crear un índice directamente sobre una vista, vista
    no actualizable por DISTINCT, privilegios de una vista independientes de los de la tabla base.
  - Numeric Functions (3): ROUND(2.5)/ROUND(-2.5) (redondeo "lejos de cero", no bancario),
    TRUNC con n negativo, MAX(AVG(...)) como ejemplo canónico de funciones de grupo anidadas.
  - GROUP BY (2): GROUPING SETS frente a CUBE/ROLLUP, HAVING con COUNT(DISTINCT ...).
  - Character Functions (2): LPAD cuando el padding pedido es más corto que la cadena, RTRIM con
    un conjunto de caracteres.
  - HAVING (2): sintaxis correcta para encontrar duplicados, cuándo se evalúa (por grupo, no por fila).
  - Indexes (2): un índice B-tree no indexa filas con la columna en NULL, CREATE UNIQUE INDEX.
  - Sequences (2): huecos por CACHE perdido en un SHUTDOWN ABORT, NOMAXVALUE/NOMINVALUE por defecto.
  - Aggregate Functions (3): las funciones de agregación ignoran NULL por defecto, SUM(DISTINCT...),
    COUNT(*) vs COUNT(columna) (Choose dos).
  - NULL Handling (2): `= NULL` nunca es cierto (hay que usar IS NULL), tipos de datos compatibles
    en NVL.
  - Conversion Functions (2): RR vs YY en TO_DATE, CAST con desbordamiento de precisión.
  - Set Operators (2): ORDER BY solo al final de toda la consulta combinada, incluso número y tipo
    de columnas entre las partes de un UNION/INTERSECT/MINUS.
  - DML (2): cláusula DELETE opcional dentro de MERGE, INSERT ALL multi-tabla.
  - DDL (2): COMMENT ON COLUMN, DROP TABLE ... CASCADE CONSTRAINTS.
  - Data Dictionary (2): USER_OBJECTS (columna STATUS = INVALID), USER_IND_COLUMNS.
  - Privileges (2): WITH ADMIN OPTION frente a WITH GRANT OPTION, GRANT de un privilegio de sistema.
  - ORDER BY (2): ORDER BY por posición numérica, ORDER BY con una columna fuera del SELECT.
  - Date Functions (2): EXTRACT(YEAR FROM ...), TRUNC(fecha, 'YEAR').
  - Transactions (1): commit implícito al salir de la sesión con EXIT.
  - Subqueries (1): subconsulta de una sola fila que devuelve varias filas (ORA-01427).
  - JOINS (1): NATURAL JOIN.
  - Constraints (1): NOT NULL solo puede definirse a nivel de columna, nunca a nivel de tabla.
- Se descartó, antes de redactarla, una pregunta sobre `MOD` con un dividendo negativo: no se
  tenía plena seguridad sobre si Oracle usa la fórmula basada en `FLOOR` o en `TRUNC` para ese caso
  (hay documentación contradictoria vista en distintas fuentes), así que, siguiendo la regla de "si
  hay duda, no se incluye", se sustituyó por una pregunta sobre `ROUND(2.5)`/`ROUND(-2.5)`, que sí
  se pudo verificar con total seguridad (Oracle redondea "lejos de cero", no con redondeo bancario).
- Validación (`export/validate.js`, 17 exámenes, **900 preguntas** — coincide exactamente con lo
  esperado: 850 + 50): **5 errores**, los mismos 5 falsos positivos ya documentados (ninguno nuevo).
  2 avisos nuevos revisados:
  - `examen-17-q12` (privilegios sobre una vista): el clasificador de categoría tenía razón esta
    vez — la pregunta usa las palabras "grant"/"privilege" varias veces porque trata realmente
    sobre seguridad, no solo sobre vistas. Se corrigió el tema interno de "Views" a "Privileges"
    (categoría de export: Seguridad y diccionario de datos) tanto en el banco como en el export.
  - Casi-duplicado entre `examen-16-q13` (ABS) y `examen-17-q1`/`examen-17-q13` (GREATEST,
    ROUND): mismo patrón de falso positivo ya visto en la Tanda 2 — preguntas muy cortas con la
    plantilla "View and examine... SELECT función(...) FROM dual; What is the result?" que
    comparten casi todo el texto salvo la función en sí. Revisado: son funciones distintas sin
    relación real, no son duplicados.
- Tests existentes: 28/28 pasan.
- Archivos creados: `Exámenes/Examen 17.docx`, `data/certification-bank/raw/Examen 17.json`,
  `export/exams/examen17.json`.
- Archivos modificados: `certification-bank.json`/`.js`, `import-report.*`, `export.zip`
  (334 archivos).

### Tanda 4 — Examen 18 (50 preguntas)
- Mismo proceso exacto: redactadas en inglés, verificadas a mano, `Exámenes/Examen 18.docx`
  importado con `tools/import_exams.py` (50/50 `validated`, 0 discrepancias).
- Se revisó otra vez la distribución de temas tras la Tanda 3 y se reforzaron los que seguían más
  bajos, con hechos nuevos (no repetidos de tandas anteriores):
  - Functions (3): GREATEST/LEAST devuelven NULL si cualquier argumento es NULL, LENGTH vs
    LENGTHB, SYS_CONTEXT('USERENV','CURRENT_SCHEMA').
  - Synonyms (3): un sinónimo no concede ningún privilegio por sí mismo, colisión de nombre con un
    objeto propio ya existente (ORA-00955), RENAME de la tabla base invalida el sinónimo.
  - Roles (2): PUBLIC no es un rol real (no se puede crear/borrar), un rol concedido pero no
    habilitado no aporta sus privilegios hasta usar SET ROLE.
  - Views (2): CREATE VIEW crea exactamente una vista por sentencia, colisión de nombre con una
    tabla propia ya existente.
  - GROUP BY (2): el orden de las columnas en GROUP BY no tiene que coincidir con el del SELECT,
    agrupar por una expresión CASE.
  - Numeric Functions (2): FLOOR/CEIL sobre un entero lo devuelven sin cambios, TRUNC(n,0) igual
    que TRUNC(n).
  - Character Functions (2): INITCAP no toca los dígitos, UPPER/LOWER no afectan a símbolos/números.
  - HAVING (2): combinar dos condiciones agregadas con OR, HAVING puede incluir una subconsulta.
  - Indexes (2): UNIQUE constraint también crea un índice único automáticamente, los nombres de
    índice deben ser únicos en el esquema (no por tabla).
  - Sequences (3): una secuencia puede usarla más de una tabla, ALTER SEQUENCE INCREMENT BY solo
    afecta a valores futuros, una secuencia genera NUMBER y necesita conversión para columnas
    VARCHAR2.
  - Aggregate Functions (3): STDDEV/VARIANCE ignoran NULL igual que AVG/SUM, COUNT(1) se comporta
    igual que COUNT(*), MIN/MAX ignoran NULL.
  - NULL Handling (2): orden por defecto de NULL en ASC/DESC (NULLS LAST/FIRST), `= NULL` tampoco
    funciona dentro de un CASE WHEN (mismo motivo que en WHERE).
  - Conversion Functions (2): TO_CHAR con formato de hora, conversión implícita NUMBER→VARCHAR2 en
    una concatenación.
  - Set Operators (2): UNION puede combinar tablas sin ninguna relación entre sí si las columnas
    encajan, precedencia de INTERSECT sobre UNION/MINUS sin paréntesis.
  - DML (3): varias columnas en un mismo SET, `SET (col1,col2) = (subconsulta)` multi-columna,
    DELETE con subconsulta correlacionada NOT EXISTS.
  - DDL (2): ALTER TABLE RENAME COLUMN, añadir una columna NOT NULL sin DEFAULT falla si la tabla
    ya tiene filas.
  - Data Dictionary (2): USER_TABLES.NUM_ROWS refleja estadísticas, no el recuento en vivo;
    ALL_TAB_PRIVS.
  - Privileges (2): REVOKE ALL ON objeto FROM usuario, el propietario de un objeto ya tiene todos
    los privilegios sobre él sin necesidad de GRANT.
  - ORDER BY (2): DESC solo afecta a la columna inmediatamente anterior, ORDER BY sí puede usar un
    alias del SELECT (a diferencia de GROUP BY).
  - Date Functions (2): SYSDATE incluye hora además de fecha, componente fraccionario de
    MONTHS_BETWEEN cuando el día del mes difiere.
  - Transactions (1): ROLLBACK sin TO SAVEPOINT deshace toda la transacción.
  - Subqueries (1): una subconsulta en FROM (inline view) necesita alias.
  - JOINS (1): diferencia entre ON y USING.
  - Constraints (2): una columna de FOREIGN KEY puede ser NULL si no lleva también NOT NULL, una
    tabla puede tener varias UNIQUE pero solo una PRIMARY KEY.
- Validación (`export/validate.js`, 18 exámenes, **950 preguntas** — coincide exactamente con lo
  esperado: 900 + 50): **7 errores**, los 5 falsos positivos ya documentados más 2 nuevos, ambos
  revisados y descartados por la misma causa (comparación insensible a mayúsculas/minúsculas sobre
  distractores que cambian solo en el uso de mayúsculas, que es precisamente lo que esas preguntas
  evalúan): `examen-18-q15` (INITCAP) y `examen-18-q16` (UPPER). 1 aviso de categoría revisado y
  aceptado como acierto del clasificador: `examen-18-q4` trataba en realidad sobre privilegios (un
  sinónimo no concede privilegios por sí mismo), así que se recategorizó de "Synonyms" a
  "Privileges" en el banco y en el export — mismo tipo de ajuste que ya se hizo con
  `examen-17-q12`. 1 aviso de casi-duplicado entre `examen-17-q1` y `examen-18-q1` (ambas sobre
  GREATEST) revisado: comparten la plantilla corta pero prueban hechos distintos (comparación de
  varios valores vs. propagación de NULL), no son duplicados reales.
- Tests existentes: 28/28 pasan.
- Archivos creados: `Exámenes/Examen 18.docx`, `data/certification-bank/raw/Examen 18.json`,
  `export/exams/examen18.json`.
- Archivos modificados: `certification-bank.json`/`.js`, `import-report.*`, `export.zip`
  (335 archivos).

### Tanda 5 — Examen 19 (50 preguntas) — ÚLTIMA TANDA

- Mismo proceso exacto que las cuatro tandas anteriores: redactadas en inglés, verificadas a mano
  una por una, `Exámenes/Examen 19.docx` importado con `tools/import_exams.py` (50/50
  `validated`, 0 discrepancias entre la respuesta pretendida y la extraída).
- Última revisión de huecos de temario antes de cerrar, con hechos que no se habían usado en las
  tandas 1-4:
  - Functions (3): GREATEST/LEAST con fechas, INSTR devuelve 0 si no encuentra la subcadena,
    USERENV como función heredada frente a SYS_CONTEXT.
  - Synonyms (3): CREATE OR REPLACE SYNONYM, crear un sinónimo PUBLIC requiere un privilegio de
    sistema específico, un sinónimo puede apuntar a un procedimiento o paquete, no solo a tablas.
  - Roles (2): DROP ROLE revoca automáticamente el rol de todos los usuarios que lo tenían,
    ALTER USER ... DEFAULT ROLE ALL EXCEPT.
  - Views (2): una vista puede basarse en otra vista (anidada), los usuarios de una vista ven los
    alias de columna definidos en ella, no los nombres reales de la tabla base.
  - GROUP BY (2): no se puede usar una función de agregación dentro de la propia cláusula GROUP BY
    (ORA-00934), ROLLUP con una sola columna genera una fila de gran total.
  - Numeric Functions (2): la división `/` entre dos NUMBER da un resultado decimal (no trunca
    como una división entera), contraste entre `5/0` (error) y `MOD(5,0)` (devuelve 5 sin error).
  - Character Functions (2): REPLACE con cadena de sustitución vacía elimina las coincidencias,
    TRANSLATE sustituye carácter a carácter por posición (a diferencia de REPLACE por subcadena).
  - Indexes (2): cuándo conviene un índice bitmap (columnas de baja cardinalidad) frente a un
    B-tree, ALTER INDEX REBUILD no toca los datos de la tabla.
  - Sequences (3): usar NEXTVAL directamente en el VALUES de un INSERT sin seleccionarlo antes,
    DROP SEQUENCE no afecta a las filas ya insertadas con valores anteriores, qué vista del
    diccionario de datos muestra INCREMENT_BY/CACHE_SIZE (recategorizada a Data Dictionary, ver
    más abajo).
  - NULL Handling (2): cualquier comparación con NULL (no solo `=`) da UNKNOWN y WHERE la excluye,
    GROUP BY agrupa todos los NULL de la columna de agrupación en un único grupo.
  - Conversion Functions (2): comparar una columna DATE con un literal de texto depende del
    NLS_DATE_FORMAT de la sesión, TO_NUMBER de un solo argumento.
  - Aggregate Functions (2): AVG(DISTINCT salary), y una pregunta de Choose DOS verificando que
    COUNT(*) devuelve 0 pero SUM/AVG devuelven NULL cuando no hay filas que coincidan.
  - Set Operators (2): se pueden encadenar más de dos SELECT con operadores de conjunto, MINUS
    compara la fila completa, no solo la primera columna.
  - DML (2): omitir una columna en INSERT usa su DEFAULT (o NULL), MERGE puede tener solo
    WHEN MATCHED o solo WHEN NOT MATCHED.
  - DDL (2): CREATE TABLE AS SELECT con una condición que no devuelve filas igualmente crea la
    tabla (vacía), ALTER TABLE MODIFY DEFAULT solo afecta a filas futuras.
  - Data Dictionary (3): USER_OBJECTS incluye vistas/secuencias/sinónimos/índices (no solo
    tablas), USER_CONS_COLUMNS, la columna TEXT de USER_VIEWS.
  - Privileges (3): CREATE SESSION por sí solo no permite crear objetos, EXECUTE para ejecutar un
    procedimiento ajeno, los privilegios a nivel de columna solo existen para INSERT/UPDATE/
    REFERENCES, no para SELECT/DELETE.
  - ORDER BY (2): se puede ordenar por una expresión que no está en el SELECT (p. ej.
    UPPER(apellido)), el orden por defecto es sensible a mayúsculas (binario).
  - Date Functions (2): restar dos DATE da un NUMBER de días, ADD_MONTHS con un número negativo
    resta meses.
  - Transactions (1): una transacción empieza implícitamente con la primera sentencia DML, sin
    necesitar un BEGIN TRANSACTION explícito.
  - Subqueries (1): una subconsulta usada con IN sí puede devolver varias filas (a diferencia de `=`).
  - JOINS (1): un LEFT JOIN con la condición de la tabla derecha puesta en WHERE en vez de en ON
    puede acabar comportándose como un INNER JOIN.
  - Constraints (3): un CHECK con NULL se evalúa como UNKNOWN y por tanto no rechaza la fila, una
    FOREIGN KEY debe referenciar una PRIMARY KEY o una UNIQUE (no cualquier columna), deshabilitar
    una constraint no limpia los datos que ya la incumplen.
  - HAVING (1): una condición HAVING puede usar una función de agregación que no aparece en el SELECT.
- Validación (`export/validate.js`, 19 exámenes, **1000 preguntas exactas**): **7 errores**, todos
  ellos el mismo falso positivo ya documentado repetidas veces en las tandas 2-4 (comparación de
  opciones insensible a mayúsculas sobre distractores que cambian aposta solo en el uso de
  mayúsculas). 1 aviso de categoría aceptado como acierto del clasificador: `examen-19-q21`
  (qué vista del diccionario de datos muestra la configuración de una secuencia) se recategorizó de
  "Sequences" a "Data Dictionary", mismo criterio que `examen-17-q12` y `examen-18-q4`.
- **Nota sobre los avisos de casi-duplicado acumulados**: con las 250 preguntas de las 5 tandas
  escritas en el mismo estilo breve ya usado en el resto del banco ("View and examine the
  following statement. SELECT FUNCIÓN(...) FROM dual; What is the result?"), el detector de
  casi-duplicados de `validate.js` ha ido marcando repetidamente parejas de preguntas que
  comparten esa plantilla corta pero prueban funciones o hechos distintos (por ejemplo ABS vs.
  GREATEST vs. ROUND, o MONTHS_BETWEEN vs. ADD_MONTHS). Se ha revisado cada aviso de este tipo
  aparecido en las 5 tandas, confirmando en todos los casos que son preguntas genuinamente
  distintas y no duplicados reales; es una limitación conocida del detector con preguntas muy
  cortas, ya documentada desde la auditoría original del proyecto, y no indica preguntas de mala
  calidad.
- Tests existentes: 28/28 pasan.
- Archivos creados: `Exámenes/Examen 19.docx`, `data/certification-bank/raw/Examen 19.json`,
  `export/exams/examen19.json`.
- Archivos modificados: `certification-bank.json`/`.js`, `import-report.*`, `export.zip`
  (336 archivos).

## Resumen final de las 5 tandas

| Tanda | Examen | Preguntas | Total acumulado (export) |
|---|---|---|---|
| 1 | Examen 15 | 50 | 800 |
| 2 | Examen 16 | 50 | 850 |
| 3 | Examen 17 | 50 | 900 |
| 4 | Examen 18 | 50 | 950 |
| 5 | Examen 19 | 50 | **1000** |

**250 preguntas nuevas en total**, todas originales, verificadas a mano contra el comportamiento
real de Oracle, importadas con el script real del proyecto (no insertadas a mano en el JSON),
0 preguntas duplicadas reales contra el resto del banco, 0 errores reales de validación
estructural, y 28/28 tests existentes pasando en cada tanda. El banco completo pasó de 750 a
1000 preguntas exportables (754 a 1004 en `certification-bank.json`, incluyendo las 4 preguntas
históricamente excluidas de export por no ser verificables con seguridad).

No se ha subido nada de esto al repositorio todavía.

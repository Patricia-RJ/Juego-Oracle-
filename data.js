/*
  Oracle SQL Quest — contenido educativo
  Cada bloque de teoría lleva "source": "apuntes" (adaptado de tus documentos)
  o "added" (contenido añadido para certificación 1Z0-071, no presente en tus apuntes).
*/

const APP_DATA = {

levels: [

// =====================================================================
// NIVEL 0
// =====================================================================
{
  id: 0, code: "N0", icon: "🏛️",
  title: "Introducción a bases de datos y SQL",
  intro: "Qué es una base de datos relacional, dónde encaja Oracle y cómo se organiza el lenguaje SQL.",
  theory: [
    { heading: "Bases de datos relacionales", source: "apuntes", body:
      "Una base de datos es un sistema que almacena y organiza información en tablas (filas y columnas). " +
      "Las relacionales usan claves primarias (PRIMARY KEY) para identificar cada fila de forma única y claves " +
      "foráneas (FOREIGN KEY) para relacionar tablas entre sí. Ejemplo clásico: CLIENTES y PEDIDOS, donde " +
      "cada pedido referencia al cliente que lo hizo. Relaciones posibles: 1:1, 1:N y N:N (esta última mediante " +
      "una tabla intermedia)." },
    { heading: "Oracle Database y sus herramientas", source: "added", body:
      "Oracle Database es un SGBD relacional (y objeto-relacional) propiedad de Oracle Corporation. Para el examen " +
      "1Z0-071 trabajarás sobre el esquema de ejemplo HR (Human Resources) con tablas como EMPLOYEES, DEPARTMENTS, " +
      "JOBS. La herramienta habitual para escribir SQL es Oracle SQL Developer (equivalente a DBeaver, pero " +
      "específico de Oracle), aunque también existe SQL*Plus en línea de comandos." },
    { heading: "La tabla DUAL", source: "added", body:
      "Oracle exige que todo SELECT tenga un FROM. Para probar expresiones sin consultar ninguna tabla real, " +
      "Oracle proporciona una tabla ficticia de una sola fila y una columna llamada DUAL. Ejemplo: " +
      "SELECT SYSDATE FROM DUAL; devuelve la fecha y hora actuales del servidor." },
    { heading: "Categorías del lenguaje SQL", source: "apuntes", body:
      "SQL se divide en sublenguajes: DDL (Data Definition Language: CREATE, ALTER, DROP) define objetos; " +
      "DML (Data Manipulation Language: INSERT, UPDATE, DELETE, MERGE) manipula datos; DQL (Data Query Language: " +
      "SELECT) consulta datos; DCL (Data Control Language: GRANT, REVOKE) controla permisos; y TCL (Transaction " +
      "Control Language: COMMIT, ROLLBACK, SAVEPOINT) controla transacciones. Esta última categoría (TCL) no " +
      "aparecía en tus apuntes originales y es un bloque propio del examen (nivel 15)." },
    { heading: "Tipos de datos principales en Oracle", source: "added", body:
      "A diferencia de char/varchar genéricos de tus apuntes, Oracle usa: VARCHAR2(n) para texto de longitud " +
      "variable (hasta 4000 bytes), CHAR(n) longitud fija, NUMBER(p,s) para cualquier número (precisión p, escala " +
      "s), DATE para fecha+hora con precisión de segundos, TIMESTAMP para fecha+hora con fracciones de segundo, " +
      "y CLOB/BLOB para objetos grandes de texto/binarios. No existen 'int' o 'varchar' (sin el 2) como tipos " +
      "nativos de columna en Oracle SQL." }
  ],
  examples: [
    { title: "Consultar la fecha del servidor", code: "SELECT SYSDATE FROM DUAL;", note: "DUAL permite evaluar expresiones sin tabla real." },
    { title: "Ver la estructura de una tabla", code: "DESCRIBE employees;\n-- o abreviado:\nDESC employees;", note: "Comando de SQL*Plus/SQL Developer, no una sentencia SQL estándar." }
  ],
  mistakes: [
    "Pensar que Oracle admite 'varchar' o 'int' como en otros motores: en Oracle son VARCHAR2 y NUMBER.",
    "Olvidar el FROM DUAL al evaluar una expresión suelta (SELECT 1+1; da error en Oracle).",
    "Confundir DDL con DML: CREATE/ALTER/DROP son DDL; INSERT/UPDATE/DELETE son DML."
  ],
  quiz: [
    { q: "¿Qué tabla especial usa Oracle para evaluar expresiones sin consultar datos reales?", options: ["TEMP", "DUAL", "SYSTEM", "NULL_TABLE"], a: 1,
      exp: "DUAL es una tabla de una fila y una columna que Oracle usa para completar el FROM obligatorio." },
    { q: "¿Cuál de estos comandos pertenece al DDL (Data Definition Language)?", options: ["INSERT", "SELECT", "ALTER", "COMMIT"], a: 2,
      exp: "ALTER modifica la estructura de un objeto, es DDL. INSERT es DML, SELECT es DQL, COMMIT es TCL." },
    { q: "¿Qué tipo de dato usa Oracle para texto de longitud variable?", options: ["VARCHAR", "TEXT", "VARCHAR2", "STRING"], a: 2,
      exp: "Oracle usa VARCHAR2, no VARCHAR (que existe reservado pero no se recomienda usar)." },
    { q: "Una clave foránea (FOREIGN KEY) sirve para...", options: [
        "Impedir que una columna tenga valores nulos",
        "Referenciar la clave primaria de otra tabla y mantener la integridad referencial",
        "Ordenar los resultados de una consulta",
        "Acelerar únicamente las búsquedas por texto"
      ], a: 1, exp: "La FK enlaza una tabla hija con la clave primaria de una tabla padre." }
  ],
  exercises: [
    { title: "Tu primera consulta a DUAL", prompt: "Escribe una sentencia que devuelva el resultado de 15 * 3 usando DUAL.", hint: "SELECT expresión FROM DUAL;", solution: "SELECT 15 * 3 AS resultado FROM DUAL;" },
    { title: "Clasifica comandos", prompt: "Indica si CREATE TABLE, DELETE, GRANT y ROLLBACK son DDL, DML, DCL o TCL.", hint: "Piensa qué afecta cada uno: estructura, datos, permisos o transacción.", solution: "CREATE TABLE = DDL · DELETE = DML · GRANT = DCL · ROLLBACK = TCL" }
  ],
  challenges: [
    { level: 1, prompt: "Sin usar ninguna tabla real, obtén en una sola consulta: tu 'nombre' como texto y el resultado de 100/4.", solution: "SELECT 'Ana' AS nombre, 100/4 AS division FROM DUAL;" },
    { level: 2, prompt: "Explica con tus palabras por qué Oracle exige FROM DUAL y qué pasaría si Oracle no tuviera esa tabla.", solution: "La sintaxis de Oracle exige siempre un FROM en el SELECT; sin DUAL no habría forma estándar de evaluar una expresión sin datos, habría que inventar una tabla real cada vez." }
  ]
},

// =====================================================================
// NIVEL 1
// =====================================================================
{
  id: 1, code: "N1", icon: "🔍",
  title: "SELECT básico",
  intro: "La instrucción más usada en SQL: elegir columnas y tablas.",
  theory: [
    { heading: "SELECT y FROM", source: "apuntes", body:
      "SELECT indica qué columnas quieres recuperar; FROM indica de qué tabla. Siempre van juntos: " +
      "SELECT columna1, columna2 FROM tabla;. El orden de las columnas en el SELECT determina el orden en que " +
      "aparecen en el resultado." },
    { heading: "Buenas prácticas", source: "apuntes", body:
      "Escribe las palabras clave en MAYÚSCULAS, termina cada sentencia con punto y coma, y evita SELECT * en " +
      "código real: listar columnas explícitas es más legible y evita traer datos innecesarios." },
    { heading: "Identificadores y comillas en Oracle", source: "added", body:
      "A diferencia de PostgreSQL (comillas dobles \"col\") tus apuntes originales, en Oracle los nombres de " +
      "columnas y tablas NO necesitan comillas salvo que contengan espacios, empiecen por número o quieras " +
      "forzar minúsculas. Por defecto Oracle guarda los nombres en MAYÚSCULAS. Los literales de texto van entre " +
      "comillas simples: 'Madrid', igual que en tus apuntes." },
    { heading: "Comentarios", source: "apuntes", body: "-- comentario de una línea, y /* comentario de varias líneas */, igual que en SQL estándar." }
  ],
  examples: [
    { title: "Seleccionar columnas concretas", code: "SELECT first_name, last_name, salary\nFROM employees;" },
    { title: "Todas las columnas (usar con cuidado)", code: "SELECT *\nFROM departments;" },
    { title: "Alias rápido de columna", code: "SELECT last_name AS apellido\nFROM employees;" }
  ],
  mistakes: [
    "Olvidar el punto y coma al final de la sentencia.",
    "Usar comillas dobles pensando en PostgreSQL: en Oracle las comillas dobles fuerzan sensibilidad a mayúsculas/minúsculas y rara vez hacen falta.",
    "Abusar de SELECT * en consultas que luego se usan en aplicaciones reales."
  ],
  quiz: [
    { q: "¿Qué cláusula es obligatoria acompañando siempre a SELECT en Oracle?", options: ["WHERE", "FROM", "ORDER BY", "GROUP BY"], a: 1, exp: "FROM es obligatorio (incluso si es DUAL)." },
    { q: "Por defecto, ¿en qué formato guarda Oracle los nombres de columnas y tablas?", options: ["minúsculas", "MAYÚSCULAS", "Como se hayan escrito, respetando mayúsculas/minúsculas", "Aleatorio"], a: 1, exp: "Oracle convierte identificadores no citados a mayúsculas internamente." },
    { q: "¿Cuál de estas opciones NO es una buena práctica recomendada?", options: [
        "Terminar cada sentencia con ;", "Escribir las palabras clave en mayúsculas",
        "Usar siempre SELECT * para no tener que pensar en las columnas", "Indentar las cláusulas para legibilidad"
      ], a: 2, exp: "SELECT * afecta al rendimiento y a la legibilidad; se recomienda listar columnas." },
    { q: "¿Qué hace 'SELECT last_name AS apellido FROM employees;'?", options: [
        "Crea una nueva columna llamada apellido en la tabla", "Muestra la columna last_name con la etiqueta apellido en el resultado",
        "Renombra permanentemente la columna last_name", "Da error de sintaxis"
      ], a: 1, exp: "AS crea un alias solo para el resultado de esa consulta, no modifica la tabla." }
  ],
  exercises: [
    { title: "Selección simple", prompt: "Obtén el nombre (first_name), apellido (last_name) y salario (salary) de la tabla employees.", hint: "SELECT col1, col2, col3 FROM tabla;", solution: "SELECT first_name, last_name, salary FROM employees;" },
    { title: "Con alias", prompt: "Repite la consulta anterior pero muestra salary con el alias sueldo_mensual.", hint: "columna AS alias", solution: "SELECT first_name, last_name, salary AS sueldo_mensual FROM employees;" }
  ],
  challenges: [
    { level: 1, prompt: "Escribe una consulta que muestre department_id y department_name de la tabla departments, con department_name aliaseado como nombre_departamento.", solution: "SELECT department_id, department_name AS nombre_departamento FROM departments;" },
    { level: 2, prompt: "¿Por qué 'SELECT * FROM employees;' puede ser problemático en una aplicación en producción aunque funcione perfectamente en pruebas?", solution: "Si se añaden columnas nuevas a la tabla en el futuro, el código que consume '*' recibirá columnas inesperadas y puede romperse; además es menos legible y puede traer más datos de los necesarios, afectando al rendimiento." }
  ]
},

// =====================================================================
// NIVEL 2
// =====================================================================
{
  id: 2, code: "N2", icon: "🧭",
  title: "WHERE, operadores, comparaciones y condiciones",
  intro: "Filtrar filas según condiciones numéricas, de texto y de fecha.",
  theory: [
    { heading: "La cláusula WHERE", source: "apuntes", body:
      "WHERE filtra las filas que cumplen una condición. Operadores de comparación: =, >, <, >=, <=, <> (distinto, " +
      "también se puede escribir !=). Se combinan condiciones con AND (todas deben cumplirse) y OR (al menos una)." },
    { heading: "IN, NOT IN y BETWEEN", source: "apuntes", body:
      "IN compara contra una lista de valores: WHERE department_id IN (10,20,30). BETWEEN selecciona un rango " +
      "incluyendo los extremos: WHERE salary BETWEEN 3000 AND 6000." },
    { heading: "LIKE y comodines en Oracle", source: "added", body:
      "Para buscar patrones de texto se usa LIKE con dos comodines: % (cualquier secuencia de caracteres, " +
      "incluida vacía) y _ (exactamente un carácter). Ejemplo: WHERE last_name LIKE 'G%' busca apellidos que " +
      "empiezan por G. Para escapar un carácter comodín literal se usa ESCAPE, p.ej. LIKE '50\\%' ESCAPE '\\'." },
    { heading: "NULL: IS NULL / IS NOT NULL", source: "added", body:
      "NULL representa 'ausencia de valor' y nunca se compara con = o <>. Para comprobar si una columna es nula " +
      "se usa IS NULL o IS NOT NULL. WHERE commission_pct = NULL nunca devuelve filas; lo correcto es " +
      "WHERE commission_pct IS NULL." },
    { heading: "Fechas en Oracle", source: "added", body:
      "El formato de fecha por defecto en Oracle suele ser DD-MON-RR (p.ej. '25-DEC-24'), configurable con " +
      "NLS_DATE_FORMAT. Para evitar ambigüedad en el examen se recomienda usar TO_DATE('2024-12-25','YYYY-MM-DD') " +
      "en las comparaciones, en vez de literales de fecha entre comillas simples sin más." },
    { heading: "Precedencia de operadores lógicos", source: "added", body:
      "AND tiene mayor precedencia que OR. WHERE dept=10 OR dept=20 AND salary>3000 se evalúa como " +
      "dept=10 OR (dept=20 AND salary>3000). Usa paréntesis siempre que combines AND y OR para evitar errores lógicos: es un clásico del examen." }
  ],
  examples: [
    { title: "Comparaciones básicas", code: "SELECT first_name, salary\nFROM employees\nWHERE salary >= 5000;" },
    { title: "IN y BETWEEN", code: "SELECT last_name, department_id\nFROM employees\nWHERE department_id IN (10, 20, 30)\nAND salary BETWEEN 3000 AND 8000;" },
    { title: "LIKE con comodines", code: "SELECT last_name\nFROM employees\nWHERE last_name LIKE '_a%';  -- segunda letra 'a'" },
    { title: "NULL correcto", code: "SELECT last_name, commission_pct\nFROM employees\nWHERE commission_pct IS NULL;" },
    { title: "Precedencia con paréntesis", code: "SELECT last_name\nFROM employees\nWHERE (department_id = 10 OR department_id = 20)\nAND salary > 3000;" }
  ],
  mistakes: [
    "Escribir WHERE columna = NULL en vez de WHERE columna IS NULL (nunca devuelve filas).",
    "Olvidar paréntesis al mezclar AND y OR, cambiando el resultado sin darse cuenta.",
    "Comparar fechas como texto plano sin TO_DATE, dependiendo del formato regional de la sesión."
  ],
  quiz: [
    { q: "¿Cómo se comprueba correctamente que una columna no tiene valor?", options: ["= NULL", "IS NULL", "<> NULL", "== NULL"], a: 1, exp: "NULL nunca se compara con =, se usa IS NULL / IS NOT NULL." },
    { q: "¿Qué devuelve 'WHERE last_name LIKE 'M_ller'' con el comodín _?", options: [
        "Apellidos que contienen 'M_ller' literalmente", "Apellidos de 6 letras que empiezan por M y terminan en ller, con cualquier letra en medio",
        "Apellidos que empiezan por M seguido de cualquier cosa", "Error de sintaxis"
      ], a: 1, exp: "_ sustituye exactamente un carácter; % sustituiría cualquier cantidad." },
    { q: "En 'WHERE dept_id = 10 OR dept_id = 20 AND salary > 3000', ¿qué operador tiene más precedencia?", options: ["OR", "AND", "Se evalúan de izquierda a derecha por igual", "Depende de la versión de Oracle"], a: 1, exp: "AND se evalúa antes que OR salvo que se use paréntesis." },
    { q: "¿Cuál es el operador correcto para 'distinto de' en Oracle?", options: ["!==", "<>", "=/=", "NOT="], a: 1, exp: "<> es el estándar; != también funciona en Oracle." }
  ],
  exercises: [
    { title: "Rango salarial", prompt: "Obtén empleados con salario entre 4000 y 9000 (inclusive).", hint: "BETWEEN ... AND ...", solution: "SELECT * FROM employees WHERE salary BETWEEN 4000 AND 9000;" },
    { title: "Sin comisión", prompt: "Obtén el nombre de los empleados que no tienen comisión asignada (commission_pct nula).", hint: "IS NULL", solution: "SELECT first_name, last_name FROM employees WHERE commission_pct IS NULL;" }
  ],
  challenges: [
    { level: 1, prompt: "Obtén empleados del departamento 10 o 20 cuyo salario supere 3000, usando paréntesis correctamente.", solution: "SELECT * FROM employees WHERE (department_id = 10 OR department_id = 20) AND salary > 3000;" },
    { level: 2, prompt: "Obtén empleados cuyo apellido empiece por 'S' y tenga exactamente 5 letras.", solution: "SELECT last_name FROM employees WHERE last_name LIKE 'S____';  -- S + 4 guiones bajos = 5 letras" }
  ]
},

// =====================================================================
// NIVEL 3
// =====================================================================
{
  id: 3, code: "N3", icon: "🔤",
  title: "ORDER BY, DISTINCT, alias y concatenación",
  intro: "Ordenar resultados, eliminar duplicados y construir texto combinado.",
  theory: [
    { heading: "ORDER BY", source: "apuntes", body:
      "Ordena el resultado por una o varias columnas, ASC (por defecto) o DESC. Se puede ordenar por varias " +
      "columnas: ORDER BY department_id ASC, salary DESC. Se ejecuta al final del procesamiento lógico de la " +
      "consulta, por lo que sí puede usar alias definidos en el SELECT." },
    { heading: "NULLS FIRST / NULLS LAST", source: "added", body:
      "En Oracle, por defecto los NULL se consideran el valor más alto: en ASC aparecen al final, en DESC al " +
      "principio. Se puede forzar con ORDER BY commission_pct NULLS FIRST." },
    { heading: "DISTINCT", source: "apuntes", body:
      "Elimina filas duplicadas del resultado. SELECT DISTINCT department_id FROM employees; devuelve cada " +
      "departamento una sola vez. Si se seleccionan varias columnas, DISTINCT afecta a la combinación de todas ellas." },
    { heading: "Alias con AS", source: "apuntes", body:
      "AS asigna un nombre temporal a una columna o tabla, útil para legibilidad. Es opcional (se puede omitir la " +
      "palabra AS: 'salary sueldo'), pero si el alias tiene espacios necesita comillas dobles: salary AS \"Sueldo Mensual\"." },
    { heading: "Concatenación con ||", source: "added", body:
      "A diferencia de la función CONCAT(a,b) de tus apuntes (que en Oracle solo admite dos argumentos), Oracle " +
      "usa el operador || para concatenar, y admite tantos elementos como se quiera: " +
      "first_name || ' ' || last_name. CONCAT(first_name, last_name) existe pero solo acepta 2 parámetros." }
  ],
  examples: [
    { title: "Ordenar por varias columnas", code: "SELECT last_name, department_id, salary\nFROM employees\nORDER BY department_id ASC, salary DESC;" },
    { title: "NULLS FIRST", code: "SELECT last_name, commission_pct\nFROM employees\nORDER BY commission_pct NULLS FIRST;" },
    { title: "DISTINCT", code: "SELECT DISTINCT department_id\nFROM employees;" },
    { title: "Concatenación con ||", code: "SELECT first_name || ' ' || last_name AS nombre_completo\nFROM employees;" }
  ],
  mistakes: [
    "Usar CONCAT con más de dos argumentos (da error, hay que anidarlo o usar ||).",
    "Suponer que los NULL se ordenan siempre al final en cualquier motor: en Oracle depende de ASC/DESC.",
    "Olvidar que ORDER BY sí puede usar alias del SELECT, a diferencia de WHERE."
  ],
  quiz: [
    { q: "¿Cuántos argumentos admite la función CONCAT en Oracle?", options: ["Ilimitados", "Exactamente 2", "Máximo 3", "Depende de la versión"], a: 1, exp: "CONCAT(a,b) solo admite dos; para más se usa || o se anida." },
    { q: "Por defecto en Oracle, en un ORDER BY ascendente (ASC) ¿dónde aparecen los valores NULL?", options: ["Al principio", "Al final", "Se excluyen automáticamente", "Provocan error"], a: 1, exp: "Oracle trata NULL como el valor más alto por defecto en ASC." },
    { q: "¿Qué hace 'SELECT DISTINCT department_id, job_id FROM employees;'?", options: [
        "Devuelve valores únicos de department_id ignorando job_id", "Devuelve combinaciones únicas de (department_id, job_id)",
        "Da error porque DISTINCT solo admite una columna", "Ordena los resultados"
      ], a: 1, exp: "DISTINCT actúa sobre la combinación completa de columnas seleccionadas." },
    { q: "¿Cuál es el operador de concatenación nativo de Oracle?", options: ["+", "&", "||", "CONCAT_ALL"], a: 2, exp: "|| es el operador estándar de concatenación en Oracle SQL." }
  ],
  exercises: [
    { title: "Nombre completo", prompt: "Muestra el nombre completo (first_name + espacio + last_name) con el alias nombre_completo.", hint: "columna1 || ' ' || columna2", solution: "SELECT first_name || ' ' || last_name AS nombre_completo FROM employees;" },
    { title: "Departamentos únicos ordenados", prompt: "Lista los department_id distintos, ordenados de mayor a menor.", hint: "DISTINCT ... ORDER BY ... DESC", solution: "SELECT DISTINCT department_id FROM employees ORDER BY department_id DESC;" }
  ],
  challenges: [
    { level: 1, prompt: "Construye una frase 'NOMBRE gana SALARIO al mes' por empleado (usa mayúsculas literales como texto fijo).", solution: "SELECT first_name || ' gana ' || salary || ' al mes' AS frase FROM employees;" },
    { level: 2, prompt: "Ordena los empleados por comisión, forzando que los que SÍ tienen comisión aparezcan primero (los NULL al final), de mayor a menor comisión.", solution: "SELECT last_name, commission_pct FROM employees ORDER BY commission_pct DESC NULLS LAST;" }
  ]
},

// =====================================================================
// NIVEL 4
// =====================================================================
{
  id: 4, code: "N4", icon: "🧩",
  title: "Funciones de una sola fila (visión general)",
  intro: "Cómo se clasifican las funciones que Oracle aplica fila a fila, antes de entrar en detalle.",
  theory: [
    { heading: "Funciones de una fila vs funciones de grupo", source: "added", body:
      "Este bloque completo es contenido añadido para la certificación: tus apuntes no distinguían explícitamente " +
      "entre ambos tipos. Una función de una sola fila (single-row function) actúa sobre cada fila de forma " +
      "independiente y devuelve un resultado por fila (por ejemplo UPPER, ROUND). Una función de grupo " +
      "(multiple-row / group function, nivel 6) actúa sobre un conjunto de filas y devuelve un único resultado " +
      "(por ejemplo SUM, COUNT)." },
    { heading: "Categorías de funciones de una fila en el examen", source: "added", body:
      "El temario 1Z0-071 agrupa las funciones de una fila en: caracteres (texto), numéricas, de fecha, de " +
      "conversión y generales/condicionales (NVL, DECODE, CASE...). Se estudian en detalle en el nivel 5." },
    { heading: "Funciones anidadas", source: "added", body:
      "Las funciones de una fila se pueden anidar: el resultado de una función se usa como argumento de otra, " +
      "de dentro hacia fuera. Ejemplo: ROUND(AVG(salary),0) — aunque cuidado, AVG es de grupo, no de una fila; " +
      "mezclarlas correctamente se estudia en el nivel 6-7. Ejemplo válido de anidamiento de una sola fila: " +
      "UPPER(SUBSTR(last_name,1,3))." }
  ],
  examples: [
    { title: "Función de una fila simple", code: "SELECT UPPER(last_name)\nFROM employees;" },
    { title: "Funciones anidadas", code: "SELECT UPPER(SUBSTR(last_name, 1, 3)) AS iniciales\nFROM employees;" }
  ],
  mistakes: [
    "Mezclar en el SELECT una función de una fila con una de grupo sin GROUP BY (se verá en detalle en el nivel 6-7).",
    "Pensar que todas las funciones devuelven texto: muchas devuelven número o fecha según el caso."
  ],
  quiz: [
    { q: "¿Cuántos resultados produce una función de una sola fila por cada fila de entrada?", options: ["Ninguno", "Exactamente uno", "Tantos como columnas tenga la tabla", "Depende del WHERE"], a: 1, exp: "Por definición, una función de una fila da un resultado por fila procesada." },
    { q: "¿Cuál de estas es una función de grupo, no de una fila?", options: ["UPPER", "ROUND", "SUM", "SUBSTR"], a: 2, exp: "SUM opera sobre un conjunto de filas; las demás son de una fila." },
    { q: "En 'UPPER(SUBSTR(last_name,1,3))', ¿qué función se evalúa primero?", options: ["UPPER", "SUBSTR", "Ambas a la vez", "Depende del optimizador"], a: 1, exp: "Las funciones anidadas se evalúan de dentro hacia fuera." }
  ],
  exercises: [
    { title: "Anidar funciones", prompt: "Muestra las 3 primeras letras del apellido en mayúsculas.", hint: "UPPER(SUBSTR(col,1,3))", solution: "SELECT UPPER(SUBSTR(last_name,1,3)) FROM employees;" }
  ],
  challenges: [
    { level: 1, prompt: "Clasifica: LOWER, AVG, TO_CHAR, COUNT, MOD. ¿Cuáles son de una fila y cuáles de grupo?", solution: "De una fila: LOWER, TO_CHAR, MOD. De grupo: AVG, COUNT." }
  ]
},

// =====================================================================
// NIVEL 5
// =====================================================================
{
  id: 5, code: "N5", icon: "🛠️",
  title: "Funciones numéricas, texto, fechas y conversión",
  intro: "El bloque de funciones más denso del examen: casi todo es contenido añadido respecto a tus apuntes.",
  theory: [
    { heading: "Funciones de texto (character functions)", source: "added", body:
      "UPPER/LOWER/INITCAP cambian mayúsculas; LENGTH devuelve longitud; SUBSTR(cadena, inicio, longitud) extrae " +
      "una subcadena (en Oracle el primer carácter es la posición 1, no 0); INSTR(cadena, busca) devuelve la " +
      "posición donde aparece; LPAD/RPAD rellenan por la izquierda/derecha hasta una longitud; TRIM quita " +
      "espacios (o un carácter indicado) de los extremos; REPLACE sustituye texto." },
    { heading: "Funciones numéricas", source: "apuntes", body:
      "ROUND(n, decimales) redondea (ya mencionado en tus apuntes); Oracle añade TRUNC(n, decimales) que trunca " +
      "sin redondear, y MOD(n, m) que devuelve el resto de la división entera." },
    { heading: "Funciones de fecha", source: "added", body:
      "SYSDATE devuelve la fecha y hora actuales del servidor. Se puede sumar/restar números a una fecha (en " +
      "días): SYSDATE + 7. MONTHS_BETWEEN(f1, f2) devuelve meses entre dos fechas; ADD_MONTHS(fecha, n) suma " +
      "meses; NEXT_DAY(fecha, 'FRIDAY') da el próximo día de la semana indicado; LAST_DAY(fecha) da el último " +
      "día del mes; ROUND/TRUNC también funcionan sobre fechas (por ejemplo al mes o al año más cercano)." },
    { heading: "Funciones de conversión", source: "added", body:
      "TO_CHAR(fecha o número, 'modelo_de_formato') convierte a texto con un formato concreto: " +
      "TO_CHAR(SYSDATE,'DD/MM/YYYY') o TO_CHAR(salary,'999,999.00'). TO_DATE(texto,'modelo') convierte texto a " +
      "fecha: TO_DATE('25/12/2024','DD/MM/YYYY'). TO_NUMBER(texto) convierte texto a número. Oracle también " +
      "hace conversión implícita en muchos casos, pero el examen exige saber usarlas de forma explícita." },
    { heading: "Funciones condicionales/generales", source: "added", body:
      "NVL(expr, valor_si_null) sustituye NULL por un valor por defecto. NVL2(expr, valor_si_no_null, " +
      "valor_si_null) es una versión con dos ramas. NULLIF(expr1, expr2) devuelve NULL si son iguales, si no " +
      "devuelve expr1. COALESCE(e1, e2, ...) devuelve el primer valor no nulo de la lista. DECODE(expr, valor1, " +
      "resultado1, valor2, resultado2, ..., por_defecto) es el 'switch' clásico de Oracle. CASE WHEN ... THEN " +
      "... ELSE ... END es el equivalente estándar ANSI, más flexible que DECODE porque admite condiciones, no " +
      "solo igualdades." }
  ],
  examples: [
    { title: "Texto", code: "SELECT INITCAP(first_name), SUBSTR(last_name,1,3), INSTR(last_name,'a'), LENGTH(last_name)\nFROM employees;" },
    { title: "Numéricas", code: "SELECT ROUND(1547.678, 2), TRUNC(1547.678, 2), MOD(17, 5)\nFROM DUAL;\n-- 1547.68  1547.67  2" },
    { title: "Fechas", code: "SELECT hire_date, MONTHS_BETWEEN(SYSDATE, hire_date) AS meses_antiguedad,\n       ADD_MONTHS(hire_date, 6) AS revision, LAST_DAY(hire_date)\nFROM employees;" },
    { title: "Conversión", code: "SELECT TO_CHAR(hire_date, 'DD \"de\" MONTH \"de\" YYYY') AS fecha_larga,\n       TO_CHAR(salary, '$999,999.00') AS salario_formateado\nFROM employees;" },
    { title: "NVL, DECODE y CASE", code: "SELECT last_name,\n       NVL(commission_pct, 0) AS comision,\n       DECODE(department_id, 10,'Admin', 20,'Marketing', 'Otro') AS depto_txt,\n       CASE WHEN salary > 10000 THEN 'Alto'\n            WHEN salary > 5000 THEN 'Medio'\n            ELSE 'Bajo' END AS categoria\nFROM employees;" }
  ],
  mistakes: [
    "Confundir SUBSTR posición 0 con posición 1: en Oracle el primer carácter es la posición 1.",
    "Usar DECODE para comparar rangos (>, <): DECODE solo compara igualdad; para rangos hay que usar CASE.",
    "Olvidar que TRUNC sin decimales sobre una fecha elimina la parte de hora, útil para comparar solo el día.",
    "Confundir NVL (siempre evalúa igual el tipo de dato) con NVL2 (dos resultados posibles según sea o no NULL)."
  ],
  quiz: [
    { q: "¿Cuál es la posición del primer carácter en SUBSTR de Oracle?", options: ["0", "1", "-1", "Depende del NLS"], a: 1, exp: "Oracle indexa cadenas desde la posición 1, no 0." },
    { q: "¿Qué diferencia hay entre ROUND y TRUNC en una función numérica?", options: [
        "Son sinónimos exactos", "ROUND redondea, TRUNC corta sin redondear",
        "TRUNC solo funciona con fechas", "ROUND solo funciona con enteros"
      ], a: 1, exp: "ROUND(1547.678,2)=1547.68; TRUNC(1547.678,2)=1547.67." },
    { q: "¿Qué función usarías para sustituir NULL por un valor por defecto?", options: ["NULLIF", "COALESCE o NVL", "DECODE", "TRUNC"], a: 1, exp: "NVL y COALESCE están diseñadas para eso; DECODE también podría pero no es su uso típico." },
    { q: "¿Qué limitación tiene DECODE frente a CASE?", options: [
        "DECODE es más lento siempre", "DECODE solo compara igualdad exacta, no admite rangos como > o <",
        "DECODE no existe en Oracle", "DECODE no puede usarse en SELECT"
      ], a: 1, exp: "CASE admite condiciones lógicas completas; DECODE solo compara igualdad." },
    { q: "¿Qué devuelve MONTHS_BETWEEN(SYSDATE, hire_date)?", options: [
        "El número de días entre las dos fechas", "El número de meses (puede ser decimal) entre las dos fechas",
        "La fecha resultante de sumar meses", "Un texto con el mes"
      ], a: 1, exp: "Devuelve un número, incluyendo fracción de mes si los días no coinciden exactamente." }
  ],
  exercises: [
    { title: "Formatear salario", prompt: "Muestra el salario formateado como moneda con dos decimales, p.ej. $6,000.00.", hint: "TO_CHAR(salary,'$999,999.00')", solution: "SELECT TO_CHAR(salary,'$999,999.00') AS salario FROM employees;" },
    { title: "Antigüedad en meses", prompt: "Calcula cuántos meses lleva contratado cada empleado hasta hoy, redondeado a 0 decimales.", hint: "ROUND(MONTHS_BETWEEN(SYSDATE, hire_date))", solution: "SELECT last_name, ROUND(MONTHS_BETWEEN(SYSDATE, hire_date)) AS meses FROM employees;" }
  ],
  challenges: [
    { level: 1, prompt: "Clasifica a los empleados en 'Sin comisión', 'Comisión baja' (<0.2) o 'Comisión alta' (>=0.2) usando CASE, tratando el NULL como 'Sin comisión'.", solution: "SELECT last_name,\n  CASE WHEN commission_pct IS NULL THEN 'Sin comisión'\n       WHEN commission_pct < 0.2 THEN 'Comisión baja'\n       ELSE 'Comisión alta' END AS categoria\nFROM employees;" },
    { level: 2, prompt: "Muestra el nombre completo en formato 'APELLIDO, Nombre' (apellido en mayúsculas, nombre con inicial mayúscula) y la fecha de contratación como 'día de MesEnTexto de año'.", solution: "SELECT UPPER(last_name) || ', ' || INITCAP(first_name) AS nombre_formateado,\n       TO_CHAR(hire_date, 'DD \"de\" Month \"de\" YYYY') AS fecha\nFROM employees;" }
  ]
},

// =====================================================================
// NIVEL 6
// =====================================================================
{
  id: 6, code: "N6", icon: "📊",
  title: "Funciones de grupo",
  intro: "Resumir muchas filas en un solo valor: COUNT, SUM, AVG, MIN, MAX y algo más.",
  theory: [
    { heading: "Funciones de agregación básicas", source: "apuntes", body:
      "COUNT(*) cuenta todas las filas (incluidos NULL); COUNT(columna) cuenta solo los valores no nulos de esa " +
      "columna; COUNT(DISTINCT columna) cuenta valores únicos no nulos. SUM suma valores numéricos ignorando " +
      "NULL. AVG calcula la media ignorando NULL. MIN y MAX funcionan también con texto (orden alfabético) y " +
      "fechas (más antigua/reciente)." },
    { heading: "STDDEV y VARIANCE", source: "apuntes", body:
      "STDDEV calcula la desviación estándar y VARIANCE la varianza de un conjunto de valores numéricos; ambas " +
      "ignoran los NULL, igual que el resto de funciones de grupo." },
    { heading: "Todas las funciones de grupo ignoran NULL (excepto COUNT(*))", source: "added", body:
      "Es una regla que el examen pregunta con frecuencia: AVG(commission_pct) NO trata los NULL como 0, los " +
      "excluye del cálculo por completo, por lo que el promedio real puede ser mayor de lo esperado si muchos " +
      "empleados no tienen comisión." },
    { heading: "Regla de columnas sueltas en el SELECT", source: "apuntes", body:
      "Si usas una función de grupo en el SELECT, cualquier otra columna 'suelta' (no agregada) debe estar en " +
      "GROUP BY o Oracle lanzará el error ORA-00937: not a single-group group function. Esto se estudia en " +
      "profundidad en el nivel 7." }
  ],
  examples: [
    { title: "Conteos", code: "SELECT COUNT(*) AS total_empleados,\n       COUNT(commission_pct) AS con_comision,\n       COUNT(DISTINCT department_id) AS departamentos_distintos\nFROM employees;" },
    { title: "Estadísticas de salario", code: "SELECT MIN(salary), MAX(salary), ROUND(AVG(salary),2), ROUND(STDDEV(salary),2)\nFROM employees;" }
  ],
  mistakes: [
    "Creer que AVG trata los NULL como cero: los excluye del cálculo, no los cuenta como 0.",
    "Poner una columna sin agregar junto a una función de grupo sin GROUP BY (ORA-00937).",
    "Usar COUNT(columna) esperando el total de filas cuando la columna tiene NULL: solo cuenta las no nulas."
  ],
  quiz: [
    { q: "¿Qué diferencia hay entre COUNT(*) y COUNT(commission_pct)?", options: [
        "Ninguna, son iguales", "COUNT(*) cuenta todas las filas; COUNT(commission_pct) solo las filas donde esa columna no es NULL",
        "COUNT(*) es más lento siempre", "COUNT(commission_pct) cuenta solo los valores duplicados"
      ], a: 1, exp: "COUNT(columna) excluye los NULL de esa columna concreta." },
    { q: "AVG(commission_pct) sobre una tabla donde el 60% de las filas tiene NULL en esa columna...", options: [
        "Trata los NULL como 0 en el cálculo", "Excluye los NULL: solo promedia el 40% de filas con valor",
        "Devuelve siempre NULL", "Da error"
      ], a: 1, exp: "Las funciones de grupo ignoran los NULL, no los convierten en 0." },
    { q: "¿Qué error lanza Oracle si mezclas una columna suelta con una función de grupo sin GROUP BY?", options: ["ORA-00001", "ORA-00937", "ORA-01400", "ORA-00904"], a: 1, exp: "ORA-00937: not a single-group group function." },
    { q: "¿Cuál de estas funciones puede aplicarse también sobre columnas de texto?", options: ["SUM", "AVG", "MIN / MAX", "VARIANCE"], a: 2, exp: "MIN/MAX funcionan con texto (orden alfabético) y fechas, no solo números." }
  ],
  exercises: [
    { title: "Resumen salarial", prompt: "Obtén en una sola consulta: número total de empleados, salario mínimo, máximo y medio (redondeado a 2 decimales).", hint: "COUNT, MIN, MAX, ROUND(AVG(...),2)", solution: "SELECT COUNT(*) AS total, MIN(salary) AS minimo, MAX(salary) AS maximo, ROUND(AVG(salary),2) AS media FROM employees;" },
    { title: "Departamentos distintos", prompt: "¿Cuántos departamentos diferentes tienen empleados asignados?", hint: "COUNT(DISTINCT ...)", solution: "SELECT COUNT(DISTINCT department_id) AS num_departamentos FROM employees;" }
  ],
  challenges: [
    { level: 1, prompt: "¿Cuántos empleados tienen comisión asignada y cuántos no? (una sola consulta, sin GROUP BY).", solution: "SELECT COUNT(commission_pct) AS con_comision,\n       COUNT(*) - COUNT(commission_pct) AS sin_comision\nFROM employees;" },
    { level: 2, prompt: "Calcula la desviación estándar y la varianza del salario, redondeadas a 2 decimales, con alias descriptivos.", solution: "SELECT ROUND(STDDEV(salary),2) AS desviacion, ROUND(VARIANCE(salary),2) AS varianza FROM employees;" }
  ]
},

// =====================================================================
// NIVEL 7
// =====================================================================
{
  id: 7, code: "N7", icon: "🗂️",
  title: "GROUP BY y HAVING",
  intro: "Agrupar filas para calcular agregados por grupo, y filtrar esos grupos.",
  theory: [
    { heading: "GROUP BY", source: "apuntes", body:
      "Agrupa filas que comparten el mismo valor en una o varias columnas, para calcular funciones de grupo por " +
      "cada grupo: SELECT department_id, AVG(salary) FROM employees GROUP BY department_id;. Toda columna del " +
      "SELECT que no esté dentro de una función de grupo debe aparecer en GROUP BY." },
    { heading: "HAVING vs WHERE", source: "apuntes", body:
      "WHERE filtra filas individuales ANTES de agrupar, y no puede usar funciones de grupo. HAVING filtra " +
      "grupos DESPUÉS de calcular los agregados, y sí puede usar funciones de grupo: " +
      "HAVING AVG(salary) > 6000." },
    { heading: "Orden lógico de ejecución de una consulta completa", source: "added", body:
      "Aunque se escriba SELECT...FROM...WHERE...GROUP BY...HAVING...ORDER BY, Oracle lo evalúa lógicamente en " +
      "este orden: 1) FROM  2) WHERE  3) GROUP BY  4) HAVING  5) SELECT  6) ORDER BY. Por eso los alias del " +
      "SELECT no se pueden usar en WHERE ni en HAVING (se calculan después), pero sí en ORDER BY." },
    { heading: "ROLLUP, CUBE y GROUPING SETS", source: "added", body:
      "Extensiones de GROUP BY que no aparecían en tus apuntes: ROLLUP(a,b) genera subtotales jerárquicos " +
      "(por a, por a+b, y el total general). CUBE(a,b) genera todas las combinaciones posibles de subtotales. " +
      "GROUPING SETS permite especificar manualmente qué combinaciones de agrupación quieres calcular en una " +
      "sola consulta, sin tener que usar UNION de varias consultas GROUP BY." }
  ],
  examples: [
    { title: "Agrupar y filtrar filas antes (WHERE) y grupos después (HAVING)", code: "SELECT department_id, COUNT(*) AS num_empleados, ROUND(AVG(salary),2) AS media\nFROM employees\nWHERE job_id <> 'ST_CLERK'\nGROUP BY department_id\nHAVING COUNT(*) > 3\nORDER BY media DESC;" },
    { title: "ROLLUP", code: "SELECT department_id, job_id, SUM(salary)\nFROM employees\nGROUP BY ROLLUP(department_id, job_id);\n-- añade subtotal por departamento y un total general" }
  ],
  mistakes: [
    "Usar una función de grupo en WHERE en vez de HAVING (WHERE AVG(salary)>5000 da error).",
    "Olvidar incluir en GROUP BY todas las columnas no agregadas del SELECT.",
    "Intentar usar un alias del SELECT dentro de HAVING: no está disponible todavía en ese punto de la ejecución."
  ],
  quiz: [
    { q: "¿Cuál es el orden lógico correcto de ejecución?", options: [
        "SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY", "FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY",
        "FROM, SELECT, WHERE, GROUP BY, HAVING, ORDER BY", "WHERE, FROM, GROUP BY, SELECT, HAVING, ORDER BY"
      ], a: 1, exp: "Primero se localizan y filtran filas, luego se agrupan, se filtran grupos y por último se eligen columnas y se ordena." },
    { q: "¿Dónde se debe filtrar por una condición de función de grupo, como 'más de 5 empleados'?", options: ["WHERE", "HAVING", "GROUP BY", "ORDER BY"], a: 1, exp: "HAVING filtra grupos ya calculados; WHERE no admite funciones de grupo." },
    { q: "¿Qué hace GROUP BY ROLLUP(department_id, job_id)?", options: [
        "Solo agrupa por department_id", "Genera subtotales por department_id+job_id, por department_id y un total general",
        "Da error de sintaxis", "Es idéntico a GROUP BY normal"
      ], a: 1, exp: "ROLLUP añade niveles de subtotal jerárquico automáticamente." },
    { q: "¿Por qué no se puede usar un alias del SELECT dentro de HAVING?", options: [
        "Por limitación arbitraria de Oracle sin motivo técnico", "Porque HAVING se evalúa lógicamente antes que el SELECT",
        "Porque HAVING no admite alias nunca en ningún caso", "Sí se puede sin problema"
      ], a: 1, exp: "El SELECT (donde se define el alias) se evalúa después de HAVING en el orden lógico." }
  ],
  exercises: [
    { title: "Media salarial por departamento", prompt: "Muestra el salario medio por departamento, solo para departamentos con más de 2 empleados.", hint: "GROUP BY ... HAVING COUNT(*) > 2", solution: "SELECT department_id, ROUND(AVG(salary),2) AS media\nFROM employees\nGROUP BY department_id\nHAVING COUNT(*) > 2;" },
    { title: "Filtrar antes y después", prompt: "Para empleados contratados después de 2005, muestra el número de empleados por puesto (job_id), solo puestos con al menos 2 empleados.", hint: "WHERE filtra filas, HAVING filtra grupos", solution: "SELECT job_id, COUNT(*) AS total\nFROM employees\nWHERE hire_date > TO_DATE('2005-01-01','YYYY-MM-DD')\nGROUP BY job_id\nHAVING COUNT(*) >= 2;" }
  ],
  challenges: [
    { level: 1, prompt: "Obtén el salario total por departamento y job_id, incluyendo subtotales por departamento y el total general, usando ROLLUP.", solution: "SELECT department_id, job_id, SUM(salary) AS total\nFROM employees\nGROUP BY ROLLUP(department_id, job_id);" },
    { level: 2, prompt: "Explica por qué esta consulta da error: SELECT department_id, salary FROM employees GROUP BY department_id; y cómo corregirla si lo que quieres es ver el salario medio.", solution: "Da error (ORA-00937) porque 'salary' no está agregada ni en GROUP BY. Corrección: SELECT department_id, AVG(salary) FROM employees GROUP BY department_id;" }
  ]
},

// =====================================================================
// NIVEL 8
// =====================================================================
{
  id: 8, code: "N8", icon: "🔗",
  title: "JOINs",
  intro: "Combinar filas de varias tablas relacionadas, con sintaxis ANSI y con la sintaxis clásica de Oracle.",
  theory: [
    { heading: "Tipos de JOIN (sintaxis ANSI)", source: "apuntes", body:
      "INNER JOIN devuelve solo las filas que coinciden en ambas tablas. LEFT [OUTER] JOIN devuelve todas las " +
      "filas de la tabla izquierda y las coincidencias de la derecha (NULL si no hay). RIGHT [OUTER] JOIN es lo " +
      "simétrico. FULL [OUTER] JOIN devuelve todo de ambas tablas, con NULL donde no hay coincidencia. " +
      "CROSS JOIN genera el producto cartesiano (todas las combinaciones posibles)." },
    { heading: "NATURAL JOIN y JOIN USING", source: "added", body:
      "NATURAL JOIN une automáticamente las tablas por todas las columnas que tengan el mismo nombre en ambas " +
      "(hay que usarlo con cuidado, puede unir por columnas no deseadas). JOIN ... USING(columna) permite " +
      "especificar manualmente una única columna común sin repetir el nombre de tabla, evitando ambigüedad " +
      "cuando ambas tablas comparten nombre de columna." },
    { heading: "Self join", source: "added", body:
      "Una tabla se puede unir consigo misma usando dos alias distintos, típico para relaciones jerárquicas " +
      "como 'empleado - su jefe', ambos almacenados en la misma tabla employees (manager_id referencia a " +
      "employee_id de la misma tabla)." },
    { heading: "Sintaxis antigua de Oracle con (+)", source: "added", body:
      "Antes de que Oracle adoptara el estándar ANSI JOIN, los outer join se escribían con el operador (+) en " +
      "la condición del WHERE, colocado en el lado de la tabla que puede tener valores 'que falten'. El examen " +
      "puede preguntar por reconocer esta sintaxis heredada: " +
      "WHERE e.department_id = d.department_id(+) equivale a un LEFT JOIN de e hacia d." }
  ],
  examples: [
    { title: "INNER JOIN (ANSI)", code: "SELECT e.last_name, d.department_name\nFROM employees e\nJOIN departments d ON e.department_id = d.department_id;" },
    { title: "LEFT JOIN", code: "SELECT e.last_name, d.department_name\nFROM employees e\nLEFT JOIN departments d ON e.department_id = d.department_id;" },
    { title: "Self join (empleado-jefe)", code: "SELECT emp.last_name AS empleado, jefe.last_name AS jefe\nFROM employees emp\nLEFT JOIN employees jefe ON emp.manager_id = jefe.employee_id;" },
    { title: "Sintaxis antigua con (+)", code: "SELECT e.last_name, d.department_name\nFROM employees e, departments d\nWHERE e.department_id = d.department_id(+);" },
    { title: "JOIN USING", code: "SELECT last_name, department_name\nFROM employees\nJOIN departments USING (department_id);" }
  ],
  mistakes: [
    "Olvidar la condición ON en un JOIN, generando sin querer un producto cartesiano.",
    "Poner el (+) en el lado equivocado en la sintaxis antigua, invirtiendo el sentido del outer join.",
    "Usar NATURAL JOIN sobre tablas que comparten una columna 'de coincidencia accidental' (por ejemplo dos columnas llamadas igual pero con significado distinto)."
  ],
  quiz: [
    { q: "¿Qué devuelve un LEFT JOIN que no devuelve un INNER JOIN?", options: [
        "Nada distinto, son iguales", "Las filas de la tabla izquierda sin coincidencia en la derecha (con NULL en las columnas de la derecha)",
        "Solo las filas coincidentes", "El producto cartesiano completo"
      ], a: 1, exp: "LEFT JOIN conserva todas las filas de la izquierda aunque no haya coincidencia." },
    { q: "En la sintaxis antigua de Oracle, ¿qué representa 'd.department_id(+)'?", options: [
        "Que la tabla d es la que puede faltar (equivalente a LEFT JOIN desde la otra tabla)", "Un error de sintaxis",
        "Que se suma 1 al department_id", "Que es un INNER JOIN forzado"
      ], a: 0, exp: "El (+) se coloca en el lado 'opcional' de la relación." },
    { q: "¿Qué genera un CROSS JOIN entre una tabla de 5 filas y otra de 3 filas?", options: ["8 filas", "15 filas", "3 filas", "Error"], a: 1, exp: "El producto cartesiano da 5 x 3 = 15 combinaciones." },
    { q: "¿Para qué sirve un self join?", options: [
        "Para unir una tabla con una vista", "Para unir una tabla consigo misma, típico en relaciones jerárquicas como empleado-jefe",
        "Para eliminar duplicados", "No existe en Oracle"
      ], a: 1, exp: "Se usan dos alias de la misma tabla para representar los dos 'roles' de la relación." }
  ],
  exercises: [
    { title: "JOIN básico", prompt: "Muestra el nombre del empleado y el nombre de su departamento.", hint: "JOIN ... ON e.department_id = d.department_id", solution: "SELECT e.last_name, d.department_name\nFROM employees e\nJOIN departments d ON e.department_id = d.department_id;" },
    { title: "Empleados sin departamento", prompt: "Lista todos los empleados, incluidos los que no tengan departamento asignado.", hint: "LEFT JOIN", solution: "SELECT e.last_name, d.department_name\nFROM employees e\nLEFT JOIN departments d ON e.department_id = d.department_id;" }
  ],
  challenges: [
    { level: 1, prompt: "Usando self join, muestra empleados junto al nombre de su jefe, incluyendo a los empleados que no tienen jefe (por ejemplo el director general).", solution: "SELECT emp.last_name AS empleado, jefe.last_name AS jefe\nFROM employees emp\nLEFT JOIN employees jefe ON emp.manager_id = jefe.employee_id;" },
    { level: 2, prompt: "Reescribe con sintaxis ANSI esta consulta antigua: SELECT e.last_name, d.department_name FROM employees e, departments d WHERE e.department_id = d.department_id(+);", solution: "SELECT e.last_name, d.department_name\nFROM employees e\nLEFT JOIN departments d ON e.department_id = d.department_id;" }
  ]
},

// =====================================================================
// NIVEL 9
// =====================================================================
{
  id: 9, code: "N9", icon: "🪆",
  title: "Subconsultas",
  intro: "Consultas dentro de consultas: en WHERE, en SELECT, en FROM, correlacionadas y con EXISTS.",
  theory: [
    { heading: "Subconsultas en WHERE", source: "apuntes", body:
      "Una subconsulta de una sola columna se puede comparar con =, >, <, IN, NOT IN: " +
      "WHERE salary > (SELECT AVG(salary) FROM employees). Es una subconsulta de una sola fila y una sola columna." },
    { heading: "Subconsultas multicolumna y multifila", source: "added", body:
      "Con IN se puede comparar contra varias filas: WHERE department_id IN (SELECT department_id FROM " +
      "departments WHERE location_id=1700). Con ANY y ALL se comparan valores contra un conjunto: > ANY " +
      "significa 'mayor que al menos uno'; > ALL significa 'mayor que todos'. Una subconsulta multicolumna " +
      "compara varias columnas a la vez: WHERE (department_id, job_id) IN (SELECT department_id, job_id FROM ...)." },
    { heading: "EXISTS y NOT EXISTS", source: "apuntes", body:
      "EXISTS comprueba si la subconsulta devuelve al menos una fila (no importa el contenido, solo la " +
      "existencia); es habitualmente más eficiente que IN con tablas grandes porque Oracle puede parar en " +
      "cuanto encuentra la primera coincidencia. NOT EXISTS comprueba la ausencia de filas." },
    { heading: "Subconsultas correlacionadas", source: "added", body:
      "Una subconsulta correlacionada referencia una columna de la consulta externa, por lo que se ejecuta una " +
      "vez por cada fila de la consulta externa (no una sola vez de forma independiente). Es la base de EXISTS " +
      "en la práctica: WHERE EXISTS (SELECT 1 FROM departments d WHERE d.department_id = e.department_id)." },
    { heading: "Subconsultas en SELECT y en FROM", source: "apuntes", body:
      "En el SELECT, una subconsulta escalar debe devolver un único valor por fila. En el FROM, una subconsulta " +
      "se comporta como una tabla temporal (también llamada 'vista en línea'), sobre la que se puede filtrar y " +
      "agrupar en la consulta externa." },
    { heading: "Subconsultas en UPDATE y DELETE", source: "added", body:
      "También se pueden usar subconsultas fuera del SELECT: " +
      "UPDATE employees SET salary = salary*1.1 WHERE department_id = (SELECT department_id FROM departments " +
      "WHERE department_name='IT'); y del mismo modo en DELETE. No aparecía en tus apuntes." }
  ],
  examples: [
    { title: "Subconsulta simple en WHERE", code: "SELECT last_name, salary\nFROM employees\nWHERE salary > (SELECT AVG(salary) FROM employees);" },
    { title: "ANY / ALL", code: "SELECT last_name, salary\nFROM employees\nWHERE salary > ALL (SELECT salary FROM employees WHERE department_id = 60);" },
    { title: "EXISTS correlacionada", code: "SELECT d.department_name\nFROM departments d\nWHERE EXISTS (SELECT 1 FROM employees e WHERE e.department_id = d.department_id);" },
    { title: "Subconsulta en FROM", code: "SELECT department_id, media\nFROM (SELECT department_id, AVG(salary) AS media\n      FROM employees GROUP BY department_id) t\nWHERE media > 6000;" },
    { title: "Subconsulta en UPDATE", code: "UPDATE employees\nSET salary = salary * 1.10\nWHERE department_id = (SELECT department_id FROM departments WHERE department_name = 'IT');" }
  ],
  mistakes: [
    "Usar = con una subconsulta que puede devolver varias filas (ORA-01427: single-row subquery returns more than one row).",
    "Confundir > ANY (mayor que el mínimo) con > ALL (mayor que el máximo): son casi opuestos.",
    "Olvidar que una subconsulta correlacionada se ejecuta una vez por cada fila externa, lo que puede afectar al rendimiento en tablas grandes."
  ],
  quiz: [
    { q: "¿Qué error da Oracle si usas = con una subconsulta que devuelve varias filas?", options: ["ORA-00937", "ORA-01427", "ORA-00001", "ORA-00904"], a: 1, exp: "ORA-01427: single-row subquery returns more than one row. Debería usarse IN, ANY o ALL." },
    { q: "'salary > ANY (subconsulta)' significa...", options: [
        "salary es mayor que TODOS los valores de la subconsulta", "salary es mayor que AL MENOS UNO de los valores de la subconsulta",
        "salary es igual a alguno de los valores", "Da error de sintaxis"
      ], a: 1, exp: "ANY equivale a 'mayor que el mínimo' de la lista." },
    { q: "¿Qué caracteriza a una subconsulta correlacionada?", options: [
        "Se ejecuta una sola vez antes que la consulta externa", "Referencia una columna de la consulta externa y se reevalúa por cada fila externa",
        "Solo puede usarse con EXISTS", "No puede usarse en WHERE"
      ], a: 1, exp: "La correlación con la fila externa es lo que la distingue de una subconsulta independiente." },
    { q: "¿Dónde se puede usar una subconsulta como si fuera una tabla?", options: ["Solo en WHERE", "Solo en HAVING", "En la cláusula FROM (vista en línea)", "No es posible en Oracle"], a: 2, exp: "Una subconsulta en FROM actúa como tabla temporal para la consulta externa." }
  ],
  exercises: [
    { title: "Por encima de la media", prompt: "Muestra los empleados que ganan más que la media general de salario.", hint: "WHERE salary > (SELECT AVG(salary) FROM employees)", solution: "SELECT last_name, salary FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);" },
    { title: "Departamentos con empleados", prompt: "Usando EXISTS, lista los departamentos que tienen al menos un empleado.", hint: "WHERE EXISTS (subconsulta correlacionada)", solution: "SELECT department_name FROM departments d WHERE EXISTS (SELECT 1 FROM employees e WHERE e.department_id = d.department_id);" }
  ],
  challenges: [
    { level: 1, prompt: "Usando NOT EXISTS, lista los departamentos que NO tienen ningún empleado asignado.", solution: "SELECT department_name FROM departments d\nWHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.department_id = d.department_id);" },
    { level: 2, prompt: "Usando una subconsulta en FROM, muestra solo los departamentos cuyo salario medio supera los 7000.", solution: "SELECT department_id, media FROM (\n  SELECT department_id, AVG(salary) AS media FROM employees GROUP BY department_id\n) t\nWHERE media > 7000;" }
  ]
},

// =====================================================================
// NIVEL 10
// =====================================================================
{
  id: 10, code: "N10", icon: "➗",
  title: "Operadores de conjunto",
  intro: "Combinar los resultados de dos o más SELECT compatibles.",
  theory: [
    { heading: "UNION y UNION ALL", source: "apuntes", body:
      "UNION combina los resultados de dos consultas y elimina duplicados (más costoso, porque ordena internamente). " +
      "UNION ALL combina sin eliminar duplicados, por lo que es más rápido. Ambas consultas deben tener el mismo " +
      "número de columnas, con tipos de datos compatibles." },
    { heading: "INTERSECT", source: "apuntes", body:
      "Devuelve solo las filas que aparecen en ambos resultados." },
    { heading: "MINUS en vez de EXCEPT", source: "added", body:
      "Aquí está el cambio de sintaxis más importante respecto a tus apuntes: donde el estándar ANSI (y " +
      "PostgreSQL) usan EXCEPT, Oracle usa la palabra clave MINUS con el mismo significado: devuelve las filas " +
      "de la primera consulta que NO aparecen en la segunda. EXCEPT no existe en Oracle SQL." },
    { heading: "Reglas y ORDER BY", source: "added", body:
      "Solo se puede usar un ORDER BY al final de toda la combinación (no en cada SELECT individual), y debe " +
      "referirse a las columnas por posición o por el alias de la primera consulta. Los nombres de columna del " +
      "resultado final son los de la primera consulta del bloque." }
  ],
  examples: [
    { title: "UNION vs UNION ALL", code: "SELECT department_id FROM employees\nUNION\nSELECT department_id FROM departments;\n\n-- con duplicados permitidos y más rápido:\nSELECT department_id FROM employees\nUNION ALL\nSELECT department_id FROM departments;" },
    { title: "MINUS", code: "SELECT department_id FROM departments\nMINUS\nSELECT department_id FROM employees;\n-- departamentos que NO tienen ningún empleado" },
    { title: "INTERSECT", code: "SELECT employee_id FROM employees WHERE department_id = 50\nINTERSECT\nSELECT employee_id FROM employees WHERE salary > 5000;" }
  ],
  mistakes: [
    "Escribir EXCEPT en Oracle pensando que existe: da error de sintaxis, es MINUS.",
    "Combinar consultas con distinto número de columnas o tipos incompatibles.",
    "Poner ORDER BY en cada SELECT individual de la combinación en vez de uno solo al final."
  ],
  quiz: [
    { q: "¿Qué palabra clave usa Oracle en vez de EXCEPT?", options: ["DIFF", "MINUS", "SUBTRACT", "NOT IN"], a: 1, exp: "Oracle no soporta EXCEPT; el equivalente es MINUS." },
    { q: "¿Qué diferencia hay entre UNION y UNION ALL?", options: [
        "Son idénticos", "UNION elimina duplicados, UNION ALL los conserva (y es más rápido)",
        "UNION ALL elimina duplicados y UNION no", "UNION ALL no existe en Oracle"
      ], a: 1, exp: "UNION ordena y elimina duplicados; UNION ALL simplemente concatena resultados." },
    { q: "¿Qué requisito deben cumplir las consultas combinadas con operadores de conjunto?", options: [
        "Consultar la misma tabla obligatoriamente", "Tener el mismo número de columnas con tipos compatibles",
        "Tener el mismo WHERE", "No pueden tener funciones de grupo"
      ], a: 1, exp: "El número de columnas y su compatibilidad de tipo es obligatorio; los nombres pueden diferir." },
    { q: "¿Dónde se coloca el ORDER BY en una consulta combinada con UNION?", options: [
        "En cada SELECT individual", "Solo al final de toda la combinación", "No se puede usar ORDER BY con UNION", "Antes del primer SELECT"
      ], a: 1, exp: "Solo puede haber un ORDER BY, al final de todo el bloque combinado." }
  ],
  exercises: [
    { title: "Departamentos sin empleados", prompt: "Usa el operador de conjunto adecuado para listar los department_id que existen en departments pero no tienen empleados en employees.", hint: "MINUS, no EXCEPT", solution: "SELECT department_id FROM departments\nMINUS\nSELECT department_id FROM employees;" },
    { title: "IDs combinados sin duplicados", prompt: "Combina los department_id de employees y departments en una sola lista sin duplicados.", hint: "UNION", solution: "SELECT department_id FROM employees\nUNION\nSELECT department_id FROM departments;" }
  ],
  challenges: [
    { level: 1, prompt: "Obtén los employee_id que están tanto en el departamento 50 como con salario mayor a 4000, usando INTERSECT.", solution: "SELECT employee_id FROM employees WHERE department_id = 50\nINTERSECT\nSELECT employee_id FROM employees WHERE salary > 4000;" },
    { level: 2, prompt: "¿Por qué UNION ALL suele preferirse a UNION cuando sabes que no puede haber duplicados entre las dos consultas?", solution: "Porque UNION internamente ordena y compara todas las filas para eliminar duplicados, lo cual tiene coste; si sabes que no hay duplicados posibles, UNION ALL da el mismo resultado sin ese coste extra." }
  ]
},

// =====================================================================
// NIVEL 11
// =====================================================================
{
  id: 11, code: "N11", icon: "✍️",
  title: "INSERT, UPDATE y DELETE",
  intro: "Las tres sentencias DML clásicas, más MERGE e INSERT multitabla, propios de Oracle.",
  theory: [
    { heading: "INSERT", source: "apuntes", body:
      "INSERT INTO tabla (col1, col2) VALUES (valor1, valor2); Si se listan todas las columnas en el mismo " +
      "orden de la tabla, se puede omitir la lista de columnas (no recomendado en código real, es frágil ante " +
      "cambios de estructura). También se puede insertar el resultado de un SELECT: INSERT INTO tabla SELECT ... FROM otra_tabla." },
    { heading: "UPDATE", source: "apuntes", body:
      "UPDATE tabla SET columna = valor WHERE condición;. Si se omite el WHERE, se actualizan TODAS las filas " +
      "de la tabla: uno de los errores más peligrosos y frecuentes." },
    { heading: "DELETE", source: "apuntes", body:
      "DELETE FROM tabla WHERE condición;. Igual que UPDATE, sin WHERE borra todas las filas (pero mantiene la " +
      "estructura de la tabla, a diferencia de DROP TABLE o TRUNCATE, que se ven en el nivel 12)." },
    { heading: "INSERT multitabla: INSERT ALL / INSERT FIRST", source: "added", body:
      "Exclusivo de Oracle, no existe en tus apuntes: permite insertar el resultado de una sola subconsulta en " +
      "varias tablas a la vez. INSERT ALL inserta en todas las ramas que cumplan su condición WHEN; INSERT " +
      "FIRST inserta solo en la primera rama que cumpla la condición." },
    { heading: "MERGE", source: "added", body:
      "MERGE combina INSERT y UPDATE en una sola sentencia ('upsert'): compara una tabla origen con una destino " +
      "según una condición, y si coincide actualiza (WHEN MATCHED), si no coincide inserta (WHEN NOT MATCHED). " +
      "Muy usado en cargas de datos y sincronización de tablas." },
    { heading: "DEFAULT en INSERT/UPDATE", source: "added", body:
      "La palabra clave DEFAULT permite asignar explícitamente el valor por defecto definido en la columna, " +
      "tanto en INSERT como en UPDATE, sin tener que conocer o repetir ese valor." }
  ],
  examples: [
    { title: "INSERT básico", code: "INSERT INTO departments (department_id, department_name, location_id)\nVALUES (280, 'Innovación', 1700);" },
    { title: "UPDATE con condición", code: "UPDATE employees\nSET salary = salary * 1.05\nWHERE department_id = 60;" },
    { title: "MERGE", code: "MERGE INTO empleados_actual dst\nUSING empleados_nuevos src\nON (dst.employee_id = src.employee_id)\nWHEN MATCHED THEN\n  UPDATE SET dst.salary = src.salary\nWHEN NOT MATCHED THEN\n  INSERT (employee_id, salary) VALUES (src.employee_id, src.salary);" },
    { title: "INSERT ALL", code: "INSERT ALL\n  WHEN salary > 10000 THEN INTO altos_salarios\n  WHEN salary <= 10000 THEN INTO resto_salarios\nSELECT employee_id, salary FROM employees;" }
  ],
  mistakes: [
    "Ejecutar UPDATE o DELETE sin WHERE por descuido, afectando a toda la tabla.",
    "Olvidar que INSERT INTO tabla SELECT ... requiere que las columnas coincidan en número y tipo compatible.",
    "Confundir MERGE con un simple UPDATE: MERGE decide entre insertar o actualizar según la coincidencia."
  ],
  quiz: [
    { q: "¿Qué ocurre si ejecutas UPDATE empleados SET salary = 5000; sin WHERE?", options: [
        "Da error, WHERE es obligatorio", "Actualiza todas las filas de la tabla al valor 5000",
        "No hace nada", "Pide confirmación automáticamente"
      ], a: 1, exp: "Sin WHERE, la actualización afecta a todas las filas: es uno de los errores más peligrosos en producción." },
    { q: "¿Qué sentencia combina INSERT y UPDATE en una sola operación según coincidencia?", options: ["UPSERT", "MERGE", "COMBINE", "INSERT ALL"], a: 1, exp: "MERGE es la sentencia estándar de Oracle para esta operación (a veces coloquialmente llamada 'upsert')." },
    { q: "¿Para qué sirve INSERT ALL en Oracle?", options: [
        "Para insertar una sola fila en una sola tabla", "Para insertar el resultado de una subconsulta en varias tablas distintas según condiciones",
        "Es sinónimo de INSERT INTO", "Solo funciona con DUAL"
      ], a: 1, exp: "INSERT ALL permite repartir filas de origen entre varias tablas destino en una sola sentencia." },
    { q: "¿Qué diferencia hay entre DELETE FROM tabla; y borrar toda la tabla con TRUNCATE (nivel 12)?", options: [
        "Son exactamente lo mismo en todos los aspectos", "DELETE es DML (se puede deshacer con ROLLBACK antes de COMMIT), TRUNCATE es DDL y libera espacio inmediatamente",
        "TRUNCATE es más lento siempre", "DELETE elimina también la estructura de la tabla"
      ], a: 1, exp: "Se profundiza en el nivel 12, pero es clave: DELETE es transaccional, TRUNCATE no." }
  ],
  exercises: [
    { title: "Insertar un departamento", prompt: "Inserta un nuevo departamento con id 290, nombre 'Sostenibilidad' y location_id 1700.", hint: "INSERT INTO departments (...) VALUES (...);", solution: "INSERT INTO departments (department_id, department_name, location_id) VALUES (290, 'Sostenibilidad', 1700);" },
    { title: "Subir sueldos", prompt: "Sube un 8% el salario a los empleados del departamento 30.", hint: "UPDATE ... SET salary = salary * 1.08 WHERE ...", solution: "UPDATE employees SET salary = salary * 1.08 WHERE department_id = 30;" }
  ],
  challenges: [
    { level: 1, prompt: "Borra los empleados del departamento 999 (departamento inexistente, para practicar sin riesgo) usando DELETE con condición.", solution: "DELETE FROM employees WHERE department_id = 999;" },
    { level: 2, prompt: "Explica en qué se diferencia una sentencia MERGE de escribir 'a mano' un UPDATE seguido de un INSERT condicional, y cuándo aporta ventaja real.", solution: "MERGE evalúa la coincidencia y decide UPDATE o INSERT en una sola pasada sobre los datos origen, evitando leer dos veces la fuente y reduciendo el riesgo de condiciones de carrera; es especialmente útil en cargas ETL o sincronización periódica de tablas." }
  ]
},

// =====================================================================
// NIVEL 12
// =====================================================================
{
  id: 12, code: "N12", icon: "🏗️",
  title: "CREATE TABLE, ALTER TABLE y DROP TABLE",
  intro: "Crear y modificar la estructura de las tablas con sintaxis y tipos de dato Oracle.",
  theory: [
    { heading: "CREATE TABLE con tipos Oracle", source: "apuntes", body:
      "La estructura CREATE TABLE nombre (columna tipo, ...) es igual que en tus apuntes, pero los tipos deben " +
      "ser los de Oracle: VARCHAR2(n), NUMBER(p,s), DATE, TIMESTAMP, CLOB. Ejemplo: " +
      "CREATE TABLE clientes (id NUMBER(6) PRIMARY KEY, nombre VARCHAR2(50) NOT NULL, alta DATE DEFAULT SYSDATE);" },
    { heading: "ALTER TABLE", source: "apuntes", body:
      "ALTER TABLE tabla ADD (columna tipo); añade columnas. ALTER TABLE tabla MODIFY (columna nuevo_tipo); " +
      "cambia el tipo o tamaño de una columna existente (con restricciones si ya tiene datos incompatibles). " +
      "ALTER TABLE tabla DROP COLUMN columna; elimina una columna." },
    { heading: "RENAME y TRUNCATE", source: "added", body:
      "RENAME tabla_vieja TO tabla_nueva; cambia el nombre de una tabla. TRUNCATE TABLE tabla; elimina TODAS " +
      "las filas de golpe: es DDL (no DML como DELETE), no se puede deshacer con ROLLBACK, y libera el espacio " +
      "de almacenamiento inmediatamente. Es mucho más rápido que un DELETE sin WHERE en tablas grandes." },
    { heading: "DROP TABLE y recuperación con Flashback", source: "added", body:
      "DROP TABLE tabla; elimina la tabla completa (estructura y datos). En Oracle, por defecto la tabla se " +
      "mueve a la 'papelera de reciclaje' (recycle bin) y se puede recuperar con " +
      "FLASHBACK TABLE tabla TO BEFORE DROP;. Para eliminarla de forma definitiva sin pasar por la papelera se " +
      "usa DROP TABLE tabla PURGE;" }
  ],
  examples: [
    { title: "Crear tabla con tipos Oracle", code: "CREATE TABLE clientes (\n  id_cliente   NUMBER(6),\n  nombre       VARCHAR2(50) NOT NULL,\n  email        VARCHAR2(100),\n  fecha_alta   DATE DEFAULT SYSDATE,\n  CONSTRAINT pk_clientes PRIMARY KEY (id_cliente)\n);" },
    { title: "Modificar y añadir columnas", code: "ALTER TABLE clientes ADD (telefono VARCHAR2(15));\nALTER TABLE clientes MODIFY (nombre VARCHAR2(80));\nALTER TABLE clientes DROP COLUMN telefono;" },
    { title: "TRUNCATE vs DELETE", code: "TRUNCATE TABLE clientes;   -- DDL, no se puede hacer ROLLBACK, muy rápido\n-- frente a:\nDELETE FROM clientes;      -- DML, se puede hacer ROLLBACK antes de COMMIT" },
    { title: "Recuperar una tabla borrada", code: "DROP TABLE clientes;\nFLASHBACK TABLE clientes TO BEFORE DROP;" }
  ],
  mistakes: [
    "Pensar que TRUNCATE se puede deshacer con ROLLBACK: es DDL, hace commit implícito.",
    "Usar VARCHAR en vez de VARCHAR2 al crear tablas en Oracle.",
    "Olvidar que ALTER ... MODIFY puede fallar si los datos existentes no caben en el nuevo tipo/tamaño."
  ],
  quiz: [
    { q: "¿Qué diferencia clave hay entre TRUNCATE y DELETE sin WHERE?", options: [
        "Ninguna, son intercambiables", "TRUNCATE es DDL y no se puede deshacer con ROLLBACK; DELETE es DML y sí",
        "DELETE es más rápido siempre", "TRUNCATE no borra todas las filas"
      ], a: 1, exp: "TRUNCATE hace commit implícito y libera espacio; DELETE es transaccional." },
    { q: "¿Qué comando permite recuperar una tabla borrada recientemente con DROP TABLE (sin PURGE)?", options: [
        "ROLLBACK TABLE", "FLASHBACK TABLE ... TO BEFORE DROP", "RESTORE TABLE", "No es posible recuperarla nunca"
      ], a: 1, exp: "Oracle mueve la tabla a la papelera de reciclaje, permitiendo recuperarla con FLASHBACK." },
    { q: "¿Qué cláusula evita que una tabla borrada pase por la papelera de reciclaje?", options: ["FORCE", "PURGE", "CASCADE", "IMMEDIATE"], a: 1, exp: "DROP TABLE tabla PURGE; elimina definitivamente sin posibilidad de flashback." },
    { q: "¿Cuál es el tipo de texto de longitud variable correcto para una columna en Oracle?", options: ["VARCHAR(50)", "TEXT(50)", "VARCHAR2(50)", "STRING(50)"], a: 2, exp: "VARCHAR2 es el tipo recomendado y estándar de Oracle para texto variable." }
  ],
  exercises: [
    { title: "Crear tabla de productos", prompt: "Crea una tabla productos con id_producto NUMBER(6) como clave primaria, nombre VARCHAR2(100) obligatorio, y precio NUMBER(8,2).", hint: "CREATE TABLE ... PRIMARY KEY ...", solution: "CREATE TABLE productos (\n  id_producto NUMBER(6) PRIMARY KEY,\n  nombre VARCHAR2(100) NOT NULL,\n  precio NUMBER(8,2)\n);" },
    { title: "Modificar estructura", prompt: "Añade una columna stock de tipo NUMBER(6) por defecto 0 a la tabla productos.", hint: "ALTER TABLE ... ADD (... DEFAULT ...)", solution: "ALTER TABLE productos ADD (stock NUMBER(6) DEFAULT 0);" }
  ],
  challenges: [
    { level: 1, prompt: "Vacía por completo la tabla productos de la forma más rápida posible, sabiendo que no necesitarás deshacer la operación.", solution: "TRUNCATE TABLE productos;" },
    { level: 2, prompt: "Borra la tabla productos de forma que NO se pueda recuperar después con FLASHBACK.", solution: "DROP TABLE productos PURGE;" }
  ]
},

// =====================================================================
// NIVEL 13
// =====================================================================
{
  id: 13, code: "N13", icon: "🔒",
  title: "Constraints",
  intro: "Reglas de integridad: NOT NULL, PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK, y su gestión en Oracle.",
  theory: [
    { heading: "Tipos de constraint", source: "apuntes", body:
      "NOT NULL obliga a que una columna tenga valor. PRIMARY KEY identifica de forma única cada fila (implica " +
      "NOT NULL + UNIQUE). UNIQUE permite valores únicos pero sí admite NULL. FOREIGN KEY enlaza con la clave " +
      "primaria de otra tabla. CHECK valida una condición sobre los valores, p.ej. CHECK (salary > 0)." },
    { heading: "Constraints con nombre explícito", source: "added", body:
      "Se recomienda nombrar siempre los constraints con CONSTRAINT nombre tipo(...), en vez de dejar que Oracle " +
      "genere un nombre automático tipo SYS_C0012345, ilegible en mensajes de error futuros: " +
      "CONSTRAINT fk_emp_dept FOREIGN KEY (department_id) REFERENCES departments(department_id)." },
    { heading: "Nivel de columna vs nivel de tabla", source: "apuntes", body:
      "Un constraint a nivel de columna se escribe justo después del tipo de dato. Un constraint a nivel de " +
      "tabla se escribe al final, después de todas las columnas, y es obligatorio cuando afecta a varias " +
      "columnas a la vez (p.ej. una PRIMARY KEY compuesta)." },
    { heading: "ON DELETE CASCADE / SET NULL", source: "apuntes", body:
      "En una FOREIGN KEY, ON DELETE CASCADE hace que al borrar la fila padre se borren automáticamente las " +
      "filas hijas relacionadas. ON DELETE SET NULL pone a NULL la clave foránea de las filas hijas en vez de " +
      "borrarlas. Sin ninguna de las dos, Oracle impide borrar la fila padre si tiene hijos (comportamiento por defecto)." },
    { heading: "Habilitar y deshabilitar constraints", source: "added", body:
      "No estaba en tus apuntes: se puede desactivar temporalmente un constraint (por ejemplo para cargar datos " +
      "masivos sin validación) con ALTER TABLE tabla DISABLE CONSTRAINT nombre; y reactivarlo después con " +
      "ENABLE CONSTRAINT nombre;." }
  ],
  examples: [
    { title: "Constraints a nivel de columna y de tabla", code: "CREATE TABLE empleados_dep (\n  id_emp     NUMBER(6),\n  nombre     VARCHAR2(50) NOT NULL,\n  email      VARCHAR2(100) UNIQUE,\n  salario    NUMBER(8,2) CHECK (salario > 0),\n  dept_id    NUMBER(4),\n  CONSTRAINT pk_empleados_dep PRIMARY KEY (id_emp),\n  CONSTRAINT fk_emp_dept FOREIGN KEY (dept_id)\n    REFERENCES departments(department_id) ON DELETE SET NULL\n);" },
    { title: "Deshabilitar y habilitar", code: "ALTER TABLE empleados_dep DISABLE CONSTRAINT fk_emp_dept;\n-- ... carga masiva de datos ...\nALTER TABLE empleados_dep ENABLE CONSTRAINT fk_emp_dept;" },
    { title: "Añadir un constraint a una tabla existente", code: "ALTER TABLE empleados_dep\nADD CONSTRAINT chk_salario_min CHECK (salario >= 1000);" }
  ],
  mistakes: [
    "No nombrar los constraints y luego no entender el mensaje de error SYS_C00123456.",
    "Olvidar que PRIMARY KEY implica NOT NULL + UNIQUE automáticamente (no hace falta repetir NOT NULL).",
    "Confundir ON DELETE CASCADE con el comportamiento por defecto (que en realidad impide el borrado del padre)."
  ],
  quiz: [
    { q: "¿Qué combinación de restricciones implica automáticamente una PRIMARY KEY?", options: ["Solo NOT NULL", "Solo UNIQUE", "NOT NULL + UNIQUE", "CHECK + UNIQUE"], a: 2, exp: "Una PK garantiza unicidad y obligatoriedad a la vez." },
    { q: "¿Qué diferencia hay entre UNIQUE y PRIMARY KEY?", options: [
        "Ninguna", "UNIQUE permite un valor NULL (o varios, según el motor), PRIMARY KEY nunca admite NULL",
        "PRIMARY KEY admite duplicados y UNIQUE no", "UNIQUE solo se puede usar una vez por tabla"
      ], a: 1, exp: "UNIQUE valida unicidad pero sí admite NULL; PRIMARY KEY no admite NULL en ninguna de sus columnas." },
    { q: "¿Qué hace ON DELETE CASCADE en una FOREIGN KEY?", options: [
        "Impide borrar la fila padre", "Al borrar la fila padre, borra automáticamente las filas hijas relacionadas",
        "Pone a NULL la clave foránea de los hijos", "No tiene efecto en DELETE"
      ], a: 1, exp: "CASCADE propaga el borrado a las filas hijas." },
    { q: "¿Cómo se desactiva temporalmente un constraint sin eliminarlo?", options: [
        "DROP CONSTRAINT temporalmente no es posible", "ALTER TABLE tabla DISABLE CONSTRAINT nombre;",
        "UPDATE constraint SET active = 0;", "No se puede desactivar, solo eliminar y recrear"
      ], a: 1, exp: "DISABLE/ENABLE CONSTRAINT permite activar o desactivar sin borrar la definición." }
  ],
  exercises: [
    { title: "Tabla con constraints nombrados", prompt: "Crea una tabla pedidos con id_pedido NUMBER PK, id_cliente NUMBER que referencia clientes(id_cliente), y total NUMBER que debe ser mayor que 0. Nombra todos los constraints.", hint: "CONSTRAINT nombre TIPO(...)", solution: "CREATE TABLE pedidos (\n  id_pedido NUMBER(8),\n  id_cliente NUMBER(6),\n  total NUMBER(10,2),\n  CONSTRAINT pk_pedidos PRIMARY KEY (id_pedido),\n  CONSTRAINT fk_pedidos_cliente FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),\n  CONSTRAINT chk_total_positivo CHECK (total > 0)\n);" },
    { title: "Añadir FK con cascade", prompt: "Añade a la tabla pedidos ya existente una FOREIGN KEY hacia clientes con ON DELETE CASCADE.", hint: "ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY ... ON DELETE CASCADE", solution: "ALTER TABLE pedidos\nADD CONSTRAINT fk_pedidos_cliente_casc FOREIGN KEY (id_cliente)\nREFERENCES clientes(id_cliente) ON DELETE CASCADE;" }
  ],
  challenges: [
    { level: 1, prompt: "Desactiva el constraint fk_pedidos_cliente, inserta un pedido con un id_cliente que no existe todavía, y luego vuelve a activar el constraint.", solution: "ALTER TABLE pedidos DISABLE CONSTRAINT fk_pedidos_cliente;\nINSERT INTO pedidos (id_pedido, id_cliente, total) VALUES (1, 9999, 50);\nALTER TABLE pedidos ENABLE CONSTRAINT fk_pedidos_cliente; -- fallará si persiste el dato incoherente" },
    { level: 2, prompt: "Explica qué pasaría al intentar borrar un cliente que tiene pedidos asociados, en tres escenarios: sin ON DELETE definido, con ON DELETE CASCADE, y con ON DELETE SET NULL.", solution: "Sin ON DELETE: Oracle lanza error (ORA-02292) e impide el borrado mientras existan pedidos asociados. Con CASCADE: se borra el cliente y automáticamente todos sus pedidos. Con SET NULL: se borra el cliente y los pedidos quedan con id_cliente en NULL." }
  ]
},

// =====================================================================
// NIVEL 14
// =====================================================================
{
  id: 14, code: "N14", icon: "🧰",
  title: "Vistas, secuencias, sinónimos e índices",
  intro: "Objetos de esquema más allá de las tablas: casi todo el detalle de sintaxis Oracle es contenido añadido.",
  theory: [
    { heading: "Vistas (concepto)", source: "apuntes", body:
      "Una vista es una consulta guardada que se comporta como una tabla virtual: no almacena datos propios, " +
      "los genera al ejecutarse. Sirve para simplificar consultas repetitivas, ocultar columnas sensibles y " +
      "dar independencia entre el modelo físico y lo que ve cada usuario." },
    { heading: "Sintaxis Oracle de vistas y opciones", source: "added", body:
      "CREATE [OR REPLACE] VIEW nombre AS SELECT ...; La cláusula WITH CHECK OPTION impide que, a través de la " +
      "vista, se inserten o actualicen filas que dejarían de cumplir el WHERE de la vista. WITH READ ONLY " +
      "impide cualquier modificación de datos a través de la vista, aunque técnicamente fuera posible." },
    { heading: "Secuencias (CREATE SEQUENCE)", source: "added", body:
      "No aparecían en tus apuntes. Una secuencia genera números únicos, típicamente para claves primarias: " +
      "CREATE SEQUENCE seq_clientes START WITH 1 INCREMENT BY 1 NOCACHE;. Se usa con seq_clientes.NEXTVAL para " +
      "obtener el siguiente valor y seq_clientes.CURRVAL para consultar el último valor generado en la sesión " +
      "actual (solo disponible tras usar NEXTVAL al menos una vez)." },
    { heading: "Sinónimos (CREATE SYNONYM)", source: "added", body:
      "Un sinónimo es un alias permanente para un objeto (tabla, vista, secuencia...), útil para simplificar " +
      "nombres largos o para dar independencia de ubicación: CREATE SYNONYM emp FOR hr.employees;" },
    { heading: "Índices (CREATE INDEX)", source: "added", body:
      "Un índice acelera las búsquedas sobre una columna, a costa de espacio y de ralentizar ligeramente las " +
      "escrituras: CREATE INDEX idx_emp_apellido ON employees(last_name);. Oracle crea automáticamente un " +
      "índice único al definir una PRIMARY KEY o un UNIQUE, por lo que no hace falta crearlo aparte en esos casos." }
  ],
  examples: [
    { title: "Vista con WITH CHECK OPTION", code: "CREATE OR REPLACE VIEW v_empleados_it AS\nSELECT employee_id, last_name, salary, department_id\nFROM employees\nWHERE department_id = 60\nWITH CHECK OPTION;" },
    { title: "Secuencia y su uso en INSERT", code: "CREATE SEQUENCE seq_clientes START WITH 1 INCREMENT BY 1 NOCACHE;\n\nINSERT INTO clientes (id_cliente, nombre)\nVALUES (seq_clientes.NEXTVAL, 'Nueva Empresa SL');" },
    { title: "Sinónimo", code: "CREATE SYNONYM emp FOR employees;\nSELECT * FROM emp; -- equivalente a SELECT * FROM employees;" },
    { title: "Índice", code: "CREATE INDEX idx_emp_apellido ON employees(last_name);" }
  ],
  mistakes: [
    "Usar CURRVAL antes de haber llamado a NEXTVAL en la misma sesión (da error).",
    "Pensar que una vista siempre se puede actualizar libremente: si tiene JOIN, GROUP BY o funciones de grupo, deja de ser actualizable.",
    "Crear manualmente un índice sobre una columna que ya es PRIMARY KEY o UNIQUE (ya tiene uno automático)."
  ],
  quiz: [
    { q: "¿Qué evita la cláusula WITH CHECK OPTION en una vista?", options: [
        "Que se pueda hacer SELECT sobre la vista", "Que se inserten o actualicen filas que dejarían de cumplir el WHERE de la vista",
        "Que la vista se pueda borrar", "Que se pueda usar en un JOIN"
      ], a: 1, exp: "Garantiza que los datos modificados a través de la vista sigan siendo visibles por ella." },
    { q: "¿Qué pseudo-columna de una secuencia da el siguiente valor?", options: ["CURRVAL", "NEXTVAL", "NEXT", "AUTOVAL"], a: 1, exp: "NEXTVAL avanza y devuelve el siguiente número de la secuencia." },
    { q: "¿Para qué sirve un sinónimo en Oracle?", options: [
        "Para acelerar consultas como un índice", "Para dar un alias permanente a un objeto de esquema",
        "Para validar datos como un constraint", "Para crear una copia física de una tabla"
      ], a: 1, exp: "El sinónimo simplemente renombra el acceso a otro objeto, sin duplicar datos." },
    { q: "¿Qué crea Oracle automáticamente al definir una PRIMARY KEY?", options: [
        "Una vista", "Un índice único sobre esa columna", "Una secuencia", "Un sinónimo"
      ], a: 1, exp: "El índice único soporta la unicidad exigida por la PK; no hace falta crearlo aparte." }
  ],
  exercises: [
    { title: "Vista de solo lectura", prompt: "Crea una vista v_altos_salarios con empleados de salario mayor a 10000, que no se pueda modificar a través de ella.", hint: "WITH READ ONLY", solution: "CREATE OR REPLACE VIEW v_altos_salarios AS\nSELECT employee_id, last_name, salary FROM employees WHERE salary > 10000\nWITH READ ONLY;" },
    { title: "Secuencia para pedidos", prompt: "Crea una secuencia seq_pedidos que empiece en 1000 e incremente de 1 en 1, y úsala para insertar un pedido nuevo.", hint: "CREATE SEQUENCE ... START WITH ...; luego NEXTVAL", solution: "CREATE SEQUENCE seq_pedidos START WITH 1000 INCREMENT BY 1;\nINSERT INTO pedidos (id_pedido, id_cliente, total) VALUES (seq_pedidos.NEXTVAL, 1, 250);" }
  ],
  challenges: [
    { level: 1, prompt: "Crea un índice sobre la columna email de la tabla clientes para acelerar búsquedas por correo.", solution: "CREATE INDEX idx_clientes_email ON clientes(email);" },
    { level: 2, prompt: "Explica por qué una vista definida con un JOIN entre dos tablas normalmente no admite INSERT directo sobre ella.", solution: "Porque Oracle no puede determinar de forma no ambigua en qué tabla base insertar cada columna cuando el resultado combina filas de varias tablas; solo las vistas 'simples' (una sola tabla base, sin funciones de grupo ni DISTINCT) son actualizables sin restricciones." }
  ]
},

// =====================================================================
// NIVEL 15
// =====================================================================
{
  id: 15, code: "N15", icon: "🔁",
  title: "Control de transacciones: COMMIT, ROLLBACK y SAVEPOINT",
  intro: "Bloque completo ausente de tus apuntes originales: cómo Oracle agrupa cambios en transacciones.",
  theory: [
    { heading: "Qué es una transacción", source: "added", body:
      "Una transacción es un conjunto de una o más sentencias DML (INSERT/UPDATE/DELETE/MERGE) que se tratan " +
      "como una unidad: o se confirman todas, o se deshacen todas. Empieza implícitamente con la primera " +
      "sentencia DML y termina con COMMIT, ROLLBACK, o una sentencia DDL (que hace COMMIT automático)." },
    { heading: "COMMIT", source: "added", body:
      "COMMIT; hace permanentes todos los cambios de la transacción actual. Antes del COMMIT, los cambios solo " +
      "son visibles para la sesión que los hizo (otros usuarios ven el estado anterior, gracias a la " +
      "consistencia de lectura de Oracle)." },
    { heading: "ROLLBACK", source: "added", body:
      "ROLLBACK; deshace todos los cambios no confirmados desde el último COMMIT (o desde el inicio de la " +
      "sesión). Es la 'tecla deshacer' de una transacción." },
    { heading: "SAVEPOINT", source: "added", body:
      "SAVEPOINT nombre; marca un punto intermedio dentro de una transacción larga, al que se puede volver con " +
      "ROLLBACK TO nombre; sin deshacer TODA la transacción, solo lo posterior al savepoint." },
    { heading: "DDL y COMMIT implícito", source: "added", body:
      "Cualquier sentencia DDL (CREATE, ALTER, DROP, TRUNCATE) hace un COMMIT automático de cualquier " +
      "transacción DML pendiente, antes y después de ejecutarse. Por eso TRUNCATE no se puede deshacer con " +
      "ROLLBACK: ya ha hecho commit." }
  ],
  examples: [
    { title: "Transacción simple", code: "UPDATE employees SET salary = salary * 1.1 WHERE department_id = 60;\nCOMMIT; -- los cambios ya son permanentes" },
    { title: "ROLLBACK completo", code: "DELETE FROM employees WHERE department_id = 60; -- ups, error\nROLLBACK; -- se deshace por completo, los empleados vuelven" },
    { title: "SAVEPOINT", code: "UPDATE employees SET salary = salary * 1.05 WHERE department_id = 10;\nSAVEPOINT sp_dep10;\n\nUPDATE employees SET salary = salary * 1.05 WHERE department_id = 20;\n-- nos damos cuenta de que el segundo UPDATE está mal:\nROLLBACK TO sp_dep10; -- deshace solo el UPDATE del departamento 20\nCOMMIT; -- confirma solo la subida del departamento 10" }
  ],
  mistakes: [
    "Olvidar hacer COMMIT y perder los cambios al cerrar la sesión sin confirmar.",
    "Pensar que un ROLLBACK TO SAVEPOINT deshace toda la transacción: solo deshace lo posterior al savepoint.",
    "Ejecutar un CREATE TABLE en medio de una transacción DML esperando poder revertirla luego con ROLLBACK (el DDL ya hizo commit)."
  ],
  quiz: [
    { q: "¿Qué hace COMMIT?", options: ["Deshace los cambios", "Hace permanentes los cambios de la transacción actual", "Crea una tabla nueva", "Bloquea la tabla"], a: 1, exp: "COMMIT confirma de forma permanente los cambios pendientes." },
    { q: "Tras un SAVEPOINT sp1 y varios UPDATE, ¿qué hace ROLLBACK TO sp1?", options: [
        "Deshace toda la transacción desde el principio", "Deshace solo los cambios posteriores a sp1, dejando los anteriores intactos",
        "Hace COMMIT de todo lo anterior a sp1", "Da error, no existe ROLLBACK TO"
      ], a: 1, exp: "El rollback parcial a un savepoint conserva lo hecho antes de ese punto." },
    { q: "¿Qué ocurre si ejecutas una sentencia DDL como CREATE TABLE en medio de cambios DML sin haber hecho COMMIT?", options: [
        "El DDL espera a que hagas COMMIT manualmente", "El DDL provoca un COMMIT automático de los cambios DML pendientes",
        "El DDL se cancela automáticamente", "No tiene ningún efecto sobre la transacción"
      ], a: 1, exp: "Toda sentencia DDL hace commit implícito antes de ejecutarse." },
    { q: "¿Por qué TRUNCATE TABLE no se puede deshacer con ROLLBACK?", options: [
        "Porque Oracle lo prohíbe por seguridad sin motivo técnico", "Porque TRUNCATE es DDL y hace commit implícito inmediatamente",
        "Porque ROLLBACK no existe en Oracle", "Sí se puede deshacer sin problema"
      ], a: 1, exp: "Al ser DDL, TRUNCATE confirma sus cambios de forma automática e inmediata." }
  ],
  exercises: [
    { title: "Confirmar un cambio", prompt: "Sube el salario un 3% al departamento 90 y confirma el cambio de forma permanente.", hint: "UPDATE ...; COMMIT;", solution: "UPDATE employees SET salary = salary * 1.03 WHERE department_id = 90;\nCOMMIT;" },
    { title: "Deshacer un error", prompt: "Simula haber borrado por error todos los empleados del departamento 10 y deshaz el cambio antes de confirmar.", hint: "DELETE ...; ROLLBACK;", solution: "DELETE FROM employees WHERE department_id = 10;\nROLLBACK;" }
  ],
  challenges: [
    { level: 1, prompt: "Realiza dos actualizaciones separadas por un SAVEPOINT y deshaz solo la segunda, confirmando la primera.", solution: "UPDATE employees SET salary = salary*1.02 WHERE department_id = 10;\nSAVEPOINT sp1;\nUPDATE employees SET salary = salary*1.50 WHERE department_id = 20; -- excesivo, error\nROLLBACK TO sp1;\nCOMMIT;" },
    { level: 2, prompt: "Explica por qué en un sistema con varios usuarios conectados a la vez, un usuario no ve los cambios de otro hasta que este hace COMMIT.", solution: "Oracle implementa consistencia de lectura: cada sesión ve una 'foto' consistente de los datos según su propio punto de vista transaccional; los cambios no confirmados de otra sesión permanecen en sus 'rollback segments' hasta el COMMIT, momento en el que pasan a ser visibles para nuevas lecturas de otras sesiones." }
  ]
},

// =====================================================================
// NIVEL 16 — SIMULACROS
// =====================================================================
{
  id: 16, code: "N16", icon: "⏱️",
  title: "Simulacros tipo Oracle 1Z0-071",
  intro: "Exámenes cronometrados con preguntas mezcladas de todos los temas anteriores.",
  isExamLevel: true,
  theory: [
    { heading: "Cómo funciona este nivel", source: "added", body:
      "Aquí no hay teoría nueva: se genera un simulacro de 20 preguntas aleatorias del banco completo, con un " +
      "temporizador (20 minutos), igual que un bloque del examen real. Al terminar verás tu puntuación, el " +
      "tiempo empleado, y todas tus fallas se añaden automáticamente al repaso de errores." }
  ],
  examples: [],
  mistakes: [
    "Leer la pregunta demasiado rápido: en el examen real muchas 'trampas' están en detalles como NULL, mayúsculas de funciones, o el orden de columnas.",
    "No gestionar el tiempo: es mejor marcar mentalmente una duda y seguir, que bloquearse en una pregunta."
  ],
  quiz: [],
  exercises: [],
  challenges: [],
  examConfig: { numQuestions: 20, minutes: 20 }
},

// =====================================================================
// NIVEL EXPERTO
// =====================================================================
{
  id: 17, code: "EXP", icon: "🏆",
  title: "Nivel experto — retos mezclados tipo examen real",
  intro: "El desafío final: preguntas de mayor dificultad, mezclando trampas típicas del examen 1Z0-071.",
  isExamLevel: true,
  theory: [
    { heading: "Qué esperar en este nivel", source: "added", body:
      "Simulacro de 30 preguntas con dificultad alta, mezclando todos los bloques, incluidas las preguntas más " +
      "'trampa' del banco (precedencia de operadores, NULL en funciones de grupo, MINUS vs EXCEPT, ROLLBACK vs " +
      "TRUNCATE, subconsultas de una fila vs varias filas). Pensado para hacerse cuando ya hayas completado " +
      "todos los niveles anteriores." }
  ],
  examples: [],
  mistakes: [],
  quiz: [],
  exercises: [],
  challenges: [],
  examConfig: { numQuestions: 30, minutes: 35 }
}

], // end levels

// =====================================================================
// BANCO ADICIONAL PARA SIMULACROS (niveles 16 y experto)
// Se combina con todas las preguntas de quiz de los niveles 0-15.
// =====================================================================
examBank: [
  { q: "¿Qué devuelve 'SELECT 10/0 FROM DUAL;' en Oracle?", options: ["0", "NULL", "Error ORA-01476: divisor is equal to zero", "Infinito"], a: 2, exp: "Oracle lanza un error explícito de división por cero, no devuelve NULL ni infinito." },
  { q: "¿Cuál es el resultado de 'SELECT NULL = NULL FROM DUAL;'?", options: ["TRUE", "FALSE", "NULL (desconocido)", "Error de sintaxis"], a: 2, exp: "Cualquier comparación con NULL da como resultado NULL (desconocido), nunca TRUE ni FALSE." },
  { q: "¿Qué palabra clave usa Oracle para limitar filas de forma estándar SQL:2008 (12c en adelante)?", options: ["LIMIT", "TOP", "OFFSET ... FETCH NEXT ... ROWS ONLY", "ROWNUM_MAX"], a: 2, exp: "Oracle 12c introdujo OFFSET/FETCH; LIMIT no existe en Oracle." },
  { q: "¿Qué pseudocolumna se usaba tradicionalmente en Oracle para limitar filas antes de 12c?", options: ["ROWID", "ROWNUM", "ROW_NUMBER_OVER", "LIMIT"], a: 1, exp: "ROWNUM numera las filas según se devuelven, y se usaba en WHERE ROWNUM <= n." },
  { q: "¿Qué hace REGEXP_LIKE(columna, '^A')?", options: ["Busca filas donde la columna contiene la letra A en cualquier posición", "Busca filas donde la columna empieza por A", "Cuenta cuántas A hay", "Sustituye la A por otra letra"], a: 1, exp: "El símbolo ^ en una expresión regular indica inicio de cadena." },
  { q: "¿Qué cláusula permite consultas jerárquicas en Oracle (por ejemplo un organigrama)?", options: ["HIERARCHY BY", "CONNECT BY ... START WITH", "GROUP BY ROLLUP", "PARTITION BY"], a: 1, exp: "CONNECT BY junto con START WITH y la pseudocolumna LEVEL permite recorrer jerarquías." },
  { q: "En una consulta jerárquica con CONNECT BY, ¿qué pseudocolumna indica la profundidad del nodo?", options: ["DEPTH", "LEVEL", "PRIOR", "RANK"], a: 1, exp: "LEVEL devuelve 1 para la raíz, 2 para sus hijos, etc." },
  { q: "¿Qué formato de fecha por defecto usa Oracle habitualmente al mostrar una DATE?", options: ["YYYY-MM-DD", "DD-MON-RR", "MM/DD/YYYY", "Depende siempre del sistema operativo"], a: 1, exp: "El formato NLS_DATE_FORMAT por defecto suele ser DD-MON-RR, aunque es configurable." },
  { q: "¿Cuál es la diferencia entre CHAR(10) y VARCHAR2(10) en Oracle?", options: [
      "Son idénticos", "CHAR siempre ocupa 10 caracteres rellenando con espacios; VARCHAR2 ocupa solo lo necesario",
      "VARCHAR2 rellena con ceros", "CHAR no admite texto"
    ], a: 1, exp: "CHAR es de longitud fija (rellena con espacios), VARCHAR2 es de longitud variable real." },
  { q: "¿Qué hace TRUNC(SYSDATE) sin segundo argumento?", options: ["Da error", "Elimina la parte de hora, dejando la fecha a las 00:00:00", "Redondea al mes más cercano", "Convierte la fecha a texto"], a: 1, exp: "TRUNC sobre una fecha sin formato indicado trunca a día completo." },
  { q: "¿Qué devuelve COALESCE(NULL, NULL, 5, 10)?", options: ["NULL", "5", "10", "Error, muchos argumentos NULL"], a: 1, exp: "COALESCE devuelve el primer valor no nulo de la lista, en este caso 5." },
  { q: "¿Qué diferencia hay entre RANK y ROW_NUMBER en un contexto de funciones analíticas (concepto avanzado)?", options: [
      "Son exactamente iguales", "RANK puede dejar huecos en el ranking cuando hay empates; ROW_NUMBER siempre asigna números consecutivos únicos",
      "ROW_NUMBER solo funciona con fechas", "RANK no existe en Oracle"
    ], a: 1, exp: "Con empates, RANK salta números (1,1,3) y ROW_NUMBER no (1,2,3)." },
  { q: "¿Qué instrucción crea un usuario/rol y le concede permisos de solo lectura sobre una tabla?", options: ["GRANT SELECT ON tabla TO usuario;", "ALLOW SELECT ON tabla TO usuario;", "PERMIT SELECT tabla usuario;", "GIVE READ tabla TO usuario;"], a: 0, exp: "GRANT privilegio ON objeto TO usuario/rol; es la sintaxis DCL estándar." },
  { q: "¿Qué instrucción retira un permiso previamente concedido?", options: ["DENY", "REVOKE", "CANCEL GRANT", "DROP PRIVILEGE"], a: 1, exp: "REVOKE privilegio ON objeto FROM usuario; retira el permiso." },
  { q: "¿Qué vista del diccionario de datos muestra las columnas de tus propias tablas?", options: ["ALL_TABLES", "USER_TAB_COLUMNS", "DBA_USERS", "SYSTEM.COLUMNS"], a: 1, exp: "USER_TAB_COLUMNS lista columnas de los objetos propiedad del usuario actual." },
  { q: "¿Qué hace 'SELECT * FROM employees FETCH FIRST 5 ROWS ONLY;'?", options: ["Da error de sintaxis en Oracle", "Devuelve las primeras 5 filas del resultado", "Devuelve todas las filas excepto las 5 primeras", "Cuenta cuántas filas hay"], a: 1, exp: "FETCH FIRST n ROWS ONLY es la sintaxis moderna de Oracle (12c+) para limitar filas, similar a LIMIT en otros motores." },
  { q: "¿Qué operador de comparación de patrones usa REGEXP_LIKE frente a LIKE?", options: [
      "Son exactamente iguales", "REGEXP_LIKE admite expresiones regulares completas, LIKE solo admite % y _",
      "LIKE es más potente que REGEXP_LIKE", "REGEXP_LIKE no existe en Oracle"
    ], a: 1, exp: "REGEXP_LIKE permite patrones mucho más ricos (rangos, alternancias, cuantificadores)." },
  { q: "¿Qué hace GROUPING SETS respecto a ROLLUP y CUBE?", options: [
      "Es sinónimo exacto de ROLLUP", "Permite definir manualmente exactamente qué combinaciones de agrupación calcular, sin generar todas las de CUBE",
      "Solo puede usarse con una columna", "No existe en Oracle"
    ], a: 1, exp: "GROUPING SETS da control total sobre qué subtotales calcular, a diferencia del comportamiento automático de ROLLUP/CUBE." },
  { q: "¿Qué es más eficiente en general para comprobar existencia de filas relacionadas en tablas grandes: EXISTS o IN?", options: ["IN siempre", "EXISTS suele ser más eficiente porque para en la primera coincidencia", "Son siempre idénticos en rendimiento", "IN no se puede usar con subconsultas"], a: 1, exp: "EXISTS puede parar en cuanto encuentra una fila, mientras IN evalúa toda la lista de valores." },
  { q: "¿Qué ocurre si defines una FOREIGN KEY sin especificar ON DELETE y tratas de borrar la fila padre con hijos existentes?", options: ["Se borra en cascada automáticamente", "Oracle lanza un error de violación de integridad (ORA-02292) y no permite el borrado", "Se pone a NULL la clave foránea", "No pasa nada, se ignora la relación"], a: 1, exp: "El comportamiento por defecto es restrictivo: protege la integridad impidiendo el borrado." },
  { q: "¿Cuál es la sintaxis correcta para crear un índice compuesto sobre dos columnas?", options: ["CREATE INDEX idx ON tabla(col1); CREATE INDEX idx ON tabla(col2);", "CREATE INDEX idx ON tabla(col1, col2);", "CREATE COMPOUND INDEX idx ON tabla(col1 AND col2);", "CREATE INDEX idx ON tabla USING (col1, col2);"], a: 1, exp: "Basta con listar las columnas separadas por coma dentro del mismo CREATE INDEX." },
  { q: "¿Qué devuelve NVL2(commission_pct, 'CON COMISION', 'SIN COMISION') cuando commission_pct es NULL?", options: ["CON COMISION", "SIN COMISION", "NULL", "Error"], a: 1, exp: "NVL2 evalúa la segunda expresión cuando el primer argumento es NULL." },
  { q: "¿Qué tipo de JOIN produce el mismo resultado combinado que escribir dos tablas separadas por coma en el FROM sin condición WHERE?", options: ["INNER JOIN", "CROSS JOIN", "FULL JOIN", "NATURAL JOIN"], a: 1, exp: "FROM tabla1, tabla2 sin condición equivale a un CROSS JOIN (producto cartesiano)." },
  { q: "¿Qué hace 'ALTER TABLE empleados MODIFY (salario NUMBER(4,2))' si ya existen salarios de 5 dígitos?", options: ["Trunca automáticamente los valores", "Da error porque los datos existentes no caben en la nueva precisión", "Redondea los valores al nuevo tamaño", "Convierte la columna a texto"], a: 1, exp: "Oracle valida que los datos existentes sean compatibles antes de aplicar el cambio de tipo." },
  { q: "¿Qué mecanismo usa Oracle para que otras sesiones no vean cambios no confirmados (antes del COMMIT)?", options: ["Bloqueo total de la base de datos", "Consistencia de lectura (read consistency) mediante segmentos de deshacer", "Copia completa de la tabla por cada sesión", "No es posible, todos ven los cambios al instante"], a: 1, exp: "Oracle mantiene una 'foto' consistente para cada consulta usando información de undo." },
  { q: "¿Qué produce 'SELECT department_id FROM employees INTERSECT SELECT department_id FROM job_history;'?", options: ["Todos los departamentos de ambas tablas sin duplicar", "Solo los department_id que aparecen en ambas tablas a la vez", "Los department_id de employees que no están en job_history", "Error de sintaxis"], a: 1, exp: "INTERSECT devuelve la intersección: filas presentes en ambos resultados." },
  { q: "¿Qué palabra clave se usa junto a INSERT para introducir varias filas en varias tablas según condiciones en una sola sentencia?", options: ["INSERT MANY", "INSERT ALL", "MULTI INSERT", "INSERT BATCH"], a: 1, exp: "INSERT ALL (o INSERT FIRST) permite repartir una única consulta origen entre varias tablas destino." },
  { q: "En 'WHERE salary BETWEEN 3000 AND 6000', ¿se incluyen los valores 3000 y 6000 exactos?", options: ["No, BETWEEN excluye siempre los extremos", "Sí, BETWEEN incluye ambos extremos", "Solo se incluye el valor menor", "Depende del tipo de dato"], a: 1, exp: "BETWEEN es inclusivo en ambos extremos del rango." },
  { q: "¿Qué diferencia hay entre una vista normal y una vista materializada (concepto avanzado)?", options: [
      "Son idénticas", "La vista materializada almacena físicamente los datos calculados, mejorando el rendimiento a costa de estar potencialmente desactualizada",
      "La vista normal ocupa más espacio en disco", "Las vistas materializadas no pueden usarse en Oracle"
    ], a: 1, exp: "Una vista materializada guarda el resultado, mientras la vista normal recalcula cada vez que se consulta." },
  { q: "¿Cuál es el resultado de SUBSTR('ORACLE', -3, 2) en Oracle?", options: ["'OR'", "'CL'", "'AC'", "Error, no se permiten índices negativos"], a: 1, exp: "Un índice negativo en SUBSTR cuenta desde el final: -3 sitúa el inicio en la 'C', y toma 2 caracteres: 'CL'." },
  { q: "¿Cuál de las siguientes NO es una función de grupo válida en Oracle?", options: ["SUM", "MEDIAN", "UPPER", "STDDEV"], a: 2, exp: "UPPER es una función de una sola fila; el resto son funciones de grupo/estadísticas." },
  { q: "¿Qué hace ALTER TABLE tabla RENAME COLUMN antigua TO nueva;?", options: ["Cambia el tipo de dato de la columna", "Cambia el nombre de una columna existente", "Elimina la columna", "Crea una columna nueva copiando otra"], a: 1, exp: "RENAME COLUMN cambia únicamente el nombre, conservando datos y tipo." },
  { q: "¿Qué resultado da 'SELECT MOD(10,3) FROM DUAL;'?", options: ["3", "1", "3.33", "0"], a: 1, exp: "MOD devuelve el resto de la división entera: 10 = 3*3 + 1." },
  { q: "¿En qué orden se procesan lógicamente WHERE y HAVING respecto a GROUP BY?", options: ["Ambos antes de GROUP BY", "WHERE antes de GROUP BY, HAVING después", "HAVING antes de GROUP BY, WHERE después", "Ambos después de GROUP BY"], a: 1, exp: "WHERE filtra filas antes de agrupar; HAVING filtra los grupos ya formados." },
  { q: "¿Qué hace 'CREATE TABLE copia AS SELECT * FROM empleados WHERE 1=0;'?", options: [
      "Copia todos los datos de empleados", "Crea una tabla nueva con la misma estructura que empleados pero sin filas (WHERE 1=0 nunca es verdadero)",
      "Da error porque 1=0 es inválido", "Elimina la tabla empleados"
    ], a: 1, exp: "Es un truco muy usado en Oracle para clonar la estructura de una tabla sin copiar datos." },
  { q: "¿Qué representa la pseudocolumna ROWID?", options: [
      "Un número secuencial que se puede reiniciar", "La dirección física única de una fila dentro de la base de datos", "El número de columnas de una fila", "Un alias de ROWNUM"
    ], a: 1, exp: "ROWID identifica la ubicación física de la fila, es distinto de ROWNUM (que es el orden en el resultado)." },
  { q: "¿Qué hace 'SELECT last_name FROM employees WHERE department_id = ANY (SELECT department_id FROM departments WHERE location_id = 1700);'?", options: [
      "Da error de sintaxis", "Devuelve empleados cuyo departamento coincide con al menos uno de los departamentos ubicados en location_id 1700",
      "Devuelve empleados que no tienen departamento", "Es equivalente a usar ALL"
    ], a: 1, exp: "= ANY con una lista se comporta de forma equivalente a IN." },
  { q: "¿Cuál es la forma correcta de escribir un comentario de varias líneas en SQL Oracle?", options: ["// comentario //", "# comentario #", "/* comentario */", "<!-- comentario -->"], a: 2, exp: "Oracle usa /* ... */ para comentarios multilínea, igual que el estándar SQL." },
  { q: "¿Qué hace 'SELECT last_name, department_id FROM employees ORDER BY 2, 1;'?", options: [
      "Da error, no se pueden usar números en ORDER BY", "Ordena por la segunda columna del SELECT y luego por la primera (por posición)",
      "Ordena por las columnas 2 y 1 de toda la tabla, no del SELECT", "Es idéntico a no usar ORDER BY"
    ], a: 1, exp: "ORDER BY admite referenciar columnas por su posición en la lista del SELECT." }
]

};

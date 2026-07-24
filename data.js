/*
  Oracle SQL Quest — contenido educativo
  Cada nivel tiene una guía de estudio con estructura fija:
  "theory.concepts" (uno o más conceptos, cada uno con heading/explanation y, cuando aplica, syntax/examples),
  "theory.oracleNotes" (matices y reglas especiales de Oracle, lo que más falla en el examen real),
  "summary" (resumen rápido de repaso) y "sourceRefs" (secciones de la documentación oficial usadas como base).
*/

const APP_DATA = {

levels: [

// =====================================================================
// NIVEL 0
// =====================================================================
{
  id: 0, code: "M0", category: "Fundamentos",
  title: "Fundamentos de bases de datos relacionales",
  intro: "El terreno sobre el que se apoya todo el temario: qué es una base de datos relacional, cómo se diseña con claves e integridad referencial, qué formas normales exige un buen diseño, y cómo organiza Oracle el lenguaje SQL y sus herramientas de trabajo.",
  theory: {
    concepts: [
      { heading: "1. El modelo relacional: tablas, filas y columnas",
        explanation: "El modelo relacional, formalizado por Edgar F. Codd en 1970, organiza la información en relaciones — lo que en la práctica llamamos tablas. Cada tabla representa un conjunto de entidades del mismo tipo (empleados, departamentos, productos...) y se compone de filas (también llamadas tuplas o registros, cada una una instancia concreta) y columnas (también llamadas atributos, cada una un dato con un dominio o tipo definido). Es importante distinguir el esquema de una tabla (su estructura: nombres de columna, tipos de dato, restricciones) de su instancia (los datos concretos que contiene en un momento dado): el esquema cambia poco, la instancia cambia constantemente con cada INSERT, UPDATE o DELETE.",
        subconcepts: [
          { heading: "1.1 Tablas, filas y columnas en Oracle",
            explanation: "En Oracle, cada tabla pertenece a un esquema, que es el conjunto de objetos que posee un usuario de la base de datos. El esquema HR (Human Resources), usado en todo el temario del examen 1Z0-071, contiene tablas como EMPLOYEES (empleados), DEPARTMENTS (departamentos), JOBS (puestos de trabajo) y LOCATIONS (ubicaciones físicas). Cada fila de EMPLOYEES es un empleado concreto; cada columna (EMPLOYEE_ID, LAST_NAME, SALARY...) es un atributo de ese empleado.",
            examples: [
              { code: "DESCRIBE employees;", output: "Name            Null?     Type\n--------------- --------- -------------\nEMPLOYEE_ID     NOT NULL  NUMBER(6)\nFIRST_NAME                VARCHAR2(20)\nLAST_NAME       NOT NULL  VARCHAR2(25)\nDEPARTMENT_ID              NUMBER(4)\nSALARY                    NUMBER(8,2)" }
            ] }
        ] },
      { heading: "2. Claves y integridad referencial",
        explanation: "Para que un modelo relacional sea útil, cada fila debe poder identificarse sin ambigüedad, y las relaciones entre tablas deben ser consistentes. Esto se consigue con tres tipos de clave y una regla que las conecta: la integridad referencial.",
        subconcepts: [
          { heading: "2.1 Clave candidata y clave primaria (PRIMARY KEY)",
            explanation: "Una clave candidata es cualquier conjunto mínimo de una o varias columnas que identifica de forma única cada fila de una tabla; 'mínimo' significa que si quitas una columna del conjunto, deja de ser único. Una tabla puede tener varias claves candidatas (por ejemplo, EMPLOYEE_ID y también EMAIL, si el email es único). La clave primaria (PRIMARY KEY) es la clave candidata que el diseñador elige como identificador oficial de la tabla; Oracle exige que sea NOT NULL y UNIQUE, y solo puede haber una PRIMARY KEY por tabla (aunque puede estar compuesta por varias columnas)." },
          { heading: "2.2 Clave foránea (FOREIGN KEY) e integridad referencial",
            explanation: "Una clave foránea es una columna (o conjunto de columnas) en una tabla 'hija' que referencia la clave primaria (o una UNIQUE) de una tabla 'padre'. Esto modela la relación entre ambas tablas y hace cumplir la integridad referencial: todo valor no nulo de la clave foránea debe existir en la tabla padre. Oracle rechaza un INSERT o UPDATE que viole esta regla, y por defecto también impide borrar una fila padre que aún tiene hijos.",
            examples: [
              { code: "SELECT employee_id, last_name, department_id\nFROM   employees\nWHERE  department_id = 60;", output: "EMPLOYEE_ID  LAST_NAME   DEPARTMENT_ID\n-----------  ----------  -------------\n       103  Hunold                 60\n       104  Ernst                  60" }
            ],
            commonErrors: [
              "Pensar que una FOREIGN KEY impide valores NULL: no es así, una FK admite NULL salvo que además se declare NOT NULL.",
              "Creer que Oracle crea automáticamente un índice sobre la columna FK, igual que hace con la PRIMARY KEY: no lo hace, hay que crearlo manualmente si se necesita rendimiento en los joins."
            ] }
        ] },
      { heading: "3. Diagramas Entidad-Relación (ERD) y su traducción a SQL",
        explanation: "Antes de escribir cualquier CREATE TABLE, el diseño se representa con un diagrama Entidad-Relación (ERD): las entidades (EMPLOYEES, DEPARTMENTS...) se dibujan como cajas con sus atributos, y las relaciones entre ellas se dibujan como líneas con una cardinalidad (1:1, 1:N o N:N, normalmente con notación de 'pata de gallo'). Traducir un ERD a SQL sigue reglas fijas: una relación 1:N se resuelve colocando la clave foránea en el lado 'N' (muchos), apuntando a la clave primaria del lado '1'. Por ejemplo, un departamento tiene muchos empleados (1:N), así que DEPARTMENT_ID es FK en EMPLOYEES, no al revés. Una relación N:N (por ejemplo, empleados que han pasado por varios puestos a lo largo del tiempo, y cada puesto ha tenido varios empleados) no se puede resolver con una sola FK: necesita una tabla intermedia (o 'de unión') con dos claves foráneas, una hacia cada tabla original — en el esquema HR, JOB_HISTORY cumple ese papel entre EMPLOYEES y JOBS/DEPARTMENTS. Una relación 1:1 suele resolverse fusionando ambas entidades en una sola tabla, o con una FK que además lleva UNIQUE." },
      { heading: "4. Normalización: 1FN, 2FN y 3FN",
        explanation: "La normalización es una disciplina de diseño (no una regla que Oracle imponga al crear tablas) para eliminar redundancia e inconsistencias, aplicando un conjunto progresivo de 'formas normales'.",
        subconcepts: [
          { heading: "4.1 Primera Forma Normal (1FN)",
            explanation: "Una tabla está en 1FN si cada columna contiene valores atómicos (no divisibles en partes con sentido propio) y no existen grupos repetidos del mismo atributo. Una tabla PEDIDOS con columnas PRODUCTO1, PRODUCTO2 y PRODUCTO3 viola 1FN porque 'producto' es el mismo atributo repetido tres veces; la solución es extraer una tabla PEDIDO_LINEAS con una fila por producto." },
          { heading: "4.2 Segunda Forma Normal (2FN)",
            explanation: "Una tabla está en 2FN si, además de cumplir 1FN, ningún atributo no clave depende solo de una PARTE de una clave primaria compuesta (solo es relevante cuando la PK tiene más de una columna). Ejemplo de violación: una tabla con PK (ID_PEDIDO, ID_PRODUCTO) donde la columna NOMBRE_PRODUCTO depende únicamente de ID_PRODUCTO, no de la combinación completa; NOMBRE_PRODUCTO debería vivir en una tabla PRODUCTOS aparte." },
          { heading: "4.3 Tercera Forma Normal (3FN)",
            explanation: "Una tabla está en 3FN si, además de cumplir 2FN, ningún atributo no clave depende de OTRO atributo no clave (dependencia transitiva). Ejemplo de violación: una tabla EMPLOYEES con DEPARTMENT_ID y también DEPARTMENT_NAME; DEPARTMENT_NAME depende de DEPARTMENT_ID, no directamente de EMPLOYEE_ID, así que debería vivir solo en DEPARTMENTS y consultarse mediante un JOIN." }
        ] },
      { heading: "5. Categorías del lenguaje SQL en Oracle",
        explanation: "Oracle agrupa las sentencias SQL en cinco categorías según su propósito: DDL (Data Definition Language) define y modifica la estructura de los objetos con CREATE, ALTER, DROP, TRUNCATE, RENAME; hace COMMIT implícito siempre. DML (Data Manipulation Language) modifica datos con INSERT, UPDATE, DELETE, MERGE; requiere COMMIT explícito. DQL (Data Query Language) consulta datos con SELECT, sin modificarlos; en el temario de certificación se trata como categoría propia, distinta de DML. DCL (Data Control Language) gestiona permisos con GRANT y REVOKE. TCL (Transaction Control Language) gestiona transacciones con COMMIT, ROLLBACK y SAVEPOINT." },
      { heading: "6. Herramientas de trabajo: SQL Developer y SQL*Plus",
        explanation: "Oracle SQL Developer es un entorno gráfico (IDE) gratuito para conectarse a la base de datos, escribir y ejecutar SQL en 'worksheets', explorar objetos de esquema y administrar conexiones. SQL*Plus es un cliente de línea de comandos, más ligero, habitual en scripts y entornos sin interfaz gráfica. Ambos envían exactamente el mismo SQL al motor de la base de datos — la diferencia está solo en la interfaz —, pero cada uno añade sus propios comandos de cliente (no SQL real) como DESCRIBE, SET, SPOOL o CONNECT, que solo funcionan dentro de esa herramienta." },
      { heading: "7. La tabla DUAL",
        explanation: "Oracle exige que todo SELECT tenga una cláusula FROM. Para evaluar una expresión (una operación aritmética, una función, una fecha del sistema...) sin necesidad de consultar ninguna tabla real, Oracle ofrece DUAL: una tabla del diccionario de datos, propiedad del usuario SYS, con una sola fila y una sola columna llamada DUMMY.",
        syntax: "SELECT expresión\nFROM   DUAL;",
        examples: [
          { code: "SELECT SYSDATE, 15 * 4 AS resultado\nFROM   DUAL;", output: "SYSDATE     RESULTADO\n----------  ---------\n17-JUL-26          60" }
        ] }
    ],
    oracleNotes: [
      "FROM es obligatorio siempre en Oracle: SELECT 1+1; da error de sintaxis. Hace falta SELECT 1+1 FROM DUAL;",
      "Una FOREIGN KEY no crea automáticamente un índice (a diferencia de PRIMARY KEY/UNIQUE): conviene crearlo a mano si esa columna se usa mucho en JOIN.",
      "La normalización es una técnica de diseño, no una restricción de Oracle: el motor permite crear tablas completamente desnormalizadas sin quejarse.",
      "TCL merece categoría propia en Oracle porque, a diferencia de motores con autocommit por defecto, Oracle no confirma los cambios automáticamente: hace falta COMMIT explícito (se profundiza en el módulo de DML)."
    ]
  },
  summary: [
    "El modelo relacional organiza datos en tablas (filas y columnas); el esquema define su estructura, la instancia son los datos en un momento dado.",
    "Clave candidata = cualquier conjunto mínimo que identifica una fila; clave primaria = la candidata elegida como identificador oficial; clave foránea = enlace hacia la PK de otra tabla que impone integridad referencial.",
    "Un ERD traduce sus relaciones a SQL: 1:N → FK en el lado 'muchos'; N:N → tabla intermedia con dos FK; 1:1 → fusión o FK con UNIQUE.",
    "1FN exige atomicidad y prohíbe grupos repetidos; 2FN prohíbe dependencias parciales de una PK compuesta; 3FN prohíbe dependencias transitivas entre atributos no clave.",
    "SQL se divide en DDL, DML, DQL, DCL y TCL; SQL Developer y SQL*Plus son clientes distintos que envían el mismo SQL.",
    "DUAL permite evaluar expresiones sin tabla real, porque en Oracle FROM es siempre obligatorio."
  ],
  comparisonTable: {
    title: "Categorías del lenguaje SQL en Oracle",
    headers: ["Categoría", "Significado", "Sentencias típicas", "¿Confirma cambios automáticamente?"],
    rows: [
      ["DDL", "Data Definition Language", "CREATE, ALTER, DROP, TRUNCATE, RENAME", "Sí, siempre (commit implícito)"],
      ["DML", "Data Manipulation Language", "INSERT, UPDATE, DELETE, MERGE", "No, requiere COMMIT explícito"],
      ["DQL", "Data Query Language", "SELECT", "No aplica (no modifica datos)"],
      ["DCL", "Data Control Language", "GRANT, REVOKE", "Sí, siempre"],
      ["TCL", "Transaction Control Language", "COMMIT, ROLLBACK, SAVEPOINT", "Es el propio mecanismo de confirmación"]
    ]
  },
  mindMap: [
    { topic: "Módulo 0 — Fundamentos", children: [
      "Modelo relacional → tablas, filas, columnas, esquema vs instancia",
      "Claves → candidata (identifica), primaria (la elegida), foránea (enlaza + integridad referencial)",
      "ERD → entidades = tablas, relaciones = FK; 1:N en el lado 'muchos', N:N con tabla intermedia",
      "Normalización → 1FN (atomicidad), 2FN (sin dependencia parcial), 3FN (sin dependencia transitiva)",
      "Lenguaje SQL → DDL (estructura), DML (datos), DQL (consulta), DCL (permisos), TCL (transacciones)",
      "Herramientas → SQL Developer (GUI) y SQL*Plus (CLI), mismo SQL por debajo",
      "DUAL → tabla técnica de 1 fila/1 columna para expresiones sin datos reales"
    ] }
  ],
  sourceRefs: [
    "Oracle SQL Language Reference 19c — \"Introduction to Oracle SQL\"",
    "Oracle SQL Language Reference 19c — \"Basic Elements of Oracle SQL\" (Data Types)",
    "Oracle Database Concepts 19c — \"Overview of Schema Objects\" y \"Data Integrity\""
  ],
  realCases: {
    business: "Una empresa de retail modela sus RRHH separando EMPLOYEES de DEPARTMENTS en vez de repetir el nombre del departamento en cada fila de empleado. Si el departamento 'Marketing' cambia de nombre a 'Marketing Digital', basta con un UPDATE en DEPARTMENTS: gracias a la normalización y a la FK, ningún empleado queda con un nombre de departamento desactualizado.",
    dataEngineering: "Un ingeniero de datos que diseña una capa de staging para un data warehouse replica primero el modelo normalizado del sistema origen (para no perder integridad al extraer), y solo desnormaliza deliberadamente más adelante, en la capa de modelo dimensional (star schema), donde la redundancia controlada mejora el rendimiento de lectura analítica.",
    etl: "En un proceso ETL que reconstruye un registro plano de 'empleado + departamento + ubicación' a partir de tablas normalizadas, entender la cardinalidad 1:N de cada FK es lo que determina el orden correcto de los JOIN y evita duplicar filas por error (por ejemplo, si se uniera por una relación N:N sin la tabla intermedia adecuada).",
    reporting: "Un informe de BI que suma el salario total por departamento puede inflarse si se une EMPLOYEES con JOB_HISTORY (una relación 1:N por empleado) sin agrupar correctamente antes: cada fila de historial adicional duplicaría el salario del empleado en la suma. Saber leer la cardinalidad del ERD evita este error clásico de reporting."
  },
  mistakes: [
    { mistake: "Confundir clave candidata con clave primaria.", why: "Oracle presenta a veces una tabla con dos o tres columnas que podrían identificar la fila (candidatas) y espera que sepas que solo una de ellas es la PRIMARY KEY realmente declarada; 'candidata' no implica 'elegida'. El examen aprovecha esta ambigüedad terminológica a propósito." },
    { mistake: "Pensar que SELECT es DML.", why: "En documentación antigua de Oracle a veces se agrupaba el SELECT dentro de una categoría amplia de manipulación de datos, pero el temario de certificación actual lo trata como DQL, una categoría propia. Las preguntas de clasificación suelen ofrecer 'DML' como distractor deliberado para SELECT." },
    { mistake: "Creer que la normalización es una regla que Oracle obliga a cumplir.", why: "Es una técnica de diseño previa al CREATE TABLE; Oracle no impide crear una tabla con grupos repetidos o dependencias transitivas. El examen puede mostrar una tabla ya creada y preguntar qué forma normal viola, no si Oracle 'lo permitió' (siempre lo permite)." },
    { mistake: "No diferenciar comandos de SQL*Plus de sentencias SQL reales.", why: "DESCRIBE, SET o SPOOL son comandos del cliente SQL*Plus/SQL Developer, no sentencias del lenguaje SQL que envía el motor; el examen puede presentar uno de estos comandos como si fuera SQL válido en cualquier contexto (por ejemplo, dentro de un procedimiento PL/SQL, donde DESCRIBE no funciona)." }
  ],
  exercises: [
    { title: "Tu primera consulta a DUAL", difficulty: "básico", prompt: "Escribe una sentencia que devuelva el resultado de 15 * 3 usando DUAL.", hint: "SELECT expresión FROM DUAL;", solution: "SELECT 15 * 3 AS resultado FROM DUAL;" },
    { title: "Ver la estructura de una tabla", difficulty: "básico", prompt: "Usa el comando adecuado para ver las columnas, el tipo de dato y si admiten NULL de la tabla DEPARTMENTS.", hint: "No es una sentencia SQL, es un comando de cliente.", solution: "DESCRIBE departments;" },
    { title: "Clasifica comandos", difficulty: "intermedio", prompt: "Indica si CREATE TABLE, DELETE, GRANT y ROLLBACK son DDL, DML, DCL o TCL.", hint: "Piensa qué afecta cada uno: estructura, datos, permisos o transacción.", solution: "CREATE TABLE = DDL · DELETE = DML · GRANT = DCL · ROLLBACK = TCL" },
    { title: "Identifica la integridad referencial", difficulty: "intermedio", prompt: "EMPLOYEES tiene una FK department_id hacia DEPARTMENTS. ¿Qué impide Oracle si intentas insertar un empleado con department_id = 999 y ese departamento no existe?", hint: "Piensa en qué valida Oracle antes de aceptar el INSERT.", solution: "Oracle rechaza el INSERT con un error de integridad referencial (ORA-02291), porque el valor de la FK no existe como PK en la tabla padre DEPARTMENTS." },
    { title: "Diseña las claves foráneas de un ERD", difficulty: "avanzado", prompt: "Dado un ERD simplificado EMPLOYEES (N) — (1) DEPARTMENTS (N) — (1) LOCATIONS, indica en qué tabla va cada clave foránea y hacia qué tabla apunta.", hint: "La FK siempre va en el lado 'N' (muchos), apuntando al lado '1'.", solution: "department_id es FK en EMPLOYEES apuntando a DEPARTMENTS.department_id; location_id es FK en DEPARTMENTS apuntando a LOCATIONS.location_id." },
    { title: "Detecta la forma normal violada", difficulty: "avanzado", prompt: "Una tabla PEDIDOS(id_pedido, cliente, producto1, producto2, producto3) almacena hasta tres productos por pedido en columnas separadas. ¿Qué forma normal viola y cómo la corregirías?", hint: "Piensa en qué representa 'producto1/2/3': ¿son atributos distintos o el mismo atributo repetido?", solution: "Viola la Primera Forma Normal (1FN) porque producto1/2/3 son un grupo repetido del mismo atributo 'producto'. Se corrige extrayendo una tabla PEDIDO_LINEAS(id_pedido FK, producto) con una fila por producto, eliminando el límite artificial de tres productos." }
  ],
  solved: [
    { title: "Ejecutar tu primera consulta sobre DUAL",
      problem: "Necesitas obtener el resultado de una operación aritmética simple sin consultar ninguna tabla de negocio.",
      steps: [
        "Recuerda que en Oracle todo SELECT necesita un FROM, incluso si no hay ninguna tabla real involucrada.",
        "Elige DUAL como tabla, ya que existe precisamente para estos casos (1 fila, 1 columna, sin datos de negocio).",
        "Escribe la expresión en la lista del SELECT y dale un alias descriptivo con AS.",
        "Ejecuta la sentencia y comprueba que devuelve una sola fila con el resultado."
      ],
      query: "SELECT 15 * 4 AS resultado FROM DUAL;",
      result: "RESULTADO\n---------\n       60" },
    { title: "Detectar y corregir una violación de 1FN",
      problem: "La tabla PEDIDOS(id_pedido, cliente, producto1, producto2, producto3) parece rara: cada pedido solo puede tener hasta 3 productos, y muchas filas tienen columnas vacías.",
      steps: [
        "Observa que producto1, producto2 y producto3 son el mismo atributo (\"producto de este pedido\") repetido tres veces en columnas distintas.",
        "Reconoce que esto es exactamente lo que 1FN prohíbe: valores no atómicos / grupos repetidos del mismo atributo.",
        "Diseña una tabla nueva PEDIDO_LINEAS con una fila por producto, en vez de una columna por producto.",
        "Conecta PEDIDO_LINEAS con PEDIDOS mediante una clave foránea id_pedido, eliminando el límite artificial de 3 productos."
      ],
      query: "CREATE TABLE pedido_lineas (\n  id_pedido  NUMBER(6) REFERENCES pedidos(id_pedido),\n  producto   VARCHAR2(50)\n);",
      result: "Ahora un pedido puede tener 1, 3 o 20 productos sin cambiar la estructura de la tabla, y ya no hay columnas vacías." },
    { title: "Comprobar qué pasa al violar la integridad referencial",
      problem: "Quieres insertar un empleado en un departamento que todavía no existe en DEPARTMENTS, y necesitas entender qué hará Oracle.",
      steps: [
        "Identifica que employees.department_id es FOREIGN KEY hacia departments.department_id.",
        "Recuerda que Oracle valida esa FK en el momento del INSERT, comprobando que el valor exista como PK en la tabla padre.",
        "Intenta el INSERT con un department_id que no existe (por ejemplo, 999) y observa el error.",
        "Para solucionarlo: o usas un department_id existente, o insertas primero la fila 999 en DEPARTMENTS antes de insertar el empleado."
      ],
      query: "INSERT INTO employees (employee_id, last_name, department_id)\nVALUES (9999, 'Prueba', 999);",
      result: "ORA-02291: integrity constraint (HR.EMP_DEPT_FK) violated - parent key not found" }
  ],
  flashcards: [
    { front: "¿Qué es una clave candidata?", back: "Cualquier conjunto mínimo de columnas que identifica de forma única cada fila de una tabla. Puede haber varias por tabla." },
    { front: "¿Qué es una clave primaria (PRIMARY KEY)?", back: "La clave candidata elegida como identificador oficial de la tabla; implica NOT NULL + UNIQUE, y solo hay una por tabla." },
    { front: "¿Qué garantiza una FOREIGN KEY?", back: "Integridad referencial: todo valor no nulo de la FK debe existir como clave primaria (o UNIQUE) en la tabla padre." },
    { front: "¿Qué es la Primera Forma Normal (1FN)?", back: "Que cada columna tenga valores atómicos y no existan grupos repetidos del mismo atributo en varias columnas." },
    { front: "¿Qué prohíbe la Segunda Forma Normal (2FN)?", back: "Que un atributo no clave dependa solo de una parte de una clave primaria compuesta (dependencia parcial)." },
    { front: "¿Qué prohíbe la Tercera Forma Normal (3FN)?", back: "Que un atributo no clave dependa de otro atributo no clave (dependencia transitiva)." },
    { front: "¿Dónde se coloca la FK en una relación 1:N?", back: "En la tabla del lado 'N' (muchos), apuntando a la clave primaria del lado '1'." },
    { front: "¿Cómo se resuelve una relación N:N en SQL?", back: "Con una tabla intermedia (de unión) que contiene dos claves foráneas, una hacia cada tabla original." },
    { front: "¿Qué categorías forman el lenguaje SQL en Oracle?", back: "DDL (estructura), DML (datos), DQL (consultas), DCL (permisos) y TCL (transacciones)." },
    { front: "¿Para qué sirve la tabla DUAL?", back: "Para evaluar expresiones sin depender de ninguna tabla real, ya que Oracle exige FROM en todo SELECT." },
    { front: "¿Qué diferencia hay entre SQL Developer y SQL*Plus?", back: "Ambos envían el mismo SQL al motor; SQL Developer es una interfaz gráfica y SQL*Plus es un cliente de línea de comandos." }
  ],
  examples: [
    { title: "Consultar la fecha del servidor", code: "SELECT SYSDATE FROM DUAL;", note: "DUAL permite evaluar expresiones sin tabla real." },
    { title: "Ver la estructura de una tabla", code: "DESCRIBE employees;\n-- o abreviado:\nDESC employees;", note: "Comando de SQL*Plus/SQL Developer, no una sentencia SQL estándar." }
  ],
  quiz: [
    { q: "¿Qué es una clave candidata?", options: [
        "La clave que Oracle elige automáticamente al crear la tabla",
        "Cualquier conjunto mínimo de columnas que identifica de forma única cada fila",
        "Una clave foránea que todavía no se ha declarado",
        "Una clave que admite valores NULL sin restricción"
      ], a: 1,
      why: [
        "Oracle nunca elige una clave automáticamente: el diseñador declara explícitamente la PRIMARY KEY.",
        "Correcta: es la definición exacta de clave candidata, con la propiedad de minimalidad (no se puede quitar ninguna columna sin perder la unicidad).",
        "Una clave candidata no tiene relación directa con las claves foráneas; son conceptos distintos del modelo relacional.",
        "Una clave candidata debe garantizar unicidad; en la práctica esto exige que sus columnas no puedan quedar todas NULL a la vez, lo contrario de lo que dice esta opción."
      ] },
    { q: "¿Cuál de las siguientes sentencias es DDL (Data Definition Language)?", options: ["UPDATE", "ALTER TABLE", "GRANT", "COMMIT"], a: 1,
      why: [
        "UPDATE modifica datos, no estructura: es DML.",
        "Correcta: ALTER TABLE modifica la estructura de un objeto de esquema, es DDL por definición.",
        "GRANT otorga privilegios: es DCL, no DDL.",
        "COMMIT confirma una transacción: es TCL, no DDL."
      ] },
    { q: "¿Qué garantiza exactamente una FOREIGN KEY?", options: [
        "Que la columna no admita valores duplicados",
        "Que la columna sea automáticamente la clave primaria de su tabla",
        "Integridad referencial: que el valor exista en la tabla padre, o sea NULL",
        "Que Oracle cree un índice único sobre esa columna en todas las versiones"
      ], a: 2,
      why: [
        "Eso lo garantiza UNIQUE, no una FOREIGN KEY: una FK puede tener valores repetidos perfectamente.",
        "Una FK jamás convierte una columna en clave primaria de su propia tabla: solo referencia la PK de otra.",
        "Correcta: la FK obliga a que todo valor no nulo exista como PK/UNIQUE en la tabla padre — eso es integridad referencial.",
        "Oracle no crea automáticamente ningún índice sobre una columna FK; es una trampa clásica del examen y motivo de recomendación de buenas prácticas."
      ] },
    { q: "¿Cuál de estas tablas viola la Primera Forma Normal (1FN)?", options: [
        "EMPLOYEES(id, nombre, salario)",
        "PEDIDOS(id, cliente, producto1, producto2, producto3)",
        "DEPARTMENTS(id, nombre)",
        "JOBS(id, titulo, salario_min, salario_max)"
      ], a: 1,
      why: [
        "Todas sus columnas son atómicas y no hay grupos repetidos: cumple 1FN sin problema.",
        "Correcta: producto1/producto2/producto3 son el mismo atributo 'producto' repetido en tres columnas, el ejemplo clásico de violación de 1FN.",
        "Estructura simple y atómica: cumple 1FN.",
        "salario_min y salario_max son atributos distintos (mínimo y máximo), no un grupo repetido del mismo dato: cumple 1FN."
      ] },
    { q: "En el temario de certificación Oracle, SELECT se clasifica como:", options: [
        "DML, exactamente igual que INSERT, UPDATE y DELETE",
        "DQL, una categoría propia de consulta de datos",
        "DCL, porque controla qué datos puede ver cada usuario",
        "TCL, porque puede ejecutarse dentro de una transacción"
      ], a: 1,
      why: [
        "Es el error más común de esta pregunta: aunque documentación antigua a veces mezclaba SELECT con DML, el temario de certificación las separa.",
        "Correcta: SELECT no modifica datos, por eso se le da la categoría propia DQL (Data Query Language).",
        "DCL controla privilegios (GRANT/REVOKE), no qué datos ve un usuario dentro de sus permisos ya concedidos.",
        "TCL gestiona COMMIT/ROLLBACK/SAVEPOINT; que SELECT pueda ejecutarse dentro de una transacción no lo convierte en TCL."
      ] },
    { q: "¿Qué comando permite ver la estructura (columnas, tipos, NULL/NOT NULL) de una tabla?", options: ["SELECT * FROM tabla;", "DESCRIBE tabla;", "SHOW TABLE tabla;", "EXPLAIN tabla;"], a: 1,
      why: [
        "SELECT * muestra los datos almacenados, no la definición de columnas y tipos.",
        "Correcta: DESCRIBE (o DESC) es el comando de SQL*Plus/SQL Developer diseñado justo para esto.",
        "SHOW TABLE no es un comando válido en SQL*Plus.",
        "EXPLAIN no existe con ese propósito; existe EXPLAIN PLAN, pero sirve para analizar el plan de ejecución de una consulta, no la estructura de una tabla."
      ] },
    { q: "En un ERD, una relación 1:N entre DEPARTMENTS (1) y EMPLOYEES (N) se traduce en SQL como:", options: [
        "Una tabla intermedia con dos claves foráneas",
        "Una clave foránea department_id en EMPLOYEES apuntando a DEPARTMENTS",
        "Una clave foránea employee_id en DEPARTMENTS apuntando a EMPLOYEES",
        "No requiere ninguna clave foránea, basta con el orden en que se crean las tablas"
      ], a: 1,
      why: [
        "Una tabla intermedia con dos FK se usa para relaciones N:N, no para una 1:N simple.",
        "Correcta: la FK se coloca siempre en el lado 'N' (muchos), apuntando a la clave primaria del lado '1'.",
        "Esto invertiría la relación de forma incorrecta: DEPARTMENTS no puede depender de un employee_id concreto.",
        "Las relaciones no se infieren nunca por el orden de creación de las tablas: deben modelarse explícitamente con una FK."
      ] },
    { q: "¿Cuál es la diferencia principal entre 2FN y 3FN?", options: [
        "2FN elimina dependencias parciales de una clave compuesta; 3FN elimina además dependencias transitivas entre atributos no clave",
        "Son el mismo concepto con dos nombres distintos",
        "3FN es un requisito técnico que Oracle exige para poder crear la tabla",
        "2FN solo se aplica a vistas, nunca a tablas reales"
      ], a: 0,
      why: [
        "Correcta: es la definición formal exacta de la diferencia entre ambas formas normales.",
        "No lo son: son formas normales progresivas, cada una con un requisito adicional sobre la anterior.",
        "Oracle no exige ninguna forma normal para ejecutar un CREATE TABLE; la normalización es una decisión de diseño, no una restricción del motor.",
        "La normalización se aplica al diseño lógico de tablas en general, no es un concepto exclusivo de vistas."
      ] },
    { q: "¿Qué es la tabla DUAL en Oracle?", options: [
        "Una tabla del esquema HR con datos de ejemplo para practicar",
        "Una tabla de una sola fila y una sola columna, propiedad de SYS, para evaluar expresiones sin datos reales",
        "Una vista que duplica automáticamente cualquier tabla que consultes",
        "Una tabla temporal que Oracle crea de nuevo en cada sesión"
      ], a: 1,
      why: [
        "DUAL no pertenece al esquema HR ni contiene datos de negocio: es un objeto del diccionario de datos.",
        "Correcta: DUAL tiene una sola fila, una sola columna (DUMMY) y pertenece a SYS; existe solo para completar el FROM obligatorio.",
        "DUAL no tiene ninguna relación con duplicar el contenido de otras tablas.",
        "DUAL es un objeto permanente, no se crea ni se destruye por sesión."
      ] },
    { q: "¿Cuál de las siguientes afirmaciones sobre las categorías del lenguaje SQL es correcta?", options: [
        "TCL agrupa CREATE, ALTER y DROP",
        "DCL agrupa GRANT y REVOKE",
        "DML agrupa SELECT, INSERT y UPDATE por igual",
        "DDL agrupa COMMIT y ROLLBACK"
      ], a: 1,
      why: [
        "Eso es DDL (Data Definition Language), no TCL.",
        "Correcta: DCL (Data Control Language) agrupa exactamente GRANT y REVOKE.",
        "SELECT se separa como DQL en el temario de certificación; agruparlo sin distinción con INSERT/UPDATE es precisamente el error que se evalúa.",
        "COMMIT y ROLLBACK son TCL, no DDL."
      ] },
    { q: "Si EMPLOYEES tiene una FOREIGN KEY department_id hacia DEPARTMENTS, ¿qué ocurre al insertar un department_id que no existe en DEPARTMENTS?", options: [
        "Oracle lo inserta igualmente y lo marca como pendiente de validar",
        "Oracle lanza un error de integridad referencial (ORA-02291) y rechaza el INSERT",
        "Oracle crea automáticamente el departamento que falta en DEPARTMENTS",
        "Oracle convierte silenciosamente ese valor a NULL"
      ], a: 1,
      why: [
        "Oracle no tiene ningún estado de 'pendiente de validar' para las claves foráneas: la valida en el momento del INSERT.",
        "Correcta: Oracle rechaza la operación inmediatamente con un error de integridad referencial.",
        "Oracle nunca crea filas automáticamente en la tabla padre para 'arreglar' una FK.",
        "Oracle no sustituye valores por NULL de forma silenciosa: si el INSERT especifica un valor, lo valida tal cual, y lo rechaza si no cumple la FK."
      ] }
  ],
  challenges: [
    { level: 1, prompt: "Sin usar ninguna tabla real, obtén en una sola consulta: tu 'nombre' como texto y el resultado de 100/4.", solution: "SELECT 'Ana' AS nombre, 100/4 AS division FROM DUAL;" },
    { level: 2, prompt: "Explica con tus palabras por qué Oracle exige FROM DUAL y qué pasaría si Oracle no tuviera esa tabla.", solution: "La sintaxis de Oracle exige siempre un FROM en el SELECT; sin DUAL no habría forma estándar de evaluar una expresión sin datos, habría que inventar o reutilizar una tabla real cada vez, con el riesgo de que su número de filas alterase el resultado." }
  ]
},

// =====================================================================
// NIVEL 1
// =====================================================================
{
  id: 1, code: "M1", category: "SELECT",
  title: "SELECT básico",
  intro: "La instrucción más usada en SQL: elegir columnas, construir expresiones y dar forma al resultado antes de filtrar u ordenar nada.",
  theory: {
    concepts: [
      { heading: "1. La sentencia SELECT y la cláusula FROM",
        explanation: "SELECT indica qué columnas o expresiones quieres recuperar; FROM indica de qué tabla (o, como ya viste en el Módulo 0, de DUAL si no necesitas ninguna tabla real). El orden de las columnas en el SELECT determina el orden en que aparecen en el resultado, no el orden físico de almacenamiento de la tabla — Oracle no garantiza ningún orden de filas sin un ORDER BY explícito (se ve en el módulo siguiente).",
        syntax: "SELECT { * | { [DISTINCT] columna | expresión [AS alias] } [, ...] }\nFROM   tabla;",
        subconcepts: [
          { heading: "1.1 Seleccionar columnas concretas frente a SELECT *",
            explanation: "SELECT * devuelve todas las columnas de la tabla, en el orden en que se definieron. Es cómodo para explorar datos de forma interactiva, pero en código real (vistas, aplicaciones, procedimientos) es una mala práctica: si alguien añade una columna nueva a la tabla, el código que depende de '*' puede recibir datos inesperados o romperse.",
            examples: [
              { code: "SELECT first_name, last_name, salary\nFROM   employees;", output: "FIRST_NAME  LAST_NAME  SALARY\n----------  ---------  ------\nSteven      King        24000\nNeena       Kochhar     17000" }
            ] }
        ] },
      { heading: "2. Alias de columna y de tabla",
        explanation: "Un alias renombra temporalmente una columna o tabla solo para esa consulta, sin modificar el objeto real. La palabra AS es opcional (salary sueldo funciona igual que salary AS sueldo), pero si el alias contiene espacios, empieza por un número o quieres forzar minúsculas, necesita comillas dobles.",
        examples: [
          { code: "SELECT last_name AS apellido, salary AS \"Sueldo Mensual\"\nFROM   employees;" }
        ] },
      { heading: "3. Expresiones aritméticas en el SELECT",
        explanation: "Se pueden combinar columnas numéricas con +, -, *, / directamente en el SELECT. La precedencia es la habitual: * y / se evalúan antes que + y -, y entre operadores del mismo nivel se evalúa de izquierda a derecha. Los paréntesis fuerzan un orden distinto.",
        examples: [
          { code: "SELECT employee_id, last_name AS apellido, salary * 12 AS salario_anual\nFROM   employees;",
            output: "EMPLOYEE_ID  APELLIDO   SALARIO_ANUAL\n-----------  ---------  -------------\n        100  King              288000\n        101  Kochhar           204000" },
          { code: "SELECT last_name, salary, commission_pct, salary + commission_pct AS total\nFROM   employees\nWHERE  last_name IN ('King', 'Russell');",
            output: "LAST_NAME  SALARY  COMMISSION_PCT  TOTAL\n---------  ------  --------------  -----\nKing        24000                  (NULL)\nRussell     14000            0.4   14000.4" }
        ] },
      { heading: "4. Literales de texto y el operador de comillas alternativas",
        explanation: "Un literal de texto va entre comillas simples: 'Madrid'. Si el texto contiene una comilla simple, se duplica: 'Jackie''s raincoat'. Para evitar duplicar comillas en textos largos (por ejemplo, SQL dentro de un literal), Oracle ofrece el operador q'delimitador...delimitador', que permite elegir tú mismo el carácter delimitador.",
        syntax: "q'delimitador texto delimitador'\n-- delimitadores especiales que se cierran en pareja: [ ], { }, < >, ( )",
        examples: [
          { code: "SELECT q'[It's Ana's report]' AS texto\nFROM   DUAL;", output: "TEXTO\n------------------\nIt's Ana's report" }
        ] },
      { heading: "5. Buenas prácticas y comentarios",
        explanation: "Escribe las palabras clave en MAYÚSCULAS, termina cada sentencia con punto y coma, y evita SELECT * en código real. Los comentarios se escriben con -- (una línea) o /* ... */ (varias líneas)." }
    ],
    oracleNotes: [
      "Cualquier expresión aritmética con un NULL da NULL: salary + commission_pct es NULL si commission_pct es NULL, aunque salary tenga valor. Es uno de los errores de interpretación más comunes en el examen (la solución, NVL, se ve en el módulo de conversión y condicionales).",
      "Excepción a la regla anterior: la concatenación (||, siguiente módulo) es la única operación que no se \"envenena\" con NULL — trata un NULL como cadena vacía.",
      "Con el operador q'...', si el delimitador de apertura es [, {, < o (, el de cierre debe ser su pareja (], }, >, )); con cualquier otro carácter, apertura y cierre deben ser el mismo símbolo.",
      "Los literales de texto son sensibles a mayúsculas/minúsculas: 'Madrid' y 'MADRID' son valores distintos.",
      "Un alias de columna definido en el SELECT se puede usar en ORDER BY, pero no en WHERE, GROUP BY ni HAVING (se explica por qué exactamente al ver el orden lógico de ejecución, en el módulo de funciones de grupo)."
    ]
  },
  summary: [
    "SELECT elige columnas/expresiones; FROM indica la tabla (o DUAL).",
    "SELECT * es cómodo para explorar, pero frágil en código real.",
    "AS crea un alias temporal; con espacios necesita comillas dobles.",
    "Las expresiones aritméticas siguen la precedencia habitual (*/ antes de +-).",
    "Cualquier operación aritmética con NULL da NULL, excepto la concatenación.",
    "q'delimitador...delimitador' evita duplicar comillas simples en literales de texto."
  ],
  comparisonTable: {
    title: "Formas de nombrar una columna en el resultado",
    headers: ["Sintaxis", "¿Necesita AS?", "¿Admite espacios?", "Ejemplo"],
    rows: [
      ["alias simple", "No (opcional)", "No", "salary sueldo"],
      ["alias con AS", "Sí, por claridad", "No", "salary AS sueldo"],
      ["alias con comillas dobles", "Sí", "Sí", "salary AS \"Sueldo Mensual\""]
    ]
  },
  mindMap: [
    { topic: "Módulo 1 — SELECT básico", children: [
      "SELECT + FROM → columnas/expresiones + tabla (o DUAL)",
      "Alias → AS opcional; comillas dobles solo si hay espacios/minúsculas forzadas",
      "Aritmética → precedencia */  antes de +-; NULL contamina el resultado",
      "Texto → comillas simples; q'[...]' evita duplicar comillas",
      "Estilo → mayúsculas en palabras clave, ; final, evitar SELECT *"
    ] }
  ],
  sourceRefs: [
    "Oracle SQL Language Reference 19c — \"SELECT\"",
    "Oracle SQL Language Reference 19c — \"Literals\"",
    "Oracle SQL Language Reference 19c — \"Nulls\""
  ],
  realCases: {
    business: "Un panel de RRHH que muestra 'salario anual estimado' no almacena esa columna en la tabla: se calcula al vuelo con salary * 12 en el SELECT, para no tener que mantener sincronizado un dato derivado cada vez que cambia el salario mensual.",
    dataEngineering: "En una capa de exposición de datos (vista o API), un ingeniero de datos nombra explícitamente cada columna con alias legibles en vez de exponer los nombres físicos de la base de datos, para que los consumidores externos no dependan de detalles internos que puedan cambiar.",
    etl: "Un job de ETL que copia datos entre sistemas nunca usa SELECT * en el origen: lista las columnas explícitamente, así un cambio de estructura en la tabla origen (una columna añadida) no rompe silenciosamente el mapeo de columnas del destino.",
    reporting: "Un informe financiero que suma comisiones usa NVL (se ve más adelante) precisamente porque descubrió que salary + commission_pct devolvía NULL para los empleados sin comisión: sin saber que la aritmética con NULL 'contamina' el resultado, el informe habría mostrado huecos en vez de sumas completas."
  },
  mistakes: [
    { mistake: "Olvidar el punto y coma al final de la sentencia.", why: "En SQL*Plus/SQL Developer, sin el ; (o la barra / según el cliente) la sentencia no se considera completa; el examen presenta bloques de código y pregunta si son válidos, y un ; faltante es un detalle fácil de pasar por alto." },
    { mistake: "Pensar que una expresión aritmética con NULL da 0 o se ignora.", why: "Cualquier operación aritmética donde interviene un NULL devuelve NULL, no 0 ni el otro operando. El examen construye tablas de resultados esperados donde una fila con NULL en una columna involucrada en +,-,*,/ debe marcarse como NULL, no como un número calculado." },
    { mistake: "Usar comillas dobles alrededor de cualquier alias 'por si acaso'.", why: "Las comillas dobles fuerzan sensibilidad a mayúsculas/minúsculas y permiten espacios, pero si no son necesarias añaden ruido; además, un alias entre comillas dobles debe escribirse exactamente igual (con las mismas mayúsculas) en cualquier referencia posterior dentro de la misma sentencia." },
    { mistake: "Duplicar mal las comillas simples dentro de un literal.", why: "'Jackie's' sin duplicar la comilla es un error de sintaxis porque Oracle interpreta la segunda comilla como el cierre del literal; hay que escribir 'Jackie''s' o usar el operador q'[...]'. El examen presenta literales mal escritos como distractor de sintaxis." }
  ],
  exercises: [
    { title: "Selección simple", difficulty: "básico", prompt: "Obtén el nombre (first_name), apellido (last_name) y salario (salary) de la tabla employees.", hint: "SELECT col1, col2, col3 FROM tabla;", solution: "SELECT first_name, last_name, salary FROM employees;" },
    { title: "Con alias", difficulty: "básico", prompt: "Repite la consulta anterior pero muestra salary con el alias sueldo_mensual.", hint: "columna AS alias", solution: "SELECT first_name, last_name, salary AS sueldo_mensual FROM employees;" },
    { title: "Salario anual", difficulty: "intermedio", prompt: "Muestra last_name y el salario anual estimado (salary * 12) con el alias salario_anual.", hint: "Multiplica dentro del propio SELECT.", solution: "SELECT last_name, salary * 12 AS salario_anual FROM employees;" },
    { title: "Alias con espacios", difficulty: "intermedio", prompt: "Muestra last_name con el alias 'Apellido Empleado' (con espacio y mayúscula inicial en cada palabra).", hint: "Necesitarás comillas dobles.", solution: "SELECT last_name AS \"Apellido Empleado\" FROM employees;" },
    { title: "Literal con comilla", difficulty: "avanzado", prompt: "Muestra el texto literal O'Brien's report usando el operador de comillas alternativas.", hint: "q'[delimitador especial que no confunda con el apóstrofe]'", solution: "SELECT q'[O'Brien's report]' AS texto FROM DUAL;" },
    { title: "Detecta el problema de NULL", difficulty: "avanzado", prompt: "Explica qué mostrará 'SELECT last_name, salary + commission_pct AS total FROM employees;' para un empleado sin comisión, y cómo se podría arreglar (sin usar todavía NVL, que se ve más adelante).", hint: "Piensa en qué hace Oracle con NULL en una suma.", solution: "Mostrará NULL en la columna total para cualquier empleado con commission_pct NULL, aunque tenga salario. Sin NVL, una forma manual de \"arreglarlo\" sería sumar 0 explícitamente solo si se puede garantizar que commission_pct nunca es NULL, lo cual no es el caso aquí; la solución real (NVL) se estudia en el módulo de conversión y condicionales." }
  ],
  solved: [
    { title: "Construir una consulta con alias legibles",
      problem: "Necesitas un listado de empleados con columnas más claras que los nombres físicos de la tabla (first_name, last_name, salary).",
      steps: [
        "Identifica las columnas físicas que necesitas: first_name, last_name, salary.",
        "Decide un alias legible para cada una: Nombre, Apellido, Salario.",
        "Como 'Nombre' y 'Apellido' no llevan espacios ni minúsculas forzadas, no necesitan comillas dobles.",
        "Escribe el SELECT con AS para cada columna y termina con punto y coma."
      ],
      query: "SELECT first_name AS Nombre, last_name AS Apellido, salary AS Salario\nFROM   employees;",
      result: "NOMBRE   APELLIDO  SALARIO\n-------  --------  -------\nSteven   King        24000" },
    { title: "Diagnosticar un resultado NULL inesperado",
      problem: "Ejecutas SELECT last_name, salary + commission_pct AS total FROM employees; y varias filas muestran total en blanco (NULL), aunque salary tiene valor en todas.",
      steps: [
        "Comprueba los valores de commission_pct para esas filas: probablemente son NULL (empleados sin comisión).",
        "Recuerda la regla: cualquier operación aritmética con un NULL da NULL como resultado completo, no ignora el NULL.",
        "Confirma la hipótesis consultando directamente esa columna: SELECT last_name, commission_pct FROM employees;",
        "Anota que la solución definitiva (sustituir NULL por 0 con NVL) se estudiará en el módulo de conversión y condicionales."
      ],
      query: "SELECT last_name, commission_pct\nFROM   employees\nWHERE  commission_pct IS NULL;",
      result: "Confirma que las filas con total NULL son exactamente las que tienen commission_pct NULL." }
  ],
  flashcards: [
    { front: "¿Qué hace SELECT * y por qué se evita en código real?", back: "Devuelve todas las columnas de la tabla; se evita porque es frágil ante cambios de estructura y menos legible." },
    { front: "¿Es obligatoria la palabra AS para crear un alias?", back: "No, es opcional: 'salary sueldo' funciona igual que 'salary AS sueldo'." },
    { front: "¿Cuándo necesita comillas dobles un alias?", back: "Cuando contiene espacios, empieza por un número o se quiere forzar una escritura exacta en mayúsculas/minúsculas." },
    { front: "¿Qué devuelve una suma si uno de los operandos es NULL?", back: "NULL: cualquier operación aritmética con NULL da NULL como resultado completo." },
    { front: "¿Qué operación NO se \"envenena\" con NULL?", back: "La concatenación (||): trata un NULL como cadena vacía." },
    { front: "¿Cómo se escribe un apóstrofe dentro de un literal de texto normal?", back: "Duplicando la comilla simple: 'Jackie''s'." },
    { front: "¿Para qué sirve el operador q'[...]'?", back: "Para escribir literales de texto largos sin tener que duplicar comillas simples, eligiendo tú el delimitador." },
    { front: "¿Qué precedencia tienen * y / frente a + y -?", back: "Mayor: se evalúan primero, salvo que se usen paréntesis para forzar otro orden." }
  ],
  examples: [
    { title: "Seleccionar columnas concretas", code: "SELECT first_name, last_name, salary\nFROM employees;" },
    { title: "Todas las columnas (usar con cuidado)", code: "SELECT *\nFROM departments;" },
    { title: "Alias rápido de columna", code: "SELECT last_name AS apellido\nFROM employees;" }
  ],
  quiz: [
    { q: "¿Qué cláusula es obligatoria acompañando siempre a SELECT en Oracle?", options: ["WHERE", "FROM", "ORDER BY", "GROUP BY"], a: 1,
      why: [
        "WHERE es opcional: sin él, simplemente no se filtra ninguna fila.",
        "Correcta: FROM es obligatorio en Oracle, incluso si es DUAL.",
        "ORDER BY es opcional y solo ordena el resultado final.",
        "GROUP BY es opcional y solo se necesita al agrupar filas."
      ] },
    { q: "¿Cuál de estas opciones NO es una buena práctica recomendada?", options: [
        "Terminar cada sentencia con ;", "Escribir las palabras clave en mayúsculas",
        "Usar siempre SELECT * para no tener que pensar en las columnas", "Indentar las cláusulas para legibilidad"
      ], a: 2,
      why: [
        "Terminar con ; es una buena práctica (y obligatoria en muchos clientes).",
        "Escribir las palabras clave en mayúsculas mejora la legibilidad; es una convención recomendada.",
        "Correcta: SELECT * afecta al rendimiento y a la robustez del código ante cambios de estructura; se recomienda listar columnas explícitas.",
        "Indentar mejora la legibilidad; es una buena práctica."
      ] },
    { q: "¿Qué hace 'SELECT last_name AS apellido FROM employees;'?", options: [
        "Crea una nueva columna llamada apellido en la tabla", "Muestra la columna last_name con la etiqueta apellido en el resultado",
        "Renombra permanentemente la columna last_name", "Da error de sintaxis"
      ], a: 1,
      why: [
        "AS no modifica la tabla física; no crea columnas nuevas en employees.",
        "Correcta: AS crea un alias solo para el resultado de esa consulta.",
        "No hay ningún renombrado permanente: la próxima consulta sin alias seguiría viendo last_name.",
        "Es sintaxis perfectamente válida en Oracle."
      ] },
    { q: "¿Cuál es el resultado de 'SELECT 10 + NULL FROM DUAL;'?", options: ["10", "0", "NULL", "Error de sintaxis"], a: 2,
      why: [
        "10 sería el resultado si Oracle ignorase el NULL, pero no lo hace.",
        "0 sería el resultado si Oracle tratase NULL como 0, pero no lo hace.",
        "Correcta: cualquier operación aritmética con NULL da NULL.",
        "No es un error de sintaxis: es una operación válida que simplemente da NULL."
      ] },
    { q: "¿Cuál de estas comparaciones de literales es sensible a mayúsculas/minúsculas?", options: [
        "Ninguna, Oracle ignora mayúsculas en literales de texto", "'Madrid' = 'MADRID' se considera verdadero",
        "'Madrid' y 'MADRID' son literales de texto distintos", "Depende del tipo de columna, nunca del literal"
      ], a: 2,
      why: [
        "Oracle sí distingue mayúsculas/minúsculas en literales de texto por defecto.",
        "Esa comparación sería FALSE en Oracle: son cadenas distintas.",
        "Correcta: los literales de texto son sensibles a mayúsculas/minúsculas.",
        "La sensibilidad es una propiedad del valor de texto en sí, no del tipo de columna donde se compare."
      ] },
    { q: "¿Qué delimitador de cierre corresponde a q'{...' al usar el operador de comillas alternativas?", options: ["'", "}", "{", "No necesita cierre"], a: 1,
      why: [
        "Una sola comilla simple NO es el cierre cuando se usa un delimitador especial de apertura como {.",
        "Correcta: { se cierra con su pareja }, igual que [ con ], < con > y ( con ).",
        "{ es el delimitador de apertura, no el de cierre.",
        "Todo literal q'...' necesita su delimitador de cierre correspondiente."
      ] },
    { q: "¿Dónde se puede usar un alias de columna definido en el propio SELECT?", options: [
        "En la cláusula WHERE de la misma consulta", "En la cláusula ORDER BY de la misma consulta",
        "En la cláusula GROUP BY de la misma consulta", "En la cláusula HAVING de la misma consulta"
      ], a: 1,
      why: [
        "WHERE se evalúa antes de que el alias exista (se explica en detalle con el orden lógico de ejecución más adelante).",
        "Correcta: ORDER BY se evalúa al final, cuando el alias ya está disponible.",
        "GROUP BY tampoco puede usar el alias del SELECT por el mismo motivo que WHERE.",
        "HAVING se evalúa antes que el SELECT en el orden lógico, así que tampoco puede usarlo."
      ] },
    { q: "¿Qué ocurre si dos columnas de tablas distintas comparten el mismo nombre y ambas aparecen sin alias en el mismo SELECT?", options: [
        "Oracle las combina automáticamente en una sola columna", "Es ambiguo y debe resolverse con alias o prefijo de tabla",
        "Oracle elige la de la primera tabla automáticamente", "Da error de sintaxis siempre, sin excepción"
      ], a: 1,
      why: [
        "Oracle no combina columnas automáticamente; siguen siendo columnas independientes.",
        "Correcta: cuando hay ambigüedad de nombre entre tablas (algo más relevante en JOINs), hay que aclarar con alias de tabla o de columna.",
        "Oracle no asume ninguna prioridad entre tablas por defecto.",
        "No es necesariamente un error de sintaxis en toda circunstancia; depende de dónde se referencie la columna ambigua."
      ] },
    { q: "¿Cómo se escriben los comentarios de una sola línea en Oracle SQL?", options: ["// comentario", "# comentario", "-- comentario", "<!-- comentario -->"], a: 2,
      why: [
        "// no es sintaxis de comentario en SQL.",
        "# no es sintaxis de comentario en Oracle SQL (sí en otros contextos, no aquí).",
        "Correcta: -- inicia un comentario de una sola línea en Oracle SQL.",
        "Esa es sintaxis de comentario HTML, no de SQL."
      ] },
    { q: "¿Qué alias es sintácticamente inválido sin comillas dobles?", options: ["sueldo", "sueldo_2024", "2024_sueldo", "SUELDO"], a: 2,
      why: [
        "sueldo es un identificador válido sin comillas.",
        "sueldo_2024 es válido: empieza por letra.",
        "Correcta: un identificador que empieza por un número necesita comillas dobles para ser válido.",
        "SUELDO es válido, es simplemente el mismo identificador en mayúsculas."
      ] }
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
  id: 2, code: "M2", category: "SELECT",
  title: "Filtrado de datos con WHERE",
  intro: "Filtrar filas según condiciones numéricas, de texto y de fecha, entendiendo la lógica de tres valores que usa Oracle por debajo.",
  theory: {
    concepts: [
      { heading: "1. La cláusula WHERE y los operadores de comparación",
        explanation: "WHERE filtra las filas que cumplen una condición, evaluada fila a fila antes de que existan alias del SELECT. Los operadores de comparación básicos son =, >, <, >=, <= y de desigualdad != , <> o ^= (los tres son equivalentes)." },
      { heading: "2. Operadores lógicos y su precedencia",
        explanation: "AND exige que se cumplan todas las condiciones combinadas; OR exige que se cumpla al menos una; NOT invierte el resultado de una condición. AND tiene más precedencia que OR, por lo que WHERE a OR b AND c se evalúa como WHERE a OR (b AND c). Usa paréntesis siempre que combines AND y OR para dejar explícita tu intención.",
        examples: [
          { code: "SELECT last_name, salary, department_id\nFROM   employees\nWHERE  (department_id = 10 OR department_id = 20)\nAND    salary > 3000;" }
        ] },
      { heading: "3. La lógica trivaluada de Oracle: TRUE, FALSE y UNKNOWN",
        explanation: "A diferencia de la lógica booleana clásica de dos valores, SQL trabaja con tres: TRUE, FALSE y UNKNOWN. Cualquier comparación que involucre NULL no es ni verdadera ni falsa: es UNKNOWN, porque Oracle no puede evaluar una comparación contra 'ausencia de valor'. WHERE solo conserva las filas donde la condición final es TRUE; tanto FALSE como UNKNOWN se descartan, lo cual explica comportamientos que a primera vista parecen ilógicos.",
        subconcepts: [
          { heading: "3.1 Por qué NOT IN con NULL no devuelve nada",
            explanation: "department_id NOT IN (10, 20, NULL) se traduce internamente en department_id <> 10 AND department_id <> 20 AND department_id <> NULL. Como comparar con NULL siempre da UNKNOWN, y AND con un UNKNOWN nunca puede dar TRUE si el resto son TRUE (el resultado global queda en UNKNOWN), la condición completa nunca se cumple para ninguna fila, aunque esa fila sí cumpliría las dos primeras comparaciones.",
            examples: [
              { code: "SELECT last_name, department_id\nFROM   employees\nWHERE  department_id NOT IN (10, 20, NULL);", output: "no se devuelve ninguna fila, aunque existan empleados con department_id distinto de 10 y de 20" }
            ],
            commonErrors: [
              "Construir una subconsulta para NOT IN sin comprobar antes si puede devolver NULL: si la devuelve, todo el NOT IN queda inutilizado silenciosamente, sin ningún error visible."
            ] }
        ] },
      { heading: "4. IN y BETWEEN",
        explanation: "IN compara un valor contra una lista, como alternativa compacta a varios OR encadenados. BETWEEN expr2 AND expr3 selecciona un rango con ambos extremos incluidos: equivale a expr2 <= expr1 AND expr1 <= expr3.",
        examples: [
          { code: "SELECT last_name, job_id\nFROM   employees\nWHERE  job_id IN ('PU_CLERK', 'SH_CLERK')\nAND    salary BETWEEN 2500 AND 3000;",
            output: "LAST_NAME   JOB_ID\n----------  ---------\nKhoo        SH_CLERK\nBaida       PU_CLERK" }
        ] },
      { heading: "5. LIKE y los comodines de Oracle",
        explanation: "LIKE busca un patrón de texto con dos comodines: % (cualquier secuencia de caracteres, incluida vacía) y _ (exactamente un carácter). La cláusula ESCAPE permite buscar un % o _ literal.",
        syntax: "char1 [NOT] LIKE char2 [ESCAPE 'esc_char']",
        examples: [
          { code: "SELECT last_name\nFROM   employees\nWHERE  last_name LIKE 'S%'\nORDER BY last_name;" }
        ] },
      { heading: "6. NULL: IS NULL / IS NOT NULL",
        explanation: "NULL representa ausencia de valor, no un valor en sí. Nunca se compara con = ni <>: la única forma correcta de comprobarlo es IS NULL / IS NOT NULL.",
        examples: [
          { code: "SELECT last_name, commission_pct\nFROM   employees\nWHERE  commission_pct IS NULL;" }
        ] },
      { heading: "7. Variables de sustitución: & , && y DEFINE",
        explanation: "En SQL*Plus/SQL Developer, & antes de un nombre crea una variable de sustitución: la herramienta pide un valor cada vez que se ejecuta la sentencia, y lo sustituye textualmente antes de enviar el SQL al motor (no es una sentencia SQL en sí, es una funcionalidad del cliente). && pide el valor solo la primera vez y lo reutiliza en el resto de la sesión para esa misma variable. DEFINE nombre = valor asigna un valor de antemano sin que se pregunte de forma interactiva; UNDEFINE elimina la definición.",
        syntax: "SELECT * FROM employees WHERE department_id = &dept_id;\nSELECT * FROM employees WHERE job_id = '&&puesto';\nDEFINE dept_id = 60;",
        examples: [
          { code: "SELECT last_name, salary\nFROM   employees\nWHERE  department_id = &dept_id;\n-- SQL*Plus pregunta: Introduzca un valor para dept_id:" }
        ] }
    ],
    oracleNotes: [
      "La trampa más repetida del examen: NOT IN con una lista que contiene un NULL no devuelve ninguna fila. IN (sin NOT) no tiene este problema porque basta con que UNA comparación sea TRUE, y OR con un TRUE siempre da TRUE aunque el resto sea UNKNOWN.",
      "Si expr3 < expr2 en un BETWEEN, el rango queda vacío y la condición es siempre FALSE: Oracle no intercambia los límites automáticamente.",
      "LIKE es sensible a mayúsculas/minúsculas por defecto (depende de la collation de la sesión): 'S%' no encuentra 'smith'.",
      "WHERE columna = NULL nunca devuelve filas: no es un error de sintaxis, Oracle simplemente evalúa esa comparación como UNKNOWN para toda fila, incluidas las que tienen NULL en esa columna.",
      "Las variables de sustitución (&, &&) son una funcionalidad de SQL*Plus/SQL Developer, no de SQL: no existen dentro de PL/SQL ni en otras herramientas de conexión que no las implementen."
    ]
  },
  summary: [
    "Operadores de comparación: =, >, <, >=, <=, y desigualdad != / <> / ^=.",
    "SQL usa lógica de tres valores (TRUE/FALSE/UNKNOWN); WHERE solo conserva las filas en TRUE.",
    "AND se evalúa antes que OR; usa paréntesis para no depender de la precedencia implícita.",
    "IN es un atajo de varios OR (inmune al problema de NULL); BETWEEN incluye ambos extremos; NOT IN con NULL en la lista anula toda la condición.",
    "LIKE con % y _, y ESCAPE para buscarlos como texto literal.",
    "NULL solo se comprueba con IS NULL / IS NOT NULL.",
    "& y && son variables de sustitución de SQL*Plus/SQL Developer, no sentencias SQL."
  ],
  comparisonTable: {
    title: "IN vs NOT IN frente a NULL en la lista",
    headers: ["Operador", "Lista con NULL", "Resultado", "Por qué"],
    rows: [
      ["IN (10, 20, NULL)", "Sí", "Funciona igual que sin el NULL", "Basta una comparación TRUE; OR con TRUE siempre da TRUE"],
      ["NOT IN (10, 20, NULL)", "Sí", "Nunca devuelve filas", "AND encadenado con un UNKNOWN nunca llega a TRUE global"]
    ]
  },
  mindMap: [
    { topic: "Módulo 2 — WHERE", children: [
      "Comparación → =, >, <, >=, <=, <>/!=/^=",
      "Lógica → AND (más precedencia), OR, NOT; lógica de 3 valores TRUE/FALSE/UNKNOWN",
      "NULL → solo IS NULL/IS NOT NULL; NOT IN + NULL en lista = trampa clásica",
      "Rangos y listas → BETWEEN (incluye extremos), IN (atajo de OR)",
      "Texto → LIKE con % y _, ESCAPE para literal",
      "Cliente → & / && variables de sustitución, DEFINE/UNDEFINE (no son SQL real)"
    ] }
  ],
  sourceRefs: [
    "Oracle SQL Language Reference 19c — \"Comparison Conditions\"",
    "Oracle SQL Language Reference 19c — \"BETWEEN Condition\"",
    "Oracle SQL Language Reference 19c — \"IN Condition\"",
    "Oracle SQL Language Reference 19c — \"Pattern-matching Conditions\" (LIKE)",
    "SQL*Plus User's Guide and Reference — \"Substitution Variables\""
  ],
  realCases: {
    business: "Un informe de ventas que filtra 'clientes fuera de una lista de países bloqueados' usando NOT IN puede devolver silenciosamente cero resultados en producción si esa lista se genera con una subconsulta que algún día incluye un NULL — un fallo típico de negocio que no lanza ningún error, solo un informe vacío.",
    dataEngineering: "Un pipeline que parametriza sus consultas de extracción con variables de sustitución en scripts de SQL*Plus permite reutilizar el mismo script para distintos department_id o rangos de fecha sin duplicar código, definiendo los valores con DEFINE al principio del script.",
    etl: "Un proceso ETL que filtra registros 'no nulos en la clave de negocio' antes de cargarlos usa IS NOT NULL de forma explícita, en vez de <> '' o similar, porque en Oracle una cadena vacía se trata como NULL en muchos contextos.",
    reporting: "Un dashboard que compara periodos usando BETWEEN fecha_inicio AND fecha_fin debe verificar que fecha_inicio no sea posterior a fecha_fin (por ejemplo, si vienen de un selector de fechas mal validado): si lo son, el rango queda vacío silenciosamente y el informe muestra 'sin datos' en lugar de un error claro."
  },
  mistakes: [
    { mistake: "Escribir WHERE columna = NULL en vez de WHERE columna IS NULL.", why: "Oracle no lanza ningún error: simplemente evalúa la comparación como UNKNOWN para todas las filas y no devuelve ninguna. El examen presenta este código como sintácticamente válido para comprobar si sabes que es un error lógico, no de sintaxis." },
    { mistake: "Usar NOT IN con una subconsulta que puede devolver NULL.", why: "Es la trampa más repetida del temario: basta que UNA fila de la subconsulta sea NULL para que el NOT IN completo deje de devolver filas, sin ningún aviso. El examen construye subconsultas con columnas que 'podrían' tener NULL a propósito." },
    { mistake: "Olvidar paréntesis al mezclar AND y OR.", why: "Como AND tiene más precedencia que OR, omitir paréntesis cambia silenciosamente el significado de la condición; el examen presenta la misma condición con y sin paréntesis para comprobar si distingues ambos resultados." },
    { mistake: "Pensar que & y && son sintaxis SQL estándar.", why: "Son una funcionalidad exclusiva de los clientes SQL*Plus/SQL Developer para pedir valores de forma interactiva; el examen puede presentarlas junto a sentencias SQL reales para comprobar si sabes distinguir 'comando de cliente' de 'sentencia SQL'." }
  ],
  exercises: [
    { title: "Rango salarial", difficulty: "básico", prompt: "Obtén empleados con salario entre 4000 y 9000 (inclusive).", hint: "BETWEEN ... AND ...", solution: "SELECT * FROM employees WHERE salary BETWEEN 4000 AND 9000;" },
    { title: "Sin comisión", difficulty: "básico", prompt: "Obtén el nombre de los empleados que no tienen comisión asignada (commission_pct nula).", hint: "IS NULL", solution: "SELECT first_name, last_name FROM employees WHERE commission_pct IS NULL;" },
    { title: "Combinar AND y OR con paréntesis", difficulty: "intermedio", prompt: "Obtén empleados del departamento 10 o 20 cuyo salario supere 3000, dejando explícita la precedencia con paréntesis.", hint: "(a OR b) AND c", solution: "SELECT * FROM employees WHERE (department_id = 10 OR department_id = 20) AND salary > 3000;" },
    { title: "Patrón con LIKE", difficulty: "intermedio", prompt: "Obtén empleados cuyo apellido empiece por 'S' y tenga exactamente 5 letras.", hint: "Un guion bajo por cada letra restante.", solution: "SELECT last_name FROM employees WHERE last_name LIKE 'S____';" },
    { title: "El caso NOT IN con NULL", difficulty: "avanzado", prompt: "Dada esta subconsulta: SELECT department_id FROM employees (algunos empleados no tienen department_id asignado), explica qué pasa si usas WHERE department_id NOT IN (SELECT department_id FROM employees) en DEPARTMENTS, y cómo solucionarlo.", hint: "Piensa en la lógica de 3 valores.", solution: "Si algún employee tiene department_id NULL, la subconsulta devuelve NULL como uno de sus valores, y el NOT IN completo deja de devolver filas para toda la consulta externa. Se soluciona filtrando los NULL en la propia subconsulta: WHERE department_id NOT IN (SELECT department_id FROM employees WHERE department_id IS NOT NULL), o usando NOT EXISTS." },
    { title: "Variables de sustitución encadenadas", difficulty: "avanzado", prompt: "Escribe una consulta parametrizada con & que pida un department_id y un salario mínimo, y explica la diferencia si usaras && en vez de &.", hint: "Con &&, SQL*Plus solo pregunta la primera vez.", solution: "SELECT last_name FROM employees WHERE department_id = &dept_id AND salary > &salario_min; -- con & pregunta cada vez que se ejecuta; con && (por ejemplo &&dept_id) pediría el valor solo la primera vez y lo reutilizaría en el resto de la sesión para esa variable." }
  ],
  solved: [
    { title: "Depurar un NOT IN que devuelve cero filas",
      problem: "Una consulta WHERE department_id NOT IN (SELECT department_id FROM job_history) debería devolver varios departamentos, pero devuelve cero filas y no hay ningún error.",
      steps: [
        "Sospecha de la lógica de tres valores: revisa si la subconsulta puede devolver NULL.",
        "Ejecuta la subconsulta por separado: SELECT department_id FROM job_history; y busca si aparece algún NULL.",
        "Confirmas que sí: algunas filas de job_history tienen department_id sin asignar.",
        "Corrige añadiendo un filtro IS NOT NULL dentro de la propia subconsulta, o cambia a NOT EXISTS con una subconsulta correlacionada."
      ],
      query: "SELECT department_id, department_name\nFROM   departments\nWHERE  department_id NOT IN (\n  SELECT department_id FROM job_history WHERE department_id IS NOT NULL\n);",
      result: "Ahora la consulta devuelve correctamente los departamentos que nunca aparecieron en job_history." },
    { title: "Elegir entre IN y BETWEEN según el tipo de condición",
      problem: "Necesitas empleados de los departamentos 10, 20 y 30, con salario entre 3000 y 8000.",
      steps: [
        "Para 'department_id es uno de estos tres valores' usa IN, más legible que tres OR encadenados.",
        "Para 'salario entre dos límites' usa BETWEEN, que incluye ambos extremos.",
        "Combina ambas condiciones con AND, ya que deben cumplirse las dos a la vez.",
        "No hace falta paréntesis adicionales aquí porque no hay OR mezclado con AND."
      ],
      query: "SELECT last_name, department_id, salary\nFROM   employees\nWHERE  department_id IN (10, 20, 30)\nAND    salary BETWEEN 3000 AND 8000;",
      result: "Devuelve solo los empleados que cumplen ambas condiciones simultáneamente." }
  ],
  flashcards: [
    { front: "¿Cómo se comprueba correctamente que una columna es NULL?", back: "Con IS NULL (o IS NOT NULL); nunca con = NULL." },
    { front: "¿Qué son TRUE, FALSE y UNKNOWN en SQL?", back: "Los tres valores posibles de una condición; UNKNOWN aparece siempre que interviene NULL." },
    { front: "¿Por qué NOT IN con NULL en la lista no devuelve filas?", back: "Porque se traduce en AND de comparaciones <>, y cualquier <> NULL da UNKNOWN, anulando el resultado global." },
    { front: "¿Por qué IN sí funciona aunque la lista tenga NULL?", back: "Porque basta una comparación = TRUE; OR con un TRUE siempre da TRUE, sin que importe el resto." },
    { front: "¿Qué pasa si el segundo límite de un BETWEEN es menor que el primero?", back: "El rango queda vacío y la condición es siempre FALSE; Oracle no intercambia los límites." },
    { front: "¿Qué comodín de LIKE sustituye exactamente un carácter?", back: "_ (guion bajo). % sustituye cualquier cantidad, incluida ninguna." },
    { front: "¿Qué son las variables & y && en SQL*Plus?", back: "Variables de sustitución del cliente: & pide el valor cada vez, && lo reutiliza tras la primera vez." },
    { front: "¿Qué precedencia tiene AND frente a OR?", back: "AND se evalúa primero, salvo que se use paréntesis para forzar otro orden." }
  ],
  examples: [
    { title: "Comparaciones básicas", code: "SELECT first_name, salary\nFROM employees\nWHERE salary >= 5000;" },
    { title: "IN y BETWEEN", code: "SELECT last_name, department_id\nFROM employees\nWHERE department_id IN (10, 20, 30)\nAND salary BETWEEN 3000 AND 8000;" },
    { title: "LIKE con comodines", code: "SELECT last_name\nFROM employees\nWHERE last_name LIKE '_a%';  -- segunda letra 'a'" },
    { title: "NULL correcto", code: "SELECT last_name, commission_pct\nFROM employees\nWHERE commission_pct IS NULL;" },
    { title: "Precedencia con paréntesis", code: "SELECT last_name\nFROM employees\nWHERE (department_id = 10 OR department_id = 20)\nAND salary > 3000;" }
  ],
  quiz: [
    { q: "¿Cómo se comprueba correctamente que una columna no tiene valor?", options: ["= NULL", "IS NULL", "<> NULL", "== NULL"], a: 1,
      why: [
        "NULL nunca se compara con =: la condición daría UNKNOWN, no TRUE.",
        "Correcta: IS NULL es la única forma correcta de comprobar ausencia de valor.",
        "<> NULL tiene el mismo problema que = NULL: da UNKNOWN siempre.",
        "== no es un operador válido en SQL de Oracle."
      ] },
    { q: "¿Qué devuelve 'WHERE last_name LIKE 'M_ller'' con el comodín _?", options: [
        "Apellidos que contienen 'M_ller' literalmente", "Apellidos de 6 letras que empiezan por M y terminan en ller, con cualquier letra en medio",
        "Apellidos que empiezan por M seguido de cualquier cosa", "Error de sintaxis"
      ], a: 1,
      why: [
        "_ no es un carácter literal en LIKE salvo que se use ESCAPE: aquí actúa como comodín.",
        "Correcta: _ sustituye exactamente un carácter, dando un patrón de 6 posiciones fijas.",
        "Eso describiría 'M%', no 'M_ller' con guion bajo.",
        "Es sintaxis perfectamente válida en una cláusula LIKE."
      ] },
    { q: "¿Qué devuelve 'department_id NOT IN (10, 20, NULL)' para una fila con department_id = 30?", options: [
        "TRUE, porque 30 no está en la lista", "FALSE, porque 30 sí está relacionado con NULL",
        "UNKNOWN, porque la comparación con NULL contamina todo el AND implícito", "Error de ejecución"
      ], a: 2,
      why: [
        "Parecería lógico, pero la lógica de tres valores lo impide: el resultado no llega a ser TRUE.",
        "No es FALSE tampoco: es UNKNOWN, un tercer valor distinto.",
        "Correcta: NOT IN se traduce en AND de comparaciones <>, y <> NULL siempre da UNKNOWN, que 'contamina' el AND completo.",
        "No es un error de ejecución: es un resultado lógico válido (UNKNOWN), simplemente inesperado si no conoces la regla."
      ] },
    { q: "En 'WHERE dept_id = 10 OR dept_id = 20 AND salary > 3000', ¿qué operador tiene más precedencia?", options: ["OR", "AND", "Se evalúan de izquierda a derecha por igual", "Depende de la versión de Oracle"], a: 1,
      why: [
        "OR tiene MENOS precedencia que AND, no más.",
        "Correcta: AND se evalúa antes que OR salvo que se use paréntesis para forzar otro orden.",
        "No se evalúan por igual: SQL respeta una jerarquía de precedencia entre operadores lógicos.",
        "La precedencia de AND sobre OR es una regla del estándar SQL, no varía entre versiones de Oracle."
      ] },
    { q: "¿Cuál es el operador correcto para 'distinto de' en Oracle?", options: ["!==", "<>", "=/=", "NOT="], a: 1,
      why: [
        "!== no es un operador válido en Oracle SQL.",
        "Correcta: <> es el operador estándar; != también funciona como alias en Oracle.",
        "=/= no existe en SQL.",
        "NOT= no es sintaxis válida (aunque NOT columna = valor sí lo sería, con NOT como palabra separada)."
      ] },
    { q: "¿Por qué IN (10, 20, NULL) sí funciona correctamente para valores que sí coinciden, a diferencia de NOT IN?", options: [
        "Porque IN ignora los NULL de la lista automáticamente", "Porque basta que una comparación sea TRUE, y OR con TRUE siempre da TRUE",
        "Porque Oracle convierte los NULL en 0 dentro de IN", "No es cierto: IN tiene el mismo problema que NOT IN"
      ], a: 1,
      why: [
        "Oracle no 'ignora' el NULL: simplemente esa comparación concreta da UNKNOWN, pero no afecta al resto.",
        "Correcta: IN se traduce en OR de igualdades; basta una TRUE para que el conjunto sea TRUE, sin que importe si otra comparación dio UNKNOWN.",
        "Oracle nunca convierte NULL en 0 de forma implícita.",
        "Sí es cierto que IN funciona bien en este caso: el problema es exclusivo de NOT IN por cómo se combina con AND."
      ] },
    { q: "¿Qué hace 'DEFINE dept_id = 60' en SQL*Plus?", options: [
        "Crea una columna calculada llamada dept_id", "Asigna un valor a una variable de sustitución sin preguntar de forma interactiva",
        "Es una sentencia DDL que crea una tabla", "No es válido en ningún cliente Oracle"
      ], a: 1,
      why: [
        "DEFINE no crea columnas ni modifica ninguna tabla.",
        "Correcta: DEFINE asigna un valor de antemano a una variable de sustitución, evitando que SQL*Plus pregunte interactivamente.",
        "No es DDL: es un comando propio del cliente SQL*Plus, no una sentencia SQL.",
        "Es válido específicamente en SQL*Plus (y equivalentes); no forma parte del lenguaje SQL en sí."
      ] },
    { q: "¿Qué rango selecciona 'WHERE salary BETWEEN 8000 AND 3000'?", options: [
        "Salarios entre 3000 y 8000, Oracle intercambia los límites", "Ningún valor: el rango queda vacío",
        "Todos los salarios mayores que 3000", "Error de sintaxis"
      ], a: 1,
      why: [
        "Oracle NO intercambia los límites automáticamente si el primero es mayor que el segundo.",
        "Correcta: como el límite inferior (8000) es mayor que el superior (3000), el rango queda vacío y la condición es siempre FALSE.",
        "No selecciona ningún salario mayor que 3000: BETWEEN exige estar entre AMBOS límites tal como se escribieron.",
        "Es sintácticamente válido, aunque lógicamente no tenga sentido: no da error, simplemente no devuelve filas."
      ] },
    { q: "¿Qué diferencia hay entre & y && como variables de sustitución?", options: [
        "Ninguna, son sinónimos exactos", "& pide el valor cada vez que se usa esa variable; && lo pide solo la primera vez y lo reutiliza",
        "&& solo funciona con números; & solo con texto", "& es válido en SQL estándar; && es exclusivo de Oracle"
      ], a: 1,
      why: [
        "No son sinónimos: su comportamiento de reutilización es distinto.",
        "Correcta: && guarda el valor introducido la primera vez y lo reutiliza en el resto de la sesión para esa variable.",
        "Ambas funcionan igual de bien con números o texto; no hay distinción por tipo de dato.",
        "Ninguna de las dos es sintaxis SQL estándar: ambas son específicas de clientes como SQL*Plus."
      ] }
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
  id: 3, code: "M3", category: "SELECT",
  title: "Ordenación y limitación de filas",
  intro: "Ordenar resultados, eliminar duplicados, construir texto combinado y limitar cuántas filas se devuelven — incluida la diferencia entre ROWNUM y ROW_NUMBER que tanto confunde en el examen.",
  theory: {
    concepts: [
      { heading: "1. ORDER BY",
        explanation: "Ordena el resultado final por una o varias columnas, expresiones, posiciones o alias, cada una ASC (por defecto) o DESC de forma independiente. ORDER BY se ejecuta al final del procesamiento lógico de la consulta, por lo que es la única cláusula que puede usar directamente un alias definido en el SELECT.",
        syntax: "SELECT   ...\nFROM     tabla\n[WHERE   ...]\nORDER BY { columna | expresión | posición | alias } [ASC|DESC] [NULLS FIRST|NULLS LAST]\n          [, ...]",
        examples: [
          { code: "SELECT last_name, department_id, salary\nFROM   employees\nORDER BY department_id ASC, salary DESC;" }
        ] },
      { heading: "2. NULLS FIRST / NULLS LAST",
        explanation: "En Oracle, por defecto NULL se trata como el valor más alto posible al ordenar: en ASC los NULL aparecen al final, en DESC aparecen al principio. NULLS FIRST y NULLS LAST fuerzan explícitamente dónde deben colocarse.",
        examples: [
          { code: "SELECT last_name, commission_pct\nFROM   employees\nORDER BY commission_pct DESC NULLS LAST;" }
        ] },
      { heading: "3. DISTINCT",
        explanation: "Elimina filas duplicadas del resultado, comparando la combinación completa de todas las columnas seleccionadas, no columna a columna.",
        examples: [
          { code: "SELECT DISTINCT department_id\nFROM   employees\nORDER BY department_id;" }
        ] },
      { heading: "4. Concatenación con ||",
        explanation: "Oracle concatena texto con el operador ||, que admite tantos elementos encadenados como se quiera. La función CONCAT(char1, char2) hace lo mismo pero solo acepta exactamente dos argumentos.",
        examples: [
          { code: "SELECT first_name || ' ' || last_name AS nombre_completo\nFROM   employees\nWHERE  last_name = 'King';",
            output: "NOMBRE_COMPLETO\n----------------\nSteven King" }
        ] },
      { heading: "5. FETCH FIRST / OFFSET: limitar filas al estilo ANSI",
        explanation: "Desde Oracle 12c, la forma moderna y estándar ANSI de limitar cuántas filas devuelve una consulta es OFFSET...FETCH, dentro de la propia cláusula ORDER BY. OFFSET n ROWS salta las primeras n filas ya ordenadas; FETCH FIRST n ROWS ONLY (o FETCH NEXT n ROWS ONLY) limita cuántas se devuelven después de ese salto. FETCH FIRST n PERCENT ROWS ONLY devuelve un porcentaje de filas en vez de un número fijo.",
        syntax: "SELECT ...\nFROM   tabla\nORDER BY columna\nOFFSET n ROWS\nFETCH { FIRST | NEXT } { n | n PERCENT } ROWS { ONLY | WITH TIES }",
        examples: [
          { code: "SELECT last_name, salary\nFROM   employees\nORDER BY salary DESC\nFETCH FIRST 5 ROWS ONLY;" },
          { code: "SELECT last_name, salary\nFROM   employees\nORDER BY salary DESC\nOFFSET 5 ROWS FETCH NEXT 5 ROWS ONLY;", output: "-- filas de la 6 a la 10 según el orden de salary DESC (paginación típica)" }
        ] },
      { heading: "6. ROWNUM: la forma clásica (pre-12c) de limitar filas",
        explanation: "ROWNUM es una pseudocolumna que Oracle asigna dinámicamente a cada fila del resultado, empezando en 1, en el orden en que las va devolviendo el motor — no necesariamente el orden final si hay ORDER BY, lo cual es la fuente de más errores. WHERE ROWNUM <= n limita el número de filas antes de aplicar el ORDER BY lógicamente (el motor filtra por ROWNUM sobre el conjunto todavía no ordenado, y solo después ordena esas filas ya seleccionadas), así que 'las 5 filas con mayor salario' NO se consigue con WHERE ROWNUM <= 5 ORDER BY salary DESC de forma directa: hay que envolver la consulta ya ordenada en una subconsulta y aplicar ROWNUM fuera.",
        syntax: "SELECT ...\nFROM (SELECT ... FROM tabla ORDER BY columna DESC)\nWHERE ROWNUM <= n;",
        examples: [
          { code: "SELECT last_name, salary\nFROM   (SELECT last_name, salary FROM employees ORDER BY salary DESC)\nWHERE  ROWNUM <= 5;" }
        ],
        commonErrors: [
          "Escribir WHERE ROWNUM <= 5 ORDER BY salary DESC en la misma consulta esperando 'los 5 salarios más altos': ROWNUM se asigna ANTES de que el ORDER BY final reordene el resultado, así que se limitan 5 filas arbitrarias y luego se ordenan esas 5, no las 5 mejores de toda la tabla.",
          "Usar WHERE ROWNUM > 1 esperando saltarse la primera fila: como ROWNUM se genera secuencialmente empezando en 1 fila a fila, ninguna fila puede tener ROWNUM > 1 antes de que exista una fila con ROWNUM = 1 ya descartada, así que esta condición no devuelve nunca filas sin una reescritura especial."
        ] }
    ],
    oracleNotes: [
      "CONCAT solo admite exactamente 2 argumentos en Oracle; para más elementos hay que usar || o anidar CONCAT(CONCAT(a,b),c).",
      "ROWNUM se asigna en el orden en que el motor va leyendo/produciendo filas, ANTES de que se aplique el ORDER BY final: para 'top N' hay que ordenar primero en una subconsulta y aplicar ROWNUM fuera, o usar directamente FETCH FIRST n ROWS ONLY.",
      "FETCH FIRST/OFFSET sí respeta el ORDER BY de la misma consulta de forma natural, sin necesidad de subconsultas: es el motivo por el que se prefiere frente a ROWNUM en código nuevo.",
      "DISTINCT actúa sobre la combinación completa de las columnas seleccionadas, no columna a columna.",
      "ORDER BY puede referenciar un alias del SELECT (o su posición numérica, ORDER BY 2) porque se evalúa al final; ordenar por posición es frágil ante cambios en la lista de columnas."
    ]
  },
  summary: [
    "ORDER BY ordena el resultado final y es la única cláusula que admite alias del SELECT.",
    "NULLS FIRST / NULLS LAST controla dónde aparecen los NULL al ordenar.",
    "DISTINCT elimina combinaciones de fila duplicadas, no valores columna a columna.",
    "|| concatena cualquier número de elementos; CONCAT(a,b) solo admite dos.",
    "FETCH FIRST/OFFSET (ANSI, 12c+) respeta el ORDER BY de forma natural; es la forma moderna de paginar y limitar filas.",
    "ROWNUM se asigna antes del ORDER BY final: para 'top N' ordenado hace falta una subconsulta con el ORDER BY dentro y el filtro de ROWNUM fuera."
  ],
  comparisonTable: {
    title: "ROWNUM vs ROW_NUMBER() vs FETCH FIRST",
    headers: ["Mecanismo", "¿Respeta el ORDER BY directamente?", "¿Permite empates (ties)?", "Disponible desde"],
    rows: [
      ["ROWNUM", "No (hay que anidar subconsulta)", "No", "Todas las versiones"],
      ["ROW_NUMBER() OVER (ORDER BY ...)", "Sí, dentro de su propia cláusula OVER", "No (cada fila un número distinto)", "Función analítica, versiones con SQL analítico"],
      ["FETCH FIRST n ROWS ONLY", "Sí, de forma natural", "Solo con WITH TIES", "12c+"]
    ]
  },
  mindMap: [
    { topic: "Módulo 3 — Ordenación y límite de filas", children: [
      "ORDER BY → columna/expresión/alias/posición, ASC/DESC, NULLS FIRST/LAST",
      "DISTINCT → elimina combinaciones de fila duplicadas completas",
      "Concatenación → || (ilimitado) vs CONCAT (solo 2 argumentos)",
      "Límite moderno → OFFSET...FETCH FIRST/NEXT...ROWS [PERCENT] [ONLY|WITH TIES]",
      "Límite clásico → ROWNUM, asignado antes del ORDER BY final: exige subconsulta para 'top N'",
      "ROW_NUMBER() → alternativa analítica, se ve en detalle en el módulo de funciones analíticas"
    ] }
  ],
  sourceRefs: [
    "Oracle SQL Language Reference 19c — \"SELECT\" (order_by_clause, row_limiting_clause)",
    "Oracle SQL Language Reference 19c — \"CONCAT\"",
    "Oracle SQL Language Reference 19c — \"Pseudocolumns\" (ROWNUM)"
  ],
  realCases: {
    business: "Un ranking de 'top 10 vendedores del mes' en un panel de ventas usa FETCH FIRST 10 ROWS ONLY sobre una consulta ordenada por total de ventas DESC, en vez de la vieja combinación de ROWNUM con subconsulta anidada, porque el código resultante es más corto y no tiene el riesgo de olvidar anidar la consulta.",
    dataEngineering: "Un ingeniero de datos que pagina la extracción de una tabla muy grande usa OFFSET...FETCH para procesarla en bloques (por ejemplo, de 10.000 filas), evitando cargar toda la tabla en memoria de golpe.",
    etl: "Un proceso de deduplicación en un ETL usa DISTINCT o ROW_NUMBER() (funciones analíticas) sobre una clave de negocio para quedarse solo con la versión más reciente de cada registro antes de cargarlo en el destino.",
    reporting: "Un informe de 'últimos 5 movimientos por cliente' combina ORDER BY fecha DESC con FETCH FIRST 5 ROWS ONLY dentro de una subconsulta correlacionada por cliente (técnica que se perfecciona con funciones analíticas más adelante)."
  },
  mistakes: [
    { mistake: "Esperar que WHERE ROWNUM <= 5 ORDER BY salary DESC devuelva los 5 salarios más altos.", why: "ROWNUM se asigna a las filas según el orden en que el motor las produce, ANTES de aplicar el ORDER BY final de esa misma consulta. El examen construye precisamente este patrón porque parece lógico y no lo es: hay que ordenar en una subconsulta interna y aplicar el filtro de ROWNUM en la consulta externa." },
    { mistake: "Pensar que WHERE ROWNUM > 1 salta la primera fila.", why: "ROWNUM se genera secuencialmente: para que una fila tenga ROWNUM = 2, antes debe haber existido (y haberse evaluado) una fila con ROWNUM = 1 dentro del mismo WHERE, pero como esa fila no cumple ROWNUM > 1, nunca se genera la siguiente. El resultado es que la condición nunca se cumple para ninguna fila." },
    { mistake: "Usar CONCAT con tres o más argumentos.", why: "CONCAT(a, b) solo acepta exactamente dos parámetros en Oracle; el examen presenta CONCAT con tres argumentos como código que 'parece' que debería funcionar, para comprobar si conoces esta limitación concreta." },
    { mistake: "Confundir DISTINCT con una función que actúa columna a columna.", why: "DISTINCT elimina combinaciones completas de fila, no valores individuales por columna; el examen pregunta el resultado de un DISTINCT sobre dos o más columnas para comprobar si entiendes que se compara la tupla completa." }
  ],
  exercises: [
    { title: "Nombre completo", difficulty: "básico", prompt: "Muestra el nombre completo (first_name + espacio + last_name) con el alias nombre_completo.", hint: "columna1 || ' ' || columna2", solution: "SELECT first_name || ' ' || last_name AS nombre_completo FROM employees;" },
    { title: "Departamentos únicos ordenados", difficulty: "básico", prompt: "Lista los department_id distintos, ordenados de mayor a menor.", hint: "DISTINCT ... ORDER BY ... DESC", solution: "SELECT DISTINCT department_id FROM employees ORDER BY department_id DESC;" },
    { title: "Top 5 con FETCH FIRST", difficulty: "intermedio", prompt: "Obtén los 5 empleados con mayor salario usando la sintaxis moderna ANSI.", hint: "ORDER BY ... FETCH FIRST n ROWS ONLY", solution: "SELECT last_name, salary FROM employees ORDER BY salary DESC FETCH FIRST 5 ROWS ONLY;" },
    { title: "Paginar resultados", difficulty: "intermedio", prompt: "Obtén la 'segunda página' de 5 empleados (filas 6 a 10) ordenados por salario descendente.", hint: "OFFSET ... FETCH NEXT ...", solution: "SELECT last_name, salary FROM employees ORDER BY salary DESC OFFSET 5 ROWS FETCH NEXT 5 ROWS ONLY;" },
    { title: "Top N con ROWNUM (forma clásica)", difficulty: "avanzado", prompt: "Reescribe 'los 5 empleados con mayor salario' usando ROWNUM en vez de FETCH FIRST.", hint: "Ordena primero en una subconsulta, filtra ROWNUM fuera.", solution: "SELECT last_name, salary\nFROM (SELECT last_name, salary FROM employees ORDER BY salary DESC)\nWHERE ROWNUM <= 5;" },
    { title: "Explica el fallo de ROWNUM > 1", difficulty: "avanzado", prompt: "Explica por qué 'SELECT last_name FROM employees WHERE ROWNUM > 1;' no devuelve nunca ninguna fila.", hint: "Piensa en cómo se asigna ROWNUM fila a fila.", solution: "ROWNUM se asigna secuencialmente empezando en 1: para que una fila reciba ROWNUM = 2, Oracle primero evalúa la condición sobre la fila con ROWNUM = 1, que no cumple ROWNUM > 1 y se descarta; como nunca se 'confirma' esa primera fila, Oracle nunca llega a asignar ROWNUM = 2 a la siguiente, y así sucesivamente. El resultado es un conjunto vacío." }
  ],
  solved: [
    { title: "Construir un 'top N' correcto con FETCH FIRST",
      problem: "Necesitas los 3 empleados con salario más alto del departamento 80, con nombre y salario.",
      steps: [
        "Filtra primero por department_id = 80 en el WHERE.",
        "Ordena por salary DESC para que los mayores queden primero.",
        "Aplica FETCH FIRST 3 ROWS ONLY al final: como FETCH FIRST respeta el ORDER BY de la misma consulta, no hace falta ninguna subconsulta.",
        "Verifica que el resultado tiene exactamente 3 filas (o menos, si el departamento tiene menos empleados)."
      ],
      query: "SELECT last_name, salary\nFROM   employees\nWHERE  department_id = 80\nORDER BY salary DESC\nFETCH FIRST 3 ROWS ONLY;",
      result: "LAST_NAME  SALARY\n---------  ------\nRussell     14000\nPartners    13500\nErrazuriz   12000" },
    { title: "Migrar una consulta con ROWNUM mal escrita a la forma correcta",
      problem: "Alguien escribió: SELECT last_name, salary FROM employees WHERE ROWNUM <= 3 ORDER BY salary DESC; esperando los 3 salarios más altos, pero el resultado no coincide con lo esperado.",
      steps: [
        "Reconoce el patrón defectuoso: ROWNUM se aplica antes del ORDER BY final de esa misma consulta.",
        "Decide entre dos soluciones: reescribir con una subconsulta ordenada + ROWNUM fuera, o cambiar directamente a FETCH FIRST.",
        "Aplica la solución más simple: FETCH FIRST, que no necesita anidar nada.",
        "Compara mentalmente ambas versiones para entender por qué la original fallaba."
      ],
      query: "SELECT last_name, salary\nFROM   employees\nORDER BY salary DESC\nFETCH FIRST 3 ROWS ONLY;",
      result: "Ahora sí se garantizan los 3 salarios más altos de toda la tabla, en el orden correcto." }
  ],
  flashcards: [
    { front: "¿Qué controla NULLS FIRST / NULLS LAST?", back: "Dónde aparecen los valores NULL al ordenar, sobrescribiendo el comportamiento por defecto de Oracle." },
    { front: "¿Sobre qué actúa exactamente DISTINCT?", back: "Sobre la combinación completa de todas las columnas seleccionadas, no columna a columna." },
    { front: "¿Cuántos argumentos admite CONCAT?", back: "Exactamente 2; para más hay que usar || o anidar CONCAT." },
    { front: "¿Qué hace FETCH FIRST n ROWS ONLY?", back: "Limita el resultado a las primeras n filas, respetando el ORDER BY de la misma consulta." },
    { front: "¿Para qué sirve OFFSET n ROWS?", back: "Para saltar las primeras n filas ya ordenadas, típico en paginación junto a FETCH NEXT." },
    { front: "¿Cuándo se asigna ROWNUM a una fila?", back: "Antes de que se aplique el ORDER BY final de esa misma consulta, en el orden en que el motor produce las filas." },
    { front: "¿Por qué falla 'WHERE ROWNUM <= 5 ORDER BY salary DESC' para un top 5?", back: "Porque limita 5 filas arbitrarias antes de ordenar, y solo después las ordena; no son necesariamente las 5 mejores." },
    { front: "¿Cómo se consigue un 'top N' correcto con ROWNUM?", back: "Ordenando en una subconsulta interna y aplicando el filtro ROWNUM <= n en la consulta externa." }
  ],
  examples: [
    { title: "Ordenar por varias columnas", code: "SELECT last_name, department_id, salary\nFROM employees\nORDER BY department_id ASC, salary DESC;" },
    { title: "NULLS FIRST", code: "SELECT last_name, commission_pct\nFROM employees\nORDER BY commission_pct NULLS FIRST;" },
    { title: "DISTINCT", code: "SELECT DISTINCT department_id\nFROM employees;" },
    { title: "FETCH FIRST", code: "SELECT last_name, salary\nFROM employees\nORDER BY salary DESC\nFETCH FIRST 5 ROWS ONLY;" }
  ],
  quiz: [
    { q: "¿Cuántos argumentos admite la función CONCAT en Oracle?", options: ["Ilimitados", "Exactamente 2", "Máximo 3", "Depende de la versión"], a: 1,
      why: [
        "Para un número ilimitado de elementos se usa || , no CONCAT.",
        "Correcta: CONCAT(a,b) solo admite dos; para más se usa || o se anida.",
        "No hay un límite de 3; el límite exacto es 2.",
        "El límite de 2 argumentos es constante, no varía entre versiones soportadas."
      ] },
    { q: "Por defecto en Oracle, en un ORDER BY ascendente (ASC), ¿dónde aparecen los valores NULL?", options: ["Al principio", "Al final", "Se excluyen automáticamente", "Provocan error"], a: 1,
      why: [
        "En ASC los NULL aparecen al final, no al principio (sería al revés en DESC).",
        "Correcta: Oracle trata NULL como el valor más alto por defecto en ASC.",
        "ORDER BY nunca excluye filas: como mucho cambia su posición.",
        "No provocan ningún error: es un comportamiento válido y predecible."
      ] },
    { q: "¿Qué hace 'SELECT DISTINCT department_id, job_id FROM employees;'?", options: [
        "Devuelve valores únicos de department_id ignorando job_id", "Devuelve combinaciones únicas de (department_id, job_id)",
        "Da error porque DISTINCT solo admite una columna", "Ordena los resultados"
      ], a: 1,
      why: [
        "DISTINCT no colapsa una sola columna ignorando las demás.",
        "Correcta: DISTINCT actúa sobre la combinación completa de columnas seleccionadas.",
        "DISTINCT admite cualquier número de columnas, no solo una.",
        "DISTINCT no ordena: solo elimina duplicados; para ordenar hace falta ORDER BY."
      ] },
    { q: "¿Qué garantiza FETCH FIRST n ROWS ONLY que ROWNUM <= n no garantiza por sí solo?", options: [
        "Que se puedan usar comodines LIKE", "Que las filas devueltas respeten el ORDER BY de la misma consulta",
        "Que nunca haya valores NULL en el resultado", "Que la consulta sea más rápida en todos los casos"
      ], a: 1,
      why: [
        "No tiene relación con LIKE ni comodines.",
        "Correcta: FETCH FIRST se aplica después de ordenar lógicamente, a diferencia de ROWNUM.",
        "No elimina NULL del resultado: eso no es su función.",
        "El rendimiento depende de muchos factores (índices, plan de ejecución); no es una garantía automática."
      ] },
    { q: "¿Qué devuelve 'SELECT last_name FROM employees WHERE ROWNUM > 1;'?", options: [
        "Todas las filas excepto la primera", "Ningún resultado, siempre vacío",
        "Error de sintaxis", "Depende del ORDER BY que se use"
      ], a: 1,
      why: [
        "Es precisamente lo que parece que debería hacer, pero no es lo que ocurre.",
        "Correcta: como ROWNUM se asigna secuencialmente y la fila con ROWNUM=1 nunca cumple la condición, nunca se genera una fila con ROWNUM=2 dentro de ese mismo WHERE.",
        "No es un error de sintaxis: es sintácticamente válido, simplemente no devuelve filas.",
        "El resultado (vacío) no depende del ORDER BY, porque ROWNUM se asigna antes de ordenar."
      ] },
    { q: "¿Cuál es la forma correcta y moderna de obtener 'los 10 empleados con mayor salario', ordenados?", options: [
        "WHERE ROWNUM <= 10 ORDER BY salary DESC", "ORDER BY salary DESC FETCH FIRST 10 ROWS ONLY",
        "GROUP BY salary HAVING ROWNUM <= 10", "No es posible sin PL/SQL"
      ], a: 1,
      why: [
        "Ese patrón no garantiza los 10 mejores: ROWNUM se aplica antes de ordenar.",
        "Correcta: FETCH FIRST respeta el ORDER BY de la misma consulta de forma natural.",
        "HAVING no admite ROWNUM de esta manera y no tiene sentido combinarlo así con GROUP BY para este caso.",
        "Sí es posible con SQL puro, sin necesidad de PL/SQL."
      ] },
    { q: "¿Qué hace 'OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY'?", options: [
        "Devuelve las primeras 20 filas", "Salta las primeras 20 filas y devuelve las siguientes 10 (filas 21 a 30)",
        "Devuelve 20 filas y luego otras 10 adicionales sin saltar nada", "Da error porque OFFSET y FETCH no pueden combinarse"
      ], a: 1,
      why: [
        "OFFSET indica cuántas filas se saltan, no cuántas se devuelven.",
        "Correcta: es el patrón típico de paginación, saltando un bloque y devolviendo el siguiente.",
        "No devuelve 20+10; las 20 primeras se descartan explícitamente por el OFFSET.",
        "OFFSET y FETCH se combinan habitualmente y de forma válida en Oracle 12c+."
      ] },
    { q: "¿Qué añade 'WITH TIES' a una cláusula FETCH FIRST n ROWS?", options: [
        "Nada, es sintaxis obsoleta", "Incluye filas adicionales empatadas con la última en el criterio de ORDER BY",
        "Excluye los empates del resultado", "Solo funciona junto con GROUP BY"
      ], a: 1,
      why: [
        "No es obsoleta: es una opción válida y útil de la cláusula.",
        "Correcta: WITH TIES amplía el resultado para incluir todas las filas empatadas con la última que entraría por el límite n.",
        "Hace justo lo contrario: incluye los empates, no los excluye.",
        "No requiere GROUP BY: funciona sobre cualquier ORDER BY."
      ] },
    { q: "¿Qué diferencia clave hay entre ROWNUM y ROW_NUMBER() OVER (ORDER BY ...)?", options: [
        "Son exactamente equivalentes en todos los casos", "ROW_NUMBER() respeta el ORDER BY de su propia cláusula OVER; ROWNUM se asigna antes de cualquier ordenación de la consulta",
        "ROWNUM solo funciona con GROUP BY", "ROW_NUMBER() no existe en Oracle"
      ], a: 1,
      why: [
        "No son equivalentes: su momento de asignación respecto al orden es distinto.",
        "Correcta: ROW_NUMBER() es una función analítica (se estudia en detalle más adelante) que numera según el ORDER BY que tú defines dentro de OVER; ROWNUM depende del orden físico de producción de filas.",
        "ROWNUM no requiere GROUP BY en absoluto.",
        "ROW_NUMBER() existe en Oracle como función analítica estándar."
      ] }
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
  id: 4, code: "M4", category: "Funciones",
  title: "Funciones de carácter y numéricas",
  intro: "Las funciones que transforman texto y números fila a fila: la base para limpiar, formatear y calcular datos sin salir del SELECT.",
  theory: {
    concepts: [
      { heading: "1. Funciones de una fila: marco general",
        explanation: "Una función de una sola fila actúa sobre cada fila de forma independiente y devuelve exactamente un resultado por fila (UPPER, ROUND...), a diferencia de una función de grupo (SUM, COUNT...), que resume un conjunto de filas en un único resultado y se estudia en el módulo de funciones de agregación. Las funciones de una fila se pueden anidar sin límite práctico: el resultado de la más interna alimenta a la siguiente, evaluándose siempre de dentro hacia fuera.",
        examples: [
          { code: "SELECT last_name, UPPER(SUBSTR(last_name, 1, 3)) AS iniciales\nFROM   employees\nWHERE  ROWNUM <= 3;",
            output: "LAST_NAME  INICIALES\n---------  ---------\nKing       KIN\nKochhar    KOC\nDe Haan    DE " }
        ] },
      { heading: "2. Funciones de carácter: mayúsculas y capitalización",
        explanation: "UPPER convierte todo a mayúsculas, LOWER a minúsculas, INITCAP pone en mayúscula la primera letra de cada palabra y el resto en minúscula. Son las funciones típicas para normalizar texto antes de comparar (por ejemplo, comparaciones LIKE que necesitan ser insensibles a mayúsculas)." },
      { heading: "3. Funciones de carácter: extraer, medir y localizar texto",
        explanation: "LENGTH(cadena) devuelve el número de caracteres. SUBSTR(cadena, inicio, [longitud]) extrae una subcadena (en Oracle el primer carácter está en la posición 1, no 0; un inicio negativo cuenta desde el final de la cadena). INSTR(cadena, busca, [inicio], [ocurrencia]) devuelve la posición donde aparece una subcadena (0 si no la encuentra).",
        syntax: "SUBSTR(char, position [, substring_length])\nINSTR(char, substring [, position [, occurrence]])",
        examples: [
          { code: "SELECT last_name, SUBSTR(last_name, 1, 3) AS pref,\n       INSTR(last_name, 'a') AS pos_a, LENGTH(last_name) AS len\nFROM   employees\nWHERE  last_name = 'Kochhar';",
            output: "LAST_NAME  PREF  POS_A  LEN\n---------  ----  -----  ---\nKochhar    Koc       4    7" }
        ] },
      { heading: "4. Funciones de carácter: rellenar, recortar y sustituir",
        explanation: "LPAD/RPAD(cadena, longitud, [relleno]) rellenan por la izquierda/derecha hasta una longitud total, típico para alinear columnas en informes de texto plano. TRIM([LEADING|TRAILING|BOTH] carácter FROM cadena) quita espacios (o el carácter indicado) de los extremos. REPLACE(cadena, busca, reemplazo) sustituye todas las apariciones de un texto por otro.",
        syntax: "LPAD(expr, length [, pad_string])\nTRIM([LEADING | TRAILING | BOTH] trim_char FROM expr)\nREPLACE(char, search_string [, replacement_string])",
        examples: [
          { code: "SELECT LPAD(employee_id, 6, '0') AS id_formateado\nFROM   employees\nWHERE  employee_id = 100;", output: "ID_FORMATEADO\n-------------\n000100" }
        ] },
      { heading: "5. TRANSLATE, ASCII y CHR",
        explanation: "TRANSLATE(cadena, de, a) sustituye carácter a carácter según dos listas de correspondencia (a diferencia de REPLACE, que sustituye una subcadena completa por otra); si 'de' tiene más caracteres que 'a', los sobrantes se eliminan de la cadena. ASCII(carácter) devuelve el código numérico del primer carácter de una cadena; CHR(número) hace lo inverso, devuelve el carácter correspondiente a un código numérico.",
        syntax: "TRANSLATE(expr, from_string, to_string)\nASCII(char)\nCHR(number)",
        examples: [
          { code: "SELECT TRANSLATE('5-556-6100', '0123456789', '**********') AS oculto\nFROM   DUAL;", output: "OCULTO\n-----------\n*-***-****" },
          { code: "SELECT ASCII('A') AS codigo, CHR(65) AS caracter FROM DUAL;", output: "CODIGO  CARACTER\n------  --------\n    65  A" }
        ] },
      { heading: "6. Funciones numéricas",
        explanation: "ROUND(n, [decimales]) redondea (un valor negativo de decimales redondea a la izquierda del punto decimal). TRUNC(n, [decimales]) trunca sin redondear. MOD(n, m) devuelve el resto de la división entera. CEIL(n) redondea hacia el entero superior más próximo; FLOOR(n) hacia el entero inferior. ABS(n) devuelve el valor absoluto. POWER(n, exponente) eleva n a ese exponente.",
        examples: [
          { code: "SELECT ROUND(1547.678, 2) AS r, TRUNC(1547.678, 2) AS t,\n       CEIL(1547.2) AS c, FLOOR(1547.8) AS f,\n       ABS(-42) AS absoluto, POWER(2, 10) AS potencia, MOD(17, 5) AS resto\nFROM   DUAL;",
            output: "R          T     C     F  ABSOLUTO  POTENCIA  RESTO\n-------  ----  ----  ----  --------  --------  -----\n1547.68  1547.67  1548  1547        42      1024      2" }
        ] },
      { heading: "7. GREATEST y LEAST",
        explanation: "GREATEST(expr1, expr2, ...) devuelve el mayor valor de la lista de expresiones; LEAST(expr1, expr2, ...) devuelve el menor. Funcionan con números, texto (orden alfabético) y fechas, no solo con números; a diferencia de MAX/MIN (funciones de grupo), comparan una lista de expresiones dentro de la misma fila, no entre filas distintas.",
        examples: [
          { code: "SELECT GREATEST(10, 25, 3) AS mayor, LEAST(10, 25, 3) AS menor\nFROM   DUAL;", output: "MAYOR  MENOR\n-----  -----\n   25      3" }
        ] }
    ],
    oracleNotes: [
      "SUBSTR indexa desde la posición 1, no desde 0: un clásico error de examen. Un inicio 0 se trata como 1.",
      "ROUND redondea y TRUNC corta sin redondear: ROUND(1547.678,2)=1547.68 pero TRUNC(1547.678,2)=1547.67.",
      "TRANSLATE sustituye carácter a carácter (y puede eliminar caracteres si 'a' es más corta que 'de'); REPLACE sustituye una subcadena completa por otra, no carácter a carácter.",
      "GREATEST/LEAST comparan expresiones de la MISMA fila; no confundir con MAX/MIN, que son funciones de grupo y comparan valores ENTRE filas distintas.",
      "Si los argumentos de GREATEST/LEAST tienen tipos distintos, Oracle intenta una conversión implícita; si no es posible, lanza un error de tipo de dato."
    ]
  },
  summary: [
    "Funciones de una fila = un resultado por fila; se anidan evaluándose de dentro hacia fuera.",
    "Texto: UPPER/LOWER/INITCAP, LENGTH, SUBSTR, INSTR, LPAD/RPAD, TRIM, REPLACE, TRANSLATE, ASCII, CHR.",
    "Numéricas: ROUND, TRUNC, MOD, CEIL, FLOOR, ABS, POWER.",
    "GREATEST/LEAST comparan expresiones de una misma fila; no confundir con MAX/MIN (funciones de grupo)."
  ],
  comparisonTable: {
    title: "REPLACE vs TRANSLATE",
    headers: ["Función", "Unidad de sustitución", "¿Puede eliminar caracteres?", "Ejemplo"],
    rows: [
      ["REPLACE(cad, busca, reemplazo)", "Subcadena completa", "Sí, si reemplazo es ''", "REPLACE('2024-01-01','-','/')"],
      ["TRANSLATE(cad, de, a)", "Carácter a carácter", "Sí, si 'a' es más corta que 'de'", "TRANSLATE('ABC','ABC','123')"]
    ]
  },
  mindMap: [
    { topic: "Módulo 4 — Funciones de carácter y numéricas", children: [
      "Mayúsculas → UPPER, LOWER, INITCAP",
      "Extraer/medir → LENGTH, SUBSTR (desde 1), INSTR",
      "Rellenar/limpiar → LPAD/RPAD, TRIM, REPLACE, TRANSLATE",
      "Códigos → ASCII, CHR",
      "Numéricas → ROUND, TRUNC, MOD, CEIL, FLOOR, ABS, POWER",
      "Comparar en fila → GREATEST/LEAST (no confundir con MAX/MIN de grupo)"
    ] }
  ],
  sourceRefs: [
    "Oracle SQL Language Reference 19c — \"Character Functions Returning Character Values\"",
    "Oracle SQL Language Reference 19c — \"NUMBER Functions\""
  ],
  realCases: {
    business: "Un sistema de facturación usa LPAD(numero_factura, 8, '0') para generar identificadores homogéneos ('00000123'), y TRANSLATE para enmascarar dígitos de tarjetas de pago en los registros de auditoría.",
    dataEngineering: "Un ingeniero de datos normaliza nombres de clientes con INITCAP y TRIM antes de cargarlos en un modelo dimensional, evitando que 'ANA GARCÍA', 'ana garcía ' y 'Ana Garcia' se traten como tres clientes distintos.",
    etl: "Un job de ETL usa REPLACE para homogeneizar separadores de fecha ('2024/01/01' → '2024-01-01') antes de convertir el texto a DATE con TO_DATE, evitando errores de formato en la carga.",
    reporting: "Un informe que compara el rendimiento de dos vendedores usa GREATEST(ventas_enero, ventas_febrero) fila a fila para destacar 'el mejor mes' de cada vendedor, distinto de un MAX que compararía entre todos los vendedores."
  },
  mistakes: [
    { mistake: "Confundir SUBSTR posición 0 con posición 1.", why: "En Oracle el primer carácter de una cadena está en la posición 1, no 0; usar 0 como inicio se trata igual que 1. El examen presenta SUBSTR con inicio 0 esperando que sepas que no se comporta como en lenguajes de programación con índices base 0." },
    { mistake: "Confundir REPLACE con TRANSLATE.", why: "REPLACE sustituye una subcadena completa por otra; TRANSLATE sustituye carácter a carácter según dos listas de correspondencia. El examen presenta un TRANSLATE con listas de distinta longitud para comprobar si sabes que los caracteres sobrantes de 'de' se eliminan de la cadena." },
    { mistake: "Confundir GREATEST/LEAST con MAX/MIN.", why: "GREATEST y LEAST comparan varias expresiones dentro de la MISMA fila; MAX y MIN son funciones de grupo que comparan un valor a través de MÚLTIPLES filas. El examen mezcla ambas parejas de funciones en preguntas de clasificación." },
    { mistake: "Olvidar que ROUND con decimales negativos redondea a la izquierda del punto decimal.", why: "ROUND(1547, -2) da 1500, no un error ni 1547.00; el examen presenta números enteros con un segundo argumento negativo para comprobar si conoces este comportamiento menos intuitivo." }
  ],
  exercises: [
    { title: "Iniciales en mayúsculas", difficulty: "básico", prompt: "Muestra las 3 primeras letras del apellido en mayúsculas.", hint: "UPPER(SUBSTR(col,1,3))", solution: "SELECT UPPER(SUBSTR(last_name,1,3)) FROM employees;" },
    { title: "Redondeo y truncado", difficulty: "básico", prompt: "Muestra 1547.678 redondeado y truncado a 2 decimales en la misma consulta.", hint: "ROUND(n,2), TRUNC(n,2)", solution: "SELECT ROUND(1547.678,2) AS redondeado, TRUNC(1547.678,2) AS truncado FROM DUAL;" },
    { title: "Formatear un identificador", difficulty: "intermedio", prompt: "Muestra employee_id como texto de 6 dígitos rellenando con ceros por la izquierda.", hint: "LPAD(col, 6, '0')", solution: "SELECT LPAD(employee_id, 6, '0') AS id_formateado FROM employees;" },
    { title: "Enmascarar texto con TRANSLATE", difficulty: "intermedio", prompt: "Enmascara todos los dígitos de la cadena '5-556-6100' con asteriscos usando TRANSLATE.", hint: "TRANSLATE(cadena, '0123456789', '**********')", solution: "SELECT TRANSLATE('5-556-6100', '0123456789', '**********') AS oculto FROM DUAL;" },
    { title: "El mejor mes por fila", difficulty: "avanzado", prompt: "Dadas dos columnas ventas_enero y ventas_febrero, muestra el mayor valor de cada fila usando GREATEST, y explica por qué no serviría MAX aquí.", hint: "GREATEST compara expresiones de una misma fila.", solution: "SELECT GREATEST(ventas_enero, ventas_febrero) AS mejor_mes FROM ventas; -- MAX es una función de grupo: compararía entre filas distintas (todos los vendedores), no las dos columnas de una misma fila." },
    { title: "Diferencia entre REPLACE y TRANSLATE", difficulty: "avanzado", prompt: "Explica y demuestra con un ejemplo la diferencia entre REPLACE('2024-01-01','-','/') y TRANSLATE('2024-01-01','-','/').", hint: "Uno sustituye subcadenas, el otro caracteres.", solution: "REPLACE('2024-01-01','-','/') sustituye la subcadena '-' completa por '/' en cada aparición: da '2024/01/01'. TRANSLATE('2024-01-01','-','/') sustituye carácter por carácter según la correspondencia (- por /): en este caso concreto el resultado es el mismo '2024/01/01', pero TRANSLATE fallaría o daría un resultado distinto si 'de' tuviera varios caracteres distintos a sustituir por otros distintos, algo que REPLACE no puede hacer en una sola llamada." }
  ],
  solved: [
    { title: "Construir un código de cliente con formato fijo",
      problem: "Necesitas mostrar employee_id como un código de 5 dígitos con ceros a la izquierda, por ejemplo 100 → '00100'.",
      steps: [
        "Identifica que LPAD rellena por la izquierda hasta una longitud total.",
        "Decide la longitud total deseada (5) y el carácter de relleno ('0').",
        "Escribe LPAD(employee_id, 5, '0'); recuerda que employee_id es NUMBER, Oracle lo convierte implícitamente a texto.",
        "Verifica con un employee_id de 3 dígitos que el resultado tiene exactamente 5 caracteres."
      ],
      query: "SELECT LPAD(employee_id, 5, '0') AS codigo\nFROM   employees\nWHERE  employee_id = 100;",
      result: "CODIGO\n------\n00100" },
    { title: "Elegir la función correcta para enmascarar un teléfono",
      problem: "Quieres ocultar todos los dígitos de un número de teléfono manteniendo los guiones, por ejemplo '555-0100' → '***-****'.",
      steps: [
        "Descartas REPLACE porque sustituiría solo una subcadena exacta, no 'cualquier dígito'.",
        "Eliges TRANSLATE, que sustituye carácter a carácter según dos listas de correspondencia.",
        "Construyes la lista 'de' con los 10 dígitos posibles (0123456789) y la lista 'a' con 10 asteriscos.",
        "Verificas que los guiones, al no estar en la lista 'de', quedan intactos."
      ],
      query: "SELECT TRANSLATE('555-0100', '0123456789', '**********') AS oculto\nFROM   DUAL;",
      result: "OCULTO\n--------\n***-****" }
  ],
  flashcards: [
    { front: "¿Desde qué posición indexa SUBSTR en Oracle?", back: "Desde la posición 1, no desde 0." },
    { front: "¿Qué hace INSTR si no encuentra la subcadena buscada?", back: "Devuelve 0." },
    { front: "¿Qué diferencia hay entre REPLACE y TRANSLATE?", back: "REPLACE sustituye subcadenas completas; TRANSLATE sustituye carácter a carácter." },
    { front: "¿Qué hace CHR(65)?", back: "Devuelve el carácter correspondiente al código 65: 'A'." },
    { front: "¿Qué hace ROUND(1547, -2)?", back: "1500: con decimales negativos redondea a la izquierda del punto decimal." },
    { front: "¿Qué diferencia hay entre CEIL y FLOOR?", back: "CEIL redondea hacia el entero superior; FLOOR hacia el entero inferior." },
    { front: "¿Qué devuelve GREATEST(10, 25, 3)?", back: "25: el mayor valor de la lista de expresiones dentro de la misma fila." },
    { front: "¿En qué se diferencian GREATEST/LEAST de MAX/MIN?", back: "GREATEST/LEAST comparan expresiones de una misma fila; MAX/MIN son funciones de grupo que comparan entre filas." }
  ],
  examples: [
    { title: "Texto", code: "SELECT INITCAP(first_name), SUBSTR(last_name,1,3), INSTR(last_name,'a'), LENGTH(last_name)\nFROM employees;" },
    { title: "Numéricas", code: "SELECT ROUND(1547.678, 2), TRUNC(1547.678, 2), MOD(17, 5)\nFROM DUAL;\n-- 1547.68  1547.67  2" },
    { title: "TRANSLATE y CHR", code: "SELECT TRANSLATE('ABC','ABC','123') AS t, CHR(65) AS c\nFROM DUAL;" }
  ],
  quiz: [
    { q: "¿Cuál es la posición del primer carácter en SUBSTR de Oracle?", options: ["0", "1", "-1", "Depende del NLS"], a: 1,
      why: [
        "0 se trata igual que 1 en Oracle, pero no es la posición 'natural' de inicio.",
        "Correcta: Oracle indexa cadenas desde la posición 1.",
        "Un inicio negativo cuenta desde el final, pero no es 'la posición del primer carácter'.",
        "La indexación de SUBSTR no depende de los parámetros NLS."
      ] },
    { q: "¿Qué diferencia hay entre ROUND y TRUNC en una función numérica?", options: [
        "Son sinónimos exactos", "ROUND redondea, TRUNC corta sin redondear",
        "TRUNC solo funciona con fechas", "ROUND solo funciona con enteros"
      ], a: 1,
      why: [
        "No son sinónimos: dan resultados distintos para el mismo número con decimales.",
        "Correcta: ROUND(1547.678,2)=1547.68; TRUNC(1547.678,2)=1547.67.",
        "TRUNC funciona con números y también con fechas, no exclusivamente con fechas.",
        "ROUND funciona con cualquier NUMBER, no solo enteros."
      ] },
    { q: "¿Qué devuelve TRANSLATE('ABC', 'ABC', '12') (nota: 'a' tiene menos caracteres que 'de')?", options: [
        "Error de tipos", "'12C' sin modificar la C", "'12' — la C se elimina porque no tiene correspondencia en la lista más corta",
        "'ABC' sin cambios"
      ], a: 2,
      why: [
        "No es un error: Oracle permite listas de distinta longitud.",
        "La C sí se ve afectada: al no tener correspondencia en 'a' (más corta), se elimina.",
        "Correcta: cuando 'de' es más larga que 'a', los caracteres sobrantes se eliminan de la cadena resultante.",
        "Sí hay cambios: A→1 y B→2 se aplican."
      ] },
    { q: "¿Qué devuelve GREATEST('Ana', 'Zoe', 'Beto')?", options: ["'Ana'", "'Beto'", "'Zoe'", "Error, GREATEST no acepta texto"], a: 2,
      why: [
        "'Ana' es la primera alfabéticamente, no la mayor.",
        "'Beto' está en medio alfabéticamente.",
        "Correcta: GREATEST también funciona con texto, comparando por orden alfabético; 'Zoe' es la última.",
        "GREATEST sí acepta VARCHAR2, no solo números."
      ] },
    { q: "¿Cuál es la diferencia principal entre GREATEST/LEAST y MAX/MIN?", options: [
        "Ninguna, son intercambiables", "GREATEST/LEAST comparan expresiones de la misma fila; MAX/MIN comparan valores entre filas distintas",
        "MAX/MIN solo funcionan con fechas", "GREATEST/LEAST son funciones de grupo"
      ], a: 1,
      why: [
        "No son intercambiables: operan en dimensiones distintas (misma fila vs entre filas).",
        "Correcta: es la distinción clave entre estas dos parejas de funciones.",
        "MAX/MIN funcionan con números, texto y fechas, no solo fechas.",
        "GREATEST/LEAST son funciones de una sola fila, no de grupo."
      ] },
    { q: "¿Qué devuelve LPAD('7', 3, '0')?", options: ["'7'", "'700'", "'007'", "Error de tipos"], a: 2,
      why: [
        "'7' no tiene la longitud total solicitada (3).",
        "RPAD (no LPAD) rellenaría por la derecha, dando '700'.",
        "Correcta: LPAD rellena por la IZQUIERDA hasta la longitud total, dando '007'.",
        "No hay error: LPAD acepta texto directamente, y un número se convertiría implícitamente."
      ] },
    { q: "¿Qué hace CEIL(4.1) y FLOOR(4.9) respectivamente?", options: ["4 y 4", "5 y 4", "4 y 5", "5 y 5"], a: 1,
      why: [
        "CEIL(4.1) no da 4: redondea hacia arriba.",
        "Correcta: CEIL redondea hacia el entero superior (5), FLOOR hacia el entero inferior (4).",
        "FLOOR(4.9) no da 5: redondea hacia abajo, no hacia el más cercano.",
        "FLOOR(4.9) no es 5: sería incoherente con la definición de FLOOR."
      ] },
    { q: "¿Qué devuelve INSTR('Oracle SQL', 'SQL')?", options: ["3", "8", "0", "'SQL'"], a: 1,
      why: [
        "3 no corresponde a la posición real de 'SQL' en la cadena.",
        "Correcta: 'SQL' empieza en la posición 8 de 'Oracle SQL' (O-r-a-c-l-e-espacio-S...).",
        "0 se devolvería solo si la subcadena no se encontrara.",
        "INSTR devuelve un número (la posición), no el texto encontrado."
      ] },
    { q: "¿Qué hace ASCII('Hola')?", options: [
        "Devuelve el código de cada letra de la palabra", "Devuelve el código numérico solo del primer carácter, 'H'",
        "Da error porque ASCII solo acepta un carácter", "Devuelve la longitud de la palabra"
      ], a: 1,
      why: [
        "ASCII no procesa la palabra completa, solo el primer carácter.",
        "Correcta: ASCII devuelve el código numérico del primer carácter de la cadena que se le pase.",
        "No da error: acepta cualquier cadena, simplemente usa solo su primer carácter.",
        "Esa sería la función LENGTH, no ASCII."
      ] },
    { q: "¿Qué modelo describe mejor MOD(17, 5)?", options: ["17 dividido entre 5, parte entera", "El resto de dividir 17 entre 5", "17 elevado a 5", "El máximo común divisor de 17 y 5"], a: 1,
      why: [
        "Esa sería una división entera, no MOD.",
        "Correcta: MOD devuelve el resto de la división entera, en este caso 2.",
        "Elevar a una potencia es POWER, no MOD.",
        "MOD no calcula el máximo común divisor."
      ] }
  ],
  challenges: [
    { level: 1, prompt: "Clasifica: LOWER, AVG, TO_CHAR, COUNT, MOD. ¿Cuáles son de una fila y cuáles de grupo?", solution: "De una fila: LOWER, TO_CHAR, MOD. De grupo: AVG, COUNT." },
    { level: 2, prompt: "Muestra el nombre completo en formato 'APELLIDO, Nombre' (apellido en mayúsculas, nombre con inicial mayúscula).", solution: "SELECT UPPER(last_name) || ', ' || INITCAP(first_name) AS nombre_formateado FROM employees;" }
  ]
},

// =====================================================================
// NIVEL 5
// =====================================================================
{
  id: 5, code: "M5", category: "Funciones",
  title: "Funciones de fecha y hora",
  intro: "Cómo almacena y calcula Oracle fechas y momentos en el tiempo: aritmética con DATE, TIMESTAMP con precisión de fracciones de segundo, e intervalos como valores de primera clase.",
  theory: {
    concepts: [
      { heading: "1. El tipo DATE y su formato interno",
        explanation: "DATE almacena siempre fecha Y hora, hasta el segundo, aunque el formato de visualización por defecto (dependiente de NLS_DATE_FORMAT) a menudo solo muestre el día. Internamente Oracle guarda siglo, año, mes, día, hora, minuto y segundo en un formato binario propio, no como texto.",
        examples: [
          { code: "SELECT hire_date FROM employees WHERE employee_id = 100;", output: "HIRE_DATE\n---------\n17-JUN-03  -- por defecto no se ve la hora, pero existe internamente" }
        ] },
      { heading: "2. Aritmética con fechas",
        explanation: "A una DATE se le pueden sumar o restar números, interpretados como días: SYSDATE + 7 es 'dentro de una semana'. Restar dos DATE da un número (de días, con parte decimal si incluye horas); sumar dos DATE no está permitido y da error, porque conceptualmente no tiene sentido sumar dos instantes en el tiempo.",
        examples: [
          { code: "SELECT hire_date, hire_date + 7 AS revision_semana,\n       SYSDATE - hire_date AS dias_desde_contratacion\nFROM   employees\nWHERE  employee_id = 100;" }
        ] },
      { heading: "3. Funciones de fecha del sistema y de cálculo",
        explanation: "SYSDATE devuelve la fecha y hora actuales del servidor (sin zona horaria); CURRENT_DATE devuelve la fecha actual en la zona horaria de la SESIÓN, que puede diferir de SYSDATE si el cliente está en otra zona. MONTHS_BETWEEN(f1, f2) devuelve meses (con parte decimal) entre dos fechas; ADD_MONTHS(fecha, n) suma n meses; NEXT_DAY(fecha, 'FRIDAY') devuelve la fecha del próximo día de la semana indicado; LAST_DAY(fecha) devuelve el último día del mes de esa fecha.",
        examples: [
          { code: "SELECT hire_date,\n       MONTHS_BETWEEN(SYSDATE, hire_date) AS meses_antiguedad,\n       ADD_MONTHS(hire_date, 6) AS revision,\n       NEXT_DAY(hire_date, 'FRIDAY') AS prox_viernes,\n       LAST_DAY(hire_date) AS fin_de_mes\nFROM   employees\nWHERE  employee_id = 100;" }
        ] },
      { heading: "4. ROUND, TRUNC y EXTRACT sobre fechas",
        explanation: "ROUND y TRUNC también aceptan fechas, con un modelo de formato ('MONTH', 'YEAR', 'DD'...) que indica a qué unidad redondear o truncar; TRUNC(fecha) sin modelo elimina la parte de hora, dejando la medianoche de ese día, algo muy útil para comparar solo el día ignorando la hora. EXTRACT(campo FROM fecha) extrae un componente aislado (YEAR, MONTH, DAY, HOUR, MINUTE, SECOND) como número.",
        syntax: "TRUNC(fecha [, 'modelo_formato'])\nEXTRACT({YEAR | MONTH | DAY | HOUR | MINUTE | SECOND} FROM fecha)",
        examples: [
          { code: "SELECT EXTRACT(YEAR FROM hire_date) AS anio,\n       TRUNC(hire_date) AS solo_dia\nFROM   employees\nWHERE  employee_id = 100;" }
        ] },
      { heading: "5. TIMESTAMP y zonas horarias",
        explanation: "TIMESTAMP[(n)] extiende DATE con fracciones de segundo (n dígitos, hasta 9). TIMESTAMP WITH TIME ZONE añade además el desplazamiento de zona horaria (por ejemplo +02:00) como parte del valor almacenado. TIMESTAMP WITH LOCAL TIME ZONE almacena el valor normalizado a la zona horaria de la base de datos, pero lo muestra convertido a la zona horaria de la SESIÓN de cada usuario que lo consulta — el mismo dato se ve distinto según quién lo lea. SESSIONTIMEZONE devuelve la zona horaria de la sesión actual; TZ_OFFSET(zona) devuelve el desplazamiento UTC de una zona horaria concreta.",
        syntax: "SYSTIMESTAMP\nCAST(fecha AS TIMESTAMP)\nSESSIONTIMEZONE\nTZ_OFFSET('Europe/Madrid')",
        examples: [
          { code: "SELECT SYSTIMESTAMP, SESSIONTIMEZONE, TZ_OFFSET('Europe/Madrid') AS offset_madrid\nFROM   DUAL;" }
        ] },
      { heading: "6. Tipos INTERVAL",
        explanation: "Oracle trata la 'duración' como un valor de primera clase, no solo como una resta de fechas. INTERVAL YEAR TO MONTH representa una duración en años y meses; INTERVAL DAY TO SECOND representa una duración en días, horas, minutos y segundos (con fracciones). Se pueden sumar o restar directamente a un DATE o TIMESTAMP, y son el resultado natural de restar dos TIMESTAMP.",
        syntax: "INTERVAL 'n' YEAR [TO MONTH]\nINTERVAL 'n' DAY [TO SECOND]",
        examples: [
          { code: "SELECT hire_date + INTERVAL '18' MONTH AS revision_18m,\n       SYSTIMESTAMP - CAST(hire_date AS TIMESTAMP) AS antiguedad_exacta\nFROM   employees\nWHERE  employee_id = 100;" }
        ] }
    ],
    oracleNotes: [
      "Restar dos DATE da un número (días); sumar dos DATE está prohibido y da error — pero sí se puede sumar un número (días) o un INTERVAL a una DATE.",
      "TRUNC(fecha) sin modelo de formato elimina la hora, dejando la medianoche; es la forma correcta de comparar 'solo el día' ignorando la hora almacenada.",
      "TIMESTAMP WITH LOCAL TIME ZONE muestra un valor distinto según la zona horaria de sesión de quien consulta, aunque el dato almacenado internamente sea el mismo para todos.",
      "Restar dos TIMESTAMP no da un número de días como con DATE: da directamente un INTERVAL DAY TO SECOND.",
      "CURRENT_DATE puede diferir de SYSDATE si la sesión del cliente está en una zona horaria distinta a la del servidor de base de datos."
    ]
  },
  summary: [
    "DATE siempre incluye hora hasta el segundo; sumar/restar un número se interpreta en días.",
    "SYSDATE, MONTHS_BETWEEN, ADD_MONTHS, NEXT_DAY, LAST_DAY son las funciones de fecha más usadas.",
    "TRUNC(fecha) sin modelo elimina la hora; EXTRACT saca un componente aislado como número.",
    "TIMESTAMP añade fracciones de segundo; WITH TIME ZONE / WITH LOCAL TIME ZONE añaden gestión de zona horaria.",
    "INTERVAL YEAR TO MONTH y DAY TO SECOND representan duraciones como valores de primera clase, sumables a fechas."
  ],
  comparisonTable: {
    title: "DATE vs TIMESTAMP vs variantes con zona horaria",
    headers: ["Tipo", "Precisión", "Zona horaria", "Caso de uso típico"],
    rows: [
      ["DATE", "Hasta el segundo", "No", "Fechas de negocio (contratación, pedido...)"],
      ["TIMESTAMP(n)", "Hasta 9 decimales de segundo", "No", "Marcas de tiempo de alta precisión (logs, eventos)"],
      ["TIMESTAMP WITH TIME ZONE", "Hasta 9 decimales de segundo", "Sí, almacenada con el valor", "Eventos que cruzan zonas horarias distintas"],
      ["TIMESTAMP WITH LOCAL TIME ZONE", "Hasta 9 decimales de segundo", "Sí, mostrada según sesión del lector", "Aplicaciones multi-zona con un dato único de verdad"]
    ]
  },
  mindMap: [
    { topic: "Módulo 5 — Fecha y hora", children: [
      "DATE → siempre con hora; +/- número = días; restar dos DATE = número de días",
      "Cálculo → SYSDATE, MONTHS_BETWEEN, ADD_MONTHS, NEXT_DAY, LAST_DAY",
      "Redondeo/extracción → ROUND/TRUNC con modelo, EXTRACT(campo FROM fecha)",
      "TIMESTAMP → fracciones de segundo; WITH TIME ZONE / WITH LOCAL TIME ZONE",
      "INTERVAL → YEAR TO MONTH, DAY TO SECOND; se suman directamente a fechas"
    ] }
  ],
  sourceRefs: [
    "Oracle SQL Language Reference 19c — \"Datetime Functions\"",
    "Oracle SQL Language Reference 19c — \"Datetime Data Types and Time Zone Support\""
  ],
  realCases: {
    business: "Un sistema de RRHH calcula la antigüedad exacta de cada empleado con MONTHS_BETWEEN(SYSDATE, hire_date) para determinar automáticamente quién tiene derecho a un plus de antigüedad este mes.",
    dataEngineering: "Un ingeniero de datos que consolida eventos de sistemas ubicados en distintos países usa TIMESTAMP WITH TIME ZONE en la capa de ingesta, para no perder la zona horaria original de cada evento antes de normalizarlo a UTC.",
    etl: "Un proceso de carga incremental filtra 'todo lo modificado desde la última ejecución' comparando una columna TIMESTAMP con SYSTIMESTAMP - INTERVAL '1' DAY, en vez de restar fechas manualmente.",
    reporting: "Un informe de vencimientos usa TRUNC(SYSDATE) para comparar solo la fecha (sin la hora) contra la fecha límite de cada contrato, evitando que un contrato 'vencido a las 00:00:01' se cuente todavía como vigente por unos segundos."
  },
  mistakes: [
    { mistake: "Intentar sumar dos columnas DATE.", why: "Oracle lo prohíbe explícitamente porque sumar dos instantes en el tiempo no tiene sentido conceptual; el examen presenta esta operación como código 'plausible' para comprobar si conoces la restricción." },
    { mistake: "Olvidar que DATE siempre incluye hora, aunque no se muestre.", why: "Dos fechas que 'parecen iguales' en el listado pueden ser distintas si difieren en la hora almacenada; comparar con = sin usar TRUNC() puede dar FALSE de forma sorprendente. El examen construye preguntas donde el formato de visualización oculta la hora real." },
    { mistake: "Confundir SYSDATE con CURRENT_DATE.", why: "SYSDATE usa la zona horaria del SERVIDOR; CURRENT_DATE usa la zona horaria de la SESIÓN del cliente. En un entorno donde ambas coinciden nunca se nota la diferencia, pero el examen puede preguntar específicamente por este matiz." },
    { mistake: "Pensar que restar dos TIMESTAMP da un número, igual que restar dos DATE.", why: "Restar dos DATE da un número de días; restar dos TIMESTAMP da directamente un valor INTERVAL DAY TO SECOND, un tipo de dato distinto con sus propios componentes (días, horas, minutos, segundos)." }
  ],
  exercises: [
    { title: "Antigüedad en meses", difficulty: "básico", prompt: "Calcula cuántos meses lleva contratado cada empleado hasta hoy, redondeado a 0 decimales.", hint: "ROUND(MONTHS_BETWEEN(SYSDATE, hire_date))", solution: "SELECT last_name, ROUND(MONTHS_BETWEEN(SYSDATE, hire_date)) AS meses FROM employees;" },
    { title: "Próxima revisión salarial", difficulty: "básico", prompt: "Muestra la fecha 6 meses después de la contratación de cada empleado.", hint: "ADD_MONTHS(fecha, 6)", solution: "SELECT last_name, ADD_MONTHS(hire_date, 6) AS revision FROM employees;" },
    { title: "Comparar solo el día", difficulty: "intermedio", prompt: "Obtén los empleados contratados exactamente hoy (sin que importe la hora almacenada), usando TRUNC.", hint: "TRUNC(hire_date) = TRUNC(SYSDATE)", solution: "SELECT last_name FROM employees WHERE TRUNC(hire_date) = TRUNC(SYSDATE);" },
    { title: "Extraer el año de contratación", difficulty: "intermedio", prompt: "Muestra el año de contratación de cada empleado como número, usando EXTRACT.", hint: "EXTRACT(YEAR FROM columna)", solution: "SELECT last_name, EXTRACT(YEAR FROM hire_date) AS anio FROM employees;" },
    { title: "Duración exacta con INTERVAL", difficulty: "avanzado", prompt: "Calcula la antigüedad exacta de un empleado como INTERVAL (días, horas...) en vez de como número de meses.", hint: "Resta dos TIMESTAMP.", solution: "SELECT last_name, SYSTIMESTAMP - CAST(hire_date AS TIMESTAMP) AS antiguedad_exacta FROM employees WHERE employee_id = 100;" },
    { title: "Zona horaria de sesión", difficulty: "avanzado", prompt: "Explica qué diferencia habría entre almacenar un evento con TIMESTAMP WITH TIME ZONE y con TIMESTAMP WITH LOCAL TIME ZONE si la aplicación tiene usuarios en Madrid y en Tokio.", hint: "Piensa en qué se almacena y qué se muestra.", solution: "Con TIMESTAMP WITH TIME ZONE, el desplazamiento de zona horaria original queda fijado en el propio valor: todos ven la misma hora local del evento tal como ocurrió. Con TIMESTAMP WITH LOCAL TIME ZONE, el valor se normaliza internamente y se muestra convertido a la zona horaria de la sesión de cada usuario: un usuario en Madrid y otro en Tokio verían horas distintas para el mismo instante." }
  ],
  solved: [
    { title: "Calcular quién cumple aniversario de contratación este mes",
      problem: "Necesitas identificar empleados cuyo mes de contratación coincide con el mes actual, sin importar el año.",
      steps: [
        "Extrae el mes de hire_date con EXTRACT(MONTH FROM hire_date).",
        "Extrae el mes actual con EXTRACT(MONTH FROM SYSDATE).",
        "Compara ambos valores en el WHERE.",
        "Verifica que el resultado no depende del año de contratación, solo del mes."
      ],
      query: "SELECT last_name, hire_date\nFROM   employees\nWHERE  EXTRACT(MONTH FROM hire_date) = EXTRACT(MONTH FROM SYSDATE);",
      result: "Devuelve todos los empleados cuyo aniversario de contratación cae en el mes actual, de cualquier año." },
    { title: "Diagnosticar por qué una comparación de fechas 'iguales' da FALSE",
      problem: "WHERE hire_date = TO_DATE('2003-06-17','YYYY-MM-DD') no devuelve la fila esperada, aunque el listado muestra esa misma fecha.",
      steps: [
        "Recuerda que DATE siempre incluye hora, aunque el formato de visualización no la muestre.",
        "Sospecha que hire_date tiene una hora distinta de 00:00:00 almacenada internamente.",
        "Reescribe la comparación truncando ambos lados: TRUNC(hire_date) = TO_DATE('2003-06-17','YYYY-MM-DD').",
        "Confirma que ahora sí devuelve la fila, ya que TRUNC elimina la hora de ambos lados."
      ],
      query: "SELECT last_name, hire_date\nFROM   employees\nWHERE  TRUNC(hire_date) = TO_DATE('2003-06-17', 'YYYY-MM-DD');",
      result: "Ahora la comparación ignora la hora almacenada y encuentra la fila correctamente." }
  ],
  flashcards: [
    { front: "¿Qué incluye siempre un valor DATE en Oracle?", back: "Fecha y hora, hasta el segundo, aunque no se muestre por defecto." },
    { front: "¿Qué da restar dos columnas DATE?", back: "Un número de días (con parte decimal si hay horas involucradas)." },
    { front: "¿Por qué no se pueden sumar dos DATE?", back: "Porque sumar dos instantes en el tiempo no tiene sentido conceptual; Oracle lo prohíbe con error." },
    { front: "¿Qué hace TRUNC(fecha) sin modelo de formato?", back: "Elimina la parte de hora, dejando la medianoche de ese día." },
    { front: "¿Qué devuelve EXTRACT(YEAR FROM fecha)?", back: "El año de esa fecha, como número." },
    { front: "¿Qué añade TIMESTAMP frente a DATE?", back: "Fracciones de segundo, con precisión configurable hasta 9 decimales." },
    { front: "¿Qué diferencia hay entre WITH TIME ZONE y WITH LOCAL TIME ZONE?", back: "WITH TIME ZONE guarda el desplazamiento original; WITH LOCAL TIME ZONE lo muestra según la sesión de quien consulta." },
    { front: "¿Qué da restar dos TIMESTAMP?", back: "Un valor INTERVAL DAY TO SECOND, no un simple número." }
  ],
  examples: [
    { title: "Fechas", code: "SELECT hire_date, MONTHS_BETWEEN(SYSDATE, hire_date) AS meses_antiguedad,\n       ADD_MONTHS(hire_date, 6) AS revision, LAST_DAY(hire_date)\nFROM employees;" },
    { title: "INTERVAL", code: "SELECT hire_date + INTERVAL '18' MONTH AS revision_18m\nFROM employees\nWHERE employee_id = 100;" }
  ],
  quiz: [
    { q: "¿Qué devuelve MONTHS_BETWEEN(SYSDATE, hire_date)?", options: [
        "El número de días entre las dos fechas", "El número de meses (puede ser decimal) entre las dos fechas",
        "La fecha resultante de sumar meses", "Un texto con el mes"
      ], a: 1,
      why: [
        "Eso lo daría restar directamente las dos DATE, no MONTHS_BETWEEN.",
        "Correcta: MONTHS_BETWEEN devuelve un número, incluyendo fracción de mes si los días no coinciden exactamente.",
        "Esa sería la función de ADD_MONTHS, no MONTHS_BETWEEN.",
        "Devuelve un NUMBER, no texto."
      ] },
    { q: "¿Qué ocurre si intentas sumar dos columnas DATE?", options: ["Da la fecha más lejana en el futuro", "Da error, no está permitido", "Da un INTERVAL", "Da el promedio de ambas fechas"], a: 1,
      why: [
        "Oracle no elige ninguna fecha 'ganadora': directamente no permite la operación.",
        "Correcta: sumar dos DATE no tiene sentido conceptual y Oracle lo rechaza con un error.",
        "Un INTERVAL resultaría de restar dos TIMESTAMP, no de sumar dos DATE.",
        "No existe una operación de 'promedio' automática entre dos fechas con +."
      ] },
    { q: "¿Qué hace TRUNC(hire_date) sin especificar un modelo de formato?", options: [
        "Elimina el año", "Elimina la hora, dejando la medianoche de ese día",
        "Redondea al mes más cercano", "Da error porque TRUNC exige siempre un modelo con fechas"
      ], a: 1,
      why: [
        "TRUNC sin modelo no toca el año: sigue siendo el mismo día completo.",
        "Correcta: sin modelo, TRUNC trunca a la unidad más pequeña con sentido, la medianoche del día.",
        "Redondear al mes requeriría especificar 'MONTH' como modelo; sin modelo no ocurre.",
        "TRUNC no exige un modelo obligatorio sobre fechas: tiene un comportamiento por defecto."
      ] },
    { q: "¿Qué devuelve EXTRACT(YEAR FROM hire_date)?", options: ["Un DATE con solo el año", "Un número con el año", "Un texto con el año", "Un INTERVAL con el año"], a: 1,
      why: [
        "EXTRACT no devuelve un DATE: devuelve un componente aislado.",
        "Correcta: EXTRACT devuelve el componente solicitado (aquí, el año) como número.",
        "No devuelve texto: el resultado es numérico, no VARCHAR2.",
        "No devuelve un INTERVAL: eso resultaría de restar dos TIMESTAMP, no de EXTRACT."
      ] },
    { q: "¿Qué añade TIMESTAMP frente al tipo DATE?", options: [
        "Nada, son exactamente iguales", "Precisión de fracciones de segundo",
        "Solo el nombre del día de la semana", "Una zona horaria obligatoria"
      ], a: 1,
      why: [
        "Sí hay diferencia: la precisión de fracciones de segundo.",
        "Correcta: TIMESTAMP(n) añade hasta 9 decimales de segundo respecto a DATE.",
        "TIMESTAMP no añade el nombre del día como tal.",
        "La zona horaria es opcional: solo aparece en las variantes WITH TIME ZONE / WITH LOCAL TIME ZONE."
      ] },
    { q: "¿Qué diferencia hay entre TIMESTAMP WITH TIME ZONE y TIMESTAMP WITH LOCAL TIME ZONE?", options: [
        "Son sinónimos exactos", "WITH TIME ZONE guarda el desplazamiento original; WITH LOCAL TIME ZONE lo normaliza y muestra según la sesión del lector",
        "WITH LOCAL TIME ZONE no admite fracciones de segundo", "WITH TIME ZONE es exclusivo de PL/SQL"
      ], a: 1,
      why: [
        "No son sinónimos: su comportamiento de almacenamiento y visualización difiere.",
        "Correcta: es la distinción clave entre ambos tipos.",
        "Ambos admiten fracciones de segundo igual que TIMESTAMP normal.",
        "Ambos son tipos de columna SQL válidos, no exclusivos de PL/SQL."
      ] },
    { q: "¿Qué representa un valor INTERVAL DAY TO SECOND?", options: [
        "Una fecha concreta", "Una duración en días, horas, minutos y segundos",
        "Solo el número de días entre dos fechas", "Una zona horaria"
      ], a: 1,
      why: [
        "No es una fecha concreta: es una duración, no un instante en el tiempo.",
        "Correcta: representa una duración con esos componentes, con fracciones de segundo si se necesita.",
        "Restar dos DATE da solo un número de días; INTERVAL DAY TO SECOND es más rico, con horas/minutos/segundos.",
        "No tiene relación con zonas horarias: es puramente una duración."
      ] },
    { q: "¿Cuál es la forma correcta de sumar 18 meses a una fecha usando INTERVAL?", options: [
        "fecha + 18", "fecha + INTERVAL '18' MONTH", "fecha + TO_DATE(18)", "ADD_INTERVAL(fecha, 18)"
      ], a: 1,
      why: [
        "fecha + 18 sumaría 18 DÍAS, no meses (los números sueltos se interpretan como días).",
        "Correcta: INTERVAL '18' MONTH representa explícitamente una duración en meses, sumable directamente.",
        "TO_DATE(18) no es una forma válida de crear un intervalo de meses.",
        "ADD_INTERVAL no es una función de Oracle SQL."
      ] },
    { q: "¿Qué zona horaria usa SYSDATE?", options: ["La del cliente que ejecuta la consulta", "La del servidor de base de datos", "UTC siempre", "La configurada en NLS_TERRITORY del usuario"], a: 1,
      why: [
        "SYSDATE no depende de la sesión del cliente: eso sería más parecido a CURRENT_DATE.",
        "Correcta: SYSDATE devuelve la fecha/hora del SERVIDOR de base de datos, sin ajuste de zona horaria de sesión.",
        "No usa UTC de forma automática: usa la hora local configurada en el servidor.",
        "NLS_TERRITORY afecta a formatos de visualización, no a qué instante devuelve SYSDATE."
      ] },
    { q: "¿Qué devuelve LAST_DAY(hire_date)?", options: [
        "El primer día del mes de hire_date", "El último día del mes de hire_date",
        "El último día del año de hire_date", "Un número con los días del mes"
      ], a: 1,
      why: [
        "Esa sería una combinación de TRUNC con modelo 'MONTH', no LAST_DAY.",
        "Correcta: LAST_DAY devuelve la fecha del último día del mes correspondiente.",
        "LAST_DAY trabaja a nivel de mes, no de año.",
        "Devuelve una FECHA (el último día), no un número de días del mes."
      ] }
  ],
  challenges: [
    { level: 1, prompt: "Clasifica a los empleados en 'Sin comisión', 'Comisión baja' (<0.2) o 'Comisión alta' (>=0.2) usando CASE, tratando el NULL como 'Sin comisión'.", solution: "SELECT last_name,\n  CASE WHEN commission_pct IS NULL THEN 'Sin comisión'\n       WHEN commission_pct < 0.2 THEN 'Comisión baja'\n       ELSE 'Comisión alta' END AS categoria\nFROM employees;" },
    { level: 2, prompt: "Muestra la fecha de contratación como 'día de MesEnTexto de año'.", solution: "SELECT TO_CHAR(hire_date, 'DD \"de\" Month \"de\" YYYY') AS fecha FROM employees;" }
  ]
},

// =====================================================================
// NIVEL 6
// =====================================================================
{
  id: 6, code: "M6", category: "Funciones",
  title: "Conversión de tipos y expresiones condicionales",
  intro: "Cómo pasar de texto a número, de número a fecha y viceversa de forma explícita, y cómo tomar decisiones dentro de una consulta con NVL, DECODE y CASE.",
  theory: {
    concepts: [
      { heading: "1. Conversión implícita vs explícita",
        explanation: "Oracle convierte automáticamente algunos tipos cuando el contexto lo permite (por ejemplo, comparar una columna NUMBER con el texto '100'): esto es conversión implícita. Depende de los parámetros NLS de la sesión, puede fallar de forma impredecible con datos reales, y su plan de ejecución puede ser menos eficiente si impide usar un índice. El examen (y las buenas prácticas) exige saber convertir de forma explícita con TO_CHAR, TO_NUMBER y TO_DATE." },
      { heading: "2. TO_CHAR: de fecha o número a texto",
        explanation: "TO_CHAR(fecha, 'modelo_fecha') convierte una fecha a texto con el formato indicado: TO_CHAR(SYSDATE,'DD/MM/YYYY'). TO_CHAR(numero, 'modelo_numero') convierte un número a texto con formato, por ejemplo con separadores de miles o símbolo de moneda: TO_CHAR(salary,'$999,999.00').",
        syntax: "TO_CHAR(fecha, 'modelo_fecha')\nTO_CHAR(numero, 'modelo_numero')",
        examples: [
          { code: "SELECT TO_CHAR(hire_date, 'DD \"de\" MONTH \"de\" YYYY') AS fecha_larga,\n       TO_CHAR(salary, '$999,999.00') AS salario_fmt\nFROM   employees\nWHERE  employee_id = 100;",
            output: "FECHA_LARGA                    SALARIO_FMT\n------------------------------  -----------\n17 de JUNE      de 2003          $24,000.00" }
        ] },
      { heading: "3. TO_DATE y TO_NUMBER: de texto a fecha o número",
        explanation: "TO_DATE(texto, 'modelo') convierte texto a fecha: TO_DATE('25/12/2024','DD/MM/YYYY'). TO_NUMBER(texto, ['modelo']) convierte texto a número, admitiendo un modelo de formato opcional para interpretar separadores decimales, de miles o símbolos de moneda presentes en el texto origen.",
        syntax: "TO_DATE(char, 'modelo_fecha')\nTO_NUMBER(char [, 'modelo_numero'])",
        examples: [
          { code: "SELECT TO_DATE('25/12/2024', 'DD/MM/YYYY') AS navidad,\n       TO_NUMBER('1.234,56', '9G999D99', 'NLS_NUMERIC_CHARACTERS='',.''') AS numero\nFROM   DUAL;" }
        ] },
      { heading: "4. NVL, NVL2, NULLIF y COALESCE",
        explanation: "NVL(expr, valor_si_null) sustituye NULL por un valor por defecto; ambos argumentos deben ser de tipos compatibles. NVL2(expr, valor_si_no_null, valor_si_null) evalúa expr y devuelve una de dos ramas según sea o no NULL. NULLIF(expr1, expr2) devuelve NULL si expr1 = expr2, y expr1 en caso contrario. COALESCE(expr1, expr2, ...) devuelve el primer valor no nulo de la lista (a diferencia de NVL, acepta más de dos argumentos).",
        syntax: "NVL(expr1, expr2)\nNVL2(expr1, expr2, expr3)\nNULLIF(expr1, expr2)\nCOALESCE(expr1, expr2 [, expr3 ...])",
        examples: [
          { code: "SELECT last_name, NVL(commission_pct, 0) AS comision\nFROM   employees\nWHERE  employee_id IN (100, 101, 103);" }
        ] },
      { heading: "5. DECODE y CASE",
        explanation: "DECODE(expr, valor1, resultado1, valor2, resultado2, ..., por_defecto) es el 'switch' clásico de Oracle, que solo compara igualdad exacta (y trata dos NULL como iguales, algo que = no hace). CASE WHEN condición THEN resultado ... ELSE resultado END es el equivalente estándar ANSI, más flexible que DECODE porque admite condiciones (>, <, BETWEEN, IS NULL...), no solo igualdades. CASE también tiene una forma 'simple' (CASE expr WHEN valor THEN ...), más parecida a DECODE.",
        syntax: "DECODE(expr, search1, result1 [, search2, result2 ...] [, default])\nCASE [expr] WHEN comparison_expr THEN return_expr [...] [ELSE else_expr] END",
        examples: [
          { code: "SELECT last_name,\n       DECODE(department_id, 10, 'Admin', 20, 'Marketing', 'Otro') AS depto_txt,\n       CASE WHEN salary > 10000 THEN 'Alto'\n            WHEN salary > 5000  THEN 'Medio'\n            ELSE 'Bajo' END AS categoria\nFROM   employees\nWHERE  employee_id IN (100, 101, 103);" }
        ] }
    ],
    oracleNotes: [
      "DECODE solo compara igualdad exacta (y considera NULL = NULL como cierto, a diferencia del operador =); para comparar rangos (>, <, BETWEEN) hace falta CASE.",
      "NVL sustituye NULL por un único valor por defecto; NVL2 tiene dos resultados posibles según sea o no NULL; COALESCE admite más de dos argumentos y devuelve el primero no nulo, siendo más general que NVL.",
      "La conversión implícita depende de los parámetros NLS de la sesión: el mismo código puede comportarse distinto en dos sesiones con configuración regional diferente. Por eso el examen y las buenas prácticas exigen conversión explícita.",
      "Los argumentos de NVL deben poder convertirse al mismo tipo de dato; NVL(comision, 'Sin comisión') fallaría si comision es NUMBER, porque Oracle no puede unificar NUMBER y VARCHAR2 en este contexto sin una conversión explícita previa."
    ]
  },
  summary: [
    "La conversión implícita depende de NLS y puede fallar; la explícita (TO_CHAR/TO_DATE/TO_NUMBER) es predecible.",
    "TO_CHAR convierte fecha o número a texto con un modelo de formato; TO_DATE y TO_NUMBER hacen el camino inverso.",
    "NVL sustituye NULL por un valor; NVL2 da dos resultados posibles; NULLIF devuelve NULL si dos expresiones son iguales; COALESCE generaliza NVL a más de dos argumentos.",
    "DECODE solo compara igualdad; CASE admite cualquier condición lógica, incluidas comparaciones de rango."
  ],
  comparisonTable: {
    title: "Funciones condicionales de un vistazo",
    headers: ["Función", "Nº de resultados posibles", "Tipo de comparación", "Equivalente ANSI"],
    rows: [
      ["NVL(a,b)", "2", "¿a es NULL?", "COALESCE(a,b)"],
      ["NVL2(a,b,c)", "2", "¿a es NULL?", "CASE WHEN a IS NULL THEN c ELSE b END"],
      ["NULLIF(a,b)", "2 (a o NULL)", "¿a = b?", "CASE WHEN a=b THEN NULL ELSE a END"],
      ["DECODE(a,v1,r1,...,def)", "N", "Igualdad exacta", "CASE simple"],
      ["CASE WHEN ... THEN ...", "N", "Cualquier condición", "— (ya es el estándar)"]
    ]
  },
  mindMap: [
    { topic: "Módulo 6 — Conversión y condicionales", children: [
      "Conversión → implícita (arriesgada, depende de NLS) vs explícita (TO_CHAR/TO_DATE/TO_NUMBER)",
      "TO_CHAR → fecha/número a texto con modelo de formato",
      "TO_DATE / TO_NUMBER → texto a fecha/número con modelo de formato",
      "NULL → NVL (1 valor), NVL2 (2 ramas), NULLIF (igual→NULL), COALESCE (N argumentos)",
      "Decisión → DECODE (solo igualdad) vs CASE (cualquier condición, estándar ANSI)"
    ] }
  ],
  sourceRefs: [
    "Oracle SQL Language Reference 19c — \"Conversion Functions\" y \"Format Models\"",
    "Oracle SQL Language Reference 19c — \"NVL\", \"DECODE\", \"CASE Expressions\""
  ],
  realCases: {
    business: "Un informe de comisiones usa NVL(commission_pct, 0) para que los empleados sin comisión asignada aparezcan con 0 en vez de con un hueco vacío que rompería una suma total.",
    dataEngineering: "Un ingeniero de datos evita la conversión implícita en los JOIN de un pipeline (comparar una clave NUMBER con una clave VARCHAR2 sin convertir) porque puede impedir el uso de índices y degradar el rendimiento en tablas grandes.",
    etl: "Un proceso ETL que recibe fechas en texto desde un sistema origen usa TO_DATE con el modelo de formato exacto del origen ('YYYYMMDD', por ejemplo) en vez de depender de la conversión implícita, que fallaría si el formato NLS de la sesión de carga cambia.",
    reporting: "Un dashboard que clasifica clientes en 'VIP', 'Regular' y 'Nuevo' según su histórico de compras usa CASE con condiciones de rango (WHEN total_compras > 10000 THEN 'VIP'...), algo que DECODE no podría expresar directamente."
  },
  mistakes: [
    { mistake: "Usar DECODE para comparar rangos (>, <).", why: "DECODE solo compara igualdad exacta; el examen presenta un DECODE con un segundo argumento que parece un límite numérico (esperando que compare '>') para comprobar si sabes que eso no es posible con DECODE y hace falta CASE." },
    { mistake: "Confiar en la conversión implícita en comparaciones de tipos distintos.", why: "El resultado depende de los parámetros NLS de la sesión, y puede fallar con ORA-01722 (invalid number) o similar si el texto no es convertible; el examen presenta código que 'funciona a veces' para comprobar si entiendes por qué no es fiable." },
    { mistake: "Confundir NVL con NVL2.", why: "NVL siempre evalúa el mismo tipo de resultado; NVL2 tiene DOS resultados posibles distintos según sea o no NULL. El examen presenta ambas funciones con argumentos similares para comprobar si distingues su número de 'ramas'." },
    { mistake: "Pensar que NULLIF compara desigualdad.", why: "NULLIF(a, b) devuelve NULL cuando a Y b SON IGUALES, y a en caso contrario; es fácil confundirlo con 'lo contrario de igual', pero hace justo lo opuesto a lo que su nombre podría sugerir a primera vista." }
  ],
  exercises: [
    { title: "Formatear salario", difficulty: "básico", prompt: "Muestra el salario formateado como moneda con dos decimales, p.ej. $6,000.00.", hint: "TO_CHAR(salary,'$999,999.00')", solution: "SELECT TO_CHAR(salary,'$999,999.00') AS salario FROM employees;" },
    { title: "Sustituir NULL", difficulty: "básico", prompt: "Muestra la comisión de cada empleado, mostrando 0 en vez de NULL.", hint: "NVL(columna, 0)", solution: "SELECT last_name, NVL(commission_pct, 0) AS comision FROM employees;" },
    { title: "Clasificar con CASE", difficulty: "intermedio", prompt: "Clasifica a los empleados en 'Alto' (salario > 10000), 'Medio' (> 5000) o 'Bajo', usando CASE.", hint: "CASE WHEN ... THEN ... ELSE ... END", solution: "SELECT last_name, CASE WHEN salary > 10000 THEN 'Alto' WHEN salary > 5000 THEN 'Medio' ELSE 'Bajo' END AS categoria FROM employees;" },
    { title: "Traducir códigos con DECODE", difficulty: "intermedio", prompt: "Traduce department_id 10 a 'Admin', 20 a 'Marketing' y cualquier otro a 'Otro', usando DECODE.", hint: "DECODE(col, v1, r1, v2, r2, default)", solution: "SELECT last_name, DECODE(department_id, 10, 'Admin', 20, 'Marketing', 'Otro') AS depto FROM employees;" },
    { title: "Por qué DECODE no sirve aquí", difficulty: "avanzado", prompt: "Explica por qué no se puede usar DECODE para clasificar salarios en 'Alto'/'Medio'/'Bajo' según rangos, y demuestra la alternativa correcta.", hint: "DECODE solo compara igualdad exacta.", solution: "DECODE compara valores exactos, no rangos como >10000 o >5000; no hay forma de expresar 'mayor que' dentro de su sintaxis. La alternativa correcta es CASE WHEN salary > 10000 THEN 'Alto' WHEN salary > 5000 THEN 'Medio' ELSE 'Bajo' END, que sí admite condiciones de comparación arbitrarias." },
    { title: "NVL2 con dos resultados distintos", difficulty: "avanzado", prompt: "Muestra 'Con comisión' o 'Sin comisión' según si commission_pct es o no NULL, usando NVL2 (no CASE).", hint: "NVL2(expr, valor_si_no_null, valor_si_null)", solution: "SELECT last_name, NVL2(commission_pct, 'Con comisión', 'Sin comisión') AS estado FROM employees;" }
  ],
  solved: [
    { title: "Elegir entre NVL, NVL2 y COALESCE",
      problem: "Necesitas mostrar el teléfono de contacto de un cliente, usando el móvil si existe, si no el fijo, y si tampoco existe el de la empresa.",
      steps: [
        "Descartas NVL porque solo admite una alternativa (2 argumentos en total).",
        "Descartas NVL2 porque da dos resultados FIJOS, no encadena varias columnas alternativas.",
        "Eliges COALESCE, que acepta más de dos argumentos y devuelve el primero no nulo de la lista.",
        "Ordenas los argumentos por prioridad: móvil, luego fijo, luego el de empresa."
      ],
      query: "SELECT COALESCE(telefono_movil, telefono_fijo, telefono_empresa) AS contacto\nFROM   clientes;",
      result: "Devuelve el primer teléfono no nulo según el orden de prioridad indicado." },
    { title: "Migrar un DECODE con rangos a CASE",
      problem: "Alguien intentó escribir DECODE(salary, salary > 5000, 'Alto', 'Bajo') esperando comparar un rango, y da un resultado incorrecto (no un error evidente).",
      steps: [
        "Reconoce que DECODE solo compara igualdad exacta: 'salary > 5000' se evalúa como una expresión booleana (1 o 0), no como una comparación de rango sobre salary.",
        "Decide migrar la lógica a CASE, que sí admite condiciones de comparación.",
        "Reescribe con WHEN salary > 5000 THEN 'Alto' ELSE 'Bajo'.",
        "Verifica el resultado contra un par de salarios conocidos por encima y por debajo de 5000."
      ],
      query: "SELECT last_name,\n       CASE WHEN salary > 5000 THEN 'Alto' ELSE 'Bajo' END AS categoria\nFROM   employees;",
      result: "Ahora clasifica correctamente según el rango real de salario." }
  ],
  flashcards: [
    { front: "¿Qué riesgo tiene la conversión implícita de tipos?", back: "Depende de los parámetros NLS de la sesión y puede fallar o comportarse distinto entre sesiones." },
    { front: "¿Qué hace TO_CHAR(fecha, 'modelo')?", back: "Convierte una fecha a texto con el formato indicado por el modelo." },
    { front: "¿Qué hace NVL(expr, valor)?", back: "Sustituye expr por valor si expr es NULL." },
    { front: "¿En qué se diferencia NVL2 de NVL?", back: "NVL2 da dos resultados distintos según sea o no NULL; NVL siempre da el mismo tipo de resultado sustituido." },
    { front: "¿Qué devuelve NULLIF(a, b) si a y b son iguales?", back: "NULL. Si son distintos, devuelve a." },
    { front: "¿Cuántos argumentos admite COALESCE?", back: "Más de dos; devuelve el primero no nulo de toda la lista." },
    { front: "¿Qué limita a DECODE frente a CASE?", back: "DECODE solo compara igualdad exacta; CASE admite cualquier condición, incluidos rangos." },
    { front: "¿Qué trata DECODE como iguales que el operador = no trata así?", back: "Dos valores NULL: DECODE los considera iguales entre sí." }
  ],
  examples: [
    { title: "Conversión", code: "SELECT TO_CHAR(hire_date, 'DD \"de\" MONTH \"de\" YYYY') AS fecha_larga,\n       TO_CHAR(salary, '$999,999.00') AS salario_formateado\nFROM employees;" },
    { title: "NVL, DECODE y CASE", code: "SELECT last_name,\n       NVL(commission_pct, 0) AS comision,\n       DECODE(department_id, 10,'Admin', 20,'Marketing', 'Otro') AS depto_txt,\n       CASE WHEN salary > 10000 THEN 'Alto'\n            WHEN salary > 5000 THEN 'Medio'\n            ELSE 'Bajo' END AS categoria\nFROM employees;" }
  ],
  quiz: [
    { q: "¿Qué función usarías para sustituir NULL por un valor por defecto?", options: ["NULLIF", "COALESCE o NVL", "DECODE", "TRUNC"], a: 1,
      why: [
        "NULLIF hace lo contrario: devuelve NULL cuando dos valores coinciden.",
        "Correcta: NVL y COALESCE están diseñadas específicamente para sustituir NULL.",
        "DECODE podría simularlo, pero no es su uso típico ni el más claro.",
        "TRUNC no tiene relación con sustituir valores NULL."
      ] },
    { q: "¿Qué limitación tiene DECODE frente a CASE?", options: [
        "DECODE es más lento siempre", "DECODE solo compara igualdad exacta, no admite rangos como > o <",
        "DECODE no existe en Oracle", "DECODE no puede usarse en SELECT"
      ], a: 1,
      why: [
        "No hay una regla general de que DECODE sea siempre más lento.",
        "Correcta: CASE admite condiciones lógicas completas; DECODE solo compara igualdad.",
        "DECODE sí existe en Oracle, es una función propia muy usada.",
        "DECODE se puede usar perfectamente en la lista del SELECT."
      ] },
    { q: "¿Qué devuelve NULLIF(10, 10)?", options: ["10", "NULL", "0", "Error"], a: 1,
      why: [
        "10 sería el resultado si los valores fueran distintos.",
        "Correcta: NULLIF devuelve NULL cuando ambos argumentos son iguales.",
        "0 no es un valor que NULLIF devuelva en ningún caso.",
        "No es un error: es un uso perfectamente válido de la función."
      ] },
    { q: "¿Cuántos resultados posibles distintos puede dar NVL2(a, b, c)?", options: ["1", "2 (b o c)", "3", "Depende del tipo de a"], a: 1,
      why: [
        "NVL2 no da un único resultado fijo: depende de si a es NULL o no.",
        "Correcta: devuelve b si a no es NULL, o c si a es NULL — dos ramas posibles.",
        "No hay una tercera rama en NVL2.",
        "El número de ramas (2) no depende del tipo de dato de a, siempre son las mismas dos opciones."
      ] },
    { q: "¿Qué problema tiene depender de la conversión implícita de tipos en código de producción?", options: [
        "Ninguno, Oracle siempre la resuelve igual", "El comportamiento puede depender de los parámetros NLS de la sesión y cambiar entre entornos",
        "Solo funciona con números, nunca con fechas", "Hace que la consulta sea siempre más rápida"
      ], a: 1,
      why: [
        "Sí hay riesgo real: no es un comportamiento absolutamente uniforme entre todas las sesiones.",
        "Correcta: el resultado depende de configuración regional (NLS), lo que la hace impredecible entre entornos distintos.",
        "También ocurre con fechas, no solo con números.",
        "La conversión implícita puede en realidad perjudicar el rendimiento, por ejemplo impidiendo el uso de un índice."
      ] },
    { q: "¿Qué hace TO_NUMBER('1.234,56', '9G999D99')?", options: [
        "Da error siempre", "Interpreta el texto como número usando el modelo de formato indicado (separador de miles y decimales)",
        "Convierte el texto a fecha", "Ignora el modelo de formato y usa el predeterminado"
      ], a: 1,
      why: [
        "No da error si el modelo de formato coincide con el patrón del texto.",
        "Correcta: el modelo indica qué carácter es separador de miles (G) y cuál de decimales (D), permitiendo interpretar el texto correctamente.",
        "TO_NUMBER convierte a NUMBER, no a fecha.",
        "El modelo de formato SÍ se aplica; no se ignora cuando se especifica explícitamente."
      ] },
    { q: "¿Qué comparación usa internamente DECODE que el operador = no hace?", options: [
        "Compara por posición de columna", "Trata dos valores NULL como iguales entre sí",
        "Compara solo números", "Ignora mayúsculas/minúsculas siempre"
      ], a: 1,
      why: [
        "DECODE no compara por posición, compara valores.",
        "Correcta: DECODE(NULL, NULL, 'coinciden', 'no coinciden') devuelve 'coinciden', algo que NULL = NULL nunca haría (da UNKNOWN).",
        "DECODE compara cualquier tipo de dato, no solo números.",
        "DECODE no ignora mayúsculas/minúsculas por defecto en comparaciones de texto."
      ] },
    { q: "¿Qué forma de CASE se parece más a DECODE?", options: ["CASE buscada (searched CASE)", "CASE simple (simple CASE)", "Ninguna, son completamente distintas", "CASE anidado"], a: 1,
      why: [
        "La CASE buscada usa condiciones WHEN libres (>,<...), más flexible, no la más parecida a DECODE.",
        "Correcta: la CASE simple (CASE expr WHEN valor THEN...) compara igualdad, igual que DECODE.",
        "Sí hay una forma más parecida: la simple, por comparar igualdad exacta.",
        "'CASE anidado' no es una forma distinta, es simplemente usar un CASE dentro de otro."
      ] },
    { q: "¿Qué pasa si los tipos de NVL(a, b) no son compatibles (por ejemplo a es NUMBER y b es un texto no numérico)?", options: [
        "Oracle lo convierte todo a texto automáticamente sin error", "Oracle lanza un error de conversión de tipos",
        "Devuelve siempre NULL", "Ignora el segundo argumento"
      ], a: 1,
      why: [
        "No hay una conversión automática silenciosa garantizada en todos los casos: puede fallar.",
        "Correcta: si Oracle no puede unificar los tipos de ambos argumentos, lanza un error.",
        "No devuelve NULL por defecto ante una incompatibilidad de tipos.",
        "NVL no ignora ningún argumento: ambos deben ser compatibles en tipo."
      ] },
    { q: "¿Cuál es la mejor práctica al comparar una fecha almacenada como texto en el origen?", options: [
        "Dejar que Oracle la convierta implícitamente siempre", "Usar TO_DATE con el modelo de formato exacto del texto de origen",
        "Comparar el texto directamente como cadena de caracteres", "Usar siempre el formato por defecto de la sesión, sea cual sea"
      ], a: 1,
      why: [
        "La conversión implícita depende de NLS y puede fallar o comportarse distinto entre sesiones.",
        "Correcta: TO_DATE explícito con el modelo exacto es predecible y no depende de configuración regional.",
        "Comparar como texto puede dar resultados de orden incorrectos ('2024-1-1' vs '2024-01-01' no ordenan igual que fechas reales).",
        "Depender del formato por defecto de la sesión es precisamente el problema que la conversión explícita evita."
      ] }
  ],
  challenges: [
    { level: 1, prompt: "Clasifica a los empleados en 'Sin comisión', 'Comisión baja' (<0.2) o 'Comisión alta' (>=0.2) usando CASE, tratando el NULL como 'Sin comisión'.", solution: "SELECT last_name,\n  CASE WHEN commission_pct IS NULL THEN 'Sin comisión'\n       WHEN commission_pct < 0.2 THEN 'Comisión baja'\n       ELSE 'Comisión alta' END AS categoria\nFROM employees;" },
    { level: 2, prompt: "Muestra el nombre completo en formato 'APELLIDO, Nombre' y la fecha de contratación como 'día de MesEnTexto de año'.", solution: "SELECT UPPER(last_name) || ', ' || INITCAP(first_name) AS nombre_formateado,\n       TO_CHAR(hire_date, 'DD \"de\" Month \"de\" YYYY') AS fecha\nFROM employees;" }
  ]
},

// =====================================================================
// NIVEL 7
// =====================================================================
{
  id: 7, code: "M7", category: "GROUP BY",
  title: "Funciones de grupo y agregación",
  intro: "Resumir muchas filas en un solo valor: COUNT, SUM, AVG, MIN, MAX, agrupación con GROUP BY/HAVING, subtotales con ROLLUP/CUBE/GROUPING SETS, y concatenación de grupos con LISTAGG.",
  theory: {
    concepts: [
      { heading: "1. Funciones de agregación básicas",
        explanation: "COUNT(*) cuenta todas las filas del resultado, incluidas las que tienen NULL en cualquier columna. COUNT(columna) cuenta solo las filas donde esa columna no es NULL. COUNT(DISTINCT columna) cuenta valores únicos no nulos. SUM(columna) suma valores numéricos ignorando los NULL. AVG(columna) calcula la media ignorando los NULL (no los cuenta como 0). MIN y MAX funcionan también con texto y fechas, no solo con números.",
        syntax: "COUNT({* | [DISTINCT] expr})\nSUM([DISTINCT] expr)\nAVG([DISTINCT] expr)\nMIN(expr)\nMAX(expr)",
        examples: [
          { code: "SELECT COUNT(*) AS total_empleados,\n       COUNT(commission_pct) AS con_comision,\n       COUNT(DISTINCT department_id) AS deptos_distintos\nFROM   employees;",
            output: "TOTAL_EMPLEADOS  CON_COMISION  DEPTOS_DISTINTOS\n---------------  ------------  -----------------\n            107            35                 11" }
        ] },
      { heading: "2. STDDEV, VARIANCE y la regla del NULL",
        explanation: "STDDEV calcula la desviación estándar y VARIANCE la varianza; ambas ignoran los NULL, igual que el resto de funciones de grupo (excepto COUNT(*), que cuenta filas). Es una regla que el examen pregunta con frecuencia: AVG(commission_pct) no trata los NULL como 0, los excluye del cálculo por completo." },
      { heading: "3. GROUP BY",
        explanation: "Agrupa filas que comparten el mismo valor en una o varias columnas o expresiones, para calcular funciones de grupo por cada grupo. Toda columna del SELECT que no esté dentro de una función de grupo debe aparecer en GROUP BY, o Oracle lanza ORA-00937: not a single-group group function.",
        syntax: "SELECT   columna [, función_de_grupo(columna2)]\nFROM     tabla\n[WHERE   condición]\nGROUP BY expr [, expr ...]\n[HAVING  condición_de_grupo]\n[ORDER BY ...]",
        examples: [
          { code: "SELECT department_id, ROUND(AVG(salary), 2) AS media\nFROM   employees\nGROUP BY department_id\nORDER BY media DESC;" }
        ] },
      { heading: "4. HAVING frente a WHERE, y el orden lógico de ejecución",
        explanation: "WHERE filtra filas individuales antes de agrupar, y no puede usar funciones de grupo. HAVING filtra grupos ya calculados, después de GROUP BY, y sí puede usar funciones de grupo en su condición. Oracle evalúa lógicamente una consulta completa en este orden: 1) FROM 2) WHERE 3) GROUP BY 4) HAVING 5) SELECT 6) ORDER BY — por eso los alias del SELECT no funcionan en WHERE ni HAVING, pero sí en ORDER BY.",
        examples: [
          { code: "SELECT department_id, COUNT(*) AS num_empleados, ROUND(AVG(salary), 2) AS media\nFROM   employees\nWHERE  job_id <> 'ST_CLERK'\nGROUP BY department_id\nHAVING COUNT(*) > 3\nORDER BY media DESC;" }
        ] },
      { heading: "5. ROLLUP, CUBE, GROUPING SETS y GROUPING()",
        explanation: "Son extensiones de GROUP BY para generar subtotales sin UNION de varias consultas. ROLLUP(a, b) genera, de derecha a izquierda, subtotales jerárquicos: por (a,b), por a, y el total general. CUBE(a, b) genera todas las combinaciones posibles de subtotales, incluyendo por b solo. GROUPING SETS permite especificar manualmente qué combinaciones calcular. GROUPING(columna) devuelve 1 en las filas de subtotal (donde esa columna aparece como NULL por ser un total) y 0 en las filas de detalle.",
        syntax: "GROUP BY ROLLUP (columna1 [, columna2, ...])\nGROUP BY CUBE (columna1 [, columna2, ...])\nGROUP BY GROUPING SETS ((columna1), (columna2), (columna1, columna2), ())",
        examples: [
          { code: "SELECT department_id, job_id, SUM(salary) AS total\nFROM   employees\nGROUP BY ROLLUP(department_id, job_id);" }
        ] },
      { heading: "6. LISTAGG: concatenar valores de un grupo en una sola cadena",
        explanation: "LISTAGG(expr, delimitador) WITHIN GROUP (ORDER BY expr_orden) concatena los valores de una columna dentro de cada grupo en una única cadena de texto, separados por el delimitador indicado, en el orden especificado por WITHIN GROUP. Es la forma estándar de Oracle de convertir 'varias filas' en 'una fila con una lista de texto', típico para informes legibles por humanos.",
        syntax: "LISTAGG(expr [, 'delimitador']) WITHIN GROUP (ORDER BY expr_orden)",
        examples: [
          { code: "SELECT department_id,\n       LISTAGG(last_name, ', ') WITHIN GROUP (ORDER BY last_name) AS empleados\nFROM   employees\nGROUP BY department_id;",
            output: "DEPARTMENT_ID  EMPLEADOS\n-------------  --------------------------------\n           10  Whalen\n           20  Fay, Hartstein" }
        ],
        commonErrors: [
          "Olvidar WITHIN GROUP (ORDER BY ...): es obligatorio en la sintaxis, aunque el orden no te importe realmente.",
          "Si la concatenación de un grupo supera el límite de tamaño de VARCHAR2 (4000 bytes en configuración clásica), Oracle lanza ORA-01489; en versiones recientes existe una cláusula ON OVERFLOW para truncar en vez de fallar."
        ] }
    ],
    oracleNotes: [
      "Toda columna no agregada del SELECT debe estar en GROUP BY, o Oracle lanza ORA-00937.",
      "Las funciones de grupo se filtran en HAVING, nunca en WHERE: WHERE AVG(salary)>5000 da error de sintaxis.",
      "AVG y el resto de funciones de grupo ignoran los NULL, no los tratan como 0; COUNT(*) es la única que sí cuenta filas con NULL en sus columnas.",
      "ROLLUP añade subtotales jerárquicos automáticamente, con NULL en las columnas que representan un total; CUBE genera más combinaciones que ROLLUP (con 2 columnas, ROLLUP da 3 niveles y CUBE da 4).",
      "APPROX_COUNT_DISTINCT(expr) calcula un recuento distinto aproximado (no exacto) mucho más rápido que COUNT(DISTINCT expr) sobre volúmenes muy grandes de datos; aparece en temarios ampliados como alternativa cuando la exactitud absoluta no es crítica."
    ]
  },
  summary: [
    "COUNT, SUM, AVG, MIN, MAX resumen un conjunto de filas; todas ignoran NULL salvo COUNT(*).",
    "GROUP BY agrupa filas; toda columna suelta del SELECT debe estar ahí o en una función de grupo.",
    "WHERE filtra filas antes de agrupar; HAVING filtra grupos después y es el único que admite funciones de grupo en su condición.",
    "Orden lógico: FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY.",
    "ROLLUP/CUBE/GROUPING SETS generan subtotales; GROUPING() identifica esas filas de subtotal.",
    "LISTAGG WITHIN GROUP (ORDER BY ...) concatena los valores de un grupo en una sola cadena ordenada."
  ],
  comparisonTable: {
    title: "ROLLUP vs CUBE vs GROUPING SETS (con 2 columnas A, B)",
    headers: ["Extensión", "Combinaciones generadas", "Número de niveles (con 2 cols.)"],
    rows: [
      ["ROLLUP(A, B)", "(A,B), (A), ()", "3"],
      ["CUBE(A, B)", "(A,B), (A), (B), ()", "4"],
      ["GROUPING SETS ((A), (B))", "Solo las especificadas: (A), (B)", "2 (a medida)"]
    ]
  },
  mindMap: [
    { topic: "Módulo 7 — Funciones de grupo", children: [
      "Básicas → COUNT, SUM, AVG, MIN, MAX (ignoran NULL salvo COUNT(*))",
      "Dispersión → STDDEV, VARIANCE",
      "Agrupar → GROUP BY (toda columna suelta debe estar ahí)",
      "Filtrar grupos → HAVING (admite función de grupo); WHERE filtra filas antes",
      "Orden lógico → FROM→WHERE→GROUP BY→HAVING→SELECT→ORDER BY",
      "Subtotales → ROLLUP (jerárquico), CUBE (todas las combinaciones), GROUPING SETS (a medida), GROUPING()",
      "Concatenar grupo → LISTAGG(...) WITHIN GROUP (ORDER BY ...)"
    ] }
  ],
  sourceRefs: [
    "Oracle SQL Language Reference 19c — \"Aggregate Functions\"",
    "Oracle SQL Language Reference 19c — \"SELECT\" (group_by_clause, having_clause)",
    "Oracle SQL Language Reference 19c — \"GROUP BY Extensions\" (ROLLUP, CUBE, GROUPING SETS)",
    "Oracle SQL Language Reference 19c — \"LISTAGG\""
  ],
  realCases: {
    business: "Un informe de nómina calcula el coste salarial total por departamento con SUM(salary) GROUP BY department_id, y añade un total general con ROLLUP sin tener que escribir una consulta adicional con UNION.",
    dataEngineering: "Un ingeniero de datos que construye una tabla de agregados diarios usa GROUPING SETS para calcular en una sola pasada los totales por (día, producto), por día solamente y por producto solamente, en vez de ejecutar tres consultas separadas sobre la misma tabla de hechos.",
    etl: "Un proceso de calidad de datos usa COUNT(*) - COUNT(columna) para detectar cuántos valores NULL tiene cada columna crítica antes de cargarla en el destino, como parte de un chequeo automático.",
    reporting: "Un informe de contactos por departamento usa LISTAGG(last_name, ', ') WITHIN GROUP (ORDER BY last_name) para mostrar 'Fay, Hartstein' en una sola celda en vez de una fila por empleado, más legible en un documento ejecutivo."
  },
  mistakes: [
    { mistake: "Creer que AVG trata los NULL como cero.", why: "Los excluye del cálculo por completo, no los cuenta como 0; si el 60% de las filas tiene NULL en esa columna, AVG promedia solo sobre el 40% restante. El examen construye tablas de datos con muchos NULL a propósito para comprobar si sabes esto." },
    { mistake: "Poner una columna sin agregar junto a una función de grupo sin GROUP BY.", why: "Oracle no puede decidir qué valor de esa columna mostrar por cada grupo resultante, y lanza ORA-00937; el examen presenta SELECTs con una columna suelta y una función de grupo mezcladas para comprobar si reconoces este error antes de ejecutarlo." },
    { mistake: "Usar una función de grupo en WHERE en vez de HAVING.", why: "WHERE se evalúa antes de que existan los grupos, así que no tiene sentido usar una función de grupo ahí; Oracle lo rechaza con un error de sintaxis, no un resultado incorrecto silencioso." },
    { mistake: "Olvidar WITHIN GROUP (ORDER BY ...) en LISTAGG.", why: "Es una parte obligatoria de la sintaxis de LISTAGG, aunque el orden de concatenación no te importe realmente; el examen presenta LISTAGG sin esa cláusula como código 'casi correcto' para comprobar si conoces la sintaxis exacta." }
  ],
  exercises: [
    { title: "Resumen salarial", difficulty: "básico", prompt: "Obtén en una sola consulta: número total de empleados, salario mínimo, máximo y medio (redondeado a 2 decimales).", hint: "COUNT, MIN, MAX, ROUND(AVG(...),2)", solution: "SELECT COUNT(*) AS total, MIN(salary) AS minimo, MAX(salary) AS maximo, ROUND(AVG(salary),2) AS media FROM employees;" },
    { title: "Media por departamento con filtro de grupo", difficulty: "básico", prompt: "Muestra el salario medio por departamento, solo para departamentos con más de 2 empleados.", hint: "GROUP BY ... HAVING COUNT(*) > 2", solution: "SELECT department_id, ROUND(AVG(salary),2) AS media FROM employees GROUP BY department_id HAVING COUNT(*) > 2;" },
    { title: "Filtrar antes y después", difficulty: "intermedio", prompt: "Para empleados contratados después de 2005, muestra el número de empleados por puesto (job_id), solo puestos con al menos 2 empleados.", hint: "WHERE filtra filas, HAVING filtra grupos", solution: "SELECT job_id, COUNT(*) AS total FROM employees WHERE hire_date > TO_DATE('2005-01-01','YYYY-MM-DD') GROUP BY job_id HAVING COUNT(*) >= 2;" },
    { title: "Subtotales con ROLLUP", difficulty: "intermedio", prompt: "Obtén el salario total por departamento y job_id, incluyendo subtotales por departamento y el total general.", hint: "GROUP BY ROLLUP(a, b)", solution: "SELECT department_id, job_id, SUM(salary) AS total FROM employees GROUP BY ROLLUP(department_id, job_id);" },
    { title: "Lista de empleados por departamento", difficulty: "avanzado", prompt: "Muestra, por cada departamento, una sola fila con los apellidos de sus empleados separados por coma y ordenados alfabéticamente.", hint: "LISTAGG(...) WITHIN GROUP (ORDER BY ...)", solution: "SELECT department_id, LISTAGG(last_name, ', ') WITHIN GROUP (ORDER BY last_name) AS empleados FROM employees GROUP BY department_id;" },
    { title: "Distinguir subtotales con GROUPING", difficulty: "avanzado", prompt: "En una consulta con ROLLUP(department_id, job_id), añade una columna que valga 'SUBTOTAL' en las filas de resumen y 'DETALLE' en las filas normales.", hint: "GROUPING(columna) devuelve 1 en las filas de subtotal.", solution: "SELECT department_id, job_id, SUM(salary) AS total,\n  CASE WHEN GROUPING(job_id) = 1 THEN 'SUBTOTAL' ELSE 'DETALLE' END AS tipo_fila\nFROM employees\nGROUP BY ROLLUP(department_id, job_id);" }
  ],
  solved: [
    { title: "Diagnosticar un ORA-00937",
      problem: "SELECT department_id, salary FROM employees GROUP BY department_id; falla con ORA-00937.",
      steps: [
        "Identifica la columna 'suelta' que no está agregada ni en GROUP BY: salary.",
        "Decide qué quieres hacer con salary por cada grupo: ¿su media?, ¿su suma?, ¿su máximo?",
        "Envuelve salary en la función de grupo elegida, por ejemplo AVG.",
        "Verifica que ya no queda ninguna columna suelta fuera de GROUP BY o de una función de grupo."
      ],
      query: "SELECT department_id, AVG(salary) AS media\nFROM   employees\nGROUP BY department_id;",
      result: "Ahora la consulta es válida: department_id está en GROUP BY, salary está agregada con AVG." },
    { title: "Construir un informe con total general usando ROLLUP",
      problem: "Necesitas el salario total por departamento, y además una fila final con el total de toda la empresa, sin escribir dos consultas.",
      steps: [
        "Reconoce que esto es exactamente lo que ROLLUP genera automáticamente: un nivel de detalle y un total general.",
        "Aplica GROUP BY ROLLUP(department_id) en vez de GROUP BY department_id normal.",
        "Observa que la fila de total general tendrá department_id = NULL.",
        "Opcionalmente, usa NVL(department_id, 'TOTAL') o CASE con GROUPING() para mostrar una etiqueta legible en esa fila."
      ],
      query: "SELECT NVL(TO_CHAR(department_id), 'TOTAL EMPRESA') AS departamento, SUM(salary) AS total\nFROM   employees\nGROUP BY ROLLUP(department_id);",
      result: "Devuelve una fila por departamento y una fila final 'TOTAL EMPRESA' con la suma de todos." }
  ],
  flashcards: [
    { front: "¿Qué diferencia hay entre COUNT(*) y COUNT(columna)?", back: "COUNT(*) cuenta todas las filas; COUNT(columna) solo las filas donde esa columna no es NULL." },
    { front: "¿Qué error lanza Oracle si mezclas una columna suelta con una función de grupo sin GROUP BY?", back: "ORA-00937: not a single-group group function." },
    { front: "¿Dónde se filtra una condición sobre una función de grupo?", back: "En HAVING, nunca en WHERE." },
    { front: "¿Cuál es el orden lógico completo de una consulta?", back: "FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY." },
    { front: "¿Qué genera GROUP BY ROLLUP(a, b)?", back: "Subtotales por (a,b), por a, y el total general." },
    { front: "¿Qué diferencia hay entre ROLLUP y CUBE con 2 columnas?", back: "ROLLUP da 3 niveles; CUBE da 4 (incluye el subtotal por la segunda columna sola)." },
    { front: "¿Para qué sirve GROUPING(columna)?", back: "Para identificar las filas de subtotal (devuelve 1) frente a las de detalle (0)." },
    { front: "¿Qué hace LISTAGG?", back: "Concatena los valores de una columna dentro de cada grupo en una sola cadena, en el orden indicado por WITHIN GROUP." }
  ],
  examples: [
    { title: "Conteos", code: "SELECT COUNT(*) AS total_empleados,\n       COUNT(commission_pct) AS con_comision,\n       COUNT(DISTINCT department_id) AS departamentos_distintos\nFROM employees;" },
    { title: "Agrupar y filtrar filas antes (WHERE) y grupos después (HAVING)", code: "SELECT department_id, COUNT(*) AS num_empleados, ROUND(AVG(salary),2) AS media\nFROM employees\nWHERE job_id <> 'ST_CLERK'\nGROUP BY department_id\nHAVING COUNT(*) > 3\nORDER BY media DESC;" },
    { title: "LISTAGG", code: "SELECT department_id, LISTAGG(last_name, ', ') WITHIN GROUP (ORDER BY last_name) AS empleados\nFROM employees\nGROUP BY department_id;" }
  ],
  quiz: [
    { q: "¿Qué diferencia hay entre COUNT(*) y COUNT(commission_pct)?", options: [
        "Ninguna, son iguales", "COUNT(*) cuenta todas las filas; COUNT(commission_pct) solo las filas donde esa columna no es NULL",
        "COUNT(*) es más lento siempre", "COUNT(commission_pct) cuenta solo los valores duplicados"
      ], a: 1,
      why: [
        "No son iguales cuando la columna tiene valores NULL.",
        "Correcta: COUNT(columna) excluye los NULL de esa columna concreta.",
        "No hay una regla general de que COUNT(*) sea siempre más lento.",
        "COUNT no cuenta duplicados específicamente; cuenta filas no nulas (o todas, con *)."
      ] },
    { q: "AVG(commission_pct) sobre una tabla donde el 60% de las filas tiene NULL en esa columna...", options: [
        "Trata los NULL como 0 en el cálculo", "Excluye los NULL: solo promedia el 40% de filas con valor",
        "Devuelve siempre NULL", "Da error"
      ], a: 1,
      why: [
        "Las funciones de grupo no convierten NULL en 0.",
        "Correcta: excluye los NULL del cálculo, promediando solo sobre los valores presentes.",
        "No devuelve NULL a menos que TODAS las filas fueran NULL.",
        "No da ningún error: es un cálculo perfectamente válido."
      ] },
    { q: "¿Qué error lanza Oracle si mezclas una columna suelta con una función de grupo sin GROUP BY?", options: ["ORA-00001", "ORA-00937", "ORA-01400", "ORA-00904"], a: 1,
      why: [
        "ORA-00001 es de restricción UNIQUE violada, no relacionado.",
        "Correcta: ORA-00937 significa 'not a single-group group function'.",
        "ORA-01400 es de intentar insertar NULL en columna NOT NULL, no relacionado.",
        "ORA-00904 es de identificador inválido, no relacionado con este error concreto."
      ] },
    { q: "¿Cuál es el orden lógico correcto de ejecución?", options: [
        "SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY", "FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY",
        "FROM, SELECT, WHERE, GROUP BY, HAVING, ORDER BY", "WHERE, FROM, GROUP BY, SELECT, HAVING, ORDER BY"
      ], a: 1,
      why: [
        "SELECT no puede evaluarse antes de que exista el resultado de FROM/WHERE/GROUP BY.",
        "Correcta: primero se localizan y filtran filas, luego se agrupan, se filtran grupos y por último se eligen columnas y se ordena.",
        "SELECT no puede ir antes de WHERE en el orden lógico.",
        "WHERE no puede evaluarse antes de que exista la fuente de datos (FROM)."
      ] },
    { q: "¿Qué hace GROUP BY ROLLUP(department_id, job_id)?", options: [
        "Solo agrupa por department_id", "Genera subtotales por department_id+job_id, por department_id y un total general",
        "Da error de sintaxis", "Es idéntico a GROUP BY normal"
      ], a: 1,
      why: [
        "ROLLUP hace más que agrupar solo por la primera columna.",
        "Correcta: ROLLUP añade niveles de subtotal jerárquico automáticamente, de derecha a izquierda.",
        "Es sintaxis perfectamente válida en Oracle.",
        "No es idéntico a GROUP BY normal: añade filas de subtotal adicionales."
      ] },
    { q: "¿Cuántos niveles de agrupación genera CUBE(a, b) frente a ROLLUP(a, b)?", options: ["Los mismos 3 niveles en ambos", "ROLLUP da 3, CUBE da 4", "ROLLUP da 4, CUBE da 3", "Ambos dan 2"], a: 1,
      why: [
        "No dan el mismo número: CUBE genera una combinación adicional.",
        "Correcta: ROLLUP da (a,b),(a),(); CUBE añade también (b), dando 4 niveles.",
        "Es al revés: CUBE es el que genera más combinaciones, no ROLLUP.",
        "Ninguno de los dos se limita a solo 2 niveles con estas columnas."
      ] },
    { q: "¿Qué indica GROUPING(columna) = 1 en una fila generada por ROLLUP?", options: [
        "Que la columna tiene un valor normal de detalle", "Que esa fila es un subtotal, donde la columna aparece como NULL por ser un total",
        "Que hubo un error en la agrupación", "Que la columna es la clave primaria"
      ], a: 1,
      why: [
        "Un valor normal de detalle daría GROUPING = 0.",
        "Correcta: GROUPING = 1 marca las filas de subtotal generadas por ROLLUP/CUBE.",
        "No indica ningún error: es un comportamiento esperado y útil.",
        "No tiene relación con si la columna es clave primaria."
      ] },
    { q: "¿Qué hace 'LISTAGG(last_name, ', ') WITHIN GROUP (ORDER BY last_name)' agrupado por department_id?", options: [
        "Cuenta cuántos empleados hay por departamento", "Concatena los apellidos de cada departamento en una sola cadena, ordenados alfabéticamente",
        "Calcula el apellido más largo por departamento", "Da error porque LISTAGG no admite WITHIN GROUP"
      ], a: 1,
      why: [
        "Contar empleados sería COUNT(*), no LISTAGG.",
        "Correcta: LISTAGG concatena los valores de la columna en una sola cadena por grupo, en el orden especificado.",
        "No calcula longitudes: eso sería una combinación distinta con LENGTH y alguna función de grupo.",
        "WITHIN GROUP es obligatorio y válido en la sintaxis de LISTAGG, no un error."
      ] },
    { q: "¿Qué diferencia hay entre WHERE y HAVING en relación con las funciones de grupo?", options: [
        "Ambas admiten funciones de grupo por igual", "Solo HAVING puede usar funciones de grupo en su condición; WHERE no",
        "Solo WHERE puede usar funciones de grupo; HAVING no", "Ninguna de las dos admite funciones de grupo"
      ], a: 1,
      why: [
        "No son equivalentes: WHERE rechaza las funciones de grupo con un error de sintaxis.",
        "Correcta: HAVING se evalúa después de agrupar, por lo que sí puede referenciar funciones de grupo ya calculadas.",
        "Es exactamente al revés: WHERE nunca admite funciones de grupo directamente.",
        "HAVING sí las admite: es precisamente su propósito principal."
      ] },
    { q: "¿Qué ventaja ofrece APPROX_COUNT_DISTINCT frente a COUNT(DISTINCT expr) sobre volúmenes de datos muy grandes?", options: [
        "Da siempre el resultado exacto más rápido", "Da un resultado aproximado mucho más rápido, aceptable cuando no se necesita exactitud absoluta",
        "Solo funciona con columnas de texto", "Sustituye por completo a GROUP BY"
      ], a: 1,
      why: [
        "No es exacto: su nombre ya indica que es una aproximación, a cambio de velocidad.",
        "Correcta: sacrifica exactitud por rendimiento en escenarios de big data donde una cifra aproximada es suficiente.",
        "Funciona con cualquier tipo de dato comparable, no solo texto.",
        "No sustituye a GROUP BY: es una función de agregación más que se usa junto a él."
      ] }
  ],
  challenges: [
    { level: 1, prompt: "¿Cuántos empleados tienen comisión asignada y cuántos no? (una sola consulta, sin GROUP BY).", solution: "SELECT COUNT(commission_pct) AS con_comision,\n       COUNT(*) - COUNT(commission_pct) AS sin_comision\nFROM employees;" },
    { level: 2, prompt: "Explica por qué esta consulta da error: SELECT department_id, salary FROM employees GROUP BY department_id; y cómo corregirla si lo que quieres es ver el salario medio.", solution: "Da error (ORA-00937) porque 'salary' no está agregada ni en GROUP BY. Corrección: SELECT department_id, AVG(salary) FROM employees GROUP BY department_id;" }
  ]
},

// =====================================================================
// NIVEL 8
// =====================================================================
{
  id: 8, code: "M8", category: "JOINS",
  title: "JOINs",
  intro: "Combinar filas de varias tablas relacionadas: equijoin, outer join, self join, non-equijoin y uniones de tres o más tablas, con sintaxis ANSI y con la sintaxis clásica de Oracle.",
  theory: {
    concepts: [
      { heading: "1. Tipos de JOIN (sintaxis ANSI)",
        explanation: "INNER JOIN devuelve solo las filas que coinciden en ambas tablas según la condición ON. LEFT [OUTER] JOIN devuelve todas las filas de la tabla izquierda y las coincidencias de la derecha (NULL en las columnas de la derecha si no hay). RIGHT [OUTER] JOIN es lo simétrico: conserva todas las filas de la derecha. FULL [OUTER] JOIN devuelve todo de ambas tablas, con NULL donde no hay coincidencia en el otro lado. CROSS JOIN genera el producto cartesiano: todas las combinaciones posibles entre las filas de ambas tablas, sin condición de unión.",
        syntax: "SELECT ...\nFROM   tabla1\n[INNER] JOIN tabla2 ON condición\n| LEFT  [OUTER] JOIN tabla2 ON condición\n| RIGHT [OUTER] JOIN tabla2 ON condición\n| FULL  [OUTER] JOIN tabla2 ON condición\n| CROSS JOIN tabla2",
        examples: [
          { code: "SELECT e.last_name, d.department_name\nFROM   employees e\nJOIN   departments d ON e.department_id = d.department_id;" },
          { code: "SELECT e.last_name, d.department_name\nFROM   employees e\nLEFT JOIN departments d ON e.department_id = d.department_id\nWHERE  d.department_id IS NULL;" }
        ] },
      { heading: "2. NATURAL JOIN y JOIN ... USING",
        explanation: "NATURAL JOIN une automáticamente dos tablas por TODAS las columnas que tengan el mismo nombre y tipo de dato en ambas, sin escribir ON; hay que usarlo con cuidado porque puede unir por una columna homónima no deseada (por ejemplo, si ambas tablas tienen una columna created_by con distinto significado). JOIN ... USING(columna) permite especificar manualmente una única columna común (o varias) sin repetir el nombre de tabla; en las columnas listadas en USING no se puede usar prefijo de tabla en ningún punto de la consulta, porque Oracle ya las trata como una sola columna compartida.",
        syntax: "SELECT ...\nFROM tabla1 NATURAL JOIN tabla2\n\nSELECT ...\nFROM tabla1 JOIN tabla2 USING (columna_comun)",
        examples: [
          { code: "SELECT last_name, department_name\nFROM   employees\nJOIN   departments USING (department_id);" }
        ] },
      { heading: "3. Self join",
        explanation: "Una tabla se puede unir consigo misma usando dos alias distintos, típico para relaciones jerárquicas como 'empleado - su jefe', ambos almacenados en la misma tabla employees (manager_id de una fila referencia a employee_id de otra fila de la misma tabla). Sintácticamente es un JOIN normal; lo único especial es que ambos lados del FROM son la misma tabla con alias diferentes.",
        examples: [
          { code: "SELECT emp.last_name AS empleado, jefe.last_name AS jefe\nFROM   employees emp\nLEFT JOIN employees jefe ON emp.manager_id = jefe.employee_id;" }
        ] },
      { heading: "4. Sintaxis antigua de Oracle con (+)",
        explanation: "Antes de que Oracle adoptara el estándar ANSI JOIN, los outer join se escribían con el operador (+) en la condición del WHERE, colocado en el lado de la tabla que puede tener valores 'que falten'. WHERE e.department_id = d.department_id(+) equivale a un LEFT JOIN de e hacia d (department_id(+) marca a departments como el lado opcional). Esta sintaxis no admite FULL OUTER JOIN ni combinar (+) con OR o IN en la misma condición, y sigue apareciendo en el examen como reconocimiento de sintaxis heredada, aunque en código nuevo se prefiere siempre la sintaxis ANSI.",
        examples: [
          { code: "SELECT e.last_name, d.department_name\nFROM   employees e, departments d\nWHERE  e.department_id = d.department_id(+);" }
        ] },
      { heading: "5. Non-equijoin",
        explanation: "Un non-equijoin (o join de desigualdad) une dos tablas con un operador distinto de =, como BETWEEN, >, < o >=. El caso clásico del esquema HR es asignar a cada empleado un nivel salarial: JOB_GRADES tiene rangos (LOWEST_SAL, HIGHEST_SAL) y se une con EMPLOYEES buscando en qué rango cae cada salario, no una igualdad exacta.",
        examples: [
          { code: "SELECT e.last_name, e.salary, j.grade_level\nFROM   employees e\nJOIN   job_grades j\n  ON   e.salary BETWEEN j.lowest_sal AND j.highest_sal;" }
        ] },
      { heading: "6. Joins de tres o más tablas",
        explanation: "Se pueden encadenar tantos JOIN como haga falta en una sola consulta: cada nueva tabla se une con una cláusula ON propia, normalmente referenciando alguna tabla ya incorporada antes. El orden de escritura de los JOIN no determina el resultado (el optimizador decide el orden físico de acceso), pero sí conviene escribirlos siguiendo la lógica de las relaciones para que el código sea legible.",
        syntax: "SELECT ...\nFROM   tabla1\nJOIN   tabla2 ON tabla1.col = tabla2.col\nJOIN   tabla3 ON tabla2.col = tabla3.col",
        examples: [
          { code: "SELECT e.last_name, d.department_name, l.city\nFROM   employees e\nJOIN   departments d ON e.department_id = d.department_id\nJOIN   locations l ON d.location_id = l.location_id;" }
        ] }
    ],
    oracleNotes: [
      "Olvidar la condición ON en un JOIN (o usar coma sin WHERE en la sintaxis antigua) genera sin querer un producto cartesiano: revisa siempre el número de filas resultante.",
      "En la sintaxis antigua con (+), el operador se coloca en el lado de la tabla que puede tener valores ausentes; no se puede usar (+) junto con OR o IN sobre la misma columna, ni expresar un FULL OUTER JOIN con esta sintaxis.",
      "Con USING, la(s) columna(s) listada(s) no pueden llevar prefijo de tabla en ninguna parte de la consulta (ni en SELECT, ni en WHERE): eso es justo lo que la distingue de ON.",
      "NATURAL JOIN falla o da resultados inesperados si las tablas comparten más de una columna con el mismo nombre pero significados distintos: en la práctica se prefiere JOIN...ON u USING por ser explícitos.",
      "En un non-equijoin con BETWEEN, si los rangos de la tabla de referencia (como JOB_GRADES) se solapan o dejan huecos, algunas filas pueden no encontrar ninguna coincidencia o encontrar más de una: conviene verificar que los rangos sean exhaustivos y disjuntos."
    ]
  },
  summary: [
    "INNER JOIN solo coincidencias; LEFT/RIGHT/FULL OUTER JOIN conservan filas sin coincidencia con NULL; CROSS JOIN es el producto cartesiano.",
    "NATURAL JOIN une por columnas homónimas automáticamente; USING especifica una columna común manualmente y prohíbe el prefijo de tabla sobre ella.",
    "Self join: una tabla unida consigo misma con dos alias, típico en jerarquías como empleado-jefe.",
    "La sintaxis antigua (+) en el WHERE es el equivalente heredado a un LEFT/RIGHT OUTER JOIN ANSI, con restricciones (no admite FULL, ni OR/IN junto al (+)).",
    "Un non-equijoin une con un operador distinto de = (típicamente BETWEEN), útil para asignar rangos.",
    "Se pueden encadenar tantos JOIN como tablas necesites en una sola consulta."
  ],
  comparisonTable: {
    title: "Tipos de JOIN de un vistazo",
    headers: ["JOIN", "Filas conservadas sin coincidencia", "Condición típica"],
    rows: [
      ["INNER JOIN", "Ninguna (solo coincidencias)", "="],
      ["LEFT JOIN", "De la tabla izquierda", "="],
      ["RIGHT JOIN", "De la tabla derecha", "="],
      ["FULL JOIN", "De ambas tablas", "="],
      ["CROSS JOIN", "Todas las combinaciones (sin condición)", "—"],
      ["Non-equijoin", "Depende del rango", "BETWEEN, >, <"]
    ]
  },
  mindMap: [
    { topic: "Módulo 8 — JOINs", children: [
      "ANSI → INNER, LEFT/RIGHT/FULL OUTER, CROSS",
      "Simplificados → NATURAL JOIN (por nombre), USING (columna explícita, sin prefijo)",
      "Self join → misma tabla, dos alias (empleado-jefe)",
      "Sintaxis antigua → (+) en WHERE, en el lado opcional; sin FULL, sin OR/IN junto al (+)",
      "Non-equijoin → operador distinto de =, típico BETWEEN para rangos",
      "Múltiples tablas → encadenar JOIN...ON tantas veces como haga falta"
    ] }
  ],
  sourceRefs: [
    "Oracle SQL Language Reference 19c — \"SELECT\" (from_clause, join_clause)",
    "Oracle SQL Language Reference 19c — \"Joins\" (conceptos de INNER/OUTER/CROSS/NATURAL/USING)"
  ],
  realCases: {
    business: "Un sistema de nóminas asigna automáticamente el nivel salarial de cada empleado uniendo EMPLOYEES con una tabla de rangos JOB_GRADES mediante un non-equijoin con BETWEEN, evitando mantener el nivel como un campo manual desincronizado.",
    dataEngineering: "Un ingeniero de datos que construye una tabla de hechos de ventas encadena varios JOIN (ventas → productos → categorías → tiendas → regiones) para desnormalizar deliberadamente el modelo antes de cargarlo en el data warehouse.",
    etl: "Un proceso de reconciliación usa un FULL OUTER JOIN entre el sistema origen y el destino para detectar en una sola consulta tanto los registros que faltan en el destino como los que sobran (huérfanos), en vez de dos consultas separadas.",
    reporting: "Un informe jerárquico de organigrama usa un self join repetido (o una consulta jerárquica, que se ve en un módulo posterior) para mostrar cada empleado junto al nombre de su jefe directo."
  },
  mistakes: [
    { mistake: "Olvidar la condición ON en un JOIN.", why: "Sin ON (o con la sintaxis antigua de coma sin WHERE), Oracle genera el producto cartesiano completo entre ambas tablas; el examen presenta JOIN sin condición como código 'que compila' para comprobar si sabes que el resultado no es el que probablemente se busca." },
    { mistake: "Poner el (+) en el lado equivocado en la sintaxis antigua.", why: "Invierte completamente el sentido del outer join: en vez de conservar las filas de la tabla 'principal', empieza a conservar las de la tabla marcada con (+). El examen presenta ambas variantes para comprobar si distingues cuál tabla es la 'opcional'." },
    { mistake: "Usar NATURAL JOIN sin comprobar qué columnas comparten nombre entre las tablas.", why: "Si dos tablas comparten accidentalmente una columna con el mismo nombre pero significado distinto, NATURAL JOIN las usará igualmente para unir, dando un resultado incorrecto sin ningún error visible." },
    { mistake: "No verificar que los rangos de un non-equijoin sean exhaustivos y disjuntos.", why: "Si hay huecos entre rangos, algunas filas no encuentran coincidencia y se pierden silenciosamente en un INNER JOIN; si hay solapamientos, una fila puede duplicarse al coincidir con más de un rango. El examen presenta tablas de rango incompletas a propósito." }
  ],
  exercises: [
    { title: "JOIN básico", difficulty: "básico", prompt: "Muestra el nombre del empleado y el nombre de su departamento.", hint: "JOIN ... ON e.department_id = d.department_id", solution: "SELECT e.last_name, d.department_name\nFROM employees e\nJOIN departments d ON e.department_id = d.department_id;" },
    { title: "Empleados sin departamento", difficulty: "básico", prompt: "Lista todos los empleados, incluidos los que no tengan departamento asignado.", hint: "LEFT JOIN", solution: "SELECT e.last_name, d.department_name\nFROM employees e\nLEFT JOIN departments d ON e.department_id = d.department_id;" },
    { title: "Tres tablas encadenadas", difficulty: "intermedio", prompt: "Muestra el apellido del empleado, el nombre de su departamento y la ciudad donde está ubicado ese departamento.", hint: "Encadena dos JOIN: employees→departments→locations.", solution: "SELECT e.last_name, d.department_name, l.city\nFROM employees e\nJOIN departments d ON e.department_id = d.department_id\nJOIN locations l ON d.location_id = l.location_id;" },
    { title: "Self join empleado-jefe", difficulty: "intermedio", prompt: "Muestra empleados junto al nombre de su jefe, incluyendo a los que no tienen jefe.", hint: "LEFT JOIN de employees consigo misma.", solution: "SELECT emp.last_name AS empleado, jefe.last_name AS jefe\nFROM employees emp\nLEFT JOIN employees jefe ON emp.manager_id = jefe.employee_id;" },
    { title: "Non-equijoin de rangos salariales", difficulty: "avanzado", prompt: "Dada una tabla job_grades(grade_level, lowest_sal, highest_sal), asigna a cada empleado su nivel salarial correspondiente.", hint: "JOIN ... ON salary BETWEEN lowest_sal AND highest_sal", solution: "SELECT e.last_name, e.salary, j.grade_level\nFROM employees e\nJOIN job_grades j ON e.salary BETWEEN j.lowest_sal AND j.highest_sal;" },
    { title: "Detectar huérfanos con FULL OUTER JOIN", difficulty: "avanzado", prompt: "Muestra los department_id que existen solo en employees, solo en departments, o en ambas, distinguiendo cada caso.", hint: "FULL OUTER JOIN + CASE sobre las claves NULL.", solution: "SELECT e.department_id AS dept_emp, d.department_id AS dept_dep,\n  CASE WHEN e.department_id IS NULL THEN 'Solo en departments'\n       WHEN d.department_id IS NULL THEN 'Solo en employees'\n       ELSE 'En ambas' END AS situacion\nFROM employees e\nFULL OUTER JOIN departments d ON e.department_id = d.department_id;" }
  ],
  solved: [
    { title: "Construir una consulta de tres tablas paso a paso",
      problem: "Necesitas el apellido de cada empleado, el nombre de su departamento y la ciudad de ese departamento.",
      steps: [
        "Identifica las tres tablas necesarias: employees, departments, locations.",
        "Determina las claves de unión: employees.department_id → departments.department_id; departments.location_id → locations.location_id.",
        "Escribe el primer JOIN entre employees y departments.",
        "Encadena un segundo JOIN entre departments (ya incorporada) y locations."
      ],
      query: "SELECT e.last_name, d.department_name, l.city\nFROM   employees e\nJOIN   departments d ON e.department_id = d.department_id\nJOIN   locations l ON d.location_id = l.location_id;",
      result: "Devuelve una fila por empleado con su departamento y la ciudad correspondiente." },
    { title: "Migrar una consulta con (+) a sintaxis ANSI",
      problem: "Tienes: SELECT e.last_name, d.department_name FROM employees e, departments d WHERE e.department_id = d.department_id(+); y necesitas reescribirla en sintaxis moderna.",
      steps: [
        "Identifica que (+) está en el lado de departments: significa que department_id de departments es el lado 'opcional'.",
        "Traduce esto a un LEFT JOIN desde employees hacia departments (employees conserva todas sus filas).",
        "Mueve la condición de la cláusula WHERE a una cláusula ON explícita.",
        "Verifica que el resultado sea idéntico ejecutando ambas versiones."
      ],
      query: "SELECT e.last_name, d.department_name\nFROM   employees e\nLEFT JOIN departments d ON e.department_id = d.department_id;",
      result: "Mismo resultado que la versión con (+), con sintaxis ANSI moderna y más legible." }
  ],
  flashcards: [
    { front: "¿Qué conserva un LEFT JOIN que un INNER JOIN no conserva?", back: "Las filas de la tabla izquierda sin coincidencia en la derecha, con NULL en las columnas de esta." },
    { front: "¿Qué genera un CROSS JOIN?", back: "El producto cartesiano: todas las combinaciones posibles entre las filas de ambas tablas." },
    { front: "¿Qué restricción tiene USING sobre la columna que agrupa?", back: "No puede llevar prefijo de tabla en ningún punto de la consulta." },
    { front: "¿Qué es un self join?", back: "Unir una tabla consigo misma usando dos alias distintos, típico en jerarquías como empleado-jefe." },
    { front: "¿Dónde se coloca el (+) en la sintaxis antigua de outer join?", back: "En el lado de la tabla que puede tener valores ausentes (el lado 'opcional')." },
    { front: "¿Qué NO admite la sintaxis (+) de Oracle?", back: "No admite FULL OUTER JOIN, ni combinar (+) con OR o IN sobre la misma columna." },
    { front: "¿Qué es un non-equijoin?", back: "Un JOIN cuya condición usa un operador distinto de =, como BETWEEN, para asignar rangos." },
    { front: "¿Cuántos JOIN se pueden encadenar en una consulta?", back: "Tantos como tablas se necesiten unir, cada uno con su propia condición ON." }
  ],
  examples: [
    { title: "INNER JOIN (ANSI)", code: "SELECT e.last_name, d.department_name\nFROM employees e\nJOIN departments d ON e.department_id = d.department_id;" },
    { title: "LEFT JOIN", code: "SELECT e.last_name, d.department_name\nFROM employees e\nLEFT JOIN departments d ON e.department_id = d.department_id;" },
    { title: "Tres tablas", code: "SELECT e.last_name, d.department_name, l.city\nFROM employees e\nJOIN departments d ON e.department_id = d.department_id\nJOIN locations l ON d.location_id = l.location_id;" },
    { title: "Non-equijoin", code: "SELECT e.last_name, e.salary, j.grade_level\nFROM employees e\nJOIN job_grades j ON e.salary BETWEEN j.lowest_sal AND j.highest_sal;" }
  ],
  quiz: [
    { q: "¿Qué devuelve un LEFT JOIN que no devuelve un INNER JOIN?", options: [
        "Nada distinto, son iguales", "Las filas de la tabla izquierda sin coincidencia en la derecha (con NULL en las columnas de la derecha)",
        "Solo las filas coincidentes", "El producto cartesiano completo"
      ], a: 1,
      why: [
        "Sí hay diferencia cuando existen filas sin coincidencia en la tabla derecha.",
        "Correcta: LEFT JOIN conserva todas las filas de la izquierda aunque no haya coincidencia.",
        "Eso describiría un INNER JOIN, no la diferencia con LEFT JOIN.",
        "El producto cartesiano completo sería un CROSS JOIN, no un LEFT JOIN."
      ] },
    { q: "En la sintaxis antigua de Oracle, ¿qué representa 'd.department_id(+)'?", options: [
        "Que la tabla d es la que puede faltar (equivalente a LEFT JOIN desde la otra tabla)", "Un error de sintaxis",
        "Que se suma 1 al department_id", "Que es un INNER JOIN forzado"
      ], a: 0,
      why: [
        "Correcta: el (+) marca el lado 'opcional' de la relación, cuyas filas pueden faltar.",
        "Es sintaxis perfectamente válida en Oracle, aunque heredada.",
        "El (+) no realiza ninguna operación aritmética sobre la columna.",
        "Hace justo lo contrario de forzar un INNER JOIN: crea un OUTER JOIN."
      ] },
    { q: "¿Qué genera un CROSS JOIN entre una tabla de 5 filas y otra de 3 filas?", options: ["8 filas", "15 filas", "3 filas", "Error"], a: 1,
      why: [
        "8 sería la suma, no el producto cartesiano.",
        "Correcta: el producto cartesiano da 5 x 3 = 15 combinaciones.",
        "3 no corresponde a ningún cálculo relevante aquí.",
        "No es un error: CROSS JOIN es sintaxis válida y da un resultado bien definido."
      ] },
    { q: "¿Para qué sirve un self join?", options: [
        "Para unir una tabla con una vista", "Para unir una tabla consigo misma, típico en relaciones jerárquicas como empleado-jefe",
        "Para eliminar duplicados", "No existe en Oracle"
      ], a: 1,
      why: [
        "Un self join no requiere una vista: es la misma tabla dos veces con distinto alias.",
        "Correcta: se usan dos alias de la misma tabla para representar los dos 'roles' de la relación.",
        "Eliminar duplicados es función de DISTINCT, no de un self join.",
        "Sí existe y es una técnica habitual en Oracle SQL."
      ] },
    { q: "¿Qué operador se usa típicamente en un non-equijoin para asignar un rango salarial?", options: ["=", "BETWEEN", "LIKE", "IN"], a: 1,
      why: [
        "= sería un equijoin normal, no un non-equijoin.",
        "Correcta: BETWEEN es el operador típico para comprobar si un valor cae dentro de un rango.",
        "LIKE se usa para patrones de texto, no para rangos numéricos.",
        "IN compara contra una lista de valores discretos, no contra un rango continuo."
      ] },
    { q: "¿Cuántos JOIN como máximo se pueden encadenar en una sola consulta?", options: [
        "Solo 2", "Solo 3", "No hay un límite práctico fijo; se pueden encadenar tantos como tablas necesites unir", "Depende de si se usa ANSI o sintaxis antigua"
      ], a: 2,
      why: [
        "No hay una limitación de solo 2 JOIN en Oracle SQL.",
        "Tampoco se limita a 3: se pueden encadenar más si el modelo lo requiere.",
        "Correcta: se puede encadenar cualquier número razonable de JOIN, cada uno con su propia condición.",
        "El límite práctico no depende de qué sintaxis (ANSI o antigua) se use."
      ] },
    { q: "¿Qué combinación NO está permitida con la sintaxis antigua del operador (+)?", options: [
        "Usarlo en más de una tabla de la misma consulta", "Combinarlo con OR o IN sobre la misma columna",
        "Usarlo junto a una cláusula WHERE adicional", "Usarlo con más de dos tablas en total"
      ], a: 1,
      why: [
        "Sí se puede usar (+) en varias tablas distintas dentro de la misma consulta.",
        "Correcta: no se puede combinar (+) con OR o IN sobre la misma columna donde aparece el (+).",
        "Sí se pueden añadir condiciones adicionales en WHERE junto a la sintaxis (+).",
        "No hay una limitación estricta de solo dos tablas con esta sintaxis, aunque se complica rápidamente."
      ] },
    { q: "¿Qué ocurre si NATURAL JOIN encuentra dos columnas homónimas con significados distintos entre las tablas?", options: [
        "Oracle lanza un error automáticamente", "Las usa igualmente para unir, pudiendo dar un resultado incorrecto sin aviso",
        "Las ignora automáticamente y no las usa para el join", "Pide confirmación al usuario antes de ejecutar"
      ], a: 1,
      why: [
        "Oracle no detecta 'significados' de negocio; solo compara nombres y tipos de columna.",
        "Correcta: NATURAL JOIN usará esas columnas homónimas sin ningún aviso, incluso si el resultado no tiene sentido de negocio.",
        "No las ignora: si coinciden en nombre y tipo, se usan para la unión.",
        "No existe ningún mecanismo de confirmación interactiva en la ejecución de SQL."
      ] },
    { q: "¿Qué tabla del esquema HR modela clásicamente una relación N:N entre empleados y puestos a lo largo del tiempo?", options: ["DEPARTMENTS", "JOB_HISTORY", "LOCATIONS", "REGIONS"], a: 1,
      why: [
        "DEPARTMENTS es la tabla padre de una relación 1:N con employees, no la tabla intermedia N:N.",
        "Correcta: JOB_HISTORY actúa como tabla intermedia con claves foráneas hacia employees y jobs/departments.",
        "LOCATIONS no tiene relación directa con el historial de puestos.",
        "REGIONS es una tabla de referencia geográfica, no relacionada con historial de puestos."
      ] },
    { q: "¿Qué produce 'SELECT * FROM employees, departments;' sin ninguna condición WHERE ni JOIN?", options: [
        "Un error de sintaxis", "El producto cartesiano de ambas tablas",
        "Solo las filas coincidentes por department_id", "Ninguna fila, por seguridad"
      ], a: 1,
      why: [
        "Es sintaxis antigua válida (aunque desaconsejada), no da error.",
        "Correcta: sin condición de unión, la sintaxis con coma genera el producto cartesiano completo.",
        "Sin ninguna condición, Oracle no puede 'adivinar' que hay que unir por department_id.",
        "Oracle no bloquea por seguridad este tipo de consulta; simplemente ejecuta lo que se le pide."
      ] }
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
  id: 9, code: "M9", category: "Subconsultas",
  title: "Subconsultas",
  intro: "Consultas dentro de consultas: en WHERE, en SELECT, en FROM, correlacionadas, con EXISTS y con la cláusula WITH.",
  theory: {
    concepts: [
      { heading: "1. Subconsultas de una sola fila en WHERE",
        explanation: "Una subconsulta que devuelve una sola fila y una sola columna se puede comparar con operadores de una fila: =, >, <, >=, <=, <>. WHERE salary > (SELECT AVG(salary) FROM employees) compara cada salario con el único valor que devuelve la subconsulta.",
        syntax: "WHERE expr { = | > | < | >= | <= | <> } (subconsulta_de_una_fila)",
        examples: [
          { code: "SELECT last_name, salary\nFROM   employees\nWHERE  salary > (SELECT AVG(salary) FROM employees);" }
        ] },
      { heading: "2. Subconsultas multifila: IN, ANY y ALL",
        explanation: "Con IN se compara contra cualquiera de los valores devueltos por una subconsulta de varias filas: WHERE department_id IN (SELECT department_id FROM departments WHERE location_id = 1700). ANY y ALL comparan un valor contra todo un conjunto: > ANY significa 'mayor que al menos uno' (equivalente a mayor que el mínimo del conjunto); > ALL significa 'mayor que todos' (mayor que el máximo). Una subconsulta multicolumna compara varias columnas a la vez con IN: WHERE (department_id, job_id) IN (SELECT department_id, job_id FROM job_history WHERE ...).",
        syntax: "WHERE expr [NOT] IN (subconsulta)\nWHERE expr { > | < | >= | <= } { ANY | ALL } (subconsulta)",
        examples: [
          { code: "SELECT last_name, salary\nFROM   employees\nWHERE  salary > ALL (SELECT salary FROM employees WHERE department_id = 60);" }
        ] },
      { heading: "3. EXISTS y NOT EXISTS",
        explanation: "EXISTS comprueba si la subconsulta devuelve al menos una fila; no importa el contenido de esas filas, solo su existencia (por eso es habitual escribir SELECT 1 dentro). Suele ser más eficiente que IN con tablas grandes porque Oracle puede detener la búsqueda en cuanto encuentra la primera coincidencia. NOT EXISTS comprueba la ausencia de filas, y a diferencia de NOT IN, no tiene el problema de los NULL en la lista de comparación.",
        syntax: "WHERE [NOT] EXISTS (subconsulta)",
        examples: [
          { code: "SELECT d.department_name\nFROM   departments d\nWHERE  EXISTS (SELECT 1 FROM employees e WHERE e.department_id = d.department_id);" }
        ] },
      { heading: "4. Subconsultas correlacionadas",
        explanation: "Una subconsulta correlacionada referencia una columna de la consulta externa (por ejemplo d.department_id dentro de una subconsulta lanzada desde departments d), por lo que Oracle la reevalúa una vez por cada fila de la consulta externa, en vez de ejecutarla una sola vez de forma independiente. Es la base de EXISTS en la práctica, aunque también puede usarse con otros operadores de comparación." },
      { heading: "5. Subconsultas en SELECT y en FROM",
        explanation: "En la lista del SELECT, una subconsulta escalar debe devolver exactamente un valor por fila de la consulta externa. En el FROM, una subconsulta se comporta como una tabla temporal (también llamada 'vista en línea' o inline view), sobre la que la consulta externa puede filtrar, unir o agrupar como si fuera una tabla real; necesita alias si va a referenciarse.",
        examples: [
          { code: "SELECT department_id, media\nFROM   (SELECT department_id, AVG(salary) AS media\n        FROM   employees\n        GROUP BY department_id) t\nWHERE  media > 6000;" }
        ] },
      { heading: "6. La cláusula WITH (subquery factoring)",
        explanation: "WITH nombre AS (subconsulta) define al principio de la consulta una o varias subconsultas con nombre, reutilizables después como si fueran tablas dentro del mismo SELECT. Mejora la legibilidad y evita repetir la misma subconsulta varias veces; Oracle puede además materializarla una sola vez si se referencia más de una vez.",
        syntax: "WITH nombre1 AS (subconsulta1) [, nombre2 AS (subconsulta2) ...]\nSELECT ...\nFROM   nombre1, nombre2, ...",
        examples: [
          { code: "WITH media_dept AS (\n  SELECT department_id, AVG(salary) AS media\n  FROM   employees\n  GROUP BY department_id\n)\nSELECT department_id, media\nFROM   media_dept\nWHERE  media > 6000;" }
        ] },
      { heading: "7. Subconsultas en UPDATE y DELETE",
        explanation: "Las subconsultas también funcionan fuera del SELECT, típicamente en la condición WHERE de un UPDATE o un DELETE para filtrar filas según datos de otra tabla." ,
        examples: [
          { code: "UPDATE employees\nSET    salary = salary * 1.10\nWHERE  department_id = (SELECT department_id FROM departments WHERE department_name = 'IT');" }
        ] }
    ],
    oracleNotes: [
      "Usar = con una subconsulta que puede devolver varias filas provoca ORA-01427 (single-row subquery returns more than one row): hay que usar IN, ANY o ALL.",
      "> ANY significa mayor que el mínimo del conjunto; > ALL significa mayor que el máximo: son casi opuestos y el examen los confunde a propósito.",
      "Una subconsulta correlacionada se reevalúa una vez por cada fila de la consulta externa, lo que puede afectar al rendimiento en tablas grandes.",
      "NOT EXISTS no sufre el problema de NOT IN con NULL (visto en el nivel 2): comprueba existencia, no igualdad, así que un NULL en la subconsulta no invalida toda la condición.",
      "Una subconsulta en el SELECT que devuelva más de una fila para alguna fila externa produce también ORA-01427."
    ]
  },
  summary: [
    "Subconsulta de una fila: se compara con =, >, <, etc. Si devuelve varias filas, hay que usar IN, ANY o ALL.",
    "ANY compara contra el mínimo del conjunto; ALL contra el máximo.",
    "EXISTS/NOT EXISTS comprueban solo la existencia de filas, no su contenido, y no tienen el problema de NULL de NOT IN.",
    "Una subconsulta correlacionada depende de la fila externa y se reevalúa por cada una de ellas.",
    "Las subconsultas también funcionan en SELECT (escalares), FROM (vistas en línea), WITH (con nombre), UPDATE y DELETE."
  ],
  comparisonTable: {
    title: "IN vs EXISTS vs = vs ANY/ALL",
    headers: ["Mecanismo", "Filas que admite la subconsulta", "¿Sensible a NULL en la lista?", "Uso típico"],
    rows: [
      ["=", "Exactamente 1", "No aplica", "Comparar contra un único valor conocido"],
      ["IN", "Varias", "No (funciona igual con NULL en la lista)", "Comparar contra un conjunto de valores"],
      ["ANY / ALL", "Varias", "No", "Comparar contra el mínimo/máximo de un conjunto"],
      ["EXISTS", "Varias (solo importa si hay alguna)", "No", "Comprobar existencia, ideal con correlación"]
    ]
  },
  mindMap: [
    { topic: "Módulo 9 — Subconsultas", children: [
      "Una fila → =, >, <, etc.",
      "Varias filas → IN (atajo de OR), ANY (mín.), ALL (máx.)",
      "Existencia → EXISTS/NOT EXISTS, ideal correlacionada",
      "Correlacionada → referencia la fila externa, se reevalúa por cada una",
      "Como tabla → FROM (vista en línea), WITH (con nombre, reutilizable)",
      "Fuera del SELECT → también en UPDATE y DELETE"
    ] }
  ],
  sourceRefs: [
    "Oracle SQL Language Reference 19c — \"Subqueries\"",
    "Oracle SQL Language Reference 19c — \"EXISTS Condition\"",
    "Oracle SQL Language Reference 19c — \"SELECT\" (subquery_factoring_clause / WITH)"
  ],
  realCases: {
    business: "Un informe de RRHH usa WHERE salary > (SELECT AVG(salary) FROM employees) para identificar automáticamente a los empleados por encima de la media, sin tener que calcular y mantener ese umbral a mano cada mes.",
    dataEngineering: "Un ingeniero de datos usa la cláusula WITH para dar nombre a cálculos intermedios complejos en una consulta de varias etapas, mejorando la legibilidad de pipelines SQL largos sin crear vistas físicas innecesarias.",
    etl: "Un proceso de carga incremental usa NOT EXISTS (en vez de NOT IN) para identificar registros del origen que todavía no existen en el destino, evitando el problema de los NULL y aprovechando que Oracle puede parar en la primera coincidencia.",
    reporting: "Un dashboard que muestra 'departamentos por encima del promedio de la empresa' construye ese promedio como una subconsulta escalar en el SELECT, recalculándose automáticamente cada vez que cambian los datos base."
  },
  mistakes: [
    { mistake: "Usar = con una subconsulta que puede devolver varias filas.", why: "Provoca ORA-01427 (single-row subquery returns more than one row); el examen construye subconsultas que 'normalmente' devuelven una fila pero podrían devolver más, para comprobar si defensivamente usarías IN/ANY/ALL en su lugar." },
    { mistake: "Confundir > ANY (mayor que el mínimo) con > ALL (mayor que el máximo).", why: "Son casi opuestos en la práctica: ANY es una condición fácil de cumplir (basta superar al más bajo del conjunto), ALL es exigente (hay que superar al más alto). El examen las intercambia deliberadamente en preguntas de opción múltiple." },
    { mistake: "Usar NOT IN con una subconsulta que puede devolver NULL.", why: "Igual que en el módulo de WHERE, un solo NULL en los resultados de la subconsulta anula todo el NOT IN; NOT EXISTS no tiene este problema porque comprueba existencia, no igualdad." },
    { mistake: "No darse cuenta de que una subconsulta correlacionada se reevalúa por cada fila externa.", why: "En tablas grandes esto puede tener un coste de rendimiento significativo; el examen puede preguntar por qué una consulta con EXISTS correlacionado 'tarda más' de lo esperado en un escenario con muchas filas externas." }
  ],
  exercises: [
    { title: "Por encima de la media", difficulty: "básico", prompt: "Muestra los empleados que ganan más que la media general de salario.", hint: "WHERE salary > (SELECT AVG(salary) FROM employees)", solution: "SELECT last_name, salary FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);" },
    { title: "Departamentos con empleados", difficulty: "básico", prompt: "Usando EXISTS, lista los departamentos que tienen al menos un empleado.", hint: "WHERE EXISTS (subconsulta correlacionada)", solution: "SELECT department_name FROM departments d WHERE EXISTS (SELECT 1 FROM employees e WHERE e.department_id = d.department_id);" },
    { title: "Departamentos sin empleados", difficulty: "intermedio", prompt: "Usando NOT EXISTS, lista los departamentos que NO tienen ningún empleado asignado.", hint: "NOT EXISTS es más seguro que NOT IN aquí.", solution: "SELECT department_name FROM departments d\nWHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.department_id = d.department_id);" },
    { title: "Vista en línea con filtro", difficulty: "intermedio", prompt: "Usando una subconsulta en FROM, muestra solo los departamentos cuyo salario medio supera los 7000.", hint: "Agrupa dentro de la subconsulta, filtra fuera.", solution: "SELECT department_id, media FROM (\n  SELECT department_id, AVG(salary) AS media FROM employees GROUP BY department_id\n) t\nWHERE media > 7000;" },
    { title: "Reescribir con WITH", difficulty: "avanzado", prompt: "Reescribe el ejercicio anterior usando la cláusula WITH en vez de una subconsulta en FROM.", hint: "WITH nombre AS (subconsulta)", solution: "WITH media_dept AS (\n  SELECT department_id, AVG(salary) AS media FROM employees GROUP BY department_id\n)\nSELECT department_id, media FROM media_dept WHERE media > 7000;" },
    { title: "ANY vs ALL en la práctica", difficulty: "avanzado", prompt: "Muestra los empleados que ganan más que TODOS los empleados del departamento 60, y por separado los que ganan más que AL MENOS UNO de ellos. Explica la diferencia de tamaño de ambos resultados.", hint: "ALL exige superar al máximo; ANY solo al mínimo.", solution: "-- Más que todos:\nSELECT last_name, salary FROM employees WHERE salary > ALL (SELECT salary FROM employees WHERE department_id = 60);\n-- Más que al menos uno:\nSELECT last_name, salary FROM employees WHERE salary > ANY (SELECT salary FROM employees WHERE department_id = 60);\n-- El segundo resultado es siempre igual o más grande que el primero, porque su condición es más fácil de cumplir." }
  ],
  solved: [
    { title: "Corregir un ORA-01427",
      problem: "WHERE department_id = (SELECT department_id FROM employees WHERE job_id = 'SA_REP'); falla con ORA-01427 porque varios empleados tienen ese job_id.",
      steps: [
        "Reconoce que la subconsulta puede devolver más de una fila (varios department_id para 'SA_REP').",
        "Decide que quieres comparar contra CUALQUIERA de esos department_id, no contra un único valor.",
        "Cambia el operador = por IN, que sí admite subconsultas multifila.",
        "Verifica que la consulta ya no falla y devuelve empleados de cualquiera de esos departamentos."
      ],
      query: "SELECT last_name, department_id\nFROM   employees\nWHERE  department_id IN (SELECT department_id FROM employees WHERE job_id = 'SA_REP');",
      result: "Ya no lanza ORA-01427; devuelve empleados de todos los departamentos con al menos un SA_REP." },
    { title: "Elegir NOT EXISTS en vez de NOT IN para evitar el problema de NULL",
      problem: "Necesitas los departamentos sin ningún empleado, pero employees.department_id puede tener NULL en algunas filas.",
      steps: [
        "Recuerda que NOT IN falla silenciosamente si la subconsulta devuelve algún NULL.",
        "Descartas NOT IN por ese riesgo, sin necesidad de filtrar NULL manualmente.",
        "Usas NOT EXISTS con una subconsulta correlacionada, que compara por existencia, no por igualdad.",
        "Confirmas que el resultado es correcto independientemente de los NULL en employees.department_id."
      ],
      query: "SELECT department_name\nFROM   departments d\nWHERE  NOT EXISTS (SELECT 1 FROM employees e WHERE e.department_id = d.department_id);",
      result: "Devuelve correctamente los departamentos sin empleados, sin verse afectado por los NULL." }
  ],
  flashcards: [
    { front: "¿Qué error da usar = con una subconsulta multifila?", back: "ORA-01427: single-row subquery returns more than one row." },
    { front: "¿Qué significa '> ANY'?", back: "Mayor que al menos uno de los valores del conjunto (equivalente a mayor que el mínimo)." },
    { front: "¿Qué significa '> ALL'?", back: "Mayor que todos los valores del conjunto (equivalente a mayor que el máximo)." },
    { front: "¿Qué comprueba EXISTS?", back: "Si la subconsulta devuelve al menos una fila; no le importa el contenido." },
    { front: "¿Por qué NOT EXISTS es más seguro que NOT IN?", back: "Porque no sufre el problema de anularse ante un NULL en la subconsulta." },
    { front: "¿Qué es una subconsulta correlacionada?", back: "Una que referencia una columna de la consulta externa y se reevalúa por cada fila de esta." },
    { front: "¿Qué es una vista en línea?", back: "Una subconsulta en la cláusula FROM, que se comporta como una tabla temporal." },
    { front: "¿Para qué sirve la cláusula WITH?", back: "Para dar nombre a una subconsulta y reutilizarla varias veces en la misma consulta, mejorando legibilidad." }
  ],
  examples: [
    { title: "Subconsulta simple en WHERE", code: "SELECT last_name, salary\nFROM employees\nWHERE salary > (SELECT AVG(salary) FROM employees);" },
    { title: "ANY / ALL", code: "SELECT last_name, salary\nFROM employees\nWHERE salary > ALL (SELECT salary FROM employees WHERE department_id = 60);" },
    { title: "EXISTS correlacionada", code: "SELECT d.department_name\nFROM departments d\nWHERE EXISTS (SELECT 1 FROM employees e WHERE e.department_id = d.department_id);" },
    { title: "WITH", code: "WITH media_dept AS (\n  SELECT department_id, AVG(salary) AS media FROM employees GROUP BY department_id\n)\nSELECT * FROM media_dept WHERE media > 6000;" }
  ],
  quiz: [
    { q: "¿Qué error da Oracle si usas = con una subconsulta que devuelve varias filas?", options: ["ORA-00937", "ORA-01427", "ORA-00001", "ORA-00904"], a: 1,
      why: [
        "ORA-00937 corresponde a mezclar columna suelta con función de grupo sin GROUP BY.",
        "Correcta: ORA-01427 (single-row subquery returns more than one row); debería usarse IN, ANY o ALL.",
        "ORA-00001 corresponde a violación de restricción UNIQUE.",
        "ORA-00904 corresponde a identificador inválido."
      ] },
    { q: "'salary > ANY (subconsulta)' significa...", options: [
        "salary es mayor que TODOS los valores de la subconsulta", "salary es mayor que AL MENOS UNO de los valores de la subconsulta",
        "salary es igual a alguno de los valores", "Da error de sintaxis"
      ], a: 1,
      why: [
        "Eso describiría ALL, no ANY.",
        "Correcta: ANY equivale a 'mayor que el mínimo' de la lista.",
        "ANY con > no compara igualdad, compara magnitud.",
        "Es sintaxis perfectamente válida en Oracle."
      ] },
    { q: "¿Qué caracteriza a una subconsulta correlacionada?", options: [
        "Se ejecuta una sola vez antes que la consulta externa", "Referencia una columna de la consulta externa y se reevalúa por cada fila externa",
        "Solo puede usarse con EXISTS", "No puede usarse en WHERE"
      ], a: 1,
      why: [
        "Eso describiría una subconsulta NO correlacionada (independiente).",
        "Correcta: la correlación con la fila externa es lo que la distingue de una subconsulta independiente.",
        "También puede combinarse con otros operadores de comparación, no solo EXISTS.",
        "Sí puede usarse en WHERE; de hecho es su ubicación más habitual."
      ] },
    { q: "¿Dónde se puede usar una subconsulta como si fuera una tabla?", options: ["Solo en WHERE", "Solo en HAVING", "En la cláusula FROM (vista en línea)", "No es posible en Oracle"], a: 2,
      why: [
        "En WHERE una subconsulta se usa como valor de comparación, no como tabla.",
        "HAVING tampoco trata una subconsulta como una tabla completa.",
        "Correcta: una subconsulta en FROM actúa como tabla temporal para la consulta externa.",
        "Sí es posible, y es una técnica muy habitual en Oracle SQL."
      ] },
    { q: "¿Qué ventaja tiene NOT EXISTS sobre NOT IN cuando la subconsulta puede devolver NULL?", options: [
        "Ninguna, se comportan exactamente igual", "NOT EXISTS no se ve afectado por los NULL de la subconsulta, a diferencia de NOT IN",
        "NOT EXISTS es siempre más lento", "NOT IN no existe en Oracle"
      ], a: 1,
      why: [
        "Sí hay una diferencia de comportamiento importante ante NULL.",
        "Correcta: NOT EXISTS comprueba existencia, no igualdad, por lo que no se anula ante un NULL en la subconsulta.",
        "No es una regla general de rendimiento; depende del caso, pero la corrección del resultado es lo más relevante aquí.",
        "NOT IN sí existe y es sintaxis válida, solo que con esta limitación conocida."
      ] },
    { q: "¿Qué necesita una subconsulta usada en la cláusula FROM?", options: [
        "Nada especial, puede omitir cualquier detalle", "Un alias, para poder referenciarla desde la consulta externa",
        "Debe devolver exactamente una fila", "Debe estar precedida por la palabra WITH"
      ], a: 1,
      why: [
        "Sí necesita un detalle importante: el alias.",
        "Correcta: una subconsulta en FROM necesita un alias para poder referenciar sus columnas en el resto de la consulta.",
        "Puede devolver cualquier número de filas: se comporta como una tabla completa, no como un valor escalar.",
        "WITH es una alternativa distinta (subquery factoring), no un requisito de las subconsultas en FROM."
      ] },
    { q: "¿Qué permite hacer la cláusula WITH que una subconsulta normal en FROM no permite tan fácilmente?", options: [
        "Nada distinto, son exactamente equivalentes en todos los casos", "Dar nombre a la subconsulta y potencialmente reutilizarla varias veces en la misma consulta",
        "Ejecutarse antes que el resto de la sentencia SQL siempre en paralelo", "Evitar el uso de JOIN por completo"
      ], a: 1,
      why: [
        "Hay una ventaja práctica real: la reutilización con nombre.",
        "Correcta: WITH define la subconsulta una vez y permite referenciarla por su nombre tantas veces como se necesite.",
        "No implica paralelismo automático; es una cuestión de organización del código, no de plan de ejecución garantizado.",
        "WITH no sustituye a JOIN: de hecho a menudo se combina con JOIN sobre las subconsultas nombradas."
      ] },
    { q: "¿En qué otras sentencias, además de SELECT, se pueden usar subconsultas?", options: [
        "Solo en SELECT, en ninguna otra sentencia", "También en UPDATE y DELETE, típicamente en su condición WHERE",
        "Solo en CREATE TABLE", "Solo en GRANT"
      ], a: 1,
      why: [
        "Las subconsultas no se limitan a SELECT.",
        "Correcta: UPDATE y DELETE también pueden usar subconsultas para filtrar filas según datos de otra tabla.",
        "CREATE TABLE no usa subconsultas de esta forma (aunque existe CREATE TABLE AS SELECT, es un concepto distinto).",
        "GRANT no admite subconsultas de este tipo."
      ] },
    { q: "¿Qué pasa si una subconsulta escalar en el SELECT devuelve más de una fila para alguna fila de la consulta externa?", options: [
        "Oracle toma la primera fila automáticamente", "Se produce el mismo error ORA-01427 que con una comparación =",
        "Se ignora esa fila externa sin error", "Oracle promedia los valores automáticamente"
      ], a: 1,
      why: [
        "Oracle no elige 'la primera' de forma implícita: lo trata como un error.",
        "Correcta: una subconsulta escalar debe devolver como máximo una fila; si devuelve más, lanza ORA-01427.",
        "No omite la fila silenciosamente: lanza un error que detiene la consulta.",
        "Oracle no promedia automáticamente valores de una subconsulta escalar."
      ] },
    { q: "¿Qué comparación NO sería válida directamente con IN sobre una subconsulta multicolumna?", options: [
        "WHERE (a, b) IN (SELECT x, y FROM tabla)", "WHERE a IN (SELECT x FROM tabla)",
        "WHERE a = ANY (SELECT x FROM tabla)", "Todas son válidas en Oracle"
      ], a: 3,
      why: [
        "Esta es una forma válida de IN multicolumna en Oracle.",
        "Esta es la forma más común y también válida.",
        "= ANY es equivalente a IN y también es válida.",
        "Correcta: las tres formas mostradas son sintácticamente válidas en Oracle SQL."
      ] }
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
  id: 10, code: "M10", category: "SELECT",
  title: "Operadores de conjunto",
  intro: "Combinar los resultados de dos o más SELECT compatibles.",
  theory: {
    concepts: [
      { heading: "1. Requisitos comunes de los operadores de conjunto",
        explanation: "UNION, UNION ALL, INTERSECT y MINUS combinan verticalmente el resultado de dos o más consultas SELECT. Todas las consultas combinadas deben devolver el mismo número de columnas, con tipos de datos compatibles en cada posición (no necesariamente idénticos, pero convertibles); los nombres de columna del resultado final son los que aparecen en la primera consulta del bloque.",
        syntax: "consulta1\n{ UNION | UNION ALL | INTERSECT | MINUS }\nconsulta2\n[{ UNION | UNION ALL | INTERSECT | MINUS } consulta3 ...]\n[ORDER BY columna_o_posición]" },
      { heading: "2. UNION y UNION ALL",
        explanation: "UNION combina los resultados de dos consultas y elimina duplicados; internamente ordena y compara todas las filas, lo que tiene un coste de rendimiento. UNION ALL combina sin eliminar duplicados, por lo que es más rápido: conviene usarlo siempre que se sepa que no puede haber filas repetidas entre ambas consultas, o que los duplicados no importan.",
        examples: [
          { code: "SELECT department_id FROM employees\nUNION\nSELECT department_id FROM departments;" }
        ] },
      { heading: "3. INTERSECT",
        explanation: "Devuelve solo las filas que aparecen en ambos resultados a la vez (la intersección de los dos conjuntos), eliminando duplicados.",
        examples: [
          { code: "SELECT employee_id FROM employees WHERE department_id = 50\nINTERSECT\nSELECT employee_id FROM employees WHERE salary > 5000;" }
        ] },
      { heading: "4. MINUS en vez de EXCEPT",
        explanation: "Oracle no implementa la palabra EXCEPT del estándar ANSI SQL: en su lugar usa MINUS, con el mismo significado — devuelve las filas de la primera consulta que NO aparecen en la segunda. EXCEPT no existe en Oracle SQL y da error de sintaxis; es uno de los cambios de sintaxis que más pregunta el examen frente a otros motores de base de datos.",
        examples: [
          { code: "SELECT department_id FROM departments\nMINUS\nSELECT department_id FROM employees;" }
        ] },
      { heading: "5. ORDER BY en consultas combinadas",
        explanation: "Solo se puede usar un ORDER BY al final de toda la combinación, nunca en cada SELECT individual (un ORDER BY intermedio da error de sintaxis, salvo dentro de una subconsulta entre paréntesis). Ese ORDER BY final debe referirse a las columnas por su nombre en la primera consulta, por su alias, o por posición numérica." }
    ],
    oracleNotes: [
      "Oracle no tiene EXCEPT: el equivalente es MINUS. Es una de las preguntas de sintaxis más repetidas del examen.",
      "UNION ordena y elimina duplicados (más lento); UNION ALL los conserva (más rápido); usa UNION ALL cuando sepas que no habrá duplicados o no te importan.",
      "Solo puede haber un ORDER BY, al final de toda la combinación, nunca en cada SELECT por separado.",
      "Los nombres/alias de columna que se ven en el resultado final son siempre los de la primera consulta del bloque, aunque las siguientes usen otros alias.",
      "MINUS e INTERSECT no tienen versión '...ALL' en Oracle (a diferencia de UNION): siempre eliminan duplicados en su resultado."
    ]
  },
  summary: [
    "UNION combina y elimina duplicados; UNION ALL combina conservándolos y es más rápido.",
    "INTERSECT devuelve las filas comunes a ambas consultas.",
    "MINUS devuelve las filas de la primera consulta que no están en la segunda (Oracle no tiene EXCEPT).",
    "Las consultas combinadas deben tener el mismo número de columnas con tipos compatibles.",
    "Solo un ORDER BY, al final de todo el bloque combinado."
  ],
  comparisonTable: {
    title: "Operadores de conjunto de un vistazo",
    headers: ["Operador", "Elimina duplicados", "Equivalente ANSI que Oracle NO tiene", "Admite versión ALL"],
    rows: [
      ["UNION", "Sí", "—", "Sí (UNION ALL)"],
      ["INTERSECT", "Sí", "—", "No"],
      ["MINUS", "Sí", "EXCEPT (no existe en Oracle)", "No"]
    ]
  },
  mindMap: [
    { topic: "Módulo 10 — Operadores de conjunto", children: [
      "Requisito → mismo número de columnas, tipos compatibles",
      "UNION → combina y elimina duplicados (más lento)",
      "UNION ALL → combina conservando duplicados (más rápido)",
      "INTERSECT → solo filas comunes a ambas consultas",
      "MINUS → filas de la 1ª que no están en la 2ª (Oracle no tiene EXCEPT)",
      "ORDER BY → solo uno, al final de todo el bloque"
    ] }
  ],
  sourceRefs: [
    "Oracle SQL Language Reference 19c — \"SELECT\" (compound_query, set operators UNION/UNION ALL/INTERSECT/MINUS)"
  ],
  realCases: {
    business: "Un informe consolidado de contactos usa UNION para combinar la lista de clientes y la lista de proveedores en un único directorio, eliminando automáticamente cualquier entidad que aparezca en ambos roles.",
    dataEngineering: "Un ingeniero de datos usa MINUS para auditar una migración: compara el conjunto de claves en el sistema origen contra el destino, detectando en una sola consulta qué registros no se migraron.",
    etl: "Un proceso de reconciliación usa INTERSECT para verificar qué claves de negocio existen simultáneamente en dos extracciones de distintos sistemas antes de decidir cómo fusionarlas.",
    reporting: "Un dashboard que combina ventas de dos regiones con estructuras de consulta similares usa UNION ALL (no UNION) porque sabe que los IDs de venta de cada región son disjuntos por diseño, evitando el coste innecesario de eliminar duplicados que no pueden existir."
  },
  mistakes: [
    { mistake: "Escribir EXCEPT en Oracle pensando que existe.", why: "Da error de sintaxis directamente: Oracle nunca implementó EXCEPT como sinónimo de MINUS, a diferencia de otros motores. El examen lo presenta porque es el cambio de sintaxis más buscado por quien viene de SQL Server o PostgreSQL." },
    { mistake: "Combinar consultas con distinto número de columnas o tipos incompatibles.", why: "Oracle exige coincidencia exacta en NÚMERO de columnas (aunque los nombres puedan diferir) y compatibilidad de TIPO en cada posición; el examen presenta un UNION con una columna de más o de menos para comprobar si detectas el error antes de ejecutar." },
    { mistake: "Poner ORDER BY en cada SELECT individual de la combinación.", why: "Solo se permite un ORDER BY, al final de todo el bloque; un ORDER BY intermedio (fuera de una subconsulta con paréntesis) da error de sintaxis, no un resultado parcialmente ordenado." },
    { mistake: "Usar UNION cuando UNION ALL sería suficiente y más eficiente.", why: "UNION ordena y compara internamente todas las filas para eliminar duplicados, un coste evitable cuando se sabe con certeza que los conjuntos son disjuntos o que los duplicados no afectan al resultado esperado." }
  ],
  exercises: [
    { title: "Departamentos sin empleados con MINUS", difficulty: "básico", prompt: "Usa el operador de conjunto adecuado para listar los department_id que existen en departments pero no tienen empleados en employees.", hint: "MINUS, no EXCEPT", solution: "SELECT department_id FROM departments\nMINUS\nSELECT department_id FROM employees;" },
    { title: "IDs combinados sin duplicados", difficulty: "básico", prompt: "Combina los department_id de employees y departments en una sola lista sin duplicados.", hint: "UNION", solution: "SELECT department_id FROM employees\nUNION\nSELECT department_id FROM departments;" },
    { title: "Intersección de condiciones", difficulty: "intermedio", prompt: "Obtén los employee_id que están tanto en el departamento 50 como con salario mayor a 4000, usando INTERSECT.", hint: "INTERSECT combina dos condiciones sobre la misma tabla.", solution: "SELECT employee_id FROM employees WHERE department_id = 50\nINTERSECT\nSELECT employee_id FROM employees WHERE salary > 4000;" },
    { title: "UNION ALL justificado", difficulty: "intermedio", prompt: "Explica por qué UNION ALL suele preferirse a UNION cuando sabes que no puede haber duplicados entre las dos consultas.", hint: "Piensa en el coste interno de eliminar duplicados.", solution: "Porque UNION internamente ordena y compara todas las filas para eliminar duplicados, lo cual tiene coste; si sabes que no hay duplicados posibles, UNION ALL da el mismo resultado sin ese coste extra." },
    { title: "Reescribir un EXCEPT importado", difficulty: "avanzado", prompt: "Alguien trae código de otro motor con 'SELECT a FROM t1 EXCEPT SELECT a FROM t2;'. Reescríbelo para que funcione en Oracle.", hint: "Sustituye directamente la palabra clave.", solution: "SELECT a FROM t1\nMINUS\nSELECT a FROM t2;" },
    { title: "Ordenar un resultado combinado", difficulty: "avanzado", prompt: "Combina employees y una tabla ficticia ex_employees (mismas columnas) con UNION, y ordena el resultado final por last_name.", hint: "El ORDER BY va una sola vez, al final.", solution: "SELECT employee_id, last_name FROM employees\nUNION\nSELECT employee_id, last_name FROM ex_employees\nORDER BY last_name;" }
  ],
  solved: [
    { title: "Diagnosticar un error de columnas incompatibles",
      problem: "SELECT employee_id, last_name FROM employees UNION SELECT department_name FROM departments; falla.",
      steps: [
        "Cuenta las columnas de cada SELECT: la primera tiene 2, la segunda tiene 1.",
        "Reconoce que UNION exige el mismo número de columnas en ambas consultas.",
        "Decide qué columna añadir o quitar para igualar el número: por ejemplo, añade department_id a la segunda consulta.",
        "Verifica además que los tipos de dato en cada posición sean compatibles."
      ],
      query: "SELECT employee_id, last_name FROM employees\nUNION\nSELECT department_id, department_name FROM departments;",
      result: "Ahora ambas consultas tienen 2 columnas con tipos compatibles (NUMBER y VARCHAR2 en cada posición)." },
    { title: "Elegir el operador de conjunto correcto para una auditoría",
      problem: "Necesitas saber qué employee_id de una tabla de respaldo backup_employees ya NO existen en la tabla employees actual.",
      steps: [
        "Identifica que buscas 'lo que está en backup pero no en la actual': es una resta de conjuntos.",
        "Descartas UNION (combinaría ambos) e INTERSECT (daría solo los que SÍ coinciden).",
        "Eliges MINUS, con backup_employees como primera consulta.",
        "Verifica el resultado: son los employee_id que se dieron de baja."
      ],
      query: "SELECT employee_id FROM backup_employees\nMINUS\nSELECT employee_id FROM employees;",
      result: "Devuelve los employee_id que existían en el respaldo pero ya no están en la tabla actual." }
  ],
  flashcards: [
    { front: "¿Qué requisito de columnas exigen los operadores de conjunto?", back: "El mismo número de columnas en cada consulta, con tipos de dato compatibles en cada posición." },
    { front: "¿Qué diferencia hay entre UNION y UNION ALL?", back: "UNION elimina duplicados (más lento); UNION ALL los conserva (más rápido)." },
    { front: "¿Qué devuelve INTERSECT?", back: "Solo las filas que aparecen en ambos resultados a la vez." },
    { front: "¿Qué palabra usa Oracle en vez de EXCEPT?", back: "MINUS, con el mismo significado." },
    { front: "¿Cuántos ORDER BY puede tener una consulta combinada?", back: "Solo uno, al final de todo el bloque." },
    { front: "¿Qué nombres de columna se ven en el resultado final combinado?", back: "Los de la primera consulta del bloque." },
    { front: "¿Tienen MINUS e INTERSECT una versión 'ALL'?", back: "No, a diferencia de UNION; siempre eliminan duplicados." }
  ],
  examples: [
    { title: "UNION vs UNION ALL", code: "SELECT department_id FROM employees\nUNION\nSELECT department_id FROM departments;\n\n-- con duplicados permitidos y más rápido:\nSELECT department_id FROM employees\nUNION ALL\nSELECT department_id FROM departments;" },
    { title: "MINUS", code: "SELECT department_id FROM departments\nMINUS\nSELECT department_id FROM employees;\n-- departamentos que NO tienen ningún empleado" },
    { title: "INTERSECT", code: "SELECT employee_id FROM employees WHERE department_id = 50\nINTERSECT\nSELECT employee_id FROM employees WHERE salary > 5000;" }
  ],
  quiz: [
    { q: "¿Qué palabra clave usa Oracle en vez de EXCEPT?", options: ["DIFF", "MINUS", "SUBTRACT", "NOT IN"], a: 1,
      why: [
        "DIFF no es una palabra clave de Oracle SQL.",
        "Correcta: Oracle no soporta EXCEPT; el equivalente exacto es MINUS.",
        "SUBTRACT no es un operador de conjunto en Oracle.",
        "NOT IN es un operador de comparación en WHERE, no un operador de conjunto entre consultas."
      ] },
    { q: "¿Qué diferencia hay entre UNION y UNION ALL?", options: [
        "Son idénticos", "UNION elimina duplicados, UNION ALL los conserva (y es más rápido)",
        "UNION ALL elimina duplicados y UNION no", "UNION ALL no existe en Oracle"
      ], a: 1,
      why: [
        "No son idénticos: su tratamiento de duplicados es distinto.",
        "Correcta: UNION ordena y elimina duplicados; UNION ALL simplemente concatena resultados.",
        "Es exactamente al revés de lo que dice esta opción.",
        "UNION ALL existe y es sintaxis muy habitual en Oracle."
      ] },
    { q: "¿Qué requisito deben cumplir las consultas combinadas con operadores de conjunto?", options: [
        "Consultar la misma tabla obligatoriamente", "Tener el mismo número de columnas con tipos compatibles",
        "Tener el mismo WHERE", "No pueden tener funciones de grupo"
      ], a: 1,
      why: [
        "No es obligatorio consultar la misma tabla; pueden ser tablas completamente distintas.",
        "Correcta: el número de columnas y su compatibilidad de tipo es obligatorio; los nombres pueden diferir.",
        "Cada consulta puede tener su propio WHERE independiente.",
        "Sí pueden usar funciones de grupo, cada consulta de forma independiente."
      ] },
    { q: "¿Dónde se coloca el ORDER BY en una consulta combinada con UNION?", options: [
        "En cada SELECT individual", "Solo al final de toda la combinación", "No se puede usar ORDER BY con UNION", "Antes del primer SELECT"
      ], a: 1,
      why: [
        "Un ORDER BY en cada SELECT individual (fuera de subconsultas con paréntesis) da error de sintaxis.",
        "Correcta: solo puede haber un ORDER BY, al final de todo el bloque combinado.",
        "Sí se puede usar, siempre que sea uno solo y al final.",
        "No tiene sentido colocarlo antes del primer SELECT: ordenaría datos que aún no existen como resultado."
      ] },
    { q: "¿Qué devuelve 'SELECT a FROM t1 INTERSECT SELECT a FROM t2' si ningún valor de a coincide entre t1 y t2?", options: ["Todos los valores de t1", "Todos los valores de t2", "Un conjunto vacío", "Error"], a: 2,
      why: [
        "INTERSECT no devuelve todos los de t1 si no hay coincidencias.",
        "Tampoco devuelve todos los de t2 en ese caso.",
        "Correcta: si no hay ningún valor en común, el resultado es un conjunto vacío, sin error.",
        "No es un error: es un resultado válido y esperado cuando no hay intersección."
      ] },
    { q: "¿Qué nombres de columna aparecen en el resultado de una consulta combinada con UNION?", options: [
        "Los de la última consulta del bloque", "Los de la primera consulta del bloque",
        "Una combinación alfabética de ambos conjuntos de nombres", "Ninguno; Oracle genera nombres genéricos"
      ], a: 1,
      why: [
        "No son los de la última consulta.",
        "Correcta: los nombres o alias visibles en el resultado final son los de la PRIMERA consulta del bloque.",
        "No hay ninguna combinación alfabética automática de nombres.",
        "Sí aparecen nombres reales, tomados de la primera consulta."
      ] },
    { q: "¿Tienen MINUS e INTERSECT una versión '...ALL' como UNION ALL?", options: ["Sí, ambas", "No, ninguna de las dos", "Solo MINUS", "Solo INTERSECT"], a: 1,
      why: [
        "No tienen esa versión en Oracle SQL estándar.",
        "Correcta: a diferencia de UNION, ni MINUS ni INTERSECT tienen una variante '...ALL'; siempre eliminan duplicados.",
        "MINUS tampoco tiene esa variante.",
        "INTERSECT tampoco la tiene."
      ] },
    { q: "¿Qué ocurre si dos consultas combinadas con UNION tienen el mismo número de columnas pero tipos incompatibles en alguna posición?", options: [
        "Oracle las convierte silenciosamente sin problema en todos los casos", "Oracle lanza un error si no puede encontrar una conversión implícita válida",
        "Ignora esa columna automáticamente", "Solo funciona si ambas columnas son VARCHAR2"
      ], a: 1,
      why: [
        "No siempre puede convertir silenciosamente: depende de si los tipos son compatibles.",
        "Correcta: si Oracle no encuentra una conversión implícita válida entre los tipos de esa posición, lanza un error.",
        "No ignora columnas: todas las posiciones deben ser compatibles.",
        "No es una limitación exclusiva de VARCHAR2; también funciona con NUMBER/DATE compatibles entre sí."
      ] },
    { q: "¿Cuál es la forma correcta de expresar 'lo que hay en t1 pero no en t2' en Oracle?", options: ["t1 EXCEPT t2", "t1 MINUS t2", "t1 DIFF t2", "t1 NOT IN t2"], a: 1,
      why: [
        "EXCEPT no existe en Oracle SQL.",
        "Correcta: MINUS es el operador de conjunto equivalente en Oracle.",
        "DIFF no es una palabra clave válida de Oracle SQL para esto.",
        "NOT IN es un operador de comparación de valores, no un operador de conjunto entre dos consultas completas."
      ] },
    { q: "¿Por qué conviene evitar UNION cuando se sabe con certeza que ambas consultas no pueden producir filas duplicadas?", options: [
        "Porque UNION daría un resultado distinto a UNION ALL en ese caso", "Porque UNION ordena y compara igualmente todas las filas, un coste innecesario si no hay duplicados posibles",
        "Porque UNION no está disponible en todas las versiones de Oracle", "No hay ninguna razón real para preferir UNION ALL en ese caso"
      ], a: 1,
      why: [
        "El resultado sería el mismo en ambos casos si de verdad no hay duplicados; la diferencia está en el coste, no en el resultado.",
        "Correcta: UNION siempre realiza el trabajo de ordenar y comparar para eliminar duplicados, aunque termine no encontrando ninguno.",
        "UNION está disponible en todas las versiones soportadas de Oracle.",
        "Sí hay una razón real: el rendimiento, evitando un coste de proceso innecesario."
      ] }
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
  id: 11, code: "M11", category: "DML",
  title: "Manipulación de datos (DML) y control de transacciones",
  intro: "Las sentencias que cambian datos —INSERT, UPDATE, DELETE, MERGE— y el mecanismo que las agrupa en unidades seguras: transacciones, COMMIT/ROLLBACK/SAVEPOINT, las propiedades ACID y la posibilidad de consultar el pasado con Flashback Query.",
  theory: {
    concepts: [
      { heading: "1. INSERT de una fila y desde SELECT",
        explanation: "INSERT INTO tabla (col1, col2, ...) VALUES (valor1, valor2, ...) añade una fila indicando explícitamente qué columnas se rellenan; las columnas omitidas quedan NULL o toman su valor por defecto. Si se listan todas las columnas en el mismo orden exacto de la tabla, se puede omitir la lista de columnas, aunque es una práctica frágil ante cambios de estructura y no se recomienda en código real. También se puede insertar el resultado de una consulta completa en lugar de VALUES: INSERT INTO tabla (col1, col2) SELECT colA, colB FROM otra_tabla WHERE ....",
        syntax: "INSERT INTO tabla [(columna1 [, columna2, ...])]\nVALUES (valor1 [, valor2, ...])\n\nINSERT INTO tabla [(columna1 [, columna2, ...])]\nsubconsulta",
        examples: [
          { code: "INSERT INTO departments (department_id, department_name, location_id)\nVALUES (280, 'Innovación', 1700);" }
        ] },
      { heading: "2. UPDATE",
        explanation: "UPDATE tabla SET columna1 = valor1 [, columna2 = valor2 ...] [WHERE condición]; modifica las filas que cumplen la condición. Si se omite WHERE, se actualizan TODAS las filas de la tabla: uno de los errores más peligrosos y frecuentes en producción. El valor asignado puede ser un literal, una expresión, el resultado de una subconsulta escalar, o la palabra clave DEFAULT.",
        syntax: "UPDATE tabla\nSET columna1 = valor1 [, columna2 = valor2 ...]\n[WHERE condición]",
        examples: [
          { code: "UPDATE employees\nSET    salary = salary * 1.05\nWHERE  department_id = 60;" }
        ] },
      { heading: "3. DELETE",
        explanation: "DELETE FROM tabla [WHERE condición]; elimina filas completas. Igual que UPDATE, si se omite WHERE se borran todas las filas de la tabla, aunque a diferencia de DROP TABLE o TRUNCATE (nivel 12) mantiene la estructura de la tabla intacta y es una operación DML (registrable, se puede deshacer con ROLLBACK antes de hacer COMMIT).",
        syntax: "DELETE [FROM] tabla\n[WHERE condición]" },
      { heading: "4. INSERT multitabla: INSERT ALL / INSERT FIRST",
        explanation: "Extensión exclusiva de Oracle (no estándar ANSI): permite insertar el resultado de una sola subconsulta en varias tablas a la vez, sin leer la fuente de datos más de una vez. INSERT ALL evalúa cada rama WHEN de forma independiente e inserta en todas las que cumplan su condición (una fila puede acabar en varias tablas). INSERT FIRST evalúa las ramas en orden y solo inserta en la primera que cumpla, ignorando el resto aunque también se cumplieran.",
        syntax: "INSERT { ALL | FIRST }\n  WHEN condición1 THEN INTO tabla1 [(columnas)] [VALUES (...)]\n  [WHEN condición2 THEN INTO tabla2 [(columnas)] [VALUES (...)]]\n  [ELSE INTO tablaN [(columnas)] [VALUES (...)]]\nsubconsulta",
        examples: [
          { code: "INSERT ALL\n  WHEN salary > 10000 THEN INTO altos_salarios\n  WHEN salary <= 10000 THEN INTO resto_salarios\nSELECT employee_id, salary FROM employees;" }
        ] },
      { heading: "5. MERGE",
        explanation: "MERGE combina INSERT y UPDATE (y opcionalmente DELETE) en una sola sentencia, comúnmente llamada 'upsert': compara una tabla/consulta origen con una tabla destino según una condición ON, y si la fila ya existe en el destino la actualiza (WHEN MATCHED), si no existe la inserta (WHEN NOT MATCHED). Dentro de la rama WHEN MATCHED se puede añadir una cláusula DELETE WHERE adicional para eliminar del destino las filas que, tras la actualización, cumplan una condición concreta.",
        syntax: "MERGE INTO tabla_destino [alias1]\nUSING { tabla_origen | subconsulta } [alias2]\nON (condición_de_coincidencia)\nWHEN MATCHED THEN\n  UPDATE SET columna1 = valor1 [, ...]\n  [DELETE WHERE condición]\nWHEN NOT MATCHED THEN\n  INSERT (columnas) VALUES (valores)",
        examples: [
          { code: "MERGE INTO empleados_actual dst\nUSING empleados_nuevos src\nON (dst.employee_id = src.employee_id)\nWHEN MATCHED THEN\n  UPDATE SET dst.salary = src.salary\nWHEN NOT MATCHED THEN\n  INSERT (employee_id, salary) VALUES (src.employee_id, src.salary);" }
        ] },
      { heading: "6. DEFAULT en INSERT/UPDATE",
        explanation: "La palabra clave DEFAULT, usada como valor en lugar de un literal, asigna explícitamente el valor por defecto definido en la columna, tanto en INSERT como en UPDATE, sin tener que conocer o repetir ese valor en el código." },
      { heading: "7. Qué es una transacción y las propiedades ACID",
        explanation: "Una transacción es un conjunto de una o más sentencias DML que se tratan como una unidad: o se confirman todas, o se deshacen todas. Empieza implícitamente con la primera sentencia DML tras la última transacción, y termina con COMMIT, ROLLBACK, una sentencia DDL (que provoca COMMIT automático), o el cierre de la sesión. Las bases de datos relacionales garantizan las propiedades ACID: Atomicidad (todo o nada, no hay estados intermedios visibles), Consistencia (una transacción solo lleva la base de datos de un estado válido a otro, respetando constraints), Isolation/Aislamiento (una transacción no ve los cambios no confirmados de otra), y Durability/Durabilidad (una vez confirmada con COMMIT, un cambio sobrevive incluso a un fallo del sistema)." },
      { heading: "8. COMMIT, ROLLBACK y SAVEPOINT",
        explanation: "COMMIT hace permanentes todos los cambios de la transacción actual, libera bloqueos y borra los savepoints. ROLLBACK deshace todos los cambios no confirmados desde el último COMMIT. SAVEPOINT nombre marca un punto intermedio; ROLLBACK TO nombre deshace solo lo posterior a ese punto, sin perder el resto de la transacción.",
        syntax: "SAVEPOINT nombre_savepoint;\n...\nROLLBACK TO [SAVEPOINT] nombre_savepoint;\n...\nCOMMIT;",
        examples: [
          { code: "UPDATE employees SET salary = salary * 1.05 WHERE department_id = 10;\nSAVEPOINT sp_dep10;\nUPDATE employees SET salary = salary * 1.05 WHERE department_id = 20;\nROLLBACK TO sp_dep10;\nCOMMIT;" }
        ] },
      { heading: "9. DDL y COMMIT implícito",
        explanation: "Cualquier sentencia DDL (CREATE, ALTER, DROP, TRUNCATE, RENAME) hace un COMMIT automático e implícito de cualquier transacción DML pendiente, tanto antes como después de ejecutarse. Por eso TRUNCATE no se puede deshacer con ROLLBACK: en el momento en que se ejecuta, ya ha confirmado también cualquier cambio DML previo de la sesión." },
      { heading: "10. Consistencia de lectura y bloqueos implícitos",
        explanation: "Oracle implementa consistencia de lectura: cada sesión ve una 'foto' consistente de los datos según su propio punto de vista transaccional, y los cambios no confirmados de otra sesión no son visibles hasta su COMMIT. Al modificar una fila con UPDATE/DELETE, Oracle adquiere automáticamente un bloqueo de fila (row lock) que impide que otra sesión modifique esa misma fila hasta que la primera transacción termine (con COMMIT o ROLLBACK); esto nunca bloquea LECTURAS de otras sesiones, solo escrituras concurrentes sobre la misma fila." },
      { heading: "11. Flashback Query: consultar el pasado",
        explanation: "AS OF TIMESTAMP y AS OF SCN permiten consultar cómo estaban los datos de una tabla en un momento pasado (dentro del periodo de retención de undo configurado), sin necesidad de backups ni de haber guardado una copia manual. Es útil para auditoría o para recuperar un valor que se sobrescribió por error, antes incluso de plantear un ROLLBACK o una restauración completa.",
        syntax: "SELECT ...\nFROM   tabla AS OF TIMESTAMP (SYSTIMESTAMP - INTERVAL '1' HOUR)\n\nSELECT ...\nFROM   tabla AS OF SCN numero_scn",
        examples: [
          { code: "SELECT salary\nFROM   employees AS OF TIMESTAMP (SYSTIMESTAMP - INTERVAL '1' HOUR)\nWHERE  employee_id = 100;" }
        ],
        commonErrors: [
          "Flashback Query depende de que la información de undo necesaria todavía exista: si ha pasado más tiempo que el periodo de retención configurado (UNDO_RETENTION), la consulta puede fallar con ORA-08180 o similar."
        ] }
    ],
    oracleNotes: [
      "UPDATE o DELETE sin WHERE afecta a TODAS las filas de la tabla: es uno de los errores más peligrosos y también una pregunta clásica del examen.",
      "MERGE decide entre INSERT y UPDATE según coincidencia en una sola sentencia; su rama WHEN MATCHED admite además una subcláusula DELETE WHERE para depurar filas actualizadas.",
      "DELETE es DML: se puede revertir con ROLLBACK antes de COMMIT. TRUNCATE es DDL y hace commit implícito, no se puede revertir de la misma forma.",
      "Toda sentencia DDL hace COMMIT automático de los cambios DML pendientes, antes y después de ejecutarse.",
      "Un bloqueo de fila (row lock) por UPDATE/DELETE nunca impide que otras sesiones LEAN esa fila (gracias a la consistencia de lectura); solo impide que otra sesión la MODIFIQUE hasta que la transacción termine."
    ]
  },
  summary: [
    "INSERT añade filas (con VALUES o desde un SELECT); UPDATE modifica; DELETE elimina — siempre con WHERE si no quieres afectar a toda la tabla.",
    "INSERT ALL / INSERT FIRST insertan en varias tablas a la vez; MERGE combina INSERT, UPDATE y opcionalmente DELETE.",
    "ACID: Atomicidad, Consistencia, Isolation, Durability — el contrato que garantiza una transacción.",
    "COMMIT confirma y libera bloqueos; ROLLBACK deshace; SAVEPOINT + ROLLBACK TO deshacen solo una parte.",
    "El DDL siempre hace commit implícito; la consistencia de lectura oculta cambios no confirmados a otras sesiones.",
    "Flashback Query (AS OF TIMESTAMP/SCN) consulta el estado pasado de una tabla dentro del periodo de retención de undo."
  ],
  comparisonTable: {
    title: "Las cuatro propiedades ACID",
    headers: ["Propiedad", "Garantiza", "Ejemplo de violación si faltara"],
    rows: [
      ["Atomicidad", "Todo o nada, sin estados intermedios visibles", "Un fallo a mitad de una transferencia dejaría dinero 'desaparecido'"],
      ["Consistencia", "Solo se pasa de un estado válido a otro", "Una FK quedaría apuntando a una fila que no existe"],
      ["Isolation", "Una transacción no ve cambios no confirmados de otra", "Un informe leería datos a medio modificar por otro usuario"],
      ["Durability", "Lo confirmado sobrevive a un fallo del sistema", "Un COMMIT se perdería si el servidor se reinicia justo después"]
    ]
  },
  mindMap: [
    { topic: "Módulo 11 — DML y transacciones", children: [
      "DML → INSERT (VALUES/SELECT), UPDATE, DELETE, MERGE, INSERT ALL/FIRST",
      "ACID → Atomicidad, Consistencia, Isolation, Durability",
      "Control → COMMIT (confirma), ROLLBACK (deshace), SAVEPOINT + ROLLBACK TO (parcial)",
      "DDL → commit implícito automático, siempre",
      "Concurrencia → consistencia de lectura + bloqueos de fila (solo afectan a escritura)",
      "Flashback Query → AS OF TIMESTAMP/SCN, consulta el pasado dentro del periodo de retención"
    ] }
  ],
  sourceRefs: [
    "Oracle SQL Language Reference 19c — \"INSERT\", \"UPDATE\", \"DELETE\", \"MERGE\"",
    "Oracle SQL Language Reference 19c — \"COMMIT\", \"ROLLBACK\", \"SAVEPOINT\"",
    "Oracle Database Concepts 19c — \"Transactions\" y \"Data Concurrency and Consistency\"",
    "Oracle Database Development Guide — \"Using Flashback Query\""
  ],
  realCases: {
    business: "Un sistema bancario depende de la atomicidad: una transferencia entre cuentas (UPDATE saldo origen, UPDATE saldo destino) debe confirmarse completa o no confirmarse en absoluto; un fallo a mitad de camino con ROLLBACK automático evita dinero 'perdido' o 'duplicado'.",
    dataEngineering: "Un ingeniero de datos usa MERGE en las cargas incrementales de un data warehouse para insertar registros nuevos y actualizar los existentes en una sola pasada, reduciendo el tiempo de ventana de carga frente a un enfoque de DELETE + INSERT completo.",
    etl: "Un proceso ETL usa Flashback Query (AS OF TIMESTAMP) para comparar el estado de una tabla origen antes y después de una carga sospechosa, sin tener que restaurar un backup completo solo para auditar qué cambió.",
    reporting: "Un informe financiero de cierre de mes se ejecuta dentro de una transacción de solo lectura para garantizar que todas sus consultas ven exactamente la misma 'foto' de los datos, sin que una carga concurrente a mitad de la noche altere los números entre una consulta y la siguiente."
  },
  mistakes: [
    { mistake: "Ejecutar UPDATE o DELETE sin WHERE por descuido.", why: "Afecta a todas las filas de la tabla; es el error DML más peligroso en producción, y el examen lo presenta para comprobar si revisas siempre la condición antes de dar por buena una sentencia." },
    { mistake: "Pensar que un ROLLBACK TO SAVEPOINT deshace toda la transacción.", why: "Solo deshace lo posterior al savepoint indicado; lo anterior permanece pendiente de confirmar o deshacer con un COMMIT o ROLLBACK posterior. El examen distingue 'deshacer todo' de 'deshacer una parte'." },
    { mistake: "Ejecutar un CREATE TABLE en medio de cambios DML esperando poder revertirlos después con ROLLBACK.", why: "El DDL hace COMMIT implícito antes de ejecutarse, confirmando también los cambios DML previos de la sesión; para entonces ya es demasiado tarde para un ROLLBACK." },
    { mistake: "Creer que un bloqueo de fila impide que otras sesiones LEAN esa fila.", why: "La consistencia de lectura de Oracle garantiza que las lecturas nunca se bloquean por escrituras en curso; el bloqueo de fila solo impide que OTRA sesión intente MODIFICAR esa misma fila hasta que la transacción actual termine." }
  ],
  exercises: [
    { title: "Insertar un departamento", difficulty: "básico", prompt: "Inserta un nuevo departamento con id 290, nombre 'Sostenibilidad' y location_id 1700.", hint: "INSERT INTO departments (...) VALUES (...);", solution: "INSERT INTO departments (department_id, department_name, location_id) VALUES (290, 'Sostenibilidad', 1700);" },
    { title: "Confirmar un cambio", difficulty: "básico", prompt: "Sube el salario un 3% al departamento 90 y confirma el cambio de forma permanente.", hint: "UPDATE ...; COMMIT;", solution: "UPDATE employees SET salary = salary * 1.03 WHERE department_id = 90;\nCOMMIT;" },
    { title: "Deshacer parcialmente con SAVEPOINT", difficulty: "intermedio", prompt: "Sube el salario del departamento 10 un 2%, marca un SAVEPOINT, sube el del departamento 20 un 50% (excesivo por error), deshaz solo esa segunda subida y confirma la primera.", hint: "SAVEPOINT antes del cambio que podría fallar.", solution: "UPDATE employees SET salary = salary*1.02 WHERE department_id = 10;\nSAVEPOINT sp1;\nUPDATE employees SET salary = salary*1.50 WHERE department_id = 20;\nROLLBACK TO sp1;\nCOMMIT;" },
    { title: "MERGE de sincronización", difficulty: "intermedio", prompt: "Sincroniza una tabla empleados_actual con empleados_nuevos: actualiza salario si el empleado ya existe, insértalo si no.", hint: "MERGE INTO ... USING ... ON ... WHEN MATCHED/NOT MATCHED", solution: "MERGE INTO empleados_actual dst\nUSING empleados_nuevos src\nON (dst.employee_id = src.employee_id)\nWHEN MATCHED THEN UPDATE SET dst.salary = src.salary\nWHEN NOT MATCHED THEN INSERT (employee_id, salary) VALUES (src.employee_id, src.salary);" },
    { title: "Consultar el pasado con Flashback Query", difficulty: "avanzado", prompt: "Consulta cuál era el salario del empleado 100 hace exactamente una hora, sin usar ningún backup.", hint: "AS OF TIMESTAMP (SYSTIMESTAMP - INTERVAL ...)", solution: "SELECT salary FROM employees AS OF TIMESTAMP (SYSTIMESTAMP - INTERVAL '1' HOUR) WHERE employee_id = 100;" },
    { title: "Explicar por qué el DDL rompe una estrategia de rollback", difficulty: "avanzado", prompt: "Explica qué ocurre si ejecutas: UPDATE employees SET salary=salary*2 WHERE employee_id=100; luego CREATE TABLE respaldo (x NUMBER); y después intentas ROLLBACK esperando deshacer el UPDATE.", hint: "El DDL hace commit implícito.", solution: "El ROLLBACK no deshace el UPDATE, porque el CREATE TABLE (DDL) ya ejecutó un COMMIT implícito antes de crear la tabla, confirmando de forma permanente el UPDATE anterior. El ROLLBACK posterior no tiene ya ninguna transacción DML pendiente que deshacer." }
  ],
  solved: [
    { title: "Diseñar una transacción segura con SAVEPOINT",
      problem: "Necesitas aplicar dos subidas de salario relacionadas, pero quieres poder deshacer solo la segunda si algo sale mal, sin perder la primera.",
      steps: [
        "Ejecuta el primer UPDATE (departamento 10).",
        "Marca un SAVEPOINT justo después, antes del segundo cambio.",
        "Ejecuta el segundo UPDATE (departamento 20) y evalúa si el resultado es razonable.",
        "Si el segundo cambio parece incorrecto, usa ROLLBACK TO para deshacerlo sin afectar al primero, y confirma con COMMIT."
      ],
      query: "UPDATE employees SET salary = salary * 1.05 WHERE department_id = 10;\nSAVEPOINT sp_dep10;\nUPDATE employees SET salary = salary * 1.05 WHERE department_id = 20;\nROLLBACK TO sp_dep10;\nCOMMIT;",
      result: "El departamento 10 queda actualizado y confirmado; el departamento 20 queda como estaba antes del segundo UPDATE." },
    { title: "Recuperar un valor sobrescrito con Flashback Query",
      problem: "Un UPDATE erróneo (ya confirmado con COMMIT) sobrescribió el salario correcto de un empleado, y no tienes backup a mano.",
      steps: [
        "Descarta ROLLBACK, porque el cambio ya se confirmó con COMMIT.",
        "Recuerda que Flashback Query permite ver el estado de la tabla en un instante pasado, dentro del periodo de retención de undo.",
        "Consulta el salario anterior con AS OF TIMESTAMP, eligiendo un momento justo antes del UPDATE erróneo.",
        "Usa ese valor recuperado para corregir la fila con un nuevo UPDATE explícito."
      ],
      query: "SELECT salary FROM employees AS OF TIMESTAMP (SYSTIMESTAMP - INTERVAL '30' MINUTE) WHERE employee_id = 100;",
      result: "Devuelve el salario tal como estaba hace 30 minutos, que se puede usar para corregir el valor actual." }
  ],
  flashcards: [
    { front: "¿Qué garantiza la 'A' de ACID?", back: "Atomicidad: la transacción se confirma completa o no se confirma en absoluto." },
    { front: "¿Qué garantiza la 'I' de ACID?", back: "Isolation: una transacción no ve los cambios no confirmados de otra." },
    { front: "¿Qué hace COMMIT?", back: "Hace permanentes los cambios de la transacción actual y libera los bloqueos." },
    { front: "¿Qué deshace ROLLBACK TO SAVEPOINT?", back: "Solo los cambios posteriores a ese savepoint, no toda la transacción." },
    { front: "¿Por qué TRUNCATE no admite ROLLBACK?", back: "Porque es DDL y hace commit implícito inmediatamente al ejecutarse." },
    { front: "¿Bloquea un row lock las lecturas de otras sesiones?", back: "No; la consistencia de lectura garantiza que las lecturas nunca se bloquean por escrituras en curso." },
    { front: "¿Para qué sirve Flashback Query?", back: "Para consultar cómo estaban los datos en un momento pasado, sin necesidad de backups." },
    { front: "¿Qué diferencia hay entre AS OF TIMESTAMP y AS OF SCN?", back: "Ambos consultan el pasado; TIMESTAMP usa una fecha/hora, SCN usa un número de cambio del sistema." }
  ],
  examples: [
    { title: "INSERT básico", code: "INSERT INTO departments (department_id, department_name, location_id)\nVALUES (280, 'Innovación', 1700);" },
    { title: "MERGE", code: "MERGE INTO empleados_actual dst\nUSING empleados_nuevos src\nON (dst.employee_id = src.employee_id)\nWHEN MATCHED THEN\n  UPDATE SET dst.salary = src.salary\nWHEN NOT MATCHED THEN\n  INSERT (employee_id, salary) VALUES (src.employee_id, src.salary);" },
    { title: "SAVEPOINT", code: "UPDATE employees SET salary = salary * 1.05 WHERE department_id = 10;\nSAVEPOINT sp_dep10;\nUPDATE employees SET salary = salary * 1.05 WHERE department_id = 20;\nROLLBACK TO sp_dep10;\nCOMMIT;" },
    { title: "Flashback Query", code: "SELECT salary FROM employees\nAS OF TIMESTAMP (SYSTIMESTAMP - INTERVAL '1' HOUR)\nWHERE employee_id = 100;" }
  ],
  quiz: [
    { q: "¿Qué ocurre si ejecutas UPDATE empleados SET salary = 5000; sin WHERE?", options: [
        "Da error, WHERE es obligatorio", "Actualiza todas las filas de la tabla al valor 5000",
        "No hace nada", "Pide confirmación automáticamente"
      ], a: 1,
      why: [
        "WHERE es opcional sintácticamente, aunque omitirlo sea peligroso.",
        "Correcta: sin WHERE, la actualización afecta a todas las filas.",
        "Sí hace algo: modifica todas las filas de la tabla.",
        "Oracle no pide confirmación interactiva por defecto en la ejecución de SQL."
      ] },
    { q: "¿Qué sentencia combina INSERT y UPDATE en una sola operación según coincidencia?", options: ["UPSERT", "MERGE", "COMBINE", "INSERT ALL"], a: 1,
      why: [
        "UPSERT es un término coloquial, no una palabra clave de Oracle SQL.",
        "Correcta: MERGE es la sentencia estándar de Oracle para esta operación.",
        "COMBINE no es una sentencia SQL válida.",
        "INSERT ALL inserta en varias tablas, no combina INSERT con UPDATE según coincidencia."
      ] },
    { q: "¿Cuál de las siguientes NO es una de las propiedades ACID?", options: ["Atomicidad", "Consistencia", "Isolation", "Escalabilidad"], a: 3,
      why: [
        "Atomicidad sí es una de las cuatro propiedades ACID.",
        "Consistencia también lo es.",
        "Isolation también lo es.",
        "Correcta: Escalabilidad no forma parte de ACID; la cuarta propiedad es Durability."
      ] },
    { q: "¿Qué hace COMMIT?", options: ["Deshace los cambios", "Hace permanentes los cambios de la transacción actual", "Crea una tabla nueva", "Bloquea la tabla"], a: 1,
      why: [
        "Esa es la función de ROLLBACK, no de COMMIT.",
        "Correcta: COMMIT confirma de forma permanente los cambios pendientes.",
        "COMMIT no crea ningún objeto de esquema.",
        "COMMIT libera bloqueos, no los crea."
      ] },
    { q: "Tras un SAVEPOINT sp1 y varios UPDATE, ¿qué hace ROLLBACK TO sp1?", options: [
        "Deshace toda la transacción desde el principio", "Deshace solo los cambios posteriores a sp1, dejando los anteriores intactos",
        "Hace COMMIT de todo lo anterior a sp1", "Da error, no existe ROLLBACK TO"
      ], a: 1,
      why: [
        "Deshacer todo sería un ROLLBACK simple, sin TO.",
        "Correcta: el rollback parcial a un savepoint conserva lo hecho antes de ese punto.",
        "ROLLBACK TO no hace ningún commit; solo deshace y deja la transacción abierta.",
        "ROLLBACK TO sí existe y es sintaxis válida en Oracle."
      ] },
    { q: "¿Qué ocurre si ejecutas una sentencia DDL como CREATE TABLE en medio de cambios DML sin haber hecho COMMIT?", options: [
        "El DDL espera a que hagas COMMIT manualmente", "El DDL provoca un COMMIT automático de los cambios DML pendientes",
        "El DDL se cancela automáticamente", "No tiene ningún efecto sobre la transacción"
      ], a: 1,
      why: [
        "El DDL no espera: se ejecuta y confirma de inmediato.",
        "Correcta: toda sentencia DDL hace commit implícito antes de ejecutarse.",
        "El DDL no se cancela: se ejecuta normalmente, y de paso confirma lo pendiente.",
        "Sí tiene un efecto importante: confirma de forma irreversible los cambios DML previos."
      ] },
    { q: "¿Qué garantiza la propiedad de Durabilidad (Durability) en ACID?", options: [
        "Que la base de datos nunca se puede apagar", "Que un cambio confirmado con COMMIT sobrevive incluso a un fallo del sistema",
        "Que las consultas se ejecutan siempre a la misma velocidad", "Que no puede haber más de una transacción a la vez"
      ], a: 1,
      why: [
        "No tiene relación con apagar o no la base de datos.",
        "Correcta: una vez confirmado, el cambio persiste aunque el sistema falle inmediatamente después.",
        "No garantiza rendimiento ni velocidad constante.",
        "Múltiples transacciones concurrentes son perfectamente normales; eso lo gestiona Isolation, no Durability."
      ] },
    { q: "¿Qué impide un bloqueo de fila (row lock) creado por un UPDATE en curso?", options: [
        "Que otras sesiones lean esa fila", "Que otra sesión modifique esa misma fila hasta que la transacción actual termine",
        "Que la propia sesión siga trabajando en otras tablas", "Que se pueda hacer ROLLBACK"
      ], a: 1,
      why: [
        "La lectura de otras sesiones nunca se bloquea, gracias a la consistencia de lectura.",
        "Correcta: el bloqueo de fila impide que OTRA sesión modifique esa fila hasta que termine la transacción actual.",
        "La propia sesión puede seguir trabajando con normalidad en cualquier tabla.",
        "El bloqueo no impide hacer ROLLBACK en absoluto; de hecho el ROLLBACK libera ese bloqueo."
      ] },
    { q: "¿Qué permite hacer Flashback Query (AS OF TIMESTAMP)?", options: [
        "Modificar datos de forma retroactiva", "Consultar cómo estaban los datos de una tabla en un momento pasado",
        "Deshacer un DDL ya confirmado", "Crear automáticamente un backup completo"
      ], a: 1,
      why: [
        "Flashback Query es solo de lectura: no modifica nada retroactivamente por sí mismo.",
        "Correcta: permite ver el estado de los datos en un instante anterior, dentro del periodo de retención de undo.",
        "No deshace DDL: opera sobre el histórico de cambios DML disponible en undo.",
        "No crea backups; usa la información de deshacer (undo) que Oracle ya mantiene temporalmente."
      ] },
    { q: "¿Qué límite tiene Flashback Query en la práctica?", options: [
        "Ninguno, funciona siempre sin importar cuánto tiempo haya pasado", "Depende del periodo de retención de undo configurado (UNDO_RETENTION); más allá de eso puede fallar",
        "Solo funciona con TIMESTAMP, nunca con SCN", "Solo funciona sobre vistas, no sobre tablas"
      ], a: 1,
      why: [
        "Sí tiene un límite práctico relacionado con cuánto undo se conserva.",
        "Correcta: si ha pasado más tiempo que el periodo de retención configurado, la información necesaria puede haberse descartado.",
        "Funciona con ambos: AS OF TIMESTAMP y AS OF SCN.",
        "Funciona sobre tablas (y otros objetos), no exclusivamente sobre vistas."
      ] }
  ],
  challenges: [
    { level: 1, prompt: "Realiza dos actualizaciones separadas por un SAVEPOINT y deshaz solo la segunda, confirmando la primera.", solution: "UPDATE employees SET salary = salary*1.02 WHERE department_id = 10;\nSAVEPOINT sp1;\nUPDATE employees SET salary = salary*1.50 WHERE department_id = 20;\nROLLBACK TO sp1;\nCOMMIT;" },
    { level: 2, prompt: "Explica por qué en un sistema con varios usuarios conectados a la vez, un usuario no ve los cambios de otro hasta que este hace COMMIT.", solution: "Oracle implementa consistencia de lectura: cada sesión ve una 'foto' consistente de los datos según su propio punto de vista transaccional; los cambios no confirmados de otra sesión permanecen en su información de undo hasta el COMMIT, momento en el que pasan a ser visibles para nuevas lecturas de otras sesiones." }
  ]
},

// =====================================================================
// NIVEL 12
// =====================================================================
{
  id: 12, code: "M12", category: "DDL",
  title: "Definición de tablas (DDL)",
  intro: "Crear y modificar la estructura de las tablas con los tipos de dato de Oracle, incluidas tablas externas, temporales y columnas virtuales.",
  theory: {
    concepts: [
      { heading: "1. CREATE TABLE con tipos Oracle",
        explanation: "La estructura básica es CREATE TABLE nombre (columna tipo [restricciones], ...);, pero los tipos deben ser los de Oracle (nivel 0): VARCHAR2(n), NUMBER(p,s), DATE, TIMESTAMP, CLOB, no los genéricos VARCHAR o INT de otros motores. Cada columna puede llevar DEFAULT valor para fijar un valor si no se especifica en el INSERT, y sus propios constraints (nivel 13).",
        syntax: "CREATE TABLE nombre_tabla (\n  columna1 tipo_dato [DEFAULT valor] [restricción_columna],\n  columna2 tipo_dato [DEFAULT valor] [restricción_columna],\n  ...\n  [restricción_de_tabla]\n);",
        examples: [
          { code: "CREATE TABLE clientes (\n  id_cliente  NUMBER(6)     PRIMARY KEY,\n  nombre      VARCHAR2(50)  NOT NULL,\n  email       VARCHAR2(100),\n  fecha_alta  DATE          DEFAULT SYSDATE\n);" }
        ] },
      { heading: "2. Tipos de dato adicionales: ROWID, UROWID y BOOLEAN",
        explanation: "ROWID es un tipo que representa la dirección física única de una fila dentro de su segmento de almacenamiento; UROWID (universal rowid) generaliza el concepto para tablas cuya organización no usa un rowid físico tradicional (por ejemplo, tablas index-organized). Ambos rara vez se usan como tipo de columna de negocio; son más relevantes para acceso interno de alto rendimiento. Desde Oracle 23c, BOOLEAN es un tipo de columna real en SQL (antes solo existía en PL/SQL), con valores TRUE, FALSE y NULL." },
      { heading: "3. CREATE TABLE ... AS SELECT (CTAS)",
        explanation: "Crea una tabla nueva a partir del resultado de una consulta, copiando estructura (nombres y tipos de columna deducidos del SELECT) y datos en un solo paso. Es habitual para copias rápidas o tablas de trabajo. Los constraints NOT NULL se copian, pero PRIMARY KEY, UNIQUE, FOREIGN KEY y CHECK no se heredan automáticamente: hay que añadirlos después con ALTER TABLE si se necesitan.",
        syntax: "CREATE TABLE nueva_tabla [(columna1 [, columna2, ...])]\nAS subconsulta",
        examples: [
          { code: "CREATE TABLE empleados_it AS\nSELECT employee_id, last_name, salary\nFROM   employees\nWHERE  department_id = 60;" }
        ] },
      { heading: "4. ALTER TABLE",
        explanation: "ALTER TABLE tabla ADD (columna tipo [DEFAULT valor], ...); añade una o varias columnas nuevas. ALTER TABLE tabla MODIFY (columna nuevo_tipo, ...); cambia el tipo, tamaño o el DEFAULT de una columna existente (falla si los datos ya almacenados son incompatibles con el nuevo tipo/tamaño). ALTER TABLE tabla DROP COLUMN columna; elimina una columna por completo. ALTER TABLE tabla RENAME COLUMN antigua TO nueva; renombra una columna sin tocar sus datos.",
        syntax: "ALTER TABLE tabla ADD (columna tipo [DEFAULT valor] [restricción])\nALTER TABLE tabla MODIFY (columna tipo [DEFAULT valor])\nALTER TABLE tabla DROP COLUMN columna\nALTER TABLE tabla RENAME COLUMN antigua TO nueva",
        examples: [
          { code: "ALTER TABLE clientes ADD (telefono VARCHAR2(15));\nALTER TABLE clientes MODIFY (nombre VARCHAR2(80));\nALTER TABLE clientes DROP COLUMN telefono;" }
        ] },
      { heading: "5. RENAME y TRUNCATE",
        explanation: "RENAME tabla_vieja TO tabla_nueva; cambia el nombre de una tabla completa. TRUNCATE TABLE tabla; elimina TODAS las filas de golpe: es DDL (no DML como DELETE), hace commit implícito por lo que no se puede deshacer con ROLLBACK, y libera el espacio de almacenamiento inmediatamente. Es mucho más rápido que un DELETE sin WHERE en tablas grandes porque no genera el mismo volumen de información de deshacer (undo).",
        examples: [
          { code: "TRUNCATE TABLE clientes;" }
        ] },
      { heading: "6. DROP TABLE y recuperación con Flashback",
        explanation: "DROP TABLE tabla; elimina la tabla completa (estructura y datos). En Oracle, por defecto la tabla no se borra físicamente de inmediato: se renombra y se mueve a la 'papelera de reciclaje' (recycle bin), y se puede recuperar con FLASHBACK TABLE tabla TO BEFORE DROP;. Para eliminarla de forma definitiva sin pasar por la papelera se usa DROP TABLE tabla PURGE;, que no admite recuperación posterior. DROP TABLE tabla CASCADE CONSTRAINTS; elimina también las foreign keys de otras tablas que dependan de esta.",
        syntax: "DROP TABLE tabla [CASCADE CONSTRAINTS] [PURGE]\nFLASHBACK TABLE tabla TO BEFORE DROP",
        examples: [
          { code: "DROP TABLE clientes;\nFLASHBACK TABLE clientes TO BEFORE DROP;" }
        ] },
      { heading: "7. Columnas virtuales",
        explanation: "Una columna virtual se define con una expresión calculada a partir de otras columnas de la misma tabla, y Oracle la recalcula automáticamente en cada lectura sin almacenar el valor físicamente (salvo que se declare VIRTUAL ... y además se indexe). Es útil para exponer un dato derivado (por ejemplo, un total con impuestos) sin duplicarlo ni depender de que una aplicación lo recalcule siempre correctamente.",
        syntax: "columna tipo_dato [GENERATED ALWAYS] AS (expresión) [VIRTUAL]",
        examples: [
          { code: "CREATE TABLE pedidos (\n  id_pedido  NUMBER(6),\n  subtotal   NUMBER(8,2),\n  iva        NUMBER(8,2),\n  total      NUMBER(8,2) GENERATED ALWAYS AS (subtotal + iva) VIRTUAL\n);" }
        ] },
      { heading: "8. Tablas temporales globales (GTT)",
        explanation: "Una Global Temporary Table (GTT) tiene una definición permanente en el diccionario de datos, pero sus FILAS son privadas de cada sesión (o de cada transacción, según la opción elegida) y se eliminan automáticamente. ON COMMIT DELETE ROWS vacía la tabla al hacer COMMIT (el comportamiento por defecto); ON COMMIT PRESERVE ROWS conserva los datos hasta el fin de la sesión. Es útil para cálculos intermedios de una sesión sin interferir con otras sesiones que usan la misma tabla temporal al mismo tiempo.",
        syntax: "CREATE GLOBAL TEMPORARY TABLE nombre (\n  columna1 tipo_dato, ...\n) ON COMMIT { DELETE ROWS | PRESERVE ROWS };" },
      { heading: "9. Tablas externas",
        explanation: "Una tabla externa permite consultar con SELECT un archivo de datos (típicamente de texto plano, CSV) que vive FUERA de la base de datos, como si fuera una tabla más, sin cargarlo previamente. Es de solo lectura desde SQL estándar (no admite INSERT/UPDATE/DELETE) y se define con ORGANIZATION EXTERNAL, indicando el tipo de acceso y la ubicación del archivo.",
        syntax: "CREATE TABLE nombre (\n  columna1 tipo_dato, ...\n)\nORGANIZATION EXTERNAL (\n  TYPE ORACLE_LOADER\n  DEFAULT DIRECTORY nombre_directorio\n  LOCATION ('archivo.csv')\n);" },
      { heading: "10. COMMENT ON",
        explanation: "COMMENT ON TABLE tabla IS 'texto'; y COMMENT ON COLUMN tabla.columna IS 'texto'; añaden documentación visible en el diccionario de datos (consultable en USER_TAB_COMMENTS y USER_COL_COMMENTS), sin afectar en absoluto a los datos ni al comportamiento de la tabla.",
        syntax: "COMMENT ON TABLE tabla IS 'texto descriptivo';\nCOMMENT ON COLUMN tabla.columna IS 'texto descriptivo';" }
    ],
    oracleNotes: [
      "TRUNCATE es DDL: hace commit implícito y no se puede deshacer con ROLLBACK, a diferencia de DELETE.",
      "DROP TABLE mueve la tabla a la papelera de reciclaje por defecto; se recupera con FLASHBACK TABLE ... TO BEFORE DROP. PURGE elimina la tabla de forma definitiva, sin pasar por la papelera.",
      "CTAS (CREATE TABLE ... AS SELECT) copia los datos y los NOT NULL, pero nunca copia PRIMARY KEY, UNIQUE, FOREIGN KEY ni CHECK.",
      "Una GTT comparte su DEFINICIÓN entre todas las sesiones, pero cada sesión ve solo SUS PROPIAS filas: dos usuarios pueden usar la misma GTT a la vez sin verse los datos mutuamente.",
      "Una tabla externa no admite INSERT/UPDATE/DELETE desde SQL: solo lectura; para 'modificarla' hay que editar el archivo de origen fuera de la base de datos."
    ]
  },
  summary: [
    "CREATE TABLE define columnas con tipos Oracle: VARCHAR2, NUMBER, DATE, TIMESTAMP, CLOB; ROWID/UROWID son de uso interno, BOOLEAN es columna real desde 23c.",
    "CREATE TABLE ... AS SELECT copia estructura y datos, pero no las constraints de clave/unicidad/check.",
    "ALTER TABLE añade, modifica, elimina o renombra columnas; TRUNCATE vacía todas las filas de golpe (DDL, sin ROLLBACK).",
    "DROP TABLE elimina la tabla (recuperable con FLASHBACK salvo que se use PURGE).",
    "Columnas virtuales calculan un valor sin almacenarlo; GTT tiene filas privadas por sesión; tablas externas consultan archivos fuera de la base de datos; COMMENT ON documenta sin afectar a los datos."
  ],
  comparisonTable: {
    title: "Objetos de tabla especiales",
    headers: ["Objeto", "¿Dónde viven los datos?", "¿Admite DML normal?", "Caso de uso típico"],
    rows: [
      ["Tabla normal", "Segmento de la base de datos", "Sí", "Datos de negocio permanentes"],
      ["Columna virtual", "No se almacena (se calcula)", "No aplica (es de solo lectura)", "Valores derivados sin duplicar datos"],
      ["GTT", "Segmento temporal, filas privadas por sesión", "Sí, pero solo la sesión ve sus filas", "Cálculos intermedios de una sesión"],
      ["Tabla externa", "Archivo fuera de la base de datos", "No (solo lectura)", "Consultar CSV/planos sin cargarlos primero"]
    ]
  },
  mindMap: [
    { topic: "Módulo 12 — DDL de tablas", children: [
      "CREATE TABLE → tipos Oracle (VARCHAR2, NUMBER, DATE...), DEFAULT, constraints",
      "CTAS → copia estructura+datos, no copia PK/UNIQUE/FK/CHECK",
      "ALTER TABLE → ADD, MODIFY, DROP COLUMN, RENAME COLUMN",
      "TRUNCATE/DROP → DDL, commit implícito; DROP recuperable con FLASHBACK salvo PURGE",
      "Especiales → columna virtual (calculada), GTT (filas privadas por sesión), tabla externa (archivo fuera de la BD)",
      "Documentación → COMMENT ON TABLE/COLUMN"
    ] }
  ],
  sourceRefs: [
    "Oracle SQL Language Reference 19c — \"CREATE TABLE\"",
    "Oracle SQL Language Reference 19c — \"ALTER TABLE\"",
    "Oracle SQL Language Reference 19c — \"DROP TABLE\", \"TRUNCATE TABLE\", \"FLASHBACK TABLE\"",
    "Oracle Database Administrator's Guide — \"Managing Tables\" (GTT, tablas externas, columnas virtuales)"
  ],
  realCases: {
    business: "Un sistema de pedidos expone el campo 'total con impuestos' como columna virtual calculada a partir de subtotal e iva, garantizando que nunca queda desincronizado con un cambio manual en cualquiera de las dos columnas base.",
    dataEngineering: "Un ingeniero de datos usa tablas externas para consultar directamente archivos CSV depositados por un sistema legado, sin necesidad de un paso de carga previo, integrándolos en un pipeline SQL como si fueran tablas normales.",
    etl: "Un proceso ETL usa una tabla temporal global (GTT) con ON COMMIT DELETE ROWS para almacenar resultados intermedios de una transformación compleja, evitando interferencias si varias instancias del proceso se ejecutan en paralelo.",
    reporting: "Un equipo de datos usa COMMENT ON COLUMN para documentar en el propio diccionario de datos qué significa exactamente cada columna ambigua (por ejemplo, 'status' con códigos numéricos), evitando depender de documentación externa que se desactualiza."
  },
  mistakes: [
    { mistake: "Pensar que TRUNCATE se puede deshacer con ROLLBACK.", why: "Es DDL, hace commit implícito inmediatamente; el examen presenta un TRUNCATE seguido de ROLLBACK esperando que sepas que ya es demasiado tarde para deshacerlo." },
    { mistake: "Creer que una columna virtual ocupa espacio de almacenamiento como una columna normal.", why: "Por defecto se recalcula en cada lectura y no se almacena; el examen distingue esto de las columnas normales, donde el valor sí se guarda físicamente." },
    { mistake: "Pensar que todas las sesiones ven los mismos datos en una tabla temporal global.", why: "La DEFINICIÓN es compartida, pero las FILAS son privadas de cada sesión (o transacción); dos usuarios que insertan en la misma GTT a la vez no se ven las filas mutuamente." },
    { mistake: "Intentar hacer INSERT/UPDATE/DELETE sobre una tabla externa.", why: "Las tablas externas son de solo lectura desde SQL; para cambiar sus datos hay que modificar el archivo de origen fuera de la base de datos, no mediante DML." }
  ],
  exercises: [
    { title: "Crear tabla de productos", difficulty: "básico", prompt: "Crea una tabla productos con id_producto NUMBER(6) como clave primaria, nombre VARCHAR2(100) obligatorio, y precio NUMBER(8,2).", hint: "CREATE TABLE ... PRIMARY KEY ...", solution: "CREATE TABLE productos (\n  id_producto NUMBER(6) PRIMARY KEY,\n  nombre VARCHAR2(100) NOT NULL,\n  precio NUMBER(8,2)\n);" },
    { title: "Modificar estructura", difficulty: "básico", prompt: "Añade una columna stock de tipo NUMBER(6) por defecto 0 a la tabla productos.", hint: "ALTER TABLE ... ADD (... DEFAULT ...)", solution: "ALTER TABLE productos ADD (stock NUMBER(6) DEFAULT 0);" },
    { title: "Columna virtual", difficulty: "intermedio", prompt: "Añade a productos una columna virtual precio_con_iva que calcule precio * 1.21 sin almacenarlo físicamente.", hint: "GENERATED ALWAYS AS (...) VIRTUAL", solution: "ALTER TABLE productos ADD (precio_con_iva NUMBER(8,2) GENERATED ALWAYS AS (precio * 1.21) VIRTUAL);" },
    { title: "Documentar con COMMENT ON", difficulty: "intermedio", prompt: "Documenta que la columna stock de productos representa unidades disponibles en almacén.", hint: "COMMENT ON COLUMN tabla.columna IS '...'", solution: "COMMENT ON COLUMN productos.stock IS 'Unidades disponibles en almacén';" },
    { title: "Diseñar una GTT para cálculos intermedios", difficulty: "avanzado", prompt: "Crea una tabla temporal global tmp_calculo(id NUMBER, valor NUMBER) que borre sus filas automáticamente al hacer COMMIT.", hint: "ON COMMIT DELETE ROWS", solution: "CREATE GLOBAL TEMPORARY TABLE tmp_calculo (\n  id NUMBER,\n  valor NUMBER\n) ON COMMIT DELETE ROWS;" },
    { title: "Recuperar una tabla borrada por error", difficulty: "avanzado", prompt: "Explica los pasos para recuperar una tabla borrada hace 5 minutos con DROP TABLE (sin PURGE), y qué pasaría si se hubiera usado PURGE.", hint: "FLASHBACK TABLE ... TO BEFORE DROP.", solution: "Sin PURGE, la tabla está en la papelera de reciclaje: basta ejecutar FLASHBACK TABLE nombre TO BEFORE DROP; para recuperarla con sus datos. Si se hubiera usado DROP TABLE nombre PURGE;, la tabla se habría eliminado definitivamente sin pasar por la papelera, y no habría forma de recuperarla con FLASHBACK (haría falta un backup completo)." }
  ],
  solved: [
    { title: "Diseñar una tabla con una columna derivada",
      problem: "Necesitas una tabla de pedidos que siempre muestre el total (subtotal + iva) sin arriesgarte a que quede desincronizado por un UPDATE manual incompleto.",
      steps: [
        "Identifica que 'total' es un valor completamente derivado de subtotal e iva.",
        "Decide usar una columna virtual en vez de una columna normal calculada por la aplicación.",
        "Define la columna con GENERATED ALWAYS AS (subtotal + iva) VIRTUAL.",
        "Verifica que un UPDATE sobre subtotal o iva actualiza automáticamente el valor mostrado en total, sin necesidad de tocarlo explícitamente."
      ],
      query: "CREATE TABLE pedidos (\n  id_pedido  NUMBER(6),\n  subtotal   NUMBER(8,2),\n  iva        NUMBER(8,2),\n  total      NUMBER(8,2) GENERATED ALWAYS AS (subtotal + iva) VIRTUAL\n);",
      result: "La columna total siempre refleja subtotal + iva actualizados, sin poder quedar desincronizada." },
    { title: "Elegir entre tabla normal, GTT y tabla externa",
      problem: "Tienes tres necesidades distintas: guardar pedidos permanentemente, un cálculo intermedio solo durante la sesión actual de un batch, y leer un archivo CSV de proveedores sin cargarlo antes.",
      steps: [
        "Para los pedidos permanentes, usas una tabla normal: los datos deben persistir para siempre.",
        "Para el cálculo intermedio del batch, usas una GTT con ON COMMIT DELETE ROWS, ya que no necesitas conservar esos datos más allá de la sesión.",
        "Para el CSV de proveedores, usas una tabla externa con ORGANIZATION EXTERNAL, evitando un paso de carga previo.",
        "Confirmas que cada elección se ajusta a la vida útil y visibilidad que necesitan los datos en cada caso."
      ],
      query: "-- Pedidos: tabla normal\n-- Cálculo intermedio: GTT ON COMMIT DELETE ROWS\n-- CSV proveedores: tabla externa ORGANIZATION EXTERNAL",
      result: "Cada tipo de tabla se ajusta exactamente a la necesidad de persistencia y origen de datos correspondiente." }
  ],
  flashcards: [
    { front: "¿Qué tipos NO se deben usar en Oracle aunque existan reservados?", back: "VARCHAR e INT; se usan VARCHAR2 y NUMBER." },
    { front: "¿Qué copia CTAS y qué no copia?", back: "Copia estructura, datos y NOT NULL; no copia PK, UNIQUE, FK ni CHECK." },
    { front: "¿Por qué TRUNCATE no admite ROLLBACK?", back: "Porque es DDL y hace commit implícito inmediatamente al ejecutarse." },
    { front: "¿Cómo se recupera una tabla borrada sin PURGE?", back: "Con FLASHBACK TABLE nombre TO BEFORE DROP." },
    { front: "¿Se almacena físicamente una columna virtual?", back: "No, por defecto se recalcula en cada lectura." },
    { front: "¿Qué filas ve cada sesión en una GTT?", back: "Solo las suyas; la definición es compartida pero los datos son privados por sesión." },
    { front: "¿Admite DML una tabla externa?", back: "No; es de solo lectura desde SQL." },
    { front: "¿Para qué sirve COMMENT ON?", back: "Para documentar tablas o columnas en el diccionario de datos, sin afectar a los datos." }
  ],
  examples: [
    { title: "Crear tabla con tipos Oracle", code: "CREATE TABLE clientes (\n  id_cliente   NUMBER(6),\n  nombre       VARCHAR2(50) NOT NULL,\n  email        VARCHAR2(100),\n  fecha_alta   DATE DEFAULT SYSDATE,\n  CONSTRAINT pk_clientes PRIMARY KEY (id_cliente)\n);" },
    { title: "Columna virtual", code: "ALTER TABLE productos ADD (\n  precio_con_iva NUMBER(8,2) GENERATED ALWAYS AS (precio * 1.21) VIRTUAL\n);" },
    { title: "GTT", code: "CREATE GLOBAL TEMPORARY TABLE tmp_calculo (\n  id NUMBER, valor NUMBER\n) ON COMMIT DELETE ROWS;" },
    { title: "Recuperar una tabla borrada", code: "DROP TABLE clientes;\nFLASHBACK TABLE clientes TO BEFORE DROP;" }
  ],
  quiz: [
    { q: "¿Qué diferencia clave hay entre TRUNCATE y DELETE sin WHERE?", options: [
        "Ninguna, son intercambiables", "TRUNCATE es DDL y no se puede deshacer con ROLLBACK; DELETE es DML y sí",
        "DELETE es más rápido siempre", "TRUNCATE no borra todas las filas"
      ], a: 1,
      why: [
        "No son intercambiables: su capacidad de deshacerse es distinta.",
        "Correcta: TRUNCATE hace commit implícito y libera espacio; DELETE es transaccional.",
        "TRUNCATE suele ser más rápido en tablas grandes, no al revés.",
        "TRUNCATE sí borra todas las filas de la tabla."
      ] },
    { q: "¿Qué comando permite recuperar una tabla borrada recientemente con DROP TABLE (sin PURGE)?", options: [
        "ROLLBACK TABLE", "FLASHBACK TABLE ... TO BEFORE DROP", "RESTORE TABLE", "No es posible recuperarla nunca"
      ], a: 1,
      why: [
        "ROLLBACK TABLE no es una sentencia válida en Oracle.",
        "Correcta: Oracle mueve la tabla a la papelera de reciclaje, permitiendo recuperarla con FLASHBACK.",
        "RESTORE TABLE no es sintaxis SQL de Oracle.",
        "Sí es posible recuperarla, mientras no se haya usado PURGE."
      ] },
    { q: "¿Qué cláusula evita que una tabla borrada pase por la papelera de reciclaje?", options: ["FORCE", "PURGE", "CASCADE", "IMMEDIATE"], a: 1,
      why: [
        "FORCE no es la cláusula relevante para este comportamiento.",
        "Correcta: DROP TABLE tabla PURGE; elimina definitivamente sin posibilidad de flashback.",
        "CASCADE (CONSTRAINTS) afecta a las claves foráneas dependientes, no a la papelera.",
        "IMMEDIATE no es una cláusula válida de DROP TABLE."
      ] },
    { q: "¿Qué almacena físicamente una columna virtual (VIRTUAL) por defecto?", options: [
        "El valor calculado, igual que una columna normal", "Nada; se recalcula en cada lectura a partir de su expresión",
        "Solo un puntero a otra tabla", "Un XML con la fórmula"
      ], a: 1,
      why: [
        "No almacena el valor como una columna normal, salvo configuraciones específicas de indexación.",
        "Correcta: por defecto no ocupa espacio de almacenamiento propio; se calcula al leerla.",
        "No es un puntero a otra tabla: es una expresión sobre columnas de la misma tabla.",
        "No almacena ningún XML; es simplemente una expresión SQL evaluada en tiempo de lectura."
      ] },
    { q: "¿Qué diferencia hay entre ON COMMIT DELETE ROWS y ON COMMIT PRESERVE ROWS en una GTT?", options: [
        "Ninguna, son sinónimos", "DELETE ROWS vacía la tabla al hacer COMMIT; PRESERVE ROWS conserva los datos hasta el fin de sesión",
        "PRESERVE ROWS hace la tabla permanente para todos los usuarios", "DELETE ROWS elimina la definición de la tabla"
      ], a: 1,
      why: [
        "No son sinónimos: su comportamiento tras COMMIT es opuesto.",
        "Correcta: es exactamente la diferencia entre ambas opciones de una tabla temporal global.",
        "PRESERVE ROWS no afecta a otros usuarios ni hace la tabla permanente para todos; sigue siendo privada por sesión.",
        "DELETE ROWS solo borra las filas de esa sesión, no la definición de la tabla."
      ] },
    { q: "¿Qué operación NO se puede realizar sobre una tabla externa desde SQL?", options: ["SELECT", "INSERT", "JOIN con otra tabla", "Usarla en una subconsulta"], a: 1,
      why: [
        "SELECT sí está permitido: es su uso principal.",
        "Correcta: las tablas externas son de solo lectura, no admiten INSERT (ni UPDATE ni DELETE).",
        "Sí se puede usar en un JOIN con tablas normales.",
        "Sí se puede usar dentro de una subconsulta como cualquier otra fuente de datos de solo lectura."
      ] },
    { q: "¿Para qué sirve COMMENT ON TABLE?", options: [
        "Para deshabilitar temporalmente una tabla", "Para añadir documentación visible en el diccionario de datos, sin afectar a los datos",
        "Para renombrar la tabla", "Para crear un índice sobre la tabla"
      ], a: 1,
      why: [
        "No deshabilita nada; la tabla sigue funcionando con normalidad.",
        "Correcta: solo añade un texto descriptivo consultable en el diccionario de datos.",
        "Renombrar se hace con RENAME, no con COMMENT ON.",
        "COMMENT ON no crea índices ni afecta al rendimiento."
      ] },
    { q: "¿Qué tipo de dato representa la dirección física de una fila dentro de su segmento?", options: ["UROWID", "ROWID", "VARCHAR2", "NUMBER"], a: 1,
      why: [
        "UROWID generaliza el concepto para casos sin rowid físico tradicional, pero no es 'la' dirección física estándar.",
        "Correcta: ROWID representa la dirección física única de la fila.",
        "VARCHAR2 es un tipo de texto, sin relación con direcciones de almacenamiento.",
        "NUMBER es un tipo numérico genérico, sin relación con direcciones de almacenamiento."
      ] },
    { q: "¿Desde qué versión de Oracle es BOOLEAN un tipo de columna SQL real (no solo de PL/SQL)?", options: ["11g", "12c", "19c", "23c"], a: 3,
      why: [
        "En 11g BOOLEAN solo existía en PL/SQL, no como columna SQL.",
        "En 12c tampoco existía todavía como tipo de columna SQL.",
        "En 19c seguía siendo exclusivo de PL/SQL para este propósito.",
        "Correcta: Oracle 23c introdujo BOOLEAN como tipo de columna SQL real."
      ] },
    { q: "¿Qué requiere obligatoriamente una tabla externa para funcionar?", options: [
        "Un índice sobre cada columna", "Un directorio de Oracle (OBJECT DIRECTORY) que apunte a la ubicación del archivo",
        "Que el archivo esté en formato XML", "Una clave primaria declarada"
      ], a: 1,
      why: [
        "No requiere índices: de hecho no admite los mismos mecanismos de indexación que una tabla normal.",
        "Correcta: se necesita un DIRECTORY que Oracle pueda usar para localizar el archivo de datos en el sistema de archivos.",
        "No tiene que ser XML; es habitual usar CSV o texto delimitado plano.",
        "No requiere una clave primaria: es una fuente de solo lectura, no gestiona integridad referencial propia."
      ] }
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
  id: 13, code: "M13", category: "Restricciones",
  title: "Constraints",
  intro: "Reglas de integridad: NOT NULL, PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK, y su gestión completa en Oracle, incluida la validación de datos existentes.",
  theory: {
    concepts: [
      { heading: "1. Tipos de constraint",
        explanation: "NOT NULL obliga a que una columna tenga valor en toda fila. PRIMARY KEY identifica de forma única cada fila de la tabla (implica NOT NULL + UNIQUE en sus columnas; solo puede haber una PRIMARY KEY por tabla). UNIQUE garantiza valores únicos por columna, pero sí admite NULL (y admite varias filas con NULL, porque NULL nunca se considera igual a otro NULL a estos efectos). FOREIGN KEY enlaza una columna con la PRIMARY KEY o una UNIQUE de otra tabla (o de la misma, en jerarquías). CHECK valida que los valores cumplan una condición booleana, por ejemplo CHECK (salary > 0)." },
      { heading: "2. Constraints con nombre explícito",
        explanation: "Se recomienda nombrar siempre los constraints con CONSTRAINT nombre tipo(...), en vez de dejar que Oracle genere un nombre automático tipo SYS_C0012345, difícil de identificar en mensajes de error futuros.",
        syntax: "CONSTRAINT nombre_constraint { NOT NULL | PRIMARY KEY | UNIQUE | CHECK (condición) | FOREIGN KEY (columna) REFERENCES tabla(columna) }",
        examples: [
          { code: "CONSTRAINT fk_emp_dept FOREIGN KEY (department_id)\n  REFERENCES departments(department_id)" }
        ] },
      { heading: "3. Nivel de columna vs nivel de tabla",
        explanation: "Un constraint a nivel de columna se escribe justo después del tipo de dato de esa columna, y solo puede referirse a ella. Un constraint a nivel de tabla se escribe como un elemento independiente al final de la lista de columnas, y es obligatorio cuando la restricción afecta a varias columnas a la vez (por ejemplo, una PRIMARY KEY compuesta por dos columnas)." },
      { heading: "4. Restricciones sobre CHECK",
        explanation: "Una condición CHECK no puede contener subconsultas, ni referenciar SYSDATE, USER, UID o pseudocolumnas como ROWNUM o CURRVAL/NEXTVAL, ni referenciar otras filas o tablas: solo puede evaluar valores de columnas de la misma fila que se está insertando o actualizando. Una columna puede tener varios CHECK a la vez, y Oracle los valida todos." },
      { heading: "5. ON DELETE CASCADE / SET NULL",
        explanation: "En una FOREIGN KEY, ON DELETE CASCADE hace que al borrar la fila padre se borren automáticamente las filas hijas relacionadas. ON DELETE SET NULL pone a NULL la clave foránea de las filas hijas en vez de borrarlas. Sin ninguna de las dos cláusulas (comportamiento por defecto, a veces llamado ON DELETE RESTRICT), Oracle impide borrar la fila padre mientras tenga hijos, lanzando ORA-02292.",
        syntax: "FOREIGN KEY (columna) REFERENCES tabla_padre(columna_pk)\n[ON DELETE { CASCADE | SET NULL }]" },
      { heading: "6. Añadir, habilitar y deshabilitar constraints",
        explanation: "Se puede añadir un constraint a una tabla ya creada con ALTER TABLE tabla ADD CONSTRAINT nombre .... Se puede desactivar temporalmente uno existente (por ejemplo para cargar datos masivos sin validación) con ALTER TABLE tabla DISABLE CONSTRAINT nombre;, y reactivarlo después con ENABLE CONSTRAINT nombre;. Para eliminar un constraint por completo se usa ALTER TABLE tabla DROP CONSTRAINT nombre;.",
        syntax: "ALTER TABLE tabla ADD CONSTRAINT nombre tipo(...)\nALTER TABLE tabla DISABLE CONSTRAINT nombre\nALTER TABLE tabla ENABLE CONSTRAINT nombre\nALTER TABLE tabla DROP CONSTRAINT nombre",
        examples: [
          { code: "ALTER TABLE empleados_dep DISABLE CONSTRAINT fk_emp_dept;\n-- ... carga masiva de datos ...\nALTER TABLE empleados_dep ENABLE CONSTRAINT fk_emp_dept;" }
        ] },
      { heading: "7. VALIDATE / NOVALIDATE: distinguir datos futuros de datos ya existentes",
        explanation: "Al habilitar un constraint, Oracle permite elegir si revisa o no los datos YA existentes en la tabla. ENABLE VALIDATE (el comportamiento por defecto de ENABLE) exige que todas las filas actuales cumplan la regla, y la rechaza si alguna la incumple. ENABLE NOVALIDATE activa el constraint para todas las operaciones FUTURAS, pero no revisa los datos ya presentes, que pueden quedar incumpliendo la regla silenciosamente. Es una técnica intermedia útil cuando se sabe que hay datos históricos 'sucios' que no se pueden limpiar de inmediato, pero se quiere empezar a exigir la regla desde ahora en adelante.",
        syntax: "ALTER TABLE tabla MODIFY CONSTRAINT nombre { ENABLE VALIDATE | ENABLE NOVALIDATE | DISABLE }",
        examples: [
          { code: "ALTER TABLE empleados_dep MODIFY CONSTRAINT chk_salario_min ENABLE NOVALIDATE;" }
        ] },
      { heading: "8. Consultar las restricciones en el diccionario de datos",
        explanation: "USER_CONSTRAINTS lista los constraints del propio usuario, con su nombre, tipo (P=Primary Key, R=Foreign Key/References, U=Unique, C=Check/NOT NULL) y estado (ENABLED/DISABLED, VALIDATED/NOT VALIDATED). USER_CONS_COLUMNS detalla qué columnas concretas forman parte de cada constraint, imprescindible para identificar las columnas de una clave compuesta o de una FK.",
        syntax: "SELECT constraint_name, constraint_type, status, validated\nFROM   USER_CONSTRAINTS\nWHERE  table_name = 'NOMBRE_TABLA';",
        examples: [
          { code: "SELECT constraint_name, constraint_type, status\nFROM   user_constraints\nWHERE  table_name = 'EMPLOYEES';" }
        ] }
    ],
    oracleNotes: [
      "PRIMARY KEY implica NOT NULL + UNIQUE automáticamente; no hace falta repetir NOT NULL, y solo puede existir una por tabla.",
      "UNIQUE sí admite NULL (incluso en varias filas); PRIMARY KEY nunca admite NULL en ninguna de sus columnas.",
      "Sin ON DELETE CASCADE ni SET NULL, Oracle impide por defecto borrar una fila padre que tiene hijos (ORA-02292).",
      "CHECK no admite subconsultas ni funciones dependientes del contexto de sesión (SYSDATE, USER, ROWNUM...): solo lógica sobre columnas de la propia fila.",
      "ENABLE VALIDATE revisa los datos existentes al activar; ENABLE NOVALIDATE solo exige la regla a partir de ahora, dejando pasar datos antiguos que ya la incumplían."
    ]
  },
  summary: [
    "NOT NULL, PRIMARY KEY, UNIQUE, FOREIGN KEY y CHECK son los tipos de constraint.",
    "Nombrar los constraints explícitamente evita mensajes de error ilegibles como SYS_C0012345.",
    "Los constraints se declaran a nivel de columna o de tabla (obligatorio para claves compuestas).",
    "CHECK solo puede evaluar columnas de la propia fila, sin subconsultas ni SYSDATE/USER/ROWNUM.",
    "ON DELETE CASCADE / SET NULL controlan qué pasa con los hijos al borrar el padre; por defecto Oracle lo impide.",
    "VALIDATE exige que los datos actuales cumplan la regla; NOVALIDATE solo la exige desde ahora en adelante.",
    "USER_CONSTRAINTS y USER_CONS_COLUMNS permiten consultar qué restricciones existen y sobre qué columnas."
  ],
  comparisonTable: {
    title: "ENABLE VALIDATE vs ENABLE NOVALIDATE",
    headers: ["Opción", "Revisa datos existentes", "Exige la regla en nuevas operaciones", "Uso típico"],
    rows: [
      ["ENABLE VALIDATE (por defecto)", "Sí, falla si hay datos inválidos", "Sí", "Constraint nuevo sobre datos ya limpios"],
      ["ENABLE NOVALIDATE", "No", "Sí", "Empezar a exigir la regla sin poder limpiar el histórico todavía"],
      ["DISABLE", "No aplica", "No", "Cargas masivas temporales sin validar nada"]
    ]
  },
  mindMap: [
    { topic: "Módulo 13 — Constraints", children: [
      "Tipos → NOT NULL, PRIMARY KEY (única, NOT NULL+UNIQUE), UNIQUE (admite NULL), FOREIGN KEY, CHECK",
      "Declaración → nivel de columna o de tabla (obligatorio para claves compuestas)",
      "CHECK → solo columnas de la propia fila, sin subconsultas ni SYSDATE/USER/ROWNUM",
      "FK y borrado → sin ON DELETE (bloquea, ORA-02292), CASCADE (borra hijos), SET NULL (desvincula)",
      "Gestión → ADD/DISABLE/ENABLE/DROP CONSTRAINT",
      "Validación → ENABLE VALIDATE (revisa histórico) vs ENABLE NOVALIDATE (solo desde ahora)",
      "Consulta → USER_CONSTRAINTS, USER_CONS_COLUMNS"
    ] }
  ],
  sourceRefs: [
    "Oracle SQL Language Reference 19c — \"CREATE TABLE\" (cláusulas de constraint)",
    "Oracle SQL Language Reference 19c — \"ALTER TABLE\" (constraint_clauses)",
    "Oracle Database SQL Language Reference — \"CHECK Constraints\" (restricciones de la condición)",
    "Oracle Database Reference 19c — \"USER_CONSTRAINTS\", \"USER_CONS_COLUMNS\""
  ],
  realCases: {
    business: "Un sistema de ventas migrado desde una hoja de cálculo descubre que el 3% de los pedidos históricos tiene un total en 0 o negativo; en vez de bloquear la operación diaria, activa el nuevo CHECK (total > 0) con ENABLE NOVALIDATE, exigiéndolo solo a partir de ahora mientras se depura el histórico en paralelo.",
    dataEngineering: "Un ingeniero de datos consulta USER_CONSTRAINTS antes de truncar o recargar una tabla, para identificar qué claves foráneas dependen de ella y evitar romper la integridad de tablas relacionadas sin darse cuenta.",
    etl: "Un proceso de carga masiva desactiva temporalmente las FOREIGN KEY con DISABLE CONSTRAINT antes de insertar millones de filas en un orden que no respeta las dependencias padre-hijo, y las reactiva con ENABLE VALIDATE al finalizar para garantizar la integridad final.",
    reporting: "Un equipo de auditoría de datos genera un informe de calidad ejecutando una consulta sobre USER_CONSTRAINTS filtrando por STATUS = 'DISABLED', para detectar constraints que quedaron desactivados por error y nunca se reactivaron."
  },
  mistakes: [
    { mistake: "No nombrar los constraints explícitamente.", why: "Oracle genera un nombre automático tipo SYS_C0012345, ilegible en mensajes de error futuros; el examen presenta un error de este tipo y espera que sepas leer USER_CONSTRAINTS para identificar a qué restricción corresponde." },
    { mistake: "Olvidar que PRIMARY KEY implica NOT NULL + UNIQUE automáticamente.", why: "Repetir NOT NULL sobre una columna que ya es PRIMARY KEY no es un error, pero el examen pregunta si es NECESARIO, y la respuesta es que no lo es." },
    { mistake: "Confundir ENABLE NOVALIDATE con una simple reactivación normal.", why: "Sin NOVALIDATE explícito, ENABLE revisa TODOS los datos existentes (comportamiento VALIDATE por defecto) y puede fallar si hay datos históricos que incumplen la regla; NOVALIDATE es la única forma de activar la regla sin ese chequeo retroactivo." },
    { mistake: "Confundir ON DELETE CASCADE con el comportamiento por defecto.", why: "Por defecto (sin ninguna cláusula ON DELETE), Oracle IMPIDE borrar la fila padre mientras tenga hijos; CASCADE hace justo lo contrario, propagar el borrado. El examen las presenta juntas para comprobar que no las confundes." }
  ],
  exercises: [
    { title: "Tabla con constraints nombrados", difficulty: "básico", prompt: "Crea una tabla pedidos con id_pedido NUMBER PK, id_cliente NUMBER que referencia clientes(id_cliente), y total NUMBER que debe ser mayor que 0. Nombra todos los constraints.", hint: "CONSTRAINT nombre TIPO(...)", solution: "CREATE TABLE pedidos (\n  id_pedido NUMBER(8),\n  id_cliente NUMBER(6),\n  total NUMBER(10,2),\n  CONSTRAINT pk_pedidos PRIMARY KEY (id_pedido),\n  CONSTRAINT fk_pedidos_cliente FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),\n  CONSTRAINT chk_total_positivo CHECK (total > 0)\n);" },
    { title: "Añadir FK con cascade", difficulty: "básico", prompt: "Añade a la tabla pedidos ya existente una FOREIGN KEY hacia clientes con ON DELETE CASCADE.", hint: "ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY ... ON DELETE CASCADE", solution: "ALTER TABLE pedidos\nADD CONSTRAINT fk_pedidos_cliente_casc FOREIGN KEY (id_cliente)\nREFERENCES clientes(id_cliente) ON DELETE CASCADE;" },
    { title: "Consultar constraints de una tabla", difficulty: "intermedio", prompt: "Consulta el nombre, tipo y estado de todos los constraints de la tabla EMPLOYEES.", hint: "USER_CONSTRAINTS WHERE table_name = '...'", solution: "SELECT constraint_name, constraint_type, status\nFROM user_constraints\nWHERE table_name = 'EMPLOYEES';" },
    { title: "Activar sin validar histórico", difficulty: "intermedio", prompt: "Activa un CHECK chk_total_positivo sobre pedidos exigiéndolo solo para operaciones futuras, sin revisar los pedidos ya existentes.", hint: "ENABLE NOVALIDATE", solution: "ALTER TABLE pedidos MODIFY CONSTRAINT chk_total_positivo ENABLE NOVALIDATE;" },
    { title: "Carga masiva con constraints desactivados", difficulty: "avanzado", prompt: "Desactiva el constraint fk_pedidos_cliente, inserta un pedido con un id_cliente que no existe todavía, y luego vuelve a activarlo con VALIDATE explicando qué pasará.", hint: "DISABLE, INSERT, ENABLE VALIDATE.", solution: "ALTER TABLE pedidos DISABLE CONSTRAINT fk_pedidos_cliente;\nINSERT INTO pedidos (id_pedido, id_cliente, total) VALUES (1, 9999, 50);\nALTER TABLE pedidos MODIFY CONSTRAINT fk_pedidos_cliente ENABLE VALIDATE;\n-- fallará porque revisa todos los datos y 9999 no existe en clientes; habría que corregir el dato antes o usar ENABLE NOVALIDATE." },
    { title: "Comparar tres escenarios de ON DELETE", difficulty: "avanzado", prompt: "Explica qué pasaría al intentar borrar un cliente que tiene pedidos asociados, en tres escenarios: sin ON DELETE definido, con ON DELETE CASCADE, y con ON DELETE SET NULL.", hint: "Piensa en qué le pasa a los pedidos hijos en cada caso.", solution: "Sin ON DELETE: Oracle lanza error (ORA-02292) e impide el borrado mientras existan pedidos asociados. Con CASCADE: se borra el cliente y automáticamente todos sus pedidos. Con SET NULL: se borra el cliente y los pedidos quedan con id_cliente en NULL." }
  ],
  solved: [
    { title: "Diagnosticar un error SYS_C0012345",
      problem: "Un INSERT falla con: ORA-02290: check constraint (HR.SYS_C0012345) violated, y no sabes a qué regla corresponde.",
      steps: [
        "Reconoce que SYS_C0012345 es un nombre autogenerado por Oracle, no descriptivo.",
        "Consulta USER_CONSTRAINTS filtrando por ese nombre para identificar la tabla y el tipo.",
        "Consulta también la condición del CHECK si es de ese tipo, en USER_CONSTRAINTS.SEARCH_CONDITION.",
        "Corrige el dato del INSERT para cumplir la condición, y considera renombrar el constraint (recreándolo con nombre) para futuros errores más legibles."
      ],
      query: "SELECT table_name, constraint_type, search_condition\nFROM   user_constraints\nWHERE  constraint_name = 'SYS_C0012345';",
      result: "Revela la tabla y la condición exacta que se está violando, facilitando el diagnóstico." },
    { title: "Activar una regla nueva sin bloquear la operación diaria",
      problem: "Necesitas exigir CHECK (salario > 0) en una tabla con algunos históricos en 0, sin poder limpiarlos de inmediato ni bloquear la actividad normal.",
      steps: [
        "Añades el constraint con ALTER TABLE ... ADD CONSTRAINT ... CHECK (salario > 0).",
        "Si lo dejas con ENABLE VALIDATE por defecto, fallará por los históricos existentes.",
        "Lo activas explícitamente con ENABLE NOVALIDATE en su lugar.",
        "Planificas una limpieza posterior de los históricos y, cuando estén corregidos, cambias a ENABLE VALIDATE para exigir el chequeo retroactivo también."
      ],
      query: "ALTER TABLE empleados_dep ADD CONSTRAINT chk_salario_min CHECK (salario > 0);\nALTER TABLE empleados_dep MODIFY CONSTRAINT chk_salario_min ENABLE NOVALIDATE;",
      result: "La regla se exige desde ya para cualquier INSERT/UPDATE nuevo, sin bloquear la operación por los datos históricos." }
  ],
  flashcards: [
    { front: "¿Qué implica automáticamente una PRIMARY KEY?", back: "NOT NULL + UNIQUE en sus columnas." },
    { front: "¿Admite NULL una columna UNIQUE?", back: "Sí, incluso en varias filas a la vez." },
    { front: "¿Qué error lanza Oracle al intentar borrar un padre con hijos, sin ON DELETE definido?", back: "ORA-02292." },
    { front: "¿Qué puede referenciar una condición CHECK?", back: "Solo columnas de la propia fila; nunca subconsultas, SYSDATE, USER o ROWNUM." },
    { front: "¿Qué diferencia hay entre ENABLE VALIDATE y ENABLE NOVALIDATE?", back: "VALIDATE revisa los datos existentes; NOVALIDATE solo exige la regla desde ahora en adelante." },
    { front: "¿Qué vista del diccionario lista los constraints de tus tablas?", back: "USER_CONSTRAINTS." },
    { front: "¿Qué vista detalla las columnas de cada constraint?", back: "USER_CONS_COLUMNS." },
    { front: "¿Cómo se desactiva un constraint sin eliminarlo?", back: "ALTER TABLE tabla DISABLE CONSTRAINT nombre;" }
  ],
  examples: [
    { title: "Constraints a nivel de columna y de tabla", code: "CREATE TABLE empleados_dep (\n  id_emp     NUMBER(6),\n  nombre     VARCHAR2(50) NOT NULL,\n  email      VARCHAR2(100) UNIQUE,\n  salario    NUMBER(8,2) CHECK (salario > 0),\n  dept_id    NUMBER(4),\n  CONSTRAINT pk_empleados_dep PRIMARY KEY (id_emp),\n  CONSTRAINT fk_emp_dept FOREIGN KEY (dept_id)\n    REFERENCES departments(department_id) ON DELETE SET NULL\n);" },
    { title: "VALIDATE vs NOVALIDATE", code: "ALTER TABLE empleados_dep MODIFY CONSTRAINT chk_salario_min ENABLE NOVALIDATE;" },
    { title: "Consultar constraints", code: "SELECT constraint_name, constraint_type, status\nFROM user_constraints\nWHERE table_name = 'EMPLOYEES';" }
  ],
  quiz: [
    { q: "¿Qué combinación de restricciones implica automáticamente una PRIMARY KEY?", options: ["Solo NOT NULL", "Solo UNIQUE", "NOT NULL + UNIQUE", "CHECK + UNIQUE"], a: 2,
      why: [
        "Solo NOT NULL no bastaría para garantizar unicidad.",
        "Solo UNIQUE no bastaría para garantizar obligatoriedad (admite NULL).",
        "Correcta: una PK garantiza unicidad y obligatoriedad a la vez.",
        "CHECK no tiene relación con la definición de PRIMARY KEY."
      ] },
    { q: "¿Qué diferencia hay entre UNIQUE y PRIMARY KEY?", options: [
        "Ninguna", "UNIQUE permite un valor NULL (o varios), PRIMARY KEY nunca admite NULL",
        "PRIMARY KEY admite duplicados y UNIQUE no", "UNIQUE solo se puede usar una vez por tabla"
      ], a: 1,
      why: [
        "Sí hay una diferencia clave respecto a NULL.",
        "Correcta: UNIQUE valida unicidad pero sí admite NULL; PRIMARY KEY no admite NULL en ninguna de sus columnas.",
        "Es exactamente al revés: PRIMARY KEY nunca admite duplicados.",
        "UNIQUE se puede declarar varias veces en la misma tabla, sobre columnas distintas."
      ] },
    { q: "¿Qué hace ON DELETE CASCADE en una FOREIGN KEY?", options: [
        "Impide borrar la fila padre", "Al borrar la fila padre, borra automáticamente las filas hijas relacionadas",
        "Pone a NULL la clave foránea de los hijos", "No tiene efecto en DELETE"
      ], a: 1,
      why: [
        "Eso describe el comportamiento por defecto (sin ON DELETE), no CASCADE.",
        "Correcta: CASCADE propaga el borrado a las filas hijas.",
        "Eso describe ON DELETE SET NULL, no CASCADE.",
        "Sí tiene un efecto directo y significativo en DELETE."
      ] },
    { q: "¿Cómo se desactiva temporalmente un constraint sin eliminarlo?", options: [
        "DROP CONSTRAINT temporalmente no es posible", "ALTER TABLE tabla DISABLE CONSTRAINT nombre;",
        "UPDATE constraint SET active = 0;", "No se puede desactivar, solo eliminar y recrear"
      ], a: 1,
      why: [
        "No es necesario un DROP para desactivar temporalmente.",
        "Correcta: DISABLE/ENABLE CONSTRAINT permite activar o desactivar sin borrar la definición.",
        "Los constraints no son filas de una tabla que se puedan UPDATE de esta forma.",
        "Sí se puede desactivar sin eliminar, con DISABLE CONSTRAINT."
      ] },
    { q: "¿Qué diferencia hay entre ENABLE VALIDATE y ENABLE NOVALIDATE?", options: [
        "Son exactamente lo mismo", "VALIDATE revisa los datos existentes; NOVALIDATE solo exige la regla a partir de ahora",
        "NOVALIDATE es más estricto que VALIDATE", "VALIDATE solo aplica a claves foráneas"
      ], a: 1,
      why: [
        "No son lo mismo: su alcance sobre los datos existentes es distinto.",
        "Correcta: es la distinción clave entre ambas formas de habilitar un constraint.",
        "Es al revés: VALIDATE es más estricto porque revisa también el histórico.",
        "VALIDATE/NOVALIDATE aplican a cualquier tipo de constraint, no solo a FK."
      ] },
    { q: "¿Qué vista del diccionario de datos consultarías para ver el tipo y estado de los constraints de una tabla?", options: ["USER_TABLES", "USER_CONSTRAINTS", "USER_INDEXES", "USER_TAB_COLUMNS"], a: 1,
      why: [
        "USER_TABLES da información general de tablas, no de sus constraints.",
        "Correcta: USER_CONSTRAINTS lista nombre, tipo y estado de cada constraint.",
        "USER_INDEXES es sobre índices, un objeto relacionado pero distinto.",
        "USER_TAB_COLUMNS describe columnas, no constraints."
      ] },
    { q: "¿Qué código representa una FOREIGN KEY en la columna CONSTRAINT_TYPE de USER_CONSTRAINTS?", options: ["P", "U", "C", "R"], a: 3,
      why: [
        "P representa PRIMARY KEY.",
        "U representa UNIQUE.",
        "C representa CHECK (incluye también NOT NULL, implementado como CHECK internamente).",
        "Correcta: R representa una foreign key (References)."
      ] },
    { q: "¿Qué puede evaluar una condición CHECK?", options: [
        "El resultado de una subconsulta a otra tabla", "Solo columnas de la propia fila que se inserta o actualiza",
        "El valor de SYSDATE en el momento de la consulta", "El número de filas total de la tabla"
      ], a: 1,
      why: [
        "CHECK no admite subconsultas: no puede depender de otra tabla.",
        "Correcta: solo puede evaluar valores de columnas de la misma fila.",
        "SYSDATE no está permitido en una condición CHECK.",
        "El número de filas requeriría una función de grupo o consulta, no permitida en CHECK."
      ] },
    { q: "¿Qué ocurre al ejecutar ENABLE VALIDATE sobre un constraint que estaba deshabilitado, si existen filas que lo incumplen?", options: [
        "Se habilita sin problema y las filas inválidas se marcan automáticamente", "Falla y el constraint no se llega a habilitar hasta corregir los datos",
        "Se habilita pero solo para las filas nuevas, ignorando las inválidas", "Oracle elimina automáticamente las filas inválidas"
      ], a: 1,
      why: [
        "No hay ningún marcado automático de filas inválidas; el intento de habilitar falla.",
        "Correcta: ENABLE VALIDATE exige que todos los datos actuales cumplan la regla, y falla si alguno no la cumple.",
        "Ese comportamiento parcial correspondería más bien a NOVALIDATE, no a VALIDATE.",
        "Oracle nunca borra datos automáticamente al intentar habilitar un constraint."
      ] },
    { q: "¿Qué combinación de opciones permite exigir una regla nueva sin revisar (ni bloquear por) los datos históricos existentes?", options: [
        "DISABLE NOVALIDATE", "ENABLE VALIDATE", "ENABLE NOVALIDATE", "DISABLE VALIDATE"
      ], a: 2,
      why: [
        "DISABLE NOVALIDATE no exige la regla en absoluto, ni para datos nuevos.",
        "ENABLE VALIDATE sí revisaría (y podría bloquear por) los datos históricos.",
        "Correcta: ENABLE NOVALIDATE activa la regla para el futuro sin revisar el pasado.",
        "DISABLE VALIDATE no es una combinación operativa habitual con este propósito."
      ] }
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
  id: 14, code: "M14", category: "DDL",
  title: "Otros objetos de esquema: vistas, secuencias, sinónimos e índices",
  intro: "Objetos de esquema más allá de las tablas: vistas (simples y complejas), secuencias, sinónimos e índices.",
  theory: {
    concepts: [
      { heading: "1. Vistas: simples vs complejas",
        explanation: "Una vista es una consulta SELECT guardada con un nombre, que se comporta como una tabla virtual: no almacena datos propios, los genera ejecutando su consulta cada vez que se referencia. Sirve para simplificar consultas repetitivas, ocultar columnas sensibles y dar independencia entre el modelo físico de las tablas y lo que necesita ver cada usuario o aplicación. Una vista SIMPLE se basa en una sola tabla, sin funciones de grupo ni operadores de conjunto; una vista COMPLEJA incluye JOIN, GROUP BY, DISTINCT o funciones de grupo, y por ello tiene restricciones de actualización (siguiente concepto)." },
      { heading: "2. Sintaxis Oracle de vistas y opciones",
        explanation: "CREATE [OR REPLACE] VIEW nombre [(alias_columna, ...)] AS subconsulta [WITH CHECK OPTION [CONSTRAINT nombre]] [WITH READ ONLY [CONSTRAINT nombre]];. WITH CHECK OPTION impide que, a través de la vista, se inserten o actualicen filas que dejarían de cumplir la condición WHERE de la vista (por ejemplo, no dejaría subir el salario de un empleado fuera del rango que la vista filtra). WITH READ ONLY impide cualquier INSERT/UPDATE/DELETE a través de la vista, aunque fuera técnicamente posible.",
        syntax: "CREATE [OR REPLACE] VIEW nombre_vista [(alias1, alias2, ...)]\nAS subconsulta\n[WITH CHECK OPTION [CONSTRAINT nombre]]\n[WITH READ ONLY [CONSTRAINT nombre]]",
        examples: [
          { code: "CREATE OR REPLACE VIEW v_empleados_it AS\nSELECT employee_id, last_name, salary, department_id\nFROM   employees\nWHERE  department_id = 60\nWITH CHECK OPTION;" }
        ] },
      { heading: "3. Cuándo una vista deja de ser actualizable",
        explanation: "Una vista 'simple' (una sola tabla base, sin funciones de grupo, DISTINCT, GROUP BY, ni operadores de conjunto) es actualizable de forma directa igual que la tabla subyacente. Una vista deja de ser actualizable (total o parcialmente) si incluye: operadores de conjunto (UNION, INTERSECT, MINUS); funciones de grupo o GROUP BY/HAVING; DISTINCT; expresiones o funciones de una fila calculadas en una columna (esa columna concreta no admite UPDATE); un JOIN entre varias tablas, salvo sobre la 'key-preserved table' (la tabla cuya clave primaria sigue identificando de forma única cada fila del resultado); o ROWNUM. Intentar modificar una columna no actualizable lanza ORA-01732 o ORA-01779 según el caso." },
      { heading: "4. Secuencias (CREATE SEQUENCE)",
        explanation: "Una secuencia es un objeto independiente de cualquier tabla que genera números únicos, típicamente usados para poblar claves primarias. CREATE SEQUENCE nombre [START WITH n] [INCREMENT BY n] [MAXVALUE n | NOMAXVALUE] [MINVALUE n | NOMINVALUE] [CYCLE | NOCYCLE] [CACHE n | NOCACHE];. Por defecto INCREMENT BY es 1, START WITH es 1, NOCYCLE, y CACHE 20 (Oracle pre-genera y reserva en memoria 20 valores por defecto para mejorar rendimiento, salvo que se indique NOCACHE). Se usa con nombre.NEXTVAL para obtener y avanzar al siguiente valor, y nombre.CURRVAL para consultar el último valor obtenido en la sesión actual — CURRVAL solo está disponible después de haber usado NEXTVAL al menos una vez en esa sesión.",
        syntax: "CREATE SEQUENCE nombre\n[START WITH n] [INCREMENT BY n]\n[MAXVALUE n | NOMAXVALUE] [MINVALUE n | NOMINVALUE]\n[CYCLE | NOCYCLE] [CACHE n | NOCACHE]",
        examples: [
          { code: "CREATE SEQUENCE seq_clientes START WITH 1 INCREMENT BY 1 NOCACHE;\n\nINSERT INTO clientes (id_cliente, nombre)\nVALUES (seq_clientes.NEXTVAL, 'Nueva Empresa SL');" }
        ] },
      { heading: "5. Sinónimos (CREATE SYNONYM)",
        explanation: "Un sinónimo es un alias permanente para un objeto de esquema (tabla, vista, secuencia, procedimiento...), útil para simplificar nombres largos o cualificados (esquema.objeto) y para dar independencia de ubicación si el objeto real cambia de esquema. CREATE [PUBLIC] SYNONYM nombre FOR [esquema.]objeto;. Un sinónimo PUBLIC lo puede usar cualquier usuario de la base de datos; uno privado (sin PUBLIC) solo el usuario que lo crea.",
        syntax: "CREATE [PUBLIC] SYNONYM nombre_sinonimo FOR [esquema.]objeto",
        examples: [
          { code: "CREATE SYNONYM emp FOR employees;\nSELECT * FROM emp;" }
        ] },
      { heading: "6. Índices (concepto general y CREATE INDEX)",
        explanation: "Un índice es una estructura auxiliar (típicamente un árbol B-tree) que acelera las búsquedas sobre una o varias columnas, a costa de espacio en disco y de ralentizar ligeramente las escrituras (cada INSERT/UPDATE/DELETE también debe mantener el índice). CREATE INDEX nombre ON tabla(columna1 [, columna2 ...]); crea por defecto un índice B-tree normal (no único: admite valores repetidos). Oracle crea automáticamente un índice único al definir una PRIMARY KEY o una restricción UNIQUE, por lo que no hace falta crear uno aparte para esos casos. Un índice no cambia el resultado de ninguna consulta, solo puede cambiar su velocidad: el optimizador decide si lo usa o no.",
        syntax: "CREATE [UNIQUE] INDEX nombre_indice\nON tabla (columna1 [, columna2, ...])",
        examples: [
          { code: "CREATE INDEX idx_emp_apellido ON employees(last_name);" }
        ] }
    ],
    oracleNotes: [
      "WITH CHECK OPTION impide insertar/actualizar a través de la vista filas que dejarían de cumplir su WHERE.",
      "CURRVAL solo está disponible después de haber usado NEXTVAL al menos una vez en la sesión; usarlo antes da error.",
      "Una vista con JOIN (salvo sobre la key-preserved table), GROUP BY, DISTINCT, funciones de grupo o UNION/INTERSECT/MINUS deja de ser actualizable, total o parcialmente.",
      "El valor por defecto de CACHE en una secuencia es 20, no 0: tras un reinicio de instancia pueden 'perderse' valores cacheados sin usar, por lo que una secuencia no garantiza números estrictamente consecutivos, solo únicos.",
      "Crear manualmente un índice sobre una columna que ya es PRIMARY KEY o UNIQUE es redundante: Oracle ya mantiene uno automáticamente para esa restricción."
    ]
  },
  summary: [
    "Una vista simple (una tabla, sin agregados) es actualizable; una compleja (JOIN, GROUP BY, DISTINCT, funciones de grupo) deja de serlo, total o parcialmente.",
    "WITH CHECK OPTION y WITH READ ONLY controlan qué modificaciones permite una vista.",
    "Una secuencia genera números únicos (no necesariamente consecutivos) con NEXTVAL / CURRVAL; CACHE 20 es el valor por defecto.",
    "Un sinónimo es un alias permanente de otro objeto, PUBLIC (todos los usuarios) o privado.",
    "Un índice acelera búsquedas sin cambiar el resultado de ninguna consulta; PRIMARY KEY y UNIQUE ya crean uno automáticamente."
  ],
  comparisonTable: {
    title: "Objetos de esquema de un vistazo",
    headers: ["Objeto", "¿Almacena datos propios?", "Propósito principal"],
    rows: [
      ["Vista", "No (ejecuta su consulta cada vez)", "Simplificar, ocultar columnas, dar independencia lógica"],
      ["Secuencia", "Solo su estado interno (último valor)", "Generar números únicos, típico para claves"],
      ["Sinónimo", "No", "Dar un alias permanente a otro objeto"],
      ["Índice", "Sí (estructura auxiliar redundante)", "Acelerar búsquedas, sin cambiar resultados"]
    ]
  },
  mindMap: [
    { topic: "Módulo 14 — Otros objetos de esquema", children: [
      "Vistas → simples (actualizables) vs complejas (JOIN/GROUP BY/DISTINCT/agregados, no actualizables)",
      "Opciones de vista → WITH CHECK OPTION (protege el WHERE), WITH READ ONLY (bloquea DML)",
      "Secuencias → NEXTVAL/CURRVAL, CACHE 20 por defecto, no garantiza consecutivos",
      "Sinónimos → PUBLIC (todos) o privado, alias permanente sin duplicar datos",
      "Índices → aceleran búsqueda, no cambian resultado; PK/UNIQUE ya crean uno automático"
    ] }
  ],
  sourceRefs: [
    "Oracle SQL Language Reference 19c — \"CREATE VIEW\"",
    "Oracle SQL Language Reference 19c — \"CREATE SEQUENCE\"",
    "Oracle SQL Language Reference 19c — \"CREATE SYNONYM\"",
    "Oracle SQL Language Reference 19c — \"CREATE INDEX\"",
    "Oracle Database Administrator's Guide — \"Managing Views\" (restricciones de actualización)"
  ],
  realCases: {
    business: "Un departamento de RRHH da acceso a sus analistas a una vista v_empleados_publico que oculta la columna salary, en vez de dar acceso directo a la tabla employees completa, aplicando el principio de mínimo privilegio sin duplicar datos.",
    dataEngineering: "Un ingeniero de datos usa secuencias para generar claves sustitutas (surrogate keys) en un modelo dimensional, desacoplando la clave técnica de cualquier identificador de negocio que pueda cambiar.",
    etl: "Un proceso ETL usa sinónimos para referenciar tablas de staging sin hardcodear el nombre completo esquema.tabla, facilitando mover ese proceso entre entornos (desarrollo, pruebas, producción) sin cambiar el código SQL.",
    reporting: "Un equipo de BI crea un índice sobre la columna fecha_venta de una tabla de hechos muy consultada por rango de fechas, mejorando drásticamente el tiempo de respuesta de los informes sin cambiar ninguna consulta existente."
  },
  mistakes: [
    { mistake: "Usar CURRVAL antes de haber llamado a NEXTVAL en la misma sesión.", why: "CURRVAL representa 'el último valor obtenido en esta sesión', y hasta que no se ejecuta NEXTVAL al menos una vez, ese valor no existe: Oracle lanza un error en vez de devolver, por ejemplo, el valor inicial." },
    { mistake: "Pensar que una vista siempre se puede actualizar libremente.", why: "Si tiene JOIN (salvo sobre la key-preserved table), GROUP BY, DISTINCT o funciones de grupo, deja de ser actualizable total o parcialmente; el examen presenta una vista compleja y espera que identifiques qué columnas concretas no admiten UPDATE." },
    { mistake: "Crear manualmente un índice sobre una columna que ya es PRIMARY KEY o UNIQUE.", why: "Oracle ya mantiene un índice único automático para esas restricciones; crear otro adicional es redundante y solo añade coste de mantenimiento sin ningún beneficio." },
    { mistake: "Confundir un sinónimo con una copia de los datos.", why: "Un sinónimo es solo un alias de acceso; no duplica ni almacena ningún dato. Modificar datos a través del sinónimo modifica exactamente el mismo objeto real al que apunta." }
  ],
  exercises: [
    { title: "Vista de solo lectura", difficulty: "básico", prompt: "Crea una vista v_altos_salarios con empleados de salario mayor a 10000, que no se pueda modificar a través de ella.", hint: "WITH READ ONLY", solution: "CREATE OR REPLACE VIEW v_altos_salarios AS\nSELECT employee_id, last_name, salary FROM employees WHERE salary > 10000\nWITH READ ONLY;" },
    { title: "Secuencia para pedidos", difficulty: "básico", prompt: "Crea una secuencia seq_pedidos que empiece en 1000 e incremente de 1 en 1, y úsala para insertar un pedido nuevo.", hint: "CREATE SEQUENCE ... START WITH ...; luego NEXTVAL", solution: "CREATE SEQUENCE seq_pedidos START WITH 1000 INCREMENT BY 1;\nINSERT INTO pedidos (id_pedido, id_cliente, total) VALUES (seq_pedidos.NEXTVAL, 1, 250);" },
    { title: "Sinónimo de acceso rápido", difficulty: "intermedio", prompt: "Crea un sinónimo privado llamado emp para la tabla employees.", hint: "CREATE SYNONYM nombre FOR objeto;", solution: "CREATE SYNONYM emp FOR employees;" },
    { title: "Vista con WITH CHECK OPTION", difficulty: "intermedio", prompt: "Crea una vista v_dept60 de empleados del departamento 60, que impida a través de ella cambiar el department_id a otro valor.", hint: "WITH CHECK OPTION protege el WHERE.", solution: "CREATE OR REPLACE VIEW v_dept60 AS\nSELECT employee_id, last_name, salary, department_id\nFROM employees WHERE department_id = 60\nWITH CHECK OPTION;" },
    { title: "Identificar columnas no actualizables", difficulty: "avanzado", prompt: "Dada la vista CREATE VIEW v_resumen AS SELECT department_id, COUNT(*) AS total FROM employees GROUP BY department_id;, explica por qué ninguna de sus columnas admite UPDATE.", hint: "Piensa en GROUP BY y en la función de grupo.", solution: "department_id proviene de una columna agrupada dentro de un GROUP BY, y total es el resultado de una función de grupo (COUNT); Oracle no puede determinar de forma no ambigua qué fila base modificar a partir de un valor agregado que representa muchas filas a la vez, así que la vista completa no es actualizable." },
    { title: "Índice sobre columnas de búsqueda frecuente", difficulty: "avanzado", prompt: "Explica cuándo tendría sentido crear un índice sobre employees(department_id, last_name) en vez de dos índices separados.", hint: "Piensa en consultas que filtran por ambas columnas juntas.", solution: "Un índice compuesto (department_id, last_name) beneficia especialmente a consultas que filtran o buscan por department_id y, dentro de ese filtro, ordenan o buscan por last_name; sería más eficiente que dos índices separados si las consultas habituales combinan ambas condiciones a la vez, ya que el índice compuesto puede resolver ambas búsquedas en un solo acceso ordenado." }
  ],
  solved: [
    { title: "Diseñar una vista segura para un equipo externo",
      problem: "Un equipo externo necesita consultar datos de empleados del departamento de IT, pero nunca debe ver el salario ni poder modificar nada.",
      steps: [
        "Decide qué columnas son seguras de exponer: employee_id, last_name, department_id (sin salary).",
        "Filtra por department_id = 60 en el WHERE de la vista.",
        "Añade WITH READ ONLY para bloquear cualquier intento de modificación a través de la vista.",
        "Otorga acceso a esa vista concreta al equipo externo, nunca a la tabla employees completa."
      ],
      query: "CREATE OR REPLACE VIEW v_it_publico AS\nSELECT employee_id, last_name, department_id\nFROM   employees\nWHERE  department_id = 60\nWITH READ ONLY;",
      result: "El equipo externo puede consultar los datos permitidos, sin acceso al salario ni posibilidad de modificar nada." },
    { title: "Detectar y evitar un índice redundante",
      problem: "Alguien va a crear CREATE INDEX idx_pk_manual ON productos(id_producto); sobre una columna que ya es PRIMARY KEY.",
      steps: [
        "Consulta USER_INDEXES o recuerda que Oracle ya crea un índice único automático para toda PRIMARY KEY.",
        "Reconoce que este nuevo índice sería completamente redundante.",
        "Decide no crearlo, evitando el coste de mantenimiento adicional en cada escritura sin ningún beneficio de rendimiento.",
        "Si se necesitara un índice adicional, lo orientarías a otra columna distinta de búsqueda frecuente, no a la ya indexada por la PK."
      ],
      query: "-- No ejecutar: CREATE INDEX idx_pk_manual ON productos(id_producto);\n-- Ya existe un índice único automático por la PRIMARY KEY.",
      result: "Se evita un índice duplicado innecesario que solo añadiría coste sin beneficio." }
  ],
  flashcards: [
    { front: "¿Qué evita WITH CHECK OPTION en una vista?", back: "Que se inserten o actualicen filas que dejarían de cumplir el WHERE de la vista." },
    { front: "¿Qué evita WITH READ ONLY en una vista?", back: "Cualquier INSERT/UPDATE/DELETE a través de la vista." },
    { front: "¿Qué pseudo-columna de una secuencia da el siguiente valor?", back: "NEXTVAL." },
    { front: "¿Cuándo está disponible CURRVAL?", back: "Solo después de haber usado NEXTVAL al menos una vez en la sesión." },
    { front: "¿Qué es un sinónimo PUBLIC?", back: "Un alias permanente que puede usar cualquier usuario de la base de datos." },
    { front: "¿Qué crea Oracle automáticamente al definir una PRIMARY KEY?", back: "Un índice único sobre esa columna." },
    { front: "¿Cambia un índice el resultado de una consulta?", back: "No; solo puede cambiar su velocidad, nunca el resultado." },
    { front: "¿Qué hace que una vista deje de ser actualizable?", back: "JOIN (salvo key-preserved table), GROUP BY, DISTINCT, funciones de grupo o operadores de conjunto." }
  ],
  examples: [
    { title: "Vista con WITH CHECK OPTION", code: "CREATE OR REPLACE VIEW v_empleados_it AS\nSELECT employee_id, last_name, salary, department_id\nFROM employees\nWHERE department_id = 60\nWITH CHECK OPTION;" },
    { title: "Secuencia y su uso en INSERT", code: "CREATE SEQUENCE seq_clientes START WITH 1 INCREMENT BY 1 NOCACHE;\n\nINSERT INTO clientes (id_cliente, nombre)\nVALUES (seq_clientes.NEXTVAL, 'Nueva Empresa SL');" },
    { title: "Sinónimo", code: "CREATE SYNONYM emp FOR employees;\nSELECT * FROM emp; -- equivalente a SELECT * FROM employees;" },
    { title: "Índice", code: "CREATE INDEX idx_emp_apellido ON employees(last_name);" }
  ],
  quiz: [
    { q: "¿Qué evita la cláusula WITH CHECK OPTION en una vista?", options: [
        "Que se pueda hacer SELECT sobre la vista", "Que se inserten o actualicen filas que dejarían de cumplir el WHERE de la vista",
        "Que la vista se pueda borrar", "Que se pueda usar en un JOIN"
      ], a: 1,
      why: [
        "No afecta a la posibilidad de hacer SELECT: eso sigue funcionando igual.",
        "Correcta: garantiza que los datos modificados a través de la vista sigan siendo visibles por ella.",
        "No impide borrar la vista con DROP VIEW.",
        "No tiene relación con si la vista se usa dentro de un JOIN."
      ] },
    { q: "¿Qué pseudo-columna de una secuencia da el siguiente valor?", options: ["CURRVAL", "NEXTVAL", "NEXT", "AUTOVAL"], a: 1,
      why: [
        "CURRVAL da el último valor ya obtenido, no el siguiente.",
        "Correcta: NEXTVAL avanza y devuelve el siguiente número de la secuencia.",
        "NEXT no es una pseudo-columna válida de una secuencia.",
        "AUTOVAL no existe en Oracle."
      ] },
    { q: "¿Para qué sirve un sinónimo en Oracle?", options: [
        "Para acelerar consultas como un índice", "Para dar un alias permanente a un objeto de esquema",
        "Para validar datos como un constraint", "Para crear una copia física de una tabla"
      ], a: 1,
      why: [
        "Un sinónimo no acelera nada; esa es la función de un índice.",
        "Correcta: el sinónimo simplemente renombra el acceso a otro objeto, sin duplicar datos.",
        "No valida ningún dato; esa es la función de un constraint.",
        "No crea ninguna copia física: es solo un alias de acceso."
      ] },
    { q: "¿Qué crea Oracle automáticamente al definir una PRIMARY KEY?", options: [
        "Una vista", "Un índice único sobre esa columna", "Una secuencia", "Un sinónimo"
      ], a: 1,
      why: [
        "No se crea ninguna vista automáticamente al definir una PK.",
        "Correcta: el índice único soporta la unicidad exigida por la PK; no hace falta crearlo aparte.",
        "Tampoco se crea ninguna secuencia automáticamente.",
        "Tampoco se crea ningún sinónimo automáticamente."
      ] },
    { q: "¿Por qué una vista con GROUP BY deja de ser actualizable?", options: [
        "Por una limitación arbitraria sin motivo técnico", "Porque cada fila del resultado representa un agregado de muchas filas base, y Oracle no puede decidir cuál modificar",
        "Porque las vistas con GROUP BY no se pueden consultar con SELECT", "No es cierto, siempre se pueden actualizar"
      ], a: 1,
      why: [
        "Sí hay un motivo técnico claro y bien definido.",
        "Correcta: un valor agregado no corresponde a una única fila física identificable para aplicar el cambio.",
        "Sí se pueden consultar con SELECT sin ningún problema; la restricción es solo sobre DML.",
        "Sí es cierto: las vistas con GROUP BY no son actualizables."
      ] },
    { q: "¿Qué tipo de sinónimo puede usar cualquier usuario de la base de datos?", options: ["Privado", "PUBLIC", "Ninguno, siempre requieren permiso explícito por usuario", "Solo el propietario del esquema"], a: 1,
      why: [
        "Un sinónimo privado solo lo puede usar el usuario que lo creó.",
        "Correcta: un sinónimo PUBLIC está disponible para cualquier usuario de la base de datos.",
        "PUBLIC es precisamente la excepción a esa necesidad de permiso individual sobre el sinónimo en sí.",
        "El propietario del esquema no es la única referencia relevante aquí; PUBLIC amplía el acceso a todos."
      ] },
    { q: "¿Qué ocurre si intentas usar CURRVAL antes de haber usado NEXTVAL en la sesión actual?", options: [
        "Devuelve el valor inicial de START WITH", "Devuelve NULL", "Da un error", "Devuelve 0"
      ], a: 2,
      why: [
        "No hay ningún valor 'actual' todavía, así que no puede devolver el valor inicial sin más.",
        "No devuelve NULL: Oracle lo trata como una condición de error, no como un valor vacío.",
        "Correcta: Oracle lanza un error porque CURRVAL no está definido hasta que se use NEXTVAL al menos una vez.",
        "No devuelve 0 de forma silenciosa."
      ] },
    { q: "¿Qué impacto tiene un índice sobre el RESULTADO de una consulta SELECT?", options: [
        "Puede cambiar qué filas se devuelven", "Ninguno: solo puede afectar a la velocidad, nunca al resultado",
        "Puede añadir columnas nuevas al resultado", "Puede eliminar automáticamente filas duplicadas"
      ], a: 1,
      why: [
        "Un índice nunca cambia qué filas cumplen la condición de una consulta.",
        "Correcta: un índice es puramente una optimización de acceso; el resultado lógico es siempre el mismo con o sin él.",
        "Un índice no añade columnas al resultado de un SELECT.",
        "Un índice no elimina duplicados; esa es la función de DISTINCT."
      ] },
    { q: "¿Qué valor de CACHE usa una secuencia por defecto si no se especifica NOCACHE ni un valor concreto?", options: ["0", "1", "10", "20"], a: 3,
      why: [
        "0 no es el valor por defecto; equivaldría más bien a comportarse como NOCACHE.",
        "1 no es el valor por defecto de CACHE.",
        "10 no es el valor por defecto en Oracle.",
        "Correcta: 20 es el valor por defecto de CACHE en una secuencia si no se indica lo contrario."
      ] },
    { q: "¿Es necesario crear manualmente un índice sobre una columna que ya tiene una restricción UNIQUE?", options: [
        "Sí, siempre, porque UNIQUE no crea ningún índice", "No, porque Oracle ya crea automáticamente un índice único para esa restricción",
        "Solo si la tabla tiene más de un millón de filas", "Solo si la columna es de tipo VARCHAR2"
      ], a: 1,
      why: [
        "UNIQUE sí crea automáticamente un índice, por lo que no es 'siempre necesario' crear uno aparte.",
        "Correcta: Oracle ya mantiene un índice único automático para toda restricción UNIQUE.",
        "No depende del volumen de filas: el índice automático se crea siempre, independientemente del tamaño.",
        "No depende del tipo de dato de la columna."
      ] }
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
  id: 15, code: "M15", category: "DCL",
  title: "Control de acceso de usuarios",
  intro: "Quién puede hacer qué en la base de datos: privilegios de sistema y de objeto, GRANT/REVOKE, roles, y el concepto de esquema como propietario de los objetos.",
  theory: {
    concepts: [
      { heading: "1. El concepto de esquema y propietario de objetos",
        explanation: "En Oracle, cada usuario de base de datos tiene asociado un esquema del mismo nombre, que es la colección de objetos (tablas, vistas, secuencias...) que ese usuario POSEE. El propietario de un objeto tiene automáticamente todos los privilegios sobre él, sin necesidad de que se le concedan explícitamente; cualquier otro usuario necesita un privilegio explícito para acceder a ese objeto, y debe cualificarlo con el nombre del esquema (esquema.objeto) salvo que use un sinónimo." },
      { heading: "2. Privilegios de sistema",
        explanation: "Un privilegio de sistema permite realizar una acción a nivel de toda la base de datos, independiente de un objeto concreto: por ejemplo CREATE SESSION (conectarse), CREATE TABLE (crear tablas en el propio esquema), CREATE ANY TABLE (crear tablas en el esquema de otro usuario), CREATE USER, DROP ANY TABLE. Se conceden con GRANT privilegio TO usuario_o_rol;." },
      { heading: "3. Privilegios de objeto",
        explanation: "Un privilegio de objeto permite realizar una acción concreta sobre un objeto concreto de otro usuario: SELECT, INSERT, UPDATE, DELETE sobre una tabla o vista; EXECUTE sobre un procedimiento; REFERENCES para poder crear una FOREIGN KEY que apunte a esa tabla. A diferencia de los privilegios de sistema, siempre se conceden 'sobre algo': GRANT SELECT ON hr.employees TO ana;.",
        syntax: "GRANT { privilegio [, privilegio ...] | ALL [PRIVILEGES] }\nON objeto\nTO { usuario | rol | PUBLIC } [, ...]\n[WITH GRANT OPTION]",
        examples: [
          { code: "GRANT SELECT, INSERT ON hr.employees TO ana;\nGRANT SELECT ON hr.departments TO PUBLIC;" }
        ] },
      { heading: "4. GRANT y REVOKE",
        explanation: "GRANT otorga un privilegio (de sistema o de objeto) a un usuario, un rol, o a PUBLIC (todos los usuarios de la base de datos). REVOKE retira un privilegio previamente concedido, con la misma sintaxis pero con FROM en vez de TO. WITH GRANT OPTION (en privilegios de objeto) permite que el usuario que recibe el privilegio pueda a su vez concederlo a otros; WITH ADMIN OPTION es el equivalente para privilegios de sistema y roles.",
        syntax: "GRANT privilegio ON objeto TO usuario [WITH GRANT OPTION];\nREVOKE privilegio ON objeto FROM usuario;",
        examples: [
          { code: "REVOKE INSERT ON hr.employees FROM ana;" }
        ] },
      { heading: "5. Roles",
        explanation: "Un rol agrupa varios privilegios bajo un solo nombre, para poder concederlos y revocarlos en bloque a muchos usuarios de una sola vez, en vez de repetir la misma lista larga de GRANT para cada usuario. Se crea con CREATE ROLE nombre;, se le añaden privilegios con GRANT privilegio TO nombre_rol;, y se asigna a usuarios con GRANT nombre_rol TO usuario;. Un cambio posterior en los privilegios del rol se refleja automáticamente en todos los usuarios que lo tienen asignado.",
        syntax: "CREATE ROLE nombre_rol;\nGRANT privilegio [, ...] TO nombre_rol;\nGRANT nombre_rol TO usuario [, ...];",
        examples: [
          { code: "CREATE ROLE analista_rrhh;\nGRANT SELECT ON hr.employees TO analista_rrhh;\nGRANT SELECT ON hr.departments TO analista_rrhh;\nGRANT analista_rrhh TO ana, luis;" }
        ] }
    ],
    oracleNotes: [
      "El propietario de un objeto no necesita que se le conceda ningún privilegio sobre su propio objeto: los tiene todos automáticamente.",
      "GRANT ... TO PUBLIC concede el privilegio a TODOS los usuarios de la base de datos, no solo a los actuales sino también a los que se creen en el futuro: hay que usarlo con mucha cautela.",
      "WITH GRANT OPTION (privilegios de objeto) y WITH ADMIN OPTION (privilegios de sistema/roles) no son intercambiables: cada uno aplica a su categoría correspondiente.",
      "Al revocar un privilegio de objeto concedido WITH GRANT OPTION, Oracle revoca en cascada los privilegios que ese usuario hubiera concedido a otros basándose en él.",
      "Un usuario puede necesitar el privilegio de sistema CREATE SESSION simplemente para poder conectarse a la base de datos; sin él, ni siquiera puede iniciar sesión aunque tenga otros privilegios."
    ]
  },
  summary: [
    "Un esquema es la colección de objetos que posee un usuario; el propietario tiene todos los privilegios sobre lo suyo por defecto.",
    "Los privilegios de sistema actúan a nivel de toda la base de datos (CREATE SESSION, CREATE TABLE...); los de objeto actúan sobre un objeto concreto (SELECT, INSERT...).",
    "GRANT concede privilegios; REVOKE los retira, con sintaxis simétrica (TO vs FROM).",
    "WITH GRANT OPTION / WITH ADMIN OPTION permiten reenviar el privilegio a otros usuarios.",
    "Un rol agrupa privilegios para gestionarlos en bloque sobre muchos usuarios a la vez."
  ],
  comparisonTable: {
    title: "Privilegios de sistema vs de objeto",
    headers: ["Aspecto", "Privilegio de sistema", "Privilegio de objeto"],
    rows: [
      ["Alcance", "Toda la base de datos", "Un objeto concreto"],
      ["Ejemplos", "CREATE SESSION, CREATE TABLE, CREATE USER", "SELECT, INSERT, UPDATE, DELETE, EXECUTE, REFERENCES"],
      ["Sintaxis de concesión", "GRANT privilegio TO usuario/rol", "GRANT privilegio ON objeto TO usuario/rol"],
      ["Opción de reenvío", "WITH ADMIN OPTION", "WITH GRANT OPTION"]
    ]
  },
  mindMap: [
    { topic: "Módulo 15 — Control de acceso", children: [
      "Esquema → colección de objetos de un usuario; el propietario tiene todo por defecto",
      "Privilegios de sistema → toda la BD (CREATE SESSION, CREATE TABLE...)",
      "Privilegios de objeto → sobre un objeto concreto (SELECT, INSERT, EXECUTE...)",
      "GRANT/REVOKE → conceder/retirar, TO vs FROM",
      "Reenvío → WITH GRANT OPTION (objeto) / WITH ADMIN OPTION (sistema/rol)",
      "Roles → agrupan privilegios, se asignan/revocan en bloque"
    ] }
  ],
  sourceRefs: [
    "Oracle SQL Language Reference 19c — \"GRANT\", \"REVOKE\"",
    "Oracle Database Security Guide — \"Configuring Privilege and Role Authorization\""
  ],
  realCases: {
    business: "Un banco crea un rol lector_auditoria con privilegios SELECT sobre las tablas necesarias para auditoría externa, y lo asigna a cada auditor externo temporal; cuando termina la auditoría, basta revocar el rol de cada usuario sin tener que recordar la lista exacta de privilegios concedidos.",
    dataEngineering: "Un ingeniero de datos solicita el privilegio de sistema CREATE TABLE en un esquema de staging, pero nunca CREATE ANY TABLE en producción, siguiendo el principio de mínimo privilegio necesario para su trabajo.",
    etl: "Un usuario técnico de ETL recibe privilegios de objeto muy concretos (SELECT en el origen, INSERT en el destino) en vez de privilegios de sistema amplios, limitando el daño potencial si sus credenciales se vieran comprometidas.",
    reporting: "Un equipo de BI usa GRANT SELECT ... TO PUBLIC solo sobre vistas ya depuradas y sin datos sensibles, nunca sobre las tablas base, para dar acceso amplio sin exponer columnas confidenciales."
  },
  mistakes: [
    { mistake: "Conceder privilegios directamente a cada usuario en vez de usar roles.", why: "Gestionar privilegios uno a uno se vuelve inviable con muchos usuarios; el examen presenta escenarios donde hay que actualizar el acceso de 50 usuarios y espera que reconozcas que un rol resuelve esto en una sola operación." },
    { mistake: "Usar GRANT ... TO PUBLIC sin pensar en el alcance real.", why: "PUBLIC concede el privilegio a todos los usuarios presentes Y futuros de la base de datos; es una de las formas más comunes de sobre-exposición accidental de datos." },
    { mistake: "Confundir WITH GRANT OPTION con WITH ADMIN OPTION.", why: "WITH GRANT OPTION es exclusivo de privilegios de OBJETO; WITH ADMIN OPTION es para privilegios de SISTEMA y roles. El examen las intercambia a propósito en las opciones de respuesta." },
    { mistake: "Pensar que el propietario de un objeto necesita GRANT sobre su propio objeto.", why: "El propietario tiene automáticamente todos los privilegios sobre lo que posee; GRANT solo es necesario para dar acceso a OTROS usuarios." }
  ],
  exercises: [
    { title: "Conceder un privilegio de objeto", difficulty: "básico", prompt: "Concede a un usuario 'ana' el privilegio de consultar (SELECT) la tabla hr.employees.", hint: "GRANT SELECT ON tabla TO usuario;", solution: "GRANT SELECT ON hr.employees TO ana;" },
    { title: "Revocar un privilegio", difficulty: "básico", prompt: "Revoca a 'ana' el privilegio de insertar en hr.employees, que se le había concedido antes.", hint: "REVOKE ... FROM ...;", solution: "REVOKE INSERT ON hr.employees FROM ana;" },
    { title: "Crear y asignar un rol", difficulty: "intermedio", prompt: "Crea un rol lector_rrhh con SELECT sobre employees y departments, y asígnalo a los usuarios ana y luis.", hint: "CREATE ROLE, GRANT ... TO rol, GRANT rol TO usuarios", solution: "CREATE ROLE lector_rrhh;\nGRANT SELECT ON hr.employees TO lector_rrhh;\nGRANT SELECT ON hr.departments TO lector_rrhh;\nGRANT lector_rrhh TO ana, luis;" },
    { title: "Distinguir tipos de privilegio", difficulty: "intermedio", prompt: "Clasifica estos privilegios como de sistema o de objeto: CREATE SESSION, SELECT, CREATE TABLE, EXECUTE, DROP ANY TABLE.", hint: "¿Actúan sobre toda la BD o sobre un objeto concreto?", solution: "Sistema: CREATE SESSION, CREATE TABLE, DROP ANY TABLE. Objeto: SELECT, EXECUTE." },
    { title: "Reenvío de privilegios con WITH GRANT OPTION", difficulty: "avanzado", prompt: "Concede a 'ana' SELECT sobre hr.departments permitiéndole reenviar ese privilegio a otros usuarios; luego explica qué pasa si le revocas el privilegio después de que ana se lo haya concedido a 'luis'.", hint: "WITH GRANT OPTION + revocación en cascada.", solution: "GRANT SELECT ON hr.departments TO ana WITH GRANT OPTION;\n-- Si después se ejecuta: REVOKE SELECT ON hr.departments FROM ana;\n-- Oracle revoca también en cascada el SELECT que ana le había concedido a luis basándose en ese privilegio." },
    { title: "Diseñar un esquema de roles jerárquico", difficulty: "avanzado", prompt: "Diseña dos roles: lector_basico (solo SELECT sobre departments) y analista_rrhh (todo lo de lector_basico más SELECT sobre employees), de forma que analista_rrhh incluya automáticamente los privilegios de lector_basico.", hint: "Un rol puede concederse a otro rol.", solution: "CREATE ROLE lector_basico;\nGRANT SELECT ON hr.departments TO lector_basico;\nCREATE ROLE analista_rrhh;\nGRANT lector_basico TO analista_rrhh;\nGRANT SELECT ON hr.employees TO analista_rrhh;\n-- Quien reciba analista_rrhh hereda también todo lo de lector_basico." }
  ],
  solved: [
    { title: "Diseñar el acceso mínimo necesario para un proceso ETL",
      problem: "Un usuario técnico etl_user necesita leer de hr.employees y escribir (solo INSERT) en una tabla de staging staging.employees_stg, sin ningún otro acceso.",
      steps: [
        "Identifica los privilegios de objeto exactos necesarios: SELECT en el origen, INSERT en el destino.",
        "Evita conceder privilegios de sistema amplios como CREATE ANY TABLE que no son necesarios para esta tarea.",
        "Concede cada privilegio de forma explícita y acotada.",
        "Verifica que etl_user no puede hacer nada más allá de esas dos acciones concretas."
      ],
      query: "GRANT SELECT ON hr.employees TO etl_user;\nGRANT INSERT ON staging.employees_stg TO etl_user;",
      result: "etl_user puede ejecutar exactamente el proceso previsto, sin privilegios adicionales innecesarios." },
    { title: "Revocar el acceso de un auditor externo al finalizar su contrato",
      problem: "Un auditor externo tenía asignado el rol lector_auditoria durante 3 meses, y su contrato ha terminado.",
      steps: [
        "Identifica que el acceso se concedió a través de un rol, no de privilegios individuales dispersos.",
        "Revoca el rol completo del usuario en una sola operación.",
        "Confirma que el usuario pierde inmediatamente todos los privilegios que ese rol agrupaba.",
        "Si el usuario ya no necesita ni siquiera conectarse, considera revocar también CREATE SESSION o bloquear la cuenta."
      ],
      query: "REVOKE lector_auditoria FROM auditor_externo;",
      result: "El auditor pierde de golpe todos los privilegios agrupados en ese rol, sin tener que revocarlos uno a uno." }
  ],
  flashcards: [
    { front: "¿Qué privilegios tiene el propietario de un objeto sobre él?", back: "Todos, automáticamente, sin necesidad de GRANT." },
    { front: "¿Qué es un privilegio de sistema?", back: "Uno que actúa sobre toda la base de datos, no sobre un objeto concreto (CREATE SESSION, CREATE TABLE...)." },
    { front: "¿Qué es un privilegio de objeto?", back: "Uno que actúa sobre un objeto concreto de otro usuario (SELECT, INSERT, EXECUTE...)." },
    { front: "¿A quién concede acceso GRANT ... TO PUBLIC?", back: "A todos los usuarios de la base de datos, presentes y futuros." },
    { front: "¿Qué opción permite reenviar un privilegio de OBJETO a otros?", back: "WITH GRANT OPTION." },
    { front: "¿Qué opción permite reenviar un privilegio de SISTEMA o un rol a otros?", back: "WITH ADMIN OPTION." },
    { front: "¿Para qué sirve un rol?", back: "Para agrupar privilegios y concederlos/revocarlos en bloque a muchos usuarios." },
    { front: "¿Qué ocurre al revocar un privilegio de objeto concedido WITH GRANT OPTION?", back: "Se revocan en cascada los privilegios que ese usuario hubiera reenviado a otros basándose en él." }
  ],
  examples: [
    { title: "GRANT de objeto", code: "GRANT SELECT, INSERT ON hr.employees TO ana;" },
    { title: "REVOKE", code: "REVOKE INSERT ON hr.employees FROM ana;" },
    { title: "Rol", code: "CREATE ROLE analista_rrhh;\nGRANT SELECT ON hr.employees TO analista_rrhh;\nGRANT analista_rrhh TO ana, luis;" }
  ],
  quiz: [
    { q: "¿Qué privilegio necesita como mínimo un usuario para poder conectarse a la base de datos?", options: ["SELECT ANY TABLE", "CREATE SESSION", "CREATE TABLE", "CONNECT DATABASE"], a: 1,
      why: [
        "SELECT ANY TABLE permite consultar cualquier tabla, pero no basta para conectarse si falta el privilegio de sesión.",
        "Correcta: CREATE SESSION es el privilegio de sistema mínimo para iniciar sesión en la base de datos.",
        "CREATE TABLE permite crear tablas, pero no es el privilegio que habilita la conexión en sí.",
        "CONNECT DATABASE no es la sintaxis real del privilegio en Oracle."
      ] },
    { q: "¿Cuál de estos es un privilegio de OBJETO, no de sistema?", options: ["CREATE TABLE", "CREATE USER", "SELECT", "DROP ANY TABLE"], a: 2,
      why: [
        "CREATE TABLE es un privilegio de sistema (actúa sobre la capacidad de crear, no sobre un objeto ya existente).",
        "CREATE USER es un privilegio de sistema, relacionado con la administración de usuarios.",
        "Correcta: SELECT se concede siempre sobre un objeto concreto, es un privilegio de objeto.",
        "DROP ANY TABLE es un privilegio de sistema muy amplio."
      ] },
    { q: "¿Qué hace GRANT SELECT ON hr.departments TO PUBLIC;?", options: [
        "Da acceso de consulta a un único usuario llamado PUBLIC", "Da acceso de consulta a TODOS los usuarios de la base de datos",
        "Da acceso de escritura a todos los usuarios", "No es una sentencia válida"
      ], a: 1,
      why: [
        "PUBLIC no es un usuario individual: es una palabra clave especial que representa a todos.",
        "Correcta: PUBLIC concede el privilegio a todos los usuarios, presentes y futuros.",
        "SELECT es de solo lectura, no de escritura.",
        "Es sintaxis perfectamente válida y muy usada en Oracle."
      ] },
    { q: "¿Qué opción permite que un usuario reenvíe a otros un privilegio de OBJETO que recibió?", options: ["WITH ADMIN OPTION", "WITH GRANT OPTION", "WITH REVOKE OPTION", "WITH PUBLIC OPTION"], a: 1,
      why: [
        "WITH ADMIN OPTION es para privilegios de sistema y roles, no de objeto.",
        "Correcta: WITH GRANT OPTION es la que aplica a privilegios de objeto.",
        "WITH REVOKE OPTION no existe como cláusula en Oracle.",
        "WITH PUBLIC OPTION no existe como cláusula en Oracle."
      ] },
    { q: "¿Qué privilegios tiene por defecto el propietario de una tabla sobre ella?", options: [
        "Ninguno hasta que se los conceda a sí mismo", "Solo SELECT", "Todos los privilegios, automáticamente", "Solo los que le conceda el DBA"
      ], a: 2,
      why: [
        "No necesita concederse nada a sí mismo: ya los tiene todos por ser el propietario.",
        "No se limita solo a SELECT: tiene control completo sobre su propio objeto.",
        "Correcta: el propietario de un objeto tiene automáticamente todos los privilegios sobre él.",
        "No depende de una concesión adicional del DBA para su propio objeto."
      ] },
    { q: "¿Qué ventaja principal ofrece un rol frente a conceder privilegios individualmente a cada usuario?", options: [
        "Ninguna ventaja real", "Permite gestionar (conceder/revocar) un conjunto de privilegios de una sola vez para muchos usuarios",
        "Los roles son obligatorios en Oracle, no hay alternativa", "Los roles solo sirven para privilegios de sistema, nunca de objeto"
      ], a: 1,
      why: [
        "Sí hay una ventaja real y significativa en mantenimiento.",
        "Correcta: un rol agrupa privilegios para administrarlos en bloque, sin repetir la misma lista para cada usuario.",
        "No son obligatorios: se puede seguir concediendo privilegios directamente si se prefiere (aunque no es recomendable a escala).",
        "Un rol puede agrupar tanto privilegios de sistema como de objeto."
      ] },
    { q: "¿Qué le ocurre a un privilegio reenviado por un usuario B (recibido de A con WITH GRANT OPTION) si A revoca ese privilegio a B?", options: [
        "No pasa nada, B conserva lo que ya reenvió", "Se revoca en cascada también lo que B había reenviado a otros basándose en ese privilegio",
        "Solo se revoca si B lo autoriza expresamente", "Oracle no permite revocar en esta situación"
      ], a: 1,
      why: [
        "Sí pasa algo: hay un efecto en cascada sobre lo que B hubiera reenviado.",
        "Correcta: Oracle revoca en cascada los privilegios concedidos posteriormente basándose en el privilegio original revocado.",
        "No requiere autorización de B: el efecto en cascada es automático.",
        "Sí se permite; de hecho es el comportamiento estándar y esperado."
      ] },
    { q: "¿Qué representa el 'esquema' de un usuario en Oracle?", options: [
        "Un diagrama visual de la base de datos", "La colección de objetos que ese usuario posee",
        "Un tipo de índice especial", "Un privilegio de sistema concreto"
      ], a: 1,
      why: [
        "No es un diagrama visual; es un concepto lógico de propiedad de objetos.",
        "Correcta: el esquema es la colección de objetos (tablas, vistas, secuencias...) que posee ese usuario.",
        "No es un tipo de índice.",
        "No es un privilegio, es un concepto distinto relacionado con la propiedad de objetos."
      ] },
    { q: "¿Con qué palabra clave se retira un privilegio previamente concedido?", options: ["REMOVE", "DENY", "REVOKE", "CANCEL"], a: 2,
      why: [
        "REMOVE no es una sentencia SQL válida para esto en Oracle.",
        "DENY no es sintaxis de Oracle SQL (existe en otros motores, no en Oracle).",
        "Correcta: REVOKE es la sentencia DCL para retirar un privilegio.",
        "CANCEL no es una sentencia SQL válida para esto."
      ] },
    { q: "¿Puede un rol concederse a otro rol?", options: [
        "No, nunca", "Sí, permitiendo construir jerarquías de roles", "Solo si ambos roles están vacíos", "Solo el DBA puede hacerlo, nunca mediante GRANT normal"
      ], a: 1,
      why: [
        "Sí es posible; de hecho es una técnica habitual de diseño de seguridad.",
        "Correcta: un rol puede concederse a otro rol, construyendo jerarquías donde uno incluye los privilegios del otro.",
        "No depende de que estén vacíos: pueden tener privilegios propios además de heredar otros.",
        "Se hace con la misma sintaxis GRANT normal, no requiere un mecanismo exclusivo del DBA."
      ] }
  ],
  challenges: [
    { level: 1, prompt: "Crea un rol solo_lectura con privilegio SELECT sobre hr.employees y hr.departments, y asígnalo al usuario invitado.", solution: "CREATE ROLE solo_lectura;\nGRANT SELECT ON hr.employees TO solo_lectura;\nGRANT SELECT ON hr.departments TO solo_lectura;\nGRANT solo_lectura TO invitado;" },
    { level: 2, prompt: "Explica la diferencia entre revocar un rol de un usuario y eliminar el rol por completo con DROP ROLE.", solution: "Revocar el rol de un usuario (REVOKE rol FROM usuario) solo le quita el acceso a ESE usuario concreto, y el rol sigue existiendo para los demás que lo tengan asignado. DROP ROLE elimina el rol por completo del sistema, quitando automáticamente el acceso a TODOS los usuarios que lo tuvieran asignado y borrando su definición." }
  ]
},

// =====================================================================
// NIVEL 16
// =====================================================================
{
  id: 16, code: "M16", category: "Diccionario",
  title: "Diccionario de datos",
  intro: "El sistema de vistas con el que Oracle documenta su propia estructura: qué tablas, columnas, restricciones y objetos existen, consultables con SQL normal.",
  theory: {
    concepts: [
      { heading: "1. Qué es el diccionario de datos",
        explanation: "El diccionario de datos es un conjunto de tablas y vistas, propiedad de SYS, que Oracle mantiene automáticamente con metadatos sobre todos los objetos de la base de datos: qué tablas existen, qué columnas tienen, qué constraints, qué privilegios se han concedido, etc. Se consulta con SELECT normal, igual que cualquier tabla de negocio, lo que permite escribir SQL que 'pregunta a la base de datos sobre sí misma'." },
      { heading: "2. Las familias USER_, ALL_ y DBA_",
        explanation: "Prácticamente cada vista del diccionario existe en tres versiones con el mismo sufijo: USER_ (objetos que POSEE el usuario actual), ALL_ (objetos que el usuario actual puede VER, los suyos más aquellos sobre los que tiene privilegios concedidos), y DBA_ (TODOS los objetos de la base de datos, sin importar el propietario; solo accesible con privilegios administrativos). Por ejemplo, USER_TABLES, ALL_TABLES y DBA_TABLES muestran progresivamente más filas.",
        syntax: "SELECT * FROM USER_TABLES;\nSELECT * FROM ALL_TABLES  WHERE OWNER = 'HR';\nSELECT * FROM DBA_TABLES  WHERE OWNER = 'HR';" },
      { heading: "3. USER_TABLES y USER_TAB_COLUMNS",
        explanation: "USER_TABLES lista las tablas que posee el usuario actual (nombre, número de filas estimado si hay estadísticas, etc.). USER_TAB_COLUMNS detalla, para cada tabla, cada columna con su tipo de dato, longitud, precisión/escala y si admite NULL — es el equivalente 'consultable con SQL' a lo que muestra DESCRIBE en el cliente.",
        examples: [
          { code: "SELECT column_name, data_type, data_length, nullable\nFROM   user_tab_columns\nWHERE  table_name = 'EMPLOYEES'\nORDER BY column_id;" }
        ] },
      { heading: "4. USER_CONSTRAINTS y USER_CONS_COLUMNS",
        explanation: "Ya vistas en el módulo de constraints: USER_CONSTRAINTS lista nombre, tipo (P/R/U/C) y estado de cada restricción; USER_CONS_COLUMNS detalla qué columnas concretas forman cada constraint, imprescindible para identificar claves compuestas o el origen exacto de una FK." },
      { heading: "5. USER_VIEWS, USER_SEQUENCES y USER_SYNONYMS",
        explanation: "USER_VIEWS lista las vistas del usuario junto con el texto de su consulta (columna TEXT), útil para inspeccionar la definición de una vista sin tener el código fuente original a mano. USER_SEQUENCES muestra el estado actual de cada secuencia propia: incremento, valor mínimo/máximo, si tiene CYCLE, y el tamaño de CACHE configurado. USER_SYNONYMS lista los sinónimos propios y a qué objeto (y esquema) apunta cada uno.",
        examples: [
          { code: "SELECT sequence_name, min_value, max_value, increment_by, cache_size\nFROM   user_sequences;" }
        ] }
    ],
    oracleNotes: [
      "USER_ muestra solo lo que el usuario actual POSEE; ALL_ añade lo que puede VER por privilegios concedidos; DBA_ lo muestra todo, para cualquier propietario, pero exige privilegios administrativos.",
      "El diccionario de datos se consulta con SELECT normal: no hace falta ningún comando especial distinto del resto del temario.",
      "USER_TAB_COLUMNS incluye la columna COLUMN_ID, que refleja el orden de definición de las columnas: útil para reproducir el mismo orden que muestra DESCRIBE.",
      "Las vistas ALL_ y DBA_ incluyen una columna OWNER que las vistas USER_ no necesitan (porque en USER_ el propietario siempre es el usuario actual, implícito).",
      "Consultar USER_VIEWS.TEXT es la forma de ver la definición SQL exacta de una vista existente si no se tiene el script original."
    ]
  },
  summary: [
    "El diccionario de datos son tablas/vistas de SYS con metadatos, consultables con SELECT normal.",
    "Tres familias por cada vista: USER_ (lo mío), ALL_ (lo que puedo ver), DBA_ (todo, con privilegios).",
    "USER_TABLES y USER_TAB_COLUMNS documentan tablas y columnas.",
    "USER_CONSTRAINTS y USER_CONS_COLUMNS documentan restricciones.",
    "USER_VIEWS, USER_SEQUENCES y USER_SYNONYMS documentan el resto de objetos de esquema."
  ],
  comparisonTable: {
    title: "USER_ vs ALL_ vs DBA_",
    headers: ["Prefijo", "Qué muestra", "Columna OWNER", "Requiere privilegios especiales"],
    rows: [
      ["USER_", "Solo objetos propios", "No (implícito: el usuario actual)", "No"],
      ["ALL_", "Objetos propios + accesibles por privilegio", "Sí", "No, pero depende de los privilegios ya concedidos"],
      ["DBA_", "Todos los objetos de la base de datos", "Sí", "Sí, privilegios administrativos"]
    ]
  },
  mindMap: [
    { topic: "Módulo 16 — Diccionario de datos", children: [
      "Concepto → tablas/vistas de SYS con metadatos, se consultan con SELECT",
      "Familias → USER_ (mío), ALL_ (visible), DBA_ (todo, admin)",
      "Tablas/columnas → USER_TABLES, USER_TAB_COLUMNS",
      "Constraints → USER_CONSTRAINTS, USER_CONS_COLUMNS",
      "Otros objetos → USER_VIEWS (TEXT), USER_SEQUENCES, USER_SYNONYMS"
    ] }
  ],
  sourceRefs: [
    "Oracle Database Reference 19c — \"Static Data Dictionary Views\"",
    "Oracle Database Reference 19c — \"USER_TABLES\", \"USER_TAB_COLUMNS\", \"USER_CONSTRAINTS\""
  ],
  realCases: {
    business: "Un analista que recibe acceso a una base de datos desconocida usa USER_TABLES y USER_TAB_COLUMNS para explorar la estructura disponible antes de escribir ninguna consulta de negocio, sin depender de documentación externa que puede estar desactualizada.",
    dataEngineering: "Un ingeniero de datos genera dinámicamente scripts de extracción consultando ALL_TAB_COLUMNS para construir automáticamente la lista de columnas de decenas de tablas, en vez de mantenerla escrita a mano.",
    etl: "Un proceso de validación de un pipeline consulta USER_CONSTRAINTS antes de una carga masiva, para decidir automáticamente qué FOREIGN KEY conviene desactivar temporalmente y volver a activar al finalizar.",
    reporting: "Un equipo de gobierno del dato genera un informe de columnas sin documentar cruzando USER_TAB_COLUMNS con USER_COL_COMMENTS, identificando qué columnas carecen todavía de un COMMENT ON descriptivo."
  },
  mistakes: [
    { mistake: "Confundir USER_TABLES con ALL_TABLES esperando ver tablas de otros usuarios.", why: "USER_TABLES solo muestra lo que el usuario actual POSEE; para ver tablas de otro propietario (sobre las que se tenga privilegio) hace falta ALL_TABLES, filtrando por OWNER." },
    { mistake: "Intentar consultar DBA_TABLES sin privilegios administrativos.", why: "Las vistas DBA_ requieren privilegios especiales (normalmente el rol SELECT_CATALOG_ROLE o privilegios de DBA); un usuario normal recibe un error de tabla o vista inexistente, no un simple resultado vacío." },
    { mistake: "Olvidar la columna OWNER al consultar ALL_ o DBA_.", why: "Sin filtrar por OWNER, una consulta sobre ALL_TAB_COLUMNS puede devolver columnas de MUCHAS tablas de MUCHOS esquemas con el mismo nombre, mezclando resultados de forma confusa." },
    { mistake: "Pensar que el diccionario de datos necesita un lenguaje de consulta especial.", why: "Se consulta exactamente con SELECT estándar, como cualquier otra tabla; no hace falta ninguna sintaxis distinta a la ya aprendida en el resto del temario." }
  ],
  exercises: [
    { title: "Listar tus propias tablas", difficulty: "básico", prompt: "Consulta el nombre de todas las tablas que posee tu usuario actual.", hint: "USER_TABLES", solution: "SELECT table_name FROM user_tables;" },
    { title: "Columnas de una tabla", difficulty: "básico", prompt: "Consulta el nombre, tipo de dato y si admite NULL de cada columna de la tabla EMPLOYEES.", hint: "USER_TAB_COLUMNS WHERE table_name = '...'", solution: "SELECT column_name, data_type, nullable FROM user_tab_columns WHERE table_name = 'EMPLOYEES';" },
    { title: "Definición de una vista", difficulty: "intermedio", prompt: "Consulta el texto SQL exacto de una vista llamada V_EMPLEADOS_IT sin tener el script original.", hint: "USER_VIEWS.TEXT", solution: "SELECT text FROM user_views WHERE view_name = 'V_EMPLEADOS_IT';" },
    { title: "Estado de una secuencia", difficulty: "intermedio", prompt: "Consulta el incremento y el tamaño de caché configurados para la secuencia SEQ_CLIENTES.", hint: "USER_SEQUENCES", solution: "SELECT increment_by, cache_size FROM user_sequences WHERE sequence_name = 'SEQ_CLIENTES';" },
    { title: "Tablas de otro esquema con privilegio", difficulty: "avanzado", prompt: "Consulta qué tablas del esquema HR puedes ver, aunque no seas su propietario, usando la vista adecuada.", hint: "ALL_TABLES filtrando por OWNER.", solution: "SELECT table_name FROM all_tables WHERE owner = 'HR';" },
    { title: "Auditar columnas sin comentar", difficulty: "avanzado", prompt: "Diseña una consulta que muestre las columnas de tus tablas que todavía no tienen ningún COMMENT ON asociado.", hint: "Combina USER_TAB_COLUMNS con USER_COL_COMMENTS usando LEFT JOIN o NOT EXISTS.", solution: "SELECT c.table_name, c.column_name\nFROM   user_tab_columns c\nWHERE  NOT EXISTS (\n  SELECT 1 FROM user_col_comments cc\n  WHERE cc.table_name = c.table_name\n  AND   cc.column_name = c.column_name\n  AND   cc.comments IS NOT NULL\n);" }
  ],
  solved: [
    { title: "Explorar una base de datos desconocida desde cero",
      problem: "Te dan acceso a un esquema que nunca has visto y necesitas entender su estructura antes de escribir ninguna consulta.",
      steps: [
        "Empiezas por USER_TABLES para ver qué tablas existen.",
        "Para cada tabla de interés, consultas USER_TAB_COLUMNS para conocer sus columnas y tipos.",
        "Consultas USER_CONSTRAINTS para entender las claves primarias y foráneas, y así deducir las relaciones entre tablas.",
        "Si hay vistas, consultas USER_VIEWS.TEXT para entender qué construyen antes de usarlas."
      ],
      query: "SELECT table_name FROM user_tables;\nSELECT column_name, data_type FROM user_tab_columns WHERE table_name = 'NOMBRE_TABLA';\nSELECT constraint_name, constraint_type FROM user_constraints WHERE table_name = 'NOMBRE_TABLA';",
      result: "Se reconstruye progresivamente el modelo de datos sin necesitar documentación externa." },
    { title: "Diagnosticar por qué una tabla de otro esquema 'no existe'",
      problem: "Ejecutas SELECT * FROM otro_esquema.alguna_tabla; y da error ORA-00942: table or view does not exist, aunque un compañero te confirma que la tabla sí existe.",
      steps: [
        "Sospechas que el problema no es que la tabla no exista, sino que no tienes privilegio para verla.",
        "Pides a alguien con acceso que consulte ALL_TABLES o DBA_TABLES filtrando por ese nombre y propietario, para confirmar que existe.",
        "Confirmas que te falta el privilegio SELECT sobre ese objeto concreto.",
        "Solicitas el GRANT correspondiente al propietario o al DBA."
      ],
      query: "SELECT owner, table_name FROM all_tables WHERE table_name = 'ALGUNA_TABLA';",
      result: "Confirma si la tabla existe y en qué esquema, ayudando a distinguir un problema de privilegios de uno de existencia real." }
  ],
  flashcards: [
    { front: "¿Qué es el diccionario de datos?", back: "Tablas y vistas de SYS con metadatos sobre todos los objetos de la base de datos, consultables con SELECT." },
    { front: "¿Qué muestra USER_TABLES?", back: "Las tablas que posee el usuario actual." },
    { front: "¿Qué muestra ALL_TABLES que USER_TABLES no muestra?", back: "También las tablas de otros propietarios sobre las que el usuario tiene privilegio." },
    { front: "¿Qué requiere consultar una vista DBA_?", back: "Privilegios administrativos." },
    { front: "¿Qué vista detalla columnas, tipo y NULL de una tabla?", back: "USER_TAB_COLUMNS." },
    { front: "¿Qué columna de USER_VIEWS contiene el SQL de la vista?", back: "TEXT." },
    { front: "¿Qué vista muestra el CACHE configurado de una secuencia?", back: "USER_SEQUENCES." },
    { front: "¿Qué columna aparece en ALL_/DBA_ pero no es necesaria en USER_?", back: "OWNER, porque en USER_ el propietario siempre es el usuario actual." }
  ],
  examples: [
    { title: "Columnas de una tabla", code: "SELECT column_name, data_type, nullable\nFROM user_tab_columns\nWHERE table_name = 'EMPLOYEES'\nORDER BY column_id;" },
    { title: "Constraints de una tabla", code: "SELECT constraint_name, constraint_type, status\nFROM user_constraints\nWHERE table_name = 'EMPLOYEES';" },
    { title: "Tablas visibles de otro esquema", code: "SELECT table_name FROM all_tables WHERE owner = 'HR';" }
  ],
  quiz: [
    { q: "¿Qué muestra la vista USER_TABLES?", options: [
        "Todas las tablas de la base de datos, de cualquier propietario", "Solo las tablas que posee el usuario actual",
        "Solo las tablas del sistema (SYS)", "Solo las tablas temporales"
      ], a: 1,
      why: [
        "Eso describiría más bien DBA_TABLES, no USER_TABLES.",
        "Correcta: USER_TABLES muestra únicamente las tablas propiedad del usuario actual.",
        "No se limita a tablas del sistema; son las tablas del propio usuario, sean del tipo que sean.",
        "No se limita a tablas temporales: incluye cualquier tabla que el usuario posea."
      ] },
    { q: "¿Qué diferencia hay entre ALL_TABLES y DBA_TABLES?", options: [
        "Son exactamente iguales", "ALL_TABLES muestra lo que el usuario puede ver por sus privilegios; DBA_TABLES muestra todo, requiriendo privilegios administrativos",
        "DBA_TABLES es más lenta pero muestra lo mismo", "ALL_TABLES solo existe en versiones antiguas de Oracle"
      ], a: 1,
      why: [
        "No son iguales: su alcance de visibilidad es distinto.",
        "Correcta: es la diferencia exacta entre ambas vistas.",
        "No es una cuestión de velocidad: es una cuestión de alcance y de privilegios requeridos.",
        "ALL_TABLES existe en todas las versiones modernas de Oracle, no es una vista obsoleta."
      ] },
    { q: "¿Qué vista detalla, para cada columna de una tabla propia, su tipo de dato y si admite NULL?", options: ["USER_TABLES", "USER_TAB_COLUMNS", "USER_CONSTRAINTS", "USER_INDEXES"], a: 1,
      why: [
        "USER_TABLES da información a nivel de tabla completa, no columna por columna.",
        "Correcta: USER_TAB_COLUMNS detalla cada columna con su tipo y si admite NULL.",
        "USER_CONSTRAINTS es sobre restricciones, no sobre tipos de columna en general.",
        "USER_INDEXES es sobre índices, un objeto distinto."
      ] },
    { q: "¿Qué columna de USER_VIEWS contiene el texto SQL exacto de la consulta que define la vista?", options: ["VIEW_NAME", "TEXT", "OWNER", "TABLE_NAME"], a: 1,
      why: [
        "VIEW_NAME solo da el nombre de la vista, no su definición.",
        "Correcta: TEXT contiene el SQL exacto de la subconsulta que define la vista.",
        "OWNER no existe como tal en USER_VIEWS (es implícito, es siempre el usuario actual).",
        "TABLE_NAME no es una columna estándar de USER_VIEWS con este propósito."
      ] },
    { q: "¿Qué necesitas para poder consultar DBA_TAB_COLUMNS con normalidad?", options: [
        "Nada especial, cualquier usuario puede consultarla siempre", "Privilegios administrativos (por ejemplo el rol SELECT_CATALOG_ROLE o privilegios de DBA)",
        "Ser el propietario de todas las tablas de la base de datos", "Tener activado el modo DEBUG en la sesión"
      ], a: 1,
      why: [
        "Sí requiere algo especial: un usuario normal sin privilegios recibe un error al intentarlo.",
        "Correcta: las vistas DBA_ requieren privilegios administrativos concretos.",
        "No es necesario poseer todas las tablas; basta con tener el privilegio adecuado sobre la vista del diccionario.",
        "No existe tal 'modo DEBUG' relacionado con el acceso a vistas DBA_."
      ] },
    { q: "¿Qué vista consultarías para saber qué columnas concretas componen una clave primaria compuesta?", options: ["USER_TABLES", "USER_TAB_COLUMNS", "USER_CONS_COLUMNS", "USER_SEQUENCES"], a: 2,
      why: [
        "USER_TABLES no detalla columnas de constraints.",
        "USER_TAB_COLUMNS lista todas las columnas de la tabla, no específicamente las de un constraint.",
        "Correcta: USER_CONS_COLUMNS detalla exactamente qué columnas forman cada constraint, incluidas las claves compuestas.",
        "USER_SEQUENCES no tiene relación con claves primarias."
      ] },
    { q: "¿Qué columna hace falta añadir al filtrar ALL_TAB_COLUMNS para evitar mezclar columnas homónimas de distintos esquemas?", options: ["COLUMN_ID", "DATA_TYPE", "OWNER", "NULLABLE"], a: 2,
      why: [
        "COLUMN_ID indica el orden de la columna, no el propietario de la tabla.",
        "DATA_TYPE indica el tipo de dato, no resuelve la ambigüedad de esquema.",
        "Correcta: OWNER identifica a qué esquema pertenece cada fila del resultado, evitando mezclar tablas homónimas de distintos propietarios.",
        "NULLABLE indica si admite NULL, no resuelve la ambigüedad de esquema."
      ] },
    { q: "¿Con qué sentencia se consulta el diccionario de datos?", options: [
        "Con un comando especial DESCRIBE_DICTIONARY", "Con SELECT normal, igual que cualquier otra tabla",
        "Solo se puede consultar desde SQL*Plus, nunca desde SQL Developer", "Requiere PL/SQL obligatoriamente"
      ], a: 1,
      why: [
        "No existe tal comando especial en Oracle SQL.",
        "Correcta: se consulta con SELECT estándar, sin sintaxis especial.",
        "Se puede consultar desde cualquier cliente SQL que ejecute sentencias contra la base de datos.",
        "No requiere PL/SQL: un simple SELECT es suficiente."
      ] },
    { q: "¿Qué diferencia estructural NO tienen las vistas USER_ respecto a las ALL_/DBA_ del mismo nombre?", options: [
        "La columna OWNER (ausente en USER_, presente en ALL_/DBA_)", "El nombre de las columnas de datos comunes, como TABLE_NAME",
        "El requisito de privilegios para consultarlas (USER_ no requiere privilegios especiales)", "El alcance de filas visibles"
      ], a: 1,
      why: [
        "Esa sí es una diferencia real entre ambas familias.",
        "Correcta: las columnas de datos comunes (como TABLE_NAME) tienen el mismo nombre en las tres familias; no cambian.",
        "Esa también es una diferencia real: ALL_/DBA_ pueden requerir más privilegios.",
        "El alcance de filas visibles es precisamente la diferencia principal entre las tres familias."
      ] },
    { q: "¿Qué prefijo usarías para ver, sin privilegios administrativos, tanto tus tablas como las de otro esquema sobre las que tienes SELECT concedido?", options: ["USER_", "ALL_", "DBA_", "Ninguno, no es posible sin privilegios administrativos"], a: 1,
      why: [
        "USER_ solo mostraría tus propias tablas, no las de otro esquema.",
        "Correcta: ALL_ muestra tus objetos más los accesibles por privilegio, sin requerir privilegios administrativos especiales.",
        "DBA_ sí requeriría privilegios administrativos, más de lo necesario para este caso.",
        "Sí es posible, precisamente usando la familia ALL_."
      ] }
  ],
  challenges: [
    { level: 1, prompt: "Consulta cuántas columnas tiene la tabla EMPLOYEES usando el diccionario de datos, sin usar DESCRIBE.", solution: "SELECT COUNT(*) FROM user_tab_columns WHERE table_name = 'EMPLOYEES';" },
    { level: 2, prompt: "Explica por qué DESCRIBE no es una sentencia SQL pero USER_TAB_COLUMNS sí lo es, y qué ventaja tiene poder consultar la estructura con SQL normal.", solution: "DESCRIBE es un comando propio de SQL*Plus/SQL Developer que el cliente traduce internamente, no una sentencia que el motor de base de datos reconozca como SQL; USER_TAB_COLUMNS es una vista real consultable con SELECT desde cualquier herramienta o programa. La ventaja de usar SQL normal es poder combinar esa información con JOIN, WHERE, funciones de grupo, etc., algo que DESCRIBE no permite al ser solo una utilidad de visualización fija." }
  ]
},

// =====================================================================
// NIVEL 17
// =====================================================================
{
  id: 17, code: "M17", category: "Avanzado",
  title: "Consultas jerárquicas y expresiones regulares",
  intro: "Dos herramientas exclusivas del SQL de Oracle para casos que el SQL básico no resuelve bien: recorrer estructuras de árbol (organigramas, categorías anidadas) y buscar patrones de texto complejos.",
  theory: {
    concepts: [
      { heading: "1. CONNECT BY PRIOR y START WITH",
        explanation: "Una consulta jerárquica recorre una relación recursiva dentro de la MISMA tabla (por ejemplo, empleados y su manager_id, que referencia a otro employee_id de la misma tabla) mostrando el resultado en forma de árbol. START WITH indica la fila (o filas) raíz desde donde empezar; CONNECT BY PRIOR indica cómo se conecta cada fila 'padre' con sus filas 'hijas': PRIOR se coloca delante de la columna del padre en la relación.",
        syntax: "SELECT ...\nFROM   tabla\nSTART WITH condición_raíz\nCONNECT BY PRIOR columna_padre = columna_hijo\n[ORDER SIBLINGS BY columna]",
        examples: [
          { code: "SELECT employee_id, last_name, manager_id\nFROM   employees\nSTART WITH manager_id IS NULL\nCONNECT BY PRIOR employee_id = manager_id;" }
        ] },
      { heading: "2. LEVEL: la profundidad dentro del árbol",
        explanation: "LEVEL es una pseudocolumna que devuelve 1 para la fila raíz, 2 para sus hijos directos, 3 para los hijos de esos hijos, y así sucesivamente. Se usa habitualmente con LPAD para generar una indentación visual que revela la estructura del árbol en el propio resultado de texto.",
        examples: [
          { code: "SELECT LPAD(' ', (LEVEL - 1) * 2) || last_name AS organigrama, LEVEL\nFROM   employees\nSTART WITH manager_id IS NULL\nCONNECT BY PRIOR employee_id = manager_id;",
            output: "ORGANIGRAMA        LEVEL\n-----------------  -----\nKing                    1\n  Kochhar               2\n    Greenberg           3" }
        ] },
      { heading: "3. SYS_CONNECT_BY_PATH, CONNECT_BY_ISLEAF y ORDER SIBLINGS BY",
        explanation: "SYS_CONNECT_BY_PATH(columna, separador) construye una cadena con la ruta completa desde la raíz hasta la fila actual, uniendo los valores de esa columna en cada nivel con el separador indicado (por ejemplo, '/King/Kochhar/Greenberg'). CONNECT_BY_ISLEAF devuelve 1 si la fila no tiene ningún hijo (es una 'hoja' del árbol) y 0 si sí tiene. ORDER SIBLINGS BY ordena los hermanos de cada nivel sin romper la estructura jerárquica (a diferencia de un ORDER BY normal, que aplanaría el árbol perdiendo el orden padre-hijo).",
        syntax: "SYS_CONNECT_BY_PATH(columna, 'separador')\nCONNECT_BY_ISLEAF\n... CONNECT BY PRIOR ... ORDER SIBLINGS BY columna",
        examples: [
          { code: "SELECT SYS_CONNECT_BY_PATH(last_name, '/') AS ruta, CONNECT_BY_ISLEAF AS es_hoja\nFROM   employees\nSTART WITH manager_id IS NULL\nCONNECT BY PRIOR employee_id = manager_id\nORDER SIBLINGS BY last_name;" }
        ] },
      { heading: "4. REGEXP_LIKE: condiciones con expresiones regulares",
        explanation: "REGEXP_LIKE(cadena, patrón, [opciones]) es la versión de LIKE potenciada con expresiones regulares completas: permite validar formatos complejos (un email, un teléfono con distintos formatos posibles) que % y _ no pueden expresar. Se usa en WHERE igual que cualquier otra condición booleana.",
        syntax: "REGEXP_LIKE(source_char, pattern [, match_param])",
        examples: [
          { code: "SELECT last_name\nFROM   employees\nWHERE  REGEXP_LIKE(last_name, '^(King|Kochhar)$');" }
        ] },
      { heading: "5. REGEXP_SUBSTR, REGEXP_REPLACE, REGEXP_INSTR y REGEXP_COUNT",
        explanation: "REGEXP_SUBSTR(cadena, patrón) extrae la parte de la cadena que coincide con el patrón (equivalente a un SUBSTR 'inteligente' basado en un patrón, no en posiciones fijas). REGEXP_REPLACE(cadena, patrón, reemplazo) sustituye todas las coincidencias del patrón (a diferencia de REPLACE, que busca texto literal exacto). REGEXP_INSTR devuelve la posición de la coincidencia. REGEXP_COUNT devuelve cuántas veces coincide el patrón en la cadena.",
        syntax: "REGEXP_SUBSTR(source_char, pattern [, position [, occurrence]])\nREGEXP_REPLACE(source_char, pattern [, replace_string])\nREGEXP_INSTR(source_char, pattern)\nREGEXP_COUNT(source_char, pattern)",
        examples: [
          { code: "SELECT REGEXP_REPLACE('Tel: 91-123-4567', '[^0-9]', '') AS solo_digitos\nFROM   DUAL;", output: "SOLO_DIGITOS\n------------\n911234567" }
        ] },
      { heading: "6. Clases POSIX en expresiones regulares",
        explanation: "Dentro de un patrón, las clases POSIX como [:alpha:] (letras), [:digit:] (dígitos), [:space:] (espacios), [:upper:]/[:lower:] (mayúsculas/minúsculas) y [:punct:] (puntuación) se usan dentro de corchetes para representar categorías de caracteres de forma legible y portable entre distintos motores de expresiones regulares.",
        syntax: "REGEXP_LIKE(cadena, '^[[:alpha:]]+$')  -- solo letras, de principio a fin",
        examples: [
          { code: "SELECT last_name\nFROM   employees\nWHERE  REGEXP_LIKE(last_name, '^[[:upper:]][[:lower:]]+$');" }
        ] }
    ],
    oracleNotes: [
      "PRIOR se coloca junto a la columna del lado 'padre' de la relación; invertir el sentido de PRIOR (PRIOR employee_id = manager_id vs employee_id = PRIOR manager_id) recorre el árbol en direcciones distintas.",
      "START WITH sin condición explícita, o mal elegida, puede generar un árbol distinto del esperado o incluso un bucle infinito si hay una referencia circular entre filas.",
      "ORDER SIBLINGS BY es indispensable si se quiere ordenar hermanos sin destruir la jerarquía; un ORDER BY normal al final de una consulta CONNECT BY aplana el árbol perdiendo la estructura visual.",
      "REGEXP_LIKE, a diferencia de LIKE, no necesita ESCAPE para comodines: usa la sintaxis estándar de expresiones regulares (\\, ^, $, +, *, [...], etc.).",
      "Las funciones REGEXP_* son sensibles a mayúsculas/minúsculas por defecto, igual que LIKE; el parámetro match_param ('i' para ignorar mayúsculas) permite cambiarlo."
    ]
  },
  summary: [
    "CONNECT BY PRIOR + START WITH recorren una relación recursiva dentro de la misma tabla, mostrando un árbol.",
    "LEVEL da la profundidad; SYS_CONNECT_BY_PATH construye la ruta completa; CONNECT_BY_ISLEAF identifica las hojas.",
    "ORDER SIBLINGS BY ordena hermanos sin romper la jerarquía, a diferencia de un ORDER BY normal.",
    "REGEXP_LIKE es un LIKE con expresiones regulares completas; REGEXP_SUBSTR/REPLACE/INSTR/COUNT extienden SUBSTR/REPLACE/INSTR/contar coincidencias.",
    "Las clases POSIX ([:alpha:], [:digit:]...) representan categorías de caracteres dentro de un patrón."
  ],
  comparisonTable: {
    title: "LIKE vs REGEXP_LIKE",
    headers: ["Aspecto", "LIKE", "REGEXP_LIKE"],
    rows: [
      ["Comodines", "% y _ únicamente", "Sintaxis completa de expresiones regulares"],
      ["Alternativas (OR de patrones)", "No directamente", "Sí, con | dentro del patrón"],
      ["Clases de caracteres", "No", "Sí, con [:alpha:], [:digit:], etc."],
      ["Anclas de inicio/fin", "No aplica igual", "Sí, con ^ y $"]
    ]
  },
  mindMap: [
    { topic: "Módulo 17 — Jerárquicas y regex", children: [
      "Jerárquicas → START WITH (raíz) + CONNECT BY PRIOR (relación padre-hijo)",
      "LEVEL → profundidad en el árbol, útil con LPAD para indentar",
      "SYS_CONNECT_BY_PATH → ruta completa desde la raíz",
      "CONNECT_BY_ISLEAF → 1 si no tiene hijos",
      "ORDER SIBLINGS BY → ordena hermanos sin romper el árbol",
      "Regex → REGEXP_LIKE, REGEXP_SUBSTR, REGEXP_REPLACE, REGEXP_INSTR, REGEXP_COUNT",
      "Clases POSIX → [:alpha:], [:digit:], [:space:], [:upper:]/[:lower:]"
    ] }
  ],
  sourceRefs: [
    "Oracle SQL Language Reference 19c — \"Hierarchical Queries\"",
    "Oracle SQL Language Reference 19c — \"REGEXP_LIKE\", \"REGEXP_SUBSTR\", \"REGEXP_REPLACE\"",
    "Oracle SQL Language Reference 19c — \"POSIX Character Classes\""
  ],
  realCases: {
    business: "Un sistema de RRHH genera el organigrama completo de la empresa con una consulta CONNECT BY PRIOR sobre employees.manager_id, indentando cada nivel con LEVEL para visualizar la jerarquía directamente en un informe de texto.",
    dataEngineering: "Un ingeniero de datos valida el formato de emails o números de teléfono en una capa de calidad de datos con REGEXP_LIKE, detectando registros que no cumplen el patrón esperado antes de cargarlos.",
    etl: "Un proceso ETL usa REGEXP_REPLACE para limpiar caracteres no numéricos de campos de teléfono importados de distintos sistemas origen con formatos inconsistentes, normalizándolos a un solo formato antes de la carga.",
    reporting: "Un informe de categorías de producto anidadas (categoría > subcategoría > sub-subcategoría) usa SYS_CONNECT_BY_PATH para mostrar la ruta completa de cada producto en una sola columna de texto, como 'Electrónica/Informática/Portátiles'."
  },
  mistakes: [
    { mistake: "Invertir accidentalmente el sentido de PRIOR.", why: "PRIOR employee_id = manager_id y employee_id = PRIOR manager_id recorren el árbol en direcciones distintas (de arriba abajo o de abajo arriba); el examen presenta ambas variantes para comprobar si entiendes cuál produce cuál resultado." },
    { mistake: "Añadir un ORDER BY normal al final de una consulta jerárquica esperando ordenar dentro de cada nivel.", why: "Un ORDER BY normal reordena TODO el resultado plano, destruyendo la estructura jerárquica visual; para ordenar hermanos sin romper el árbol hace falta ORDER SIBLINGS BY." },
    { mistake: "Olvidar que REGEXP_LIKE es sensible a mayúsculas/minúsculas por defecto.", why: "Igual que LIKE, un patrón en minúsculas no coincide con texto en mayúsculas salvo que se indique el parámetro 'i' en match_param; el examen presenta patrones que 'deberían' coincidir a simple vista pero no lo hacen por este motivo." },
    { mistake: "Confundir REPLACE con REGEXP_REPLACE.", why: "REPLACE busca y sustituye texto LITERAL exacto; REGEXP_REPLACE interpreta el segundo argumento como un PATRÓN de expresión regular, no como texto literal, por lo que caracteres especiales como '.', '*' o '[' se comportan de forma distinta en cada una." }
  ],
  exercises: [
    { title: "Organigrama básico", difficulty: "básico", prompt: "Muestra employee_id, last_name y manager_id en forma de árbol, empezando por el empleado sin jefe.", hint: "START WITH manager_id IS NULL", solution: "SELECT employee_id, last_name, manager_id\nFROM employees\nSTART WITH manager_id IS NULL\nCONNECT BY PRIOR employee_id = manager_id;" },
    { title: "Validar un patrón simple", difficulty: "básico", prompt: "Encuentra los apellidos que contienen solo letras (sin espacios, números ni símbolos).", hint: "REGEXP_LIKE con [:alpha:]", solution: "SELECT last_name FROM employees WHERE REGEXP_LIKE(last_name, '^[[:alpha:]]+$');" },
    { title: "Indentar el organigrama", difficulty: "intermedio", prompt: "Repite el organigrama básico pero indenta cada nivel con 2 espacios por profundidad, usando LEVEL.", hint: "LPAD(' ', (LEVEL-1)*2) || columna", solution: "SELECT LPAD(' ', (LEVEL-1)*2) || last_name AS organigrama\nFROM employees\nSTART WITH manager_id IS NULL\nCONNECT BY PRIOR employee_id = manager_id;" },
    { title: "Limpiar un campo de texto con regex", difficulty: "intermedio", prompt: "Elimina todos los caracteres que no sean dígitos de la cadena 'Tel: 91-123-4567'.", hint: "REGEXP_REPLACE con [^0-9]", solution: "SELECT REGEXP_REPLACE('Tel: 91-123-4567', '[^0-9]', '') AS solo_digitos FROM DUAL;" },
    { title: "Ruta completa y hojas del árbol", difficulty: "avanzado", prompt: "Muestra la ruta completa desde la raíz hasta cada empleado (separada por '/') y marca si cada uno es una hoja del organigrama (no tiene subordinados).", hint: "SYS_CONNECT_BY_PATH + CONNECT_BY_ISLEAF", solution: "SELECT SYS_CONNECT_BY_PATH(last_name, '/') AS ruta, CONNECT_BY_ISLEAF AS es_hoja\nFROM employees\nSTART WITH manager_id IS NULL\nCONNECT BY PRIOR employee_id = manager_id;" },
    { title: "Extraer un patrón concreto de un texto libre", difficulty: "avanzado", prompt: "De la cadena 'Contacto: ana.garcia@empresa.com, tel 912345678', extrae solo la dirección de email usando REGEXP_SUBSTR.", hint: "Un patrón típico de email: [[:alnum:]._%+-]+@[[:alnum:].-]+\\.[[:alpha:]]{2,}", solution: "SELECT REGEXP_SUBSTR('Contacto: ana.garcia@empresa.com, tel 912345678',\n  '[[:alnum:]._%+-]+@[[:alnum:].-]+\\.[[:alpha:]]{2,}') AS email\nFROM DUAL;" }
  ],
  solved: [
    { title: "Construir un organigrama legible con profundidad e indentación",
      problem: "Necesitas un listado de empleados que visualmente muestre la jerarquía, con cada nivel más indentado que el anterior.",
      steps: [
        "Identifica la relación recursiva: employees.manager_id apunta a employees.employee_id.",
        "Define la raíz con START WITH manager_id IS NULL (el empleado sin jefe).",
        "Define la relación con CONNECT BY PRIOR employee_id = manager_id.",
        "Usa LEVEL dentro de LPAD para generar espacios proporcionales a la profundidad de cada fila."
      ],
      query: "SELECT LPAD(' ', (LEVEL - 1) * 2) || last_name AS organigrama\nFROM   employees\nSTART WITH manager_id IS NULL\nCONNECT BY PRIOR employee_id = manager_id;",
      result: "Cada nivel jerárquico aparece con más sangría, revelando visualmente la estructura del árbol." },
    { title: "Validar el formato de un campo antes de cargarlo",
      problem: "Necesitas detectar qué valores de una columna 'telefono' no siguen el patrón esperado de 9 dígitos, antes de cargarlos en un sistema que los exige estrictamente numéricos.",
      steps: [
        "Defines el patrón esperado: exactamente 9 dígitos, nada más.",
        "Usas REGEXP_LIKE con anclas ^ y $ para exigir que TODA la cadena cumpla el patrón, no solo una parte.",
        "Consultas con NOT para encontrar los que NO cumplen el patrón.",
        "Revisas esos registros antes de decidir cómo corregirlos o excluirlos de la carga."
      ],
      query: "SELECT telefono\nFROM   clientes\nWHERE  NOT REGEXP_LIKE(telefono, '^[[:digit:]]{9}$');",
      result: "Devuelve todos los teléfonos que no tienen exactamente 9 dígitos, listos para revisión." }
  ],
  flashcards: [
    { front: "¿Qué indica START WITH en una consulta jerárquica?", back: "La fila (o filas) raíz desde donde empieza el recorrido del árbol." },
    { front: "¿Qué indica CONNECT BY PRIOR?", back: "Cómo se conecta cada fila padre con sus filas hijas; PRIOR va junto a la columna del padre." },
    { front: "¿Qué devuelve la pseudocolumna LEVEL?", back: "La profundidad de la fila actual dentro del árbol, empezando en 1 para la raíz." },
    { front: "¿Qué construye SYS_CONNECT_BY_PATH?", back: "La ruta completa desde la raíz hasta la fila actual, con un separador indicado." },
    { front: "¿Qué indica CONNECT_BY_ISLEAF = 1?", back: "Que esa fila no tiene ningún hijo (es una hoja del árbol)." },
    { front: "¿Por qué se usa ORDER SIBLINGS BY en vez de ORDER BY normal?", back: "Para ordenar los hermanos de cada nivel sin destruir la estructura jerárquica." },
    { front: "¿Qué añade REGEXP_LIKE frente a LIKE?", back: "Soporte de expresiones regulares completas, no solo % y _." },
    { front: "¿Qué representa la clase POSIX [:digit:]?", back: "Cualquier carácter numérico (0-9)." }
  ],
  examples: [
    { title: "Consulta jerárquica básica", code: "SELECT employee_id, last_name, manager_id\nFROM employees\nSTART WITH manager_id IS NULL\nCONNECT BY PRIOR employee_id = manager_id;" },
    { title: "LEVEL e indentación", code: "SELECT LPAD(' ', (LEVEL-1)*2) || last_name AS organigrama\nFROM employees\nSTART WITH manager_id IS NULL\nCONNECT BY PRIOR employee_id = manager_id;" },
    { title: "REGEXP_LIKE", code: "SELECT last_name FROM employees\nWHERE REGEXP_LIKE(last_name, '^[[:upper:]][[:lower:]]+$');" }
  ],
  quiz: [
    { q: "¿Qué indica la cláusula START WITH en una consulta jerárquica?", options: [
        "El orden final del resultado", "La fila o filas raíz desde donde empieza el recorrido",
        "El número máximo de niveles a mostrar", "La columna que se va a mostrar primero"
      ], a: 1,
      why: [
        "El orden final se controla con ORDER SIBLINGS BY, no con START WITH.",
        "Correcta: START WITH define la condición que identifica la raíz o raíces del árbol.",
        "No limita el número de niveles: eso dependería de la propia estructura de datos.",
        "No tiene relación con qué columna se muestra primero en el SELECT."
      ] },
    { q: "¿Dónde se coloca PRIOR en 'CONNECT BY PRIOR employee_id = manager_id'?", options: [
        "Junto a la columna del lado hijo", "Junto a la columna del lado padre",
        "Puede ir en cualquiera de los dos lados indistintamente", "Solo se usa una vez al principio de toda la sentencia"
      ], a: 1,
      why: [
        "PRIOR no va junto al lado hijo en este patrón.",
        "Correcta: PRIOR se coloca junto a la columna que representa al padre en la relación.",
        "La posición sí importa: cambiarla invierte el sentido del recorrido del árbol.",
        "PRIOR se usa en cada evaluación de la condición CONNECT BY, no solo una vez al inicio de la sentencia."
      ] },
    { q: "¿Qué devuelve LEVEL para la fila raíz de un árbol?", options: ["0", "1", "-1", "NULL"], a: 1,
      why: [
        "0 no es el valor inicial de LEVEL en Oracle.",
        "Correcta: LEVEL devuelve 1 para la raíz, y aumenta en cada nivel de profundidad.",
        "LEVEL nunca es negativo.",
        "LEVEL no es NULL para ninguna fila dentro de una consulta jerárquica válida."
      ] },
    { q: "¿Qué construye SYS_CONNECT_BY_PATH(last_name, '/')?", options: [
        "Solo el nombre de la fila actual", "La ruta completa desde la raíz hasta la fila actual, separada por '/'",
        "El número de hijos de la fila actual", "Un booleano indicando si la fila es una hoja"
      ], a: 1,
      why: [
        "No se limita al nombre de la fila actual: incluye toda la cadena de ancestros.",
        "Correcta: construye la ruta jerárquica completa uniendo los valores con el separador indicado.",
        "No cuenta hijos: eso no es su función.",
        "Eso describiría CONNECT_BY_ISLEAF, no SYS_CONNECT_BY_PATH."
      ] },
    { q: "¿Por qué no conviene usar un ORDER BY normal al final de una consulta jerárquica para ordenar los hermanos de cada nivel?", options: [
        "Porque ORDER BY no funciona en absoluto con CONNECT BY", "Porque ORDER BY reordena todo el resultado plano, destruyendo la estructura jerárquica visual",
        "Porque solo se puede usar GROUP BY en su lugar", "No hay ningún problema real en hacerlo"
      ], a: 1,
      why: [
        "ORDER BY sí es sintácticamente válido junto a CONNECT BY; el problema es de resultado, no de sintaxis.",
        "Correcta: aplana el árbol completo según el criterio de ORDER BY, perdiendo el agrupamiento padre-hijo visual.",
        "GROUP BY no es un sustituto para este propósito de ordenación jerárquica.",
        "Sí hay un problema real: se pierde la estructura visual del árbol."
      ] },
    { q: "¿Qué diferencia hay entre REPLACE y REGEXP_REPLACE?", options: [
        "Ninguna, son sinónimos", "REPLACE busca texto literal exacto; REGEXP_REPLACE interpreta el segundo argumento como un patrón de expresión regular",
        "REGEXP_REPLACE solo funciona con números", "REPLACE es más potente que REGEXP_REPLACE"
      ], a: 1,
      why: [
        "No son sinónimos: interpretan su segundo argumento de forma distinta.",
        "Correcta: es la diferencia fundamental entre ambas funciones.",
        "REGEXP_REPLACE funciona con cualquier texto, no solo números.",
        "Es al revés: REGEXP_REPLACE es más potente y flexible que REPLACE."
      ] },
    { q: "¿Qué representa la clase POSIX [:alpha:] dentro de un patrón de expresión regular?", options: ["Cualquier dígito", "Cualquier letra", "Cualquier espacio en blanco", "Cualquier signo de puntuación"], a: 1,
      why: [
        "Los dígitos corresponden a la clase [:digit:].",
        "Correcta: [:alpha:] representa cualquier carácter alfabético (letra).",
        "Los espacios corresponden a la clase [:space:].",
        "La puntuación corresponde a la clase [:punct:]."
      ] },
    { q: "¿Qué devuelve REGEXP_COUNT('banana', 'an')?", options: ["1", "2", "3", "0"], a: 1,
      why: [
        "1 no cuenta todas las apariciones reales del patrón.",
        "Correcta: 'an' aparece dos veces en 'banana' (b-AN-AN-a), así que REGEXP_COUNT devuelve 2.",
        "3 sobreestima el número real de coincidencias en esta cadena.",
        "0 sería si el patrón no apareciera en absoluto, pero sí aparece."
      ] },
    { q: "¿Es sensible a mayúsculas/minúsculas REGEXP_LIKE por defecto?", options: [
        "No, nunca distingue mayúsculas de minúsculas", "Sí, igual que LIKE, salvo que se indique lo contrario con match_param",
        "Solo si se usan clases POSIX", "Depende exclusivamente del tipo de dato de la columna"
      ], a: 1,
      why: [
        "Sí distingue por defecto: un patrón en minúsculas no coincide con mayúsculas sin configurarlo.",
        "Correcta: es sensible por defecto, y el parámetro match_param ('i') permite cambiar ese comportamiento.",
        "No depende de si se usan clases POSIX: la sensibilidad es una propiedad general de la función.",
        "No depende del tipo de dato de la columna, sino del comportamiento por defecto de la función."
      ] },
    { q: "¿Qué produce invertir PRIOR de 'CONNECT BY PRIOR employee_id = manager_id' a 'CONNECT BY employee_id = PRIOR manager_id'?", options: [
        "Exactamente el mismo resultado", "Se invierte el sentido del recorrido del árbol (de abajo hacia arriba en vez de arriba hacia abajo, o viceversa)",
        "Da un error de sintaxis", "Solo cambia el orden de las columnas mostradas"
      ], a: 1,
      why: [
        "No produce el mismo resultado: cambia la dirección de la relación recorrida.",
        "Correcta: invertir la posición de PRIOR invierte qué fila se considera 'padre' de cuál en cada paso.",
        "No es un error de sintaxis: ambas formas son válidas, solo cambian de significado.",
        "No es solo un cambio estético de columnas: cambia fundamentalmente qué árbol se recorre."
      ] }
  ],
  challenges: [
    { level: 1, prompt: "Muestra el organigrama completo de employees indentado, y añade una columna con LEVEL para verificar la profundidad numérica de cada fila.", solution: "SELECT LPAD(' ', (LEVEL-1)*2) || last_name AS organigrama, LEVEL\nFROM employees\nSTART WITH manager_id IS NULL\nCONNECT BY PRIOR employee_id = manager_id;" },
    { level: 2, prompt: "Explica por qué una consulta CONNECT BY sin una condición START WITH adecuada podría generar un resultado inesperado o un bucle, y cómo se previene.", solution: "Si la relación entre filas tiene un ciclo (por ejemplo, la fila A referencia a B como padre y B referencia de vuelta a A), Oracle puede intentar recorrer el árbol indefinidamente y lanzar un error de conexión cíclica (ORA-01436); se previene asegurando que los datos representen realmente una jerarquía sin ciclos, y opcionalmente usando la cláusula NOCYCLE junto a CONNECT BY para que Oracle detenga el recorrido en un ciclo detectado en vez de fallar." }
  ]
},

// =====================================================================
// NIVEL 18
// =====================================================================
{
  id: 18, code: "M18", category: "Avanzado",
  title: "Funciones analíticas (de ventana)",
  intro: "Cálculos que comparan cada fila con un grupo de filas relacionadas (una 'ventana') sin colapsarlas en una sola, como hace GROUP BY: rankings, comparación con la fila anterior/siguiente, y totales acumulados.",
  theory: {
    concepts: [
      { heading: "1. La cláusula OVER: qué distingue a una función analítica",
        explanation: "Una función analítica se reconoce por ir seguida de OVER (...). A diferencia de una función de grupo con GROUP BY, que colapsa varias filas en una sola por grupo, una función analítica CONSERVA todas las filas originales y añade una columna calculada sobre una 'ventana' de filas relacionadas con la actual. PARTITION BY divide las filas en particiones (como un GROUP BY que no colapsa); ORDER BY dentro de OVER define el orden en el que se procesa cada partición.",
        syntax: "funcion_analitica(...) OVER (\n  [PARTITION BY columna [, ...]]\n  [ORDER BY columna [, ...]]\n  [frame_clause]\n)" },
      { heading: "2. RANK, DENSE_RANK y ROW_NUMBER",
        explanation: "Las tres numeran filas dentro de cada partición según el ORDER BY de OVER, pero se comportan distinto ante empates (valores iguales). ROW_NUMBER() asigna un número distinto y consecutivo a cada fila, incluso si hay empates (deshace el empate de forma arbitraria). RANK() da el mismo número a las filas empatadas, y SALTA números después de un empate (1, 2, 2, 4). DENSE_RANK() también da el mismo número a los empates, pero NO deja huecos (1, 2, 2, 3).",
        syntax: "RANK() OVER (PARTITION BY ... ORDER BY ...)\nDENSE_RANK() OVER (PARTITION BY ... ORDER BY ...)\nROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...)",
        examples: [
          { code: "SELECT last_name, salary,\n       RANK()       OVER (ORDER BY salary DESC) AS rango,\n       DENSE_RANK() OVER (ORDER BY salary DESC) AS rango_denso,\n       ROW_NUMBER() OVER (ORDER BY salary DESC) AS fila\nFROM   employees;",
            output: "LAST_NAME  SALARY  RANGO  RANGO_DENSO  FILA\n---------  ------  -----  -----------  ----\nKing        24000      1            1     1\nRussell     14000      2            2     2\nPartners    14000      2            2     3\nErrazuriz   12000      4            3     4" }
        ] },
      { heading: "3. PARTITION BY: rankings independientes por grupo",
        explanation: "PARTITION BY departamento reinicia el cálculo de la función analítica dentro de cada partición, de forma similar a como GROUP BY departamento agruparía para una función de grupo, pero sin colapsar las filas: cada empleado sigue apareciendo en el resultado, con su rango calculado SOLO dentro de su propio departamento.",
        examples: [
          { code: "SELECT department_id, last_name, salary,\n       RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rango_depto\nFROM   employees;" }
        ] },
      { heading: "4. LAG y LEAD: comparar con la fila anterior o siguiente",
        explanation: "LAG(columna, [n], [valor_por_defecto]) devuelve el valor de esa columna n filas ANTES de la actual (por defecto n=1), según el orden definido en OVER; LEAD hace lo mismo pero n filas DESPUÉS. Son la forma estándar de calcular diferencias entre periodos consecutivos (por ejemplo, 'ventas de este mes menos ventas del mes anterior') sin necesidad de un self join.",
        syntax: "LAG(expr [, offset [, default]]) OVER (...)\nLEAD(expr [, offset [, default]]) OVER (...)",
        examples: [
          { code: "SELECT last_name, hire_date, salary,\n       LAG(salary)  OVER (ORDER BY hire_date) AS salario_anterior,\n       LEAD(salary) OVER (ORDER BY hire_date) AS salario_siguiente\nFROM   employees;" }
        ] },
      { heading: "5. FIRST_VALUE y LAST_VALUE",
        explanation: "FIRST_VALUE(expr) OVER (...) devuelve el valor de expr en la PRIMERA fila de la ventana (según el ORDER BY definido); LAST_VALUE hace lo mismo con la ÚLTIMA fila. Son útiles para comparar cada fila contra un extremo del grupo, por ejemplo 'diferencia respecto al salario más alto de tu departamento'. LAST_VALUE requiere prestar atención al frame por defecto (siguiente concepto), o el resultado puede no ser el esperado.",
        examples: [
          { code: "SELECT department_id, last_name, salary,\n       FIRST_VALUE(salary) OVER (PARTITION BY department_id ORDER BY salary DESC) AS salario_top\nFROM   employees;" }
        ] },
      { heading: "6. La cláusula de frame: ROWS BETWEEN / RANGE BETWEEN",
        explanation: "El frame define exactamente qué subconjunto de filas de la partición entran en el cálculo para la fila actual, más allá de PARTITION BY/ORDER BY. ROWS BETWEEN cuenta filas físicas; RANGE BETWEEN cuenta por el VALOR del ORDER BY. UNBOUNDED PRECEDING significa 'desde el principio de la partición'; CURRENT ROW es la fila actual; UNBOUNDED FOLLOWING es 'hasta el final'. El frame por defecto (si no se especifica) es RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW, lo cual explica comportamientos de LAST_VALUE que a primera vista parecen incorrectos.",
        syntax: "funcion(...) OVER (\n  ORDER BY columna\n  ROWS BETWEEN { UNBOUNDED PRECEDING | n PRECEDING | CURRENT ROW }\n           AND { UNBOUNDED FOLLOWING | n FOLLOWING  | CURRENT ROW }\n)",
        examples: [
          { code: "SELECT last_name, hire_date, salary,\n       SUM(salary) OVER (ORDER BY hire_date\n                         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS acumulado\nFROM   employees;" }
        ],
        commonErrors: [
          "Usar LAST_VALUE sin ajustar el frame esperando 'el último valor de toda la partición': con el frame por defecto, LAST_VALUE solo ve hasta la fila actual, así que devuelve el valor de la propia fila actual, no el verdadero último de la partición. Hace falta RANGE/ROWS BETWEEN ... AND UNBOUNDED FOLLOWING para el comportamiento esperado."
        ] }
    ],
    oracleNotes: [
      "Una función analítica NO colapsa filas como GROUP BY: el número de filas del resultado es el mismo que sin OVER.",
      "RANK deja huecos tras un empate; DENSE_RANK no deja huecos; ROW_NUMBER nunca tiene empates (siempre números consecutivos únicos).",
      "PARTITION BY reinicia el cálculo por grupo, de forma similar a GROUP BY, pero sin colapsar las filas resultantes.",
      "El frame por defecto es RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW: afecta especialmente a LAST_VALUE y a sumas acumuladas, dando resultados distintos de los que se obtendrían con el frame completo de la partición.",
      "Las funciones analíticas se evalúan DESPUÉS de WHERE, GROUP BY y HAVING en el orden lógico, pero ANTES del ORDER BY final de la consulta completa (por eso a veces se necesita una subconsulta para filtrar por el resultado de una función analítica, ya que no se puede usar directamente en WHERE de la misma consulta)."
    ]
  },
  summary: [
    "Una función analítica (con OVER) conserva todas las filas, a diferencia de una función de grupo con GROUP BY.",
    "RANK (con huecos), DENSE_RANK (sin huecos) y ROW_NUMBER (siempre consecutivo) numeran filas ante empates de forma distinta.",
    "PARTITION BY reinicia el cálculo por grupo sin colapsar filas.",
    "LAG/LEAD comparan con filas anterior/siguiente; FIRST_VALUE/LAST_VALUE con los extremos de la ventana.",
    "El frame (ROWS/RANGE BETWEEN) define qué filas exactas entran en el cálculo; el frame por defecto puede sorprender con LAST_VALUE."
  ],
  comparisonTable: {
    title: "RANK vs DENSE_RANK vs ROW_NUMBER ante un empate",
    headers: ["Función", "Filas empatadas", "Siguiente valor tras el empate", "Ejemplo con salarios 24000,14000,14000,12000"],
    rows: [
      ["RANK()", "Mismo número", "Deja huecos", "1, 2, 2, 4"],
      ["DENSE_RANK()", "Mismo número", "Sin huecos", "1, 2, 2, 3"],
      ["ROW_NUMBER()", "Números distintos (desempata arbitrariamente)", "Siempre consecutivo", "1, 2, 3, 4"]
    ]
  },
  mindMap: [
    { topic: "Módulo 18 — Funciones analíticas", children: [
      "OVER(...) → distingue función analítica de función de grupo; no colapsa filas",
      "PARTITION BY → reinicia el cálculo por grupo, sin colapsar",
      "Ranking → RANK (huecos), DENSE_RANK (sin huecos), ROW_NUMBER (siempre único)",
      "Comparar filas → LAG (anterior), LEAD (siguiente)",
      "Extremos → FIRST_VALUE, LAST_VALUE (cuidado con el frame por defecto)",
      "Frame → ROWS/RANGE BETWEEN ... AND ...; por defecto hasta CURRENT ROW"
    ] }
  ],
  sourceRefs: [
    "Oracle SQL Language Reference 19c — \"Analytic Functions\"",
    "Oracle SQL Language Reference 19c — \"RANK\", \"DENSE_RANK\", \"ROW_NUMBER\", \"LAG\", \"LEAD\", \"FIRST_VALUE\", \"LAST_VALUE\""
  ],
  realCases: {
    business: "Un informe de comisiones usa RANK() OVER (PARTITION BY department_id ORDER BY sales DESC) para identificar al mejor vendedor de CADA departamento en un solo listado, sin perder el detalle de cada vendedor como haría un GROUP BY con MAX.",
    dataEngineering: "Un ingeniero de datos usa ROW_NUMBER() OVER (PARTITION BY clave_negocio ORDER BY fecha_carga DESC) para quedarse solo con la versión más reciente de cada registro duplicado, filtrando después por ROW_NUMBER = 1 en una subconsulta.",
    etl: "Un proceso ETL de series temporales usa LAG(valor) OVER (ORDER BY fecha) para calcular la variación día a día de una métrica, sin necesidad de un self join contra 'el día anterior'.",
    reporting: "Un dashboard financiero usa SUM(importe) OVER (ORDER BY fecha ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) para mostrar un saldo acumulado fila a fila junto al detalle de cada movimiento."
  },
  mistakes: [
    { mistake: "Confundir una función analítica con una función de grupo por el nombre de la función.", why: "SUM, COUNT, AVG, MAX, MIN pueden usarse tanto como funciones de grupo (con GROUP BY) como analíticas (con OVER); lo que las distingue es la presencia de OVER, no el nombre de la función." },
    { mistake: "Esperar que RANK y DENSE_RANK numeren igual tras un empate.", why: "RANK deja huecos después de un empate (1,2,2,4); DENSE_RANK no los deja (1,2,2,3); el examen presenta datos con empates deliberados para comprobar si conoces esta diferencia exacta." },
    { mistake: "Usar una función analítica directamente en WHERE de la misma consulta.", why: "Las funciones analíticas se evalúan después de WHERE en el orden lógico, así que no está disponible todavía en ese punto; hace falta envolver la consulta en una subconsulta o CTE y filtrar en la consulta externa." },
    { mistake: "Asumir que LAST_VALUE siempre da el último valor de toda la partición.", why: "Con el frame por defecto (hasta CURRENT ROW), LAST_VALUE solo ve las filas hasta la actual, devolviendo el valor de la propia fila en muchos casos; hace falta ajustar el frame a UNBOUNDED FOLLOWING para el comportamiento 'intuitivo'." }
  ],
  exercises: [
    { title: "Ranking simple de salarios", difficulty: "básico", prompt: "Muestra last_name, salary y el ranking de cada empleado por salario descendente usando RANK.", hint: "RANK() OVER (ORDER BY salary DESC)", solution: "SELECT last_name, salary, RANK() OVER (ORDER BY salary DESC) AS rango\nFROM employees;" },
    { title: "Numeración sin empates", difficulty: "básico", prompt: "Repite el ranking anterior pero con ROW_NUMBER, y explica por qué nunca hay dos empleados con el mismo número.", hint: "ROW_NUMBER() siempre desempata.", solution: "SELECT last_name, salary, ROW_NUMBER() OVER (ORDER BY salary DESC) AS fila\nFROM employees;\n-- ROW_NUMBER asigna un valor único y consecutivo a cada fila, deshaciendo cualquier empate de forma arbitraria." },
    { title: "Ranking por departamento", difficulty: "intermedio", prompt: "Muestra el ranking de salario de cada empleado, pero calculado solo dentro de su propio departamento.", hint: "PARTITION BY department_id", solution: "SELECT department_id, last_name, salary,\n       RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rango_depto\nFROM employees;" },
    { title: "Comparar con el salario anterior por antigüedad", difficulty: "intermedio", prompt: "Ordenando por fecha de contratación, muestra para cada empleado el salario del empleado contratado justo antes que él.", hint: "LAG(salary) OVER (ORDER BY hire_date)", solution: "SELECT last_name, hire_date, salary,\n       LAG(salary) OVER (ORDER BY hire_date) AS salario_anterior\nFROM employees;" },
    { title: "Filtrar sobre el resultado de una función analítica", difficulty: "avanzado", prompt: "Muestra solo el empleado con mayor salario de cada departamento, usando RANK y una subconsulta (no HAVING).", hint: "RANK() en una subconsulta, filtra rango=1 en la externa.", solution: "SELECT department_id, last_name, salary FROM (\n  SELECT department_id, last_name, salary,\n         RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rango\n  FROM employees\n) WHERE rango = 1;" },
    { title: "Saldo acumulado con frame explícito", difficulty: "avanzado", prompt: "Calcula un salario acumulado ordenado por fecha de contratación, sumando desde el principio hasta la fila actual, dejando explícito el frame.", hint: "ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW", solution: "SELECT last_name, hire_date, salary,\n       SUM(salary) OVER (ORDER BY hire_date\n                         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS acumulado\nFROM employees;" }
  ],
  solved: [
    { title: "Elegir entre RANK, DENSE_RANK y ROW_NUMBER según la necesidad real",
      problem: "Necesitas un 'top 3 de salarios por departamento', pero no sabes si debe haber empates o no.",
      steps: [
        "Si quieres exactamente 3 filas por departamento sin importar empates, usa ROW_NUMBER (siempre da exactamente n filas por partición al filtrar <= n).",
        "Si quieres 'todos los que estén entre los 3 mejores, incluidos los empatados en el puesto 3', usa RANK (puede devolver más de 3 filas si hay empate en la posición 3).",
        "Si además quieres que el siguiente puesto tras un empate no salte números, complementa con DENSE_RANK para mostrar la posición 'lógica'.",
        "Decides según el requisito de negocio exacto, no por preferencia arbitraria."
      ],
      query: "SELECT * FROM (\n  SELECT department_id, last_name, salary,\n         RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rango\n  FROM employees\n) WHERE rango <= 3;",
      result: "Devuelve los 3 mejores salarios por departamento, incluyendo empates adicionales en el tercer puesto si existieran." },
    { title: "Diagnosticar un LAST_VALUE que 'no funciona'",
      problem: "SELECT last_name, salary, LAST_VALUE(salary) OVER (PARTITION BY department_id ORDER BY salary) AS ultimo FROM employees; no da el salario más alto de cada departamento como se esperaba.",
      steps: [
        "Reconoces que el frame por defecto es RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW.",
        "Con ese frame, LAST_VALUE solo ve hasta la fila actual, devolviendo típicamente el propio valor de la fila.",
        "Añades explícitamente el frame extendido hasta el final de la partición.",
        "Verificas que ahora sí devuelve el máximo real de cada partición en todas las filas."
      ],
      query: "SELECT last_name, salary,\n       LAST_VALUE(salary) OVER (PARTITION BY department_id ORDER BY salary\n                                RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS ultimo\nFROM   employees;",
      result: "Ahora LAST_VALUE devuelve correctamente el salario más alto de cada departamento en todas las filas de esa partición." }
  ],
  flashcards: [
    { front: "¿Qué distingue a una función analítica de una de grupo?", back: "La cláusula OVER(...); una analítica conserva todas las filas, una de grupo con GROUP BY las colapsa." },
    { front: "¿Qué hace PARTITION BY dentro de OVER?", back: "Reinicia el cálculo de la función por cada grupo, sin colapsar filas." },
    { front: "¿Deja huecos RANK tras un empate?", back: "Sí (1,2,2,4). DENSE_RANK no los deja (1,2,2,3)." },
    { front: "¿Puede haber empates con ROW_NUMBER?", back: "No; siempre asigna números distintos y consecutivos." },
    { front: "¿Qué hace LAG(columna) OVER (ORDER BY ...)?", back: "Devuelve el valor de esa columna en la fila anterior según ese orden." },
    { front: "¿Qué hace LEAD(columna) OVER (ORDER BY ...)?", back: "Devuelve el valor de esa columna en la fila siguiente según ese orden." },
    { front: "¿Cuál es el frame por defecto de una función analítica con ORDER BY?", back: "RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW." },
    { front: "¿Por qué puede 'fallar' LAST_VALUE sin ajustar el frame?", back: "Porque con el frame por defecto solo ve hasta la fila actual, no toda la partición." }
  ],
  examples: [
    { title: "RANK / DENSE_RANK / ROW_NUMBER", code: "SELECT last_name, salary,\n       RANK()       OVER (ORDER BY salary DESC) AS rango,\n       DENSE_RANK() OVER (ORDER BY salary DESC) AS rango_denso,\n       ROW_NUMBER() OVER (ORDER BY salary DESC) AS fila\nFROM employees;" },
    { title: "PARTITION BY", code: "SELECT department_id, last_name, salary,\n       RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rango_depto\nFROM employees;" },
    { title: "LAG / LEAD", code: "SELECT last_name, hire_date, salary,\n       LAG(salary) OVER (ORDER BY hire_date) AS anterior,\n       LEAD(salary) OVER (ORDER BY hire_date) AS siguiente\nFROM employees;" }
  ],
  quiz: [
    { q: "¿Qué distingue a una función analítica de una función de grupo con GROUP BY?", options: [
        "Nada, son exactamente lo mismo", "La función analítica conserva todas las filas originales; GROUP BY las colapsa en una por grupo",
        "Las funciones analíticas solo funcionan con COUNT", "GROUP BY siempre es más rápido"
      ], a: 1,
      why: [
        "Sí hay una diferencia fundamental en el número de filas del resultado.",
        "Correcta: la clave es que OVER no colapsa filas, a diferencia de GROUP BY.",
        "Las funciones analíticas funcionan con SUM, AVG, RANK, LAG, y muchas más, no solo COUNT.",
        "No hay una regla general de velocidad; depende del caso y del plan de ejecución."
      ] },
    { q: "Ante un empate en el ORDER BY, ¿qué hace RANK() que DENSE_RANK() no hace?", options: [
        "Asigna el mismo número a ambas filas empatadas (los dos lo hacen)", "Deja un hueco en la numeración tras el empate",
        "Asigna siempre números distintos", "Ignora las filas empatadas"
      ], a: 1,
      why: [
        "Ambas asignan el mismo número a los empates; esto no es lo que las distingue.",
        "Correcta: RANK deja huecos tras un empate (1,2,2,4); DENSE_RANK no (1,2,2,3).",
        "Eso describiría más bien a ROW_NUMBER.",
        "Ninguna de las dos ignora filas: todas aparecen en el resultado."
      ] },
    { q: "¿Puede ROW_NUMBER() asignar el mismo número a dos filas distintas?", options: ["Sí, si están empatadas en el ORDER BY", "No, siempre asigna números únicos y consecutivos", "Solo si se usa PARTITION BY", "Solo en Oracle 19c y versiones anteriores"], a: 1,
      why: [
        "No, incluso con empate, ROW_NUMBER desempata de forma arbitraria y asigna números distintos.",
        "Correcta: ROW_NUMBER siempre da números únicos y consecutivos dentro de su partición.",
        "El comportamiento de unicidad de ROW_NUMBER no depende de si se usa PARTITION BY.",
        "No es una limitación de una versión concreta; es el comportamiento estándar en todas las versiones que soportan la función."
      ] },
    { q: "¿Qué hace PARTITION BY department_id dentro de una cláusula OVER?", options: [
        "Filtra solo las filas de un departamento concreto", "Reinicia el cálculo de la función analítica para cada departamento, sin colapsar filas",
        "Ordena el resultado final por departamento", "Elimina departamentos duplicados"
      ], a: 1,
      why: [
        "No filtra: sigue incluyendo todas las filas de todos los departamentos.",
        "Correcta: divide el cálculo por grupos, igual que GROUP BY, pero sin colapsar las filas.",
        "No ordena el resultado final por sí solo; eso lo haría un ORDER BY de la consulta completa.",
        "No elimina duplicados de ningún tipo; esa sería función de DISTINCT."
      ] },
    { q: "¿Qué devuelve LAG(salary) OVER (ORDER BY hire_date) para la primera fila (la más antigua) de la partición?", options: [
        "El salario de la propia fila", "NULL, salvo que se especifique un valor por defecto", "0", "Error de ejecución"
      ], a: 1,
      why: [
        "No devuelve su propio valor: LAG mira hacia atrás, y no hay fila anterior para la primera.",
        "Correcta: al no existir fila anterior, devuelve NULL, salvo que se indique explícitamente un tercer argumento como valor por defecto.",
        "No devuelve 0 automáticamente; sería NULL salvo configuración explícita.",
        "No es un error: es un comportamiento perfectamente definido y esperado."
      ] },
    { q: "¿Por qué no se puede usar una función analítica directamente en la cláusula WHERE de la misma consulta?", options: [
        "Por una limitación arbitraria sin motivo", "Porque las funciones analíticas se evalúan después de WHERE en el orden lógico de la consulta",
        "Porque las funciones analíticas no existen en WHERE en ninguna base de datos", "Sí se puede sin ningún problema"
      ], a: 1,
      why: [
        "Hay un motivo técnico claro relacionado con el orden lógico de evaluación.",
        "Correcta: WHERE se evalúa antes de que las funciones analíticas hayan calculado su resultado.",
        "Esta limitación es coherente con cómo se procesan las consultas en Oracle, ligada al orden lógico, no una peculiaridad de todas las bases de datos por igual.",
        "No se puede directamente: se necesita una subconsulta o CTE para filtrar sobre su resultado."
      ] },
    { q: "¿Cuál es el frame por defecto cuando se usa ORDER BY dentro de OVER sin especificar ROWS/RANGE?", options: [
        "Toda la partición completa", "RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW",
        "Solo la fila actual, sin ninguna otra", "No hay ningún frame por defecto, hay que especificarlo siempre"
      ], a: 1,
      why: [
        "No es toda la partición por defecto cuando hay ORDER BY: ese comportamiento requiere especificarlo explícitamente.",
        "Correcta: ese es el frame implícito, y explica por qué funciones como LAST_VALUE pueden sorprender.",
        "No se limita solo a la fila actual sin incluir las anteriores: incluye desde el principio de la partición hasta la actual.",
        "Sí existe un frame por defecto; no es obligatorio especificarlo siempre."
      ] },
    { q: "¿Qué función usarías para comparar el valor de una fila con el de la fila inmediatamente siguiente, según un orden dado?", options: ["LAG", "LEAD", "FIRST_VALUE", "RANK"], a: 1,
      why: [
        "LAG mira hacia la fila ANTERIOR, no la siguiente.",
        "Correcta: LEAD devuelve el valor de la fila siguiente según el orden especificado.",
        "FIRST_VALUE da el valor de la primera fila de la ventana, no específicamente la siguiente a la actual.",
        "RANK calcula una posición, no el valor de otra fila."
      ] },
    { q: "¿Qué problema tiene usar LAST_VALUE sin ajustar el frame, esperando el último valor de toda la partición?", options: [
        "Ninguno, funciona siempre igual", "Con el frame por defecto, solo ve hasta la fila actual, así que normalmente devuelve el valor de la propia fila",
        "LAST_VALUE no existe en Oracle SQL", "Solo funciona si se usa PARTITION BY"
      ], a: 1,
      why: [
        "Sí hay un problema real y muy común en la práctica.",
        "Correcta: hay que extender el frame hasta UNBOUNDED FOLLOWING para obtener el verdadero último valor de toda la partición.",
        "LAST_VALUE sí existe y es una función analítica estándar de Oracle.",
        "Funciona igual con o sin PARTITION BY; el problema del frame por defecto es independiente de eso."
      ] },
    { q: "¿Qué combinación permite obtener 'solo el empleado con mayor salario de cada departamento' usando una función analítica?", options: [
        "GROUP BY department_id HAVING MAX(salary)", "RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) en una subconsulta, filtrando rango = 1 en la externa",
        "ORDER BY salary DESC FETCH FIRST 1 ROW ONLY sin más", "No es posible sin PL/SQL"
      ], a: 1,
      why: [
        "Ese patrón con HAVING no funciona directamente así para obtener la fila completa del empleado top por grupo.",
        "Correcta: es el patrón estándar para este tipo de 'top N por grupo' usando funciones analíticas.",
        "FETCH FIRST 1 ROW ONLY sin PARTITION BY daría solo el top de TODA la tabla, no uno por departamento.",
        "Sí es perfectamente posible con SQL puro, sin necesidad de PL/SQL."
      ] }
  ],
  challenges: [
    { level: 1, prompt: "Muestra el ranking (RANK) y el ranking denso (DENSE_RANK) de salario por departamento en la misma consulta, y explica en qué fila concreta difieren si hay algún empate.", solution: "SELECT department_id, last_name, salary,\n       RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rango,\n       DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rango_denso\nFROM employees;\n-- Difieren en la fila siguiente a cualquier empate: RANK salta un número, DENSE_RANK no." },
    { level: 2, prompt: "Explica por qué LAG y LEAD evitan tener que escribir un self join para comparar una fila con la anterior o siguiente en una secuencia ordenada.", solution: "Un self join requeriría unir la tabla consigo misma con una condición que relacione cada fila con 'la fila justo antes/después según algún criterio', lo cual es difícil de expresar con un JOIN normal porque no hay una clave directa que conecte filas consecutivas. LAG/LEAD resuelven esto directamente dentro de la cláusula OVER, usando el ORDER BY para definir qué es 'anterior' o 'siguiente', sin necesidad de ninguna condición de unión explícita." }
  ]
},

// =====================================================================
// NIVEL 19
// =====================================================================
{
  id: 19, code: "M19", category: "Avanzado",
  title: "PIVOT/UNPIVOT y datos semiestructurados (JSON)",
  intro: "Girar filas en columnas (y viceversa) sin escribir CASE manuales, y consultar datos JSON almacenados en Oracle como si fueran columnas relacionales.",
  theory: {
    concepts: [
      { heading: "1. PIVOT: de filas a columnas",
        explanation: "PIVOT convierte valores distintos de una columna en columnas nuevas del resultado, agregando una métrica para cada combinación. Es el equivalente declarativo a escribir manualmente varias funciones de grupo con CASE WHEN dentro (por ejemplo, SUM(CASE WHEN job_id='SA_REP' THEN salary END)), pero más legible y compacto.",
        syntax: "SELECT ...\nFROM (subconsulta_o_tabla)\nPIVOT (\n  función_agregada(columna_valor)\n  FOR columna_a_girar IN (valor1 AS alias1, valor2 AS alias2, ...)\n)",
        examples: [
          { code: "SELECT *\nFROM   (SELECT department_id, job_id, salary FROM employees)\nPIVOT (\n  SUM(salary)\n  FOR job_id IN ('SA_REP' AS ventas, 'ST_CLERK' AS almacen, 'IT_PROG' AS it)\n);",
            output: "DEPARTMENT_ID  VENTAS  ALMACEN     IT\n-------------  ------  -------  -----\n           80   50000    (NULL)  (NULL)\n           60  (NULL)    (NULL)  28800" }
        ] },
      { heading: "2. UNPIVOT: de columnas a filas",
        explanation: "UNPIVOT hace lo inverso: convierte varias columnas en filas, generando una columna que identifica de qué columna original venía cada valor, y otra con el valor en sí. Es útil para 'normalizar' una tabla que llegó ya pivotada desde una hoja de cálculo o un sistema externo.",
        syntax: "SELECT ...\nFROM tabla\nUNPIVOT (\n  columna_valor\n  FOR columna_identificadora IN (columna1 AS 'etiqueta1', columna2 AS 'etiqueta2', ...)\n)",
        examples: [
          { code: "SELECT *\nFROM   ventas_trimestrales\nUNPIVOT (\n  importe\n  FOR trimestre IN (q1 AS 'Q1', q2 AS 'Q2', q3 AS 'Q3', q4 AS 'Q4')\n);" }
        ] },
      { heading: "3. IS JSON: validar que una columna contiene JSON válido",
        explanation: "Oracle almacena JSON típicamente en una columna VARCHAR2, CLOB o BLOB como texto, y ofrece funciones específicas para tratarlo como datos estructurados. La condición IS JSON comprueba si el contenido de una columna es JSON sintácticamente válido, y se usa habitualmente como CHECK constraint para garantizar que solo se almacene JSON bien formado.",
        syntax: "columna IS [NOT] JSON",
        examples: [
          { code: "CREATE TABLE pedidos_json (\n  id       NUMBER,\n  detalle  CLOB CHECK (detalle IS JSON)\n);" }
        ] },
      { heading: "4. JSON_VALUE: extraer un escalar de un documento JSON",
        explanation: "JSON_VALUE(columna, ruta) extrae un único valor escalar (texto o número) de un documento JSON, usando una ruta en notación JSON Path (empieza por $, el documento raíz). Si la ruta no existe o el valor no es escalar, devuelve NULL por defecto (comportamiento configurable con ON ERROR/ON EMPTY).",
        syntax: "JSON_VALUE(columna, 'ruta_json_path' [RETURNING tipo] [ON ERROR valor])",
        examples: [
          { code: "SELECT JSON_VALUE(detalle, '$.cliente.nombre') AS nombre_cliente\nFROM   pedidos_json;" }
        ] },
      { heading: "5. JSON_TABLE: convertir JSON en filas y columnas relacionales",
        explanation: "JSON_TABLE proyecta un documento JSON (típicamente un array de objetos) como si fuera una tabla relacional normal, con una fila por elemento del array y una columna por cada campo extraído, permitiendo usarlo en el FROM como cualquier otra fuente de datos, incluso dentro de un JOIN.",
        syntax: "SELECT ...\nFROM   tabla,\n       JSON_TABLE(columna_json, 'ruta_al_array'\n         COLUMNS (col1 tipo PATH '$.campo1', col2 tipo PATH '$.campo2')\n       ) alias_json",
        examples: [
          { code: "SELECT jt.producto, jt.cantidad\nFROM   pedidos_json p,\n       JSON_TABLE(p.detalle, '$.lineas[*]'\n         COLUMNS (producto VARCHAR2(50) PATH '$.producto',\n                   cantidad NUMBER      PATH '$.cantidad')\n       ) jt;" }
        ] }
    ],
    oracleNotes: [
      "PIVOT necesita conocer de antemano los valores concretos que se convertirán en columnas (se escriben explícitamente en el FOR ... IN); no genera columnas dinámicamente según los datos que haya en cada momento.",
      "Los valores IN de PIVOT deben coincidir exactamente (incluidas mayúsculas/minúsculas si son texto) con los valores reales de la columna, o esa 'columna nueva' aparecerá siempre con NULL.",
      "IS JSON no garantiza que el JSON tenga la ESTRUCTURA esperada, solo que es sintácticamente válido: un JSON válido pero con campos distintos a los esperados pasaría igualmente esa comprobación.",
      "JSON_VALUE solo extrae valores ESCALARES (un texto o número); si la ruta apunta a un objeto o array completo, hay que usar JSON_QUERY en su lugar, no JSON_VALUE.",
      "El soporte de JSON nativo (tipo JSON como tipo de dato de primera clase, no solo texto validado) varía según la versión concreta de Oracle; las funciones JSON_VALUE/JSON_TABLE funcionan igual sobre una columna de texto validada con IS JSON."
    ]
  },
  summary: [
    "PIVOT convierte valores de una columna en columnas nuevas, agregando una métrica para cada uno.",
    "UNPIVOT hace lo inverso: convierte columnas en filas, con una columna identificadora y otra de valor.",
    "IS JSON valida que el contenido de una columna de texto sea JSON sintácticamente correcto.",
    "JSON_VALUE extrae un valor escalar de un documento JSON mediante una ruta JSON Path.",
    "JSON_TABLE proyecta un array JSON como filas y columnas relacionales, usable en FROM."
  ],
  comparisonTable: {
    title: "PIVOT/UNPIVOT y funciones JSON de un vistazo",
    headers: ["Operación", "Dirección", "Resultado"],
    rows: [
      ["PIVOT", "Filas → columnas", "Una columna nueva por cada valor listado en FOR...IN"],
      ["UNPIVOT", "Columnas → filas", "Una fila por cada columna original, con etiqueta y valor"],
      ["JSON_VALUE", "JSON → escalar", "Un texto o número extraído de una ruta JSON Path"],
      ["JSON_TABLE", "JSON → tabla relacional", "Varias filas/columnas, usable en FROM/JOIN"]
    ]
  },
  mindMap: [
    { topic: "Módulo 19 — PIVOT/UNPIVOT y JSON", children: [
      "PIVOT → filas a columnas, FOR columna IN (valores)",
      "UNPIVOT → columnas a filas, columna identificadora + columna valor",
      "JSON básico → almacenado como texto (VARCHAR2/CLOB), validado con IS JSON",
      "JSON_VALUE → extrae un escalar por JSON Path",
      "JSON_TABLE → proyecta un array JSON como tabla, usable en FROM/JOIN"
    ] }
  ],
  sourceRefs: [
    "Oracle SQL Language Reference 19c — \"PIVOT Clause\", \"UNPIVOT Clause\"",
    "Oracle SQL Language Reference 19c — \"JSON Conditions and Functions\" (IS JSON, JSON_VALUE, JSON_TABLE)"
  ],
  realCases: {
    business: "Un informe financiero convierte una tabla de gastos con una fila por mes en un cuadro cruzado con un mes por columna (formato típico de hoja de cálculo) usando PIVOT, para presentarlo directamente en un comité.",
    dataEngineering: "Un ingeniero de datos recibe una tabla de métricas ya pivotada (una columna por trimestre) desde un sistema externo y la normaliza con UNPIVOT antes de cargarla en un modelo de hechos con una fila por periodo.",
    etl: "Un proceso ETL que integra eventos de una API externa en formato JSON los almacena tal cual en una columna CLOB validada con IS JSON, y usa JSON_TABLE para explotar cada evento en filas normalizadas durante la fase de transformación.",
    reporting: "Un dashboard que consume una configuración de usuario almacenada como JSON en una tabla de preferencias usa JSON_VALUE para extraer directamente el tema visual o el idioma preferido sin tener que parsear el documento completo en la capa de aplicación."
  },
  mistakes: [
    { mistake: "Esperar que PIVOT genere columnas dinámicamente según los datos existentes.", why: "PIVOT exige listar explícitamente los valores en FOR...IN; si aparece un valor nuevo en los datos que no está en esa lista, simplemente no genera una columna para él, sin ningún aviso." },
    { mistake: "Escribir mal un valor de texto en el FOR...IN de un PIVOT (mayúsculas/minúsculas distintas a las reales).", why: "Si el valor no coincide exactamente con los datos reales de la columna, esa columna del resultado aparecerá siempre en NULL, sin lanzar ningún error que lo delate." },
    { mistake: "Usar JSON_VALUE para extraer un array u objeto completo.", why: "JSON_VALUE solo puede devolver un escalar (texto o número); si la ruta apunta a una estructura compleja, devuelve NULL o error según configuración, y hace falta JSON_QUERY para extraer esa estructura completa." },
    { mistake: "Pensar que IS JSON garantiza que el documento tiene los campos esperados.", why: "IS JSON solo valida la sintaxis general (llaves, comas, comillas bien formadas), no la presencia ni el tipo de ningún campo concreto dentro del documento." }
  ],
  exercises: [
    { title: "PIVOT simple", difficulty: "básico", prompt: "Convierte una tabla employees(department_id, job_id, salary) en un cuadro con una columna por cada uno de los job_id 'SA_REP' y 'IT_PROG', sumando el salario.", hint: "PIVOT (SUM(salary) FOR job_id IN (...))", solution: "SELECT *\nFROM (SELECT department_id, job_id, salary FROM employees)\nPIVOT (\n  SUM(salary)\n  FOR job_id IN ('SA_REP' AS ventas, 'IT_PROG' AS it)\n);" },
    { title: "Validar JSON con IS JSON", difficulty: "básico", prompt: "Escribe una condición que compruebe si la columna 'detalle' de una tabla contiene JSON válido.", hint: "columna IS JSON", solution: "SELECT * FROM pedidos_json WHERE detalle IS JSON;" },
    { title: "UNPIVOT de una tabla trimestral", difficulty: "intermedio", prompt: "Dada ventas_trimestrales(anio, q1, q2, q3, q4), conviértela en filas (anio, trimestre, importe).", hint: "UNPIVOT (importe FOR trimestre IN (...))", solution: "SELECT *\nFROM ventas_trimestrales\nUNPIVOT (\n  importe\n  FOR trimestre IN (q1 AS 'Q1', q2 AS 'Q2', q3 AS 'Q3', q4 AS 'Q4')\n);" },
    { title: "Extraer un campo con JSON_VALUE", difficulty: "intermedio", prompt: "Extrae el nombre del cliente almacenado en la ruta $.cliente.nombre de la columna JSON 'detalle'.", hint: "JSON_VALUE(columna, ruta)", solution: "SELECT JSON_VALUE(detalle, '$.cliente.nombre') AS nombre_cliente FROM pedidos_json;" },
    { title: "Proyectar un array JSON con JSON_TABLE", difficulty: "avanzado", prompt: "Dado un documento JSON con un array 'lineas' de objetos {producto, cantidad}, proyecta cada línea como una fila con columnas producto y cantidad.", hint: "JSON_TABLE(..., '$.lineas[*]' COLUMNS (...))", solution: "SELECT jt.producto, jt.cantidad\nFROM pedidos_json p,\n     JSON_TABLE(p.detalle, '$.lineas[*]'\n       COLUMNS (producto VARCHAR2(50) PATH '$.producto',\n                 cantidad NUMBER PATH '$.cantidad')\n     ) jt;" },
    { title: "Elegir entre PIVOT manual con CASE y PIVOT declarativo", difficulty: "avanzado", prompt: "Reescribe con CASE (sin usar PIVOT) la consulta del ejercicio de PIVOT simple, y compara la legibilidad de ambas versiones.", hint: "SUM(CASE WHEN job_id = '...' THEN salary END)", solution: "SELECT department_id,\n  SUM(CASE WHEN job_id = 'SA_REP' THEN salary END) AS ventas,\n  SUM(CASE WHEN job_id = 'IT_PROG' THEN salary END) AS it\nFROM employees\nGROUP BY department_id;\n-- Produce el mismo resultado que PIVOT, pero repite la lógica condicional por cada columna en vez de declarar la lista de valores una sola vez en FOR...IN, lo que se vuelve menos legible cuantos más valores se giren." }
  ],
  solved: [
    { title: "Convertir una tabla de hechos en un cuadro cruzado para un informe",
      problem: "Tienes ventas(vendedor, mes, importe) con una fila por vendedor y mes, y necesitas un cuadro con un vendedor por fila y un mes por columna.",
      steps: [
        "Identificas la columna que se convertirá en filas (vendedor, se mantiene tal cual) y la que se convertirá en columnas (mes).",
        "Eliges la función de agregación a aplicar en cada celda (SUM(importe), asumiendo un solo registro por vendedor y mes; si hubiera varios, SUM los sumaría todos).",
        "Listas explícitamente los meses que quieres como columnas en FOR mes IN (...).",
        "Ejecutas y verificas que cada combinación vendedor-mes aparece en la celda correcta."
      ],
      query: "SELECT *\nFROM   (SELECT vendedor, mes, importe FROM ventas)\nPIVOT (\n  SUM(importe)\n  FOR mes IN ('ENE' AS enero, 'FEB' AS febrero, 'MAR' AS marzo)\n);",
      result: "Un vendedor por fila, con una columna por cada mes listado y el importe correspondiente." },
    { title: "Extraer y filtrar por un campo anidado en JSON",
      problem: "Tienes pedidos_json(id, detalle) donde detalle es un documento JSON con un campo anidado cliente.pais, y necesitas los pedidos de clientes de 'España'.",
      steps: [
        "Identificas la ruta JSON Path exacta: $.cliente.pais.",
        "Usas JSON_VALUE para extraer ese campo como texto escalar.",
        "Filtras en el WHERE comparando el resultado de JSON_VALUE con el texto 'España'.",
        "Verificas que los documentos que no tienen ese campo devuelven NULL y quedan excluidos del filtro."
      ],
      query: "SELECT id\nFROM   pedidos_json\nWHERE  JSON_VALUE(detalle, '$.cliente.pais') = 'España';",
      result: "Devuelve solo los pedidos cuyo documento JSON tiene cliente.pais = 'España'." }
  ],
  flashcards: [
    { front: "¿Qué hace PIVOT?", back: "Convierte valores de una columna en columnas nuevas, agregando una métrica en cada una." },
    { front: "¿Qué hace UNPIVOT?", back: "Convierte columnas en filas, generando una columna identificadora y otra de valor." },
    { front: "¿Qué necesita conocer PIVOT de antemano?", back: "Los valores exactos que se convertirán en columnas, listados en FOR...IN." },
    { front: "¿Qué valida IS JSON?", back: "Que el contenido de una columna de texto sea JSON sintácticamente válido." },
    { front: "¿Qué extrae JSON_VALUE?", back: "Un único valor escalar (texto o número) de un documento JSON, según una ruta JSON Path." },
    { front: "¿Qué función se usa si la ruta JSON apunta a un objeto o array completo?", back: "JSON_QUERY, no JSON_VALUE." },
    { front: "¿Qué hace JSON_TABLE?", back: "Proyecta un array JSON como filas y columnas relacionales, usable en FROM." },
    { front: "¿Qué ocurre si un valor real no está en la lista FOR...IN de un PIVOT?", back: "No se genera columna para él; sus datos no aparecen en el resultado pivotado." }
  ],
  examples: [
    { title: "PIVOT", code: "SELECT *\nFROM (SELECT department_id, job_id, salary FROM employees)\nPIVOT (\n  SUM(salary)\n  FOR job_id IN ('SA_REP' AS ventas, 'IT_PROG' AS it)\n);" },
    { title: "JSON_VALUE", code: "SELECT JSON_VALUE(detalle, '$.cliente.nombre') AS nombre_cliente\nFROM pedidos_json;" },
    { title: "JSON_TABLE", code: "SELECT jt.producto, jt.cantidad\nFROM pedidos_json p,\n     JSON_TABLE(p.detalle, '$.lineas[*]'\n       COLUMNS (producto VARCHAR2(50) PATH '$.producto',\n                 cantidad NUMBER PATH '$.cantidad')\n     ) jt;" }
  ],
  quiz: [
    { q: "¿Qué hace la cláusula PIVOT?", options: [
        "Convierte columnas en filas", "Convierte valores de una columna en columnas nuevas, agregando una métrica",
        "Ordena el resultado de forma descendente", "Elimina filas duplicadas"
      ], a: 1,
      why: [
        "Eso describe UNPIVOT, no PIVOT.",
        "Correcta: PIVOT gira valores de una columna hacia nuevas columnas del resultado.",
        "No tiene relación directa con ordenación.",
        "No elimina duplicados; esa es función de DISTINCT."
      ] },
    { q: "¿Qué necesita especificar obligatoriamente un PIVOT para saber qué columnas generar?", options: [
        "Nada, las genera automáticamente según los datos", "La lista explícita de valores en la cláusula FOR...IN",
        "Un índice sobre la columna a girar", "Una vista materializada previa"
      ], a: 1,
      why: [
        "No las genera automáticamente: si un valor no está en la lista, no aparece como columna.",
        "Correcta: FOR...IN debe listar explícitamente los valores que se convertirán en columnas.",
        "No requiere ningún índice para funcionar.",
        "No requiere una vista materializada previa; funciona sobre cualquier fuente de filas."
      ] },
    { q: "¿Qué genera UNPIVOT a partir de varias columnas?", options: [
        "Una sola columna con la suma de todas", "Una fila por cada columna original, con una columna identificadora y otra de valor",
        "Una tabla vacía si hay NULL", "Un índice nuevo sobre esas columnas"
      ], a: 1,
      why: [
        "No suma nada: reestructura, no agrega.",
        "Correcta: es exactamente el patrón de columnas a filas que produce UNPIVOT.",
        "Los NULL no vacían la tabla resultante; simplemente aparecen como valores NULL en las filas generadas.",
        "No crea ningún índice como parte de su función."
      ] },
    { q: "¿Qué comprueba la condición IS JSON?", options: [
        "Que el documento tenga un campo concreto", "Que el contenido de la columna sea JSON sintácticamente válido",
        "Que el JSON tenga menos de 4000 caracteres", "Que el JSON esté ordenado alfabéticamente por clave"
      ], a: 1,
      why: [
        "No comprueba campos concretos; solo la validez sintáctica general.",
        "Correcta: valida que el texto tenga una estructura JSON bien formada.",
        "No impone ningún límite de longitud como parte de su comprobación.",
        "JSON no tiene un concepto de 'orden alfabético' obligatorio de claves; IS JSON no lo exige."
      ] },
    { q: "¿Qué tipo de valor puede devolver JSON_VALUE?", options: [
        "Un array completo", "Un objeto JSON completo", "Un único valor escalar (texto o número)", "Una tabla de varias filas"
      ], a: 2,
      why: [
        "Un array completo requeriría JSON_QUERY, no JSON_VALUE.",
        "Un objeto completo también requeriría JSON_QUERY.",
        "Correcta: JSON_VALUE está limitado a devolver un escalar.",
        "Una tabla de varias filas es lo que produce JSON_TABLE, no JSON_VALUE."
      ] },
    { q: "¿Para qué se usa JSON_TABLE?", options: [
        "Para validar que un documento es JSON válido", "Para proyectar un documento JSON (típicamente un array) como filas y columnas relacionales",
        "Para convertir una tabla relacional en JSON", "Para comprimir un documento JSON"
      ], a: 1,
      why: [
        "Esa es la función de IS JSON, no de JSON_TABLE.",
        "Correcta: JSON_TABLE convierte JSON en un formato tabular usable en FROM.",
        "El camino inverso (relacional a JSON) usaría otras funciones, como JSON_OBJECT o similares, no JSON_TABLE.",
        "JSON_TABLE no comprime nada; proyecta estructura, no maneja tamaño de almacenamiento."
      ] },
    { q: "¿Qué ocurre si el valor real de una columna no coincide exactamente (mayúsculas incluidas) con el especificado en el FOR...IN de un PIVOT?", options: [
        "Oracle lo normaliza automáticamente e ignora mayúsculas/minúsculas", "Esa columna del resultado aparece siempre en NULL para esas filas",
        "Da un error de sintaxis inmediato", "El PIVOT se cancela por completo sin devolver ningún resultado"
      ], a: 1,
      why: [
        "Oracle no normaliza mayúsculas automáticamente en esta comparación.",
        "Correcta: si no hay coincidencia exacta, esa columna queda en NULL para las filas afectadas, sin ningún aviso.",
        "No es un error de sintaxis: la sentencia se ejecuta con normalidad, solo con datos incorrectos.",
        "El PIVOT completo no se cancela; simplemente esa columna concreta no recibe los valores esperados."
      ] },
    { q: "¿Qué tipo de columna usa Oracle habitualmente para almacenar un documento JSON como texto?", options: ["NUMBER", "DATE", "VARCHAR2 o CLOB", "ROWID"], a: 2,
      why: [
        "NUMBER no puede almacenar texto JSON.",
        "DATE tampoco es un tipo adecuado para almacenar texto JSON.",
        "Correcta: VARCHAR2 (para documentos cortos) o CLOB (para documentos largos) son los tipos habituales.",
        "ROWID no tiene relación con el almacenamiento de contenido JSON."
      ] },
    { q: "¿Qué diferencia hay entre PIVOT y escribir manualmente varias funciones de grupo con CASE WHEN?", options: [
        "Ninguna diferencia de resultado; PIVOT es solo una sintaxis más declarativa para el mismo cálculo", "PIVOT es una operación de solo lectura, mientras que CASE WHEN permite modificar datos",
        "PIVOT no admite ninguna función de agregación", "CASE WHEN no puede combinarse nunca con GROUP BY"
      ], a: 0,
      why: [
        "Correcta: ambas técnicas logran el mismo resultado; PIVOT simplemente evita repetir la lógica condicional columna por columna.",
        "Ninguna de las dos técnicas modifica datos: ambas son parte de un SELECT de solo lectura.",
        "PIVOT sí admite funciones de agregación; de hecho las requiere (SUM, COUNT, AVG...).",
        "CASE WHEN se combina habitualmente con GROUP BY, precisamente en la técnica manual equivalente a PIVOT."
      ] },
    { q: "¿Qué necesita una ruta JSON Path para referirse al documento raíz?", options: ["#", "@", "$", "%"], a: 2,
      why: [
        "# no es el símbolo usado para el documento raíz en JSON Path.",
        "@ no es el símbolo del documento raíz (se usa en otros contextos de algunas implementaciones, no como raíz aquí).",
        "Correcta: $ representa el documento JSON raíz en la notación JSON Path usada por Oracle.",
        "% no tiene ningún significado especial en JSON Path."
      ] }
  ],
  challenges: [
    { level: 1, prompt: "Convierte una tabla ventas(region, trimestre, importe) en un cuadro con una columna por cada trimestre Q1-Q4, sumando el importe por región.", solution: "SELECT *\nFROM (SELECT region, trimestre, importe FROM ventas)\nPIVOT (\n  SUM(importe)\n  FOR trimestre IN ('Q1' AS q1, 'Q2' AS q2, 'Q3' AS q3, 'Q4' AS q4)\n);" },
    { level: 2, prompt: "Explica por qué JSON_VALUE devuelve NULL (y no un error) cuando la ruta indicada no existe en el documento, y qué ventaja práctica tiene ese comportamiento por defecto.", solution: "Por defecto, JSON_VALUE trata una ruta ausente como 'sin valor' en vez de como un fallo, devolviendo NULL (comportamiento ON ERROR NULL, el predeterminado); esto permite consultar documentos JSON con estructuras ligeramente distintas entre filas (campos opcionales) sin que toda la consulta falle por un documento que simplemente no tiene ese campo concreto, tratándolo igual que una columna NULL en una tabla relacional normal." }
  ]
},

// =====================================================================
// NIVEL 20 — SIMULACROS
// =====================================================================
{
  id: 20, code: "M20", category: null,
  title: "Simulacros tipo Oracle 1Z0-071",
  intro: "Exámenes cronometrados con preguntas mezcladas de todos los temas anteriores.",
  isExamLevel: true,
  theory: {
    concepts: [
      { heading: "Cómo funciona este nivel",
        explanation: "Aquí no hay teoría nueva: se genera un simulacro de 20 preguntas aleatorias del banco completo, con un temporizador (20 minutos), reproduciendo el formato y la duración de un bloque del examen oficial. Al terminar verás tu puntuación, el tiempo empleado, y todas tus fallas se añaden automáticamente al repaso de errores. Importante: todas las preguntas de este simulacro son de elaboración propia, inspiradas en la documentación oficial de Oracle; no son preguntas reales filtradas del examen." }
    ],
    oracleNotes: []
  },
  examples: [],
  mistakes: [
    "Leer la pregunta demasiado rápido: en el examen oficial muchas 'trampas' están en detalles como NULL, mayúsculas de funciones, o el orden de columnas.",
    "No gestionar el tiempo: es mejor marcar mentalmente una duda y seguir, que bloquearse en una pregunta."
  ],
  quiz: [],
  exercises: [],
  challenges: [],
  examConfig: { numQuestions: 20, minutes: 20 }
},

// =====================================================================
// NIVEL 21 — EXPERTO
// =====================================================================
{
  id: 21, code: "M21", category: null,
  title: "Nivel experto — retos mezclados de dificultad de examen",
  intro: "El desafío final: preguntas de mayor dificultad, mezclando trampas típicas del temario 1Z0-071.",
  isExamLevel: true,
  theory: {
    concepts: [
      { heading: "Qué esperar en este nivel",
        explanation: "Simulacro de 30 preguntas con dificultad alta, mezclando todos los bloques, incluidas las preguntas más 'trampa' del banco (precedencia de operadores, NULL en funciones de grupo, MINUS vs EXCEPT, ROLLBACK vs TRUNCATE, subconsultas de una fila vs varias filas). Pensado para hacerse cuando ya hayas completado todos los niveles anteriores. Como en todo el banco de preguntas de Oracle SQL Quest, son preguntas de elaboración propia inspiradas en la documentación oficial de Oracle, no preguntas reales del examen." }
    ],
    oracleNotes: []
  },
  examples: [],
  mistakes: [],
  quiz: [],
  exercises: [],
  challenges: [],
  examConfig: { numQuestions: 30, minutes: 35 }
}

], // end levels

// =====================================================================
// BANCO ADICIONAL PARA SIMULACROS (niveles 20 y 21 — experto)
// Se combina con todas las preguntas de quiz de los niveles 0-19.
// =====================================================================
examBank: [
  { category: "SELECT", q: "¿Qué devuelve 'SELECT 10/0 FROM DUAL;' en Oracle?", options: ["0", "NULL", "Error ORA-01476: divisor is equal to zero", "Infinito"], a: 2, exp: "Oracle lanza un error explícito de división por cero, no devuelve NULL ni infinito." },
  { category: "SELECT", q: "¿Cuál es el resultado de 'SELECT NULL = NULL FROM DUAL;'?", options: ["TRUE", "FALSE", "NULL (desconocido)", "Error de sintaxis"], a: 2, exp: "Cualquier comparación con NULL da como resultado NULL (desconocido), nunca TRUE ni FALSE." },
  { category: "SELECT", q: "¿Qué palabra clave usa Oracle para limitar filas de forma estándar SQL:2008 (12c en adelante)?", options: ["LIMIT", "TOP", "OFFSET ... FETCH NEXT ... ROWS ONLY", "ROWNUM_MAX"], a: 2, exp: "Oracle 12c introdujo OFFSET/FETCH; LIMIT no existe en Oracle." },
  { category: "SELECT", q: "¿Qué pseudocolumna se usaba tradicionalmente en Oracle para limitar filas antes de 12c?", options: ["ROWID", "ROWNUM", "ROW_NUMBER_OVER", "LIMIT"], a: 1, exp: "ROWNUM numera las filas según se devuelven, y se usaba en WHERE ROWNUM <= n." },
  { category: "Funciones", q: "¿Qué hace REGEXP_LIKE(columna, '^A')?", options: ["Busca filas donde la columna contiene la letra A en cualquier posición", "Busca filas donde la columna empieza por A", "Cuenta cuántas A hay", "Sustituye la A por otra letra"], a: 1, exp: "El símbolo ^ en una expresión regular indica inicio de cadena." },
  { category: "SELECT", q: "¿Qué cláusula permite consultas jerárquicas en Oracle (por ejemplo un organigrama)?", options: ["HIERARCHY BY", "CONNECT BY ... START WITH", "GROUP BY ROLLUP", "PARTITION BY"], a: 1, exp: "CONNECT BY junto con START WITH y la pseudocolumna LEVEL permite recorrer jerarquías." },
  { category: "SELECT", q: "En una consulta jerárquica con CONNECT BY, ¿qué pseudocolumna indica la profundidad del nodo?", options: ["DEPTH", "LEVEL", "PRIOR", "RANK"], a: 1, exp: "LEVEL devuelve 1 para la raíz, 2 para sus hijos, etc." },
  { category: "Funciones", q: "¿Qué formato de fecha por defecto usa Oracle habitualmente al mostrar una DATE?", options: ["YYYY-MM-DD", "DD-MON-RR", "MM/DD/YYYY", "Depende siempre del sistema operativo"], a: 1, exp: "El formato NLS_DATE_FORMAT por defecto suele ser DD-MON-RR, aunque es configurable." },
  { category: "DDL", q: "¿Cuál es la diferencia entre CHAR(10) y VARCHAR2(10) en Oracle?", options: [
      "Son idénticos", "CHAR siempre ocupa 10 caracteres rellenando con espacios; VARCHAR2 ocupa solo lo necesario",
      "VARCHAR2 rellena con ceros", "CHAR no admite texto"
    ], a: 1, exp: "CHAR es de longitud fija (rellena con espacios), VARCHAR2 es de longitud variable real." },
  { category: "Funciones", q: "¿Qué hace TRUNC(SYSDATE) sin segundo argumento?", options: ["Da error", "Elimina la parte de hora, dejando la fecha a las 00:00:00", "Redondea al mes más cercano", "Convierte la fecha a texto"], a: 1, exp: "TRUNC sobre una fecha sin formato indicado trunca a día completo." },
  { category: "Funciones", q: "¿Qué devuelve COALESCE(NULL, NULL, 5, 10)?", options: ["NULL", "5", "10", "Error, muchos argumentos NULL"], a: 1, exp: "COALESCE devuelve el primer valor no nulo de la lista, en este caso 5." },
  { category: "Funciones", q: "¿Qué diferencia hay entre RANK y ROW_NUMBER en un contexto de funciones analíticas (concepto avanzado)?", options: [
      "Son exactamente iguales", "RANK puede dejar huecos en el ranking cuando hay empates; ROW_NUMBER siempre asigna números consecutivos únicos",
      "ROW_NUMBER solo funciona con fechas", "RANK no existe en Oracle"
    ], a: 1, exp: "Con empates, RANK salta números (1,1,3) y ROW_NUMBER no (1,2,3)." },
  { category: "DDL", q: "¿Qué instrucción crea un usuario/rol y le concede permisos de solo lectura sobre una tabla?", options: ["GRANT SELECT ON tabla TO usuario;", "ALLOW SELECT ON tabla TO usuario;", "PERMIT SELECT tabla usuario;", "GIVE READ tabla TO usuario;"], a: 0, exp: "GRANT privilegio ON objeto TO usuario/rol; es la sintaxis DCL estándar." },
  { category: "DDL", q: "¿Qué instrucción retira un permiso previamente concedido?", options: ["DENY", "REVOKE", "CANCEL GRANT", "DROP PRIVILEGE"], a: 1, exp: "REVOKE privilegio ON objeto FROM usuario; retira el permiso." },
  { category: "DDL", q: "¿Qué vista del diccionario de datos muestra las columnas de tus propias tablas?", options: ["ALL_TABLES", "USER_TAB_COLUMNS", "DBA_USERS", "SYSTEM.COLUMNS"], a: 1, exp: "USER_TAB_COLUMNS lista columnas de los objetos propiedad del usuario actual." },
  { category: "SELECT", q: "¿Qué hace 'SELECT * FROM employees FETCH FIRST 5 ROWS ONLY;'?", options: ["Da error de sintaxis en Oracle", "Devuelve las primeras 5 filas del resultado", "Devuelve todas las filas excepto las 5 primeras", "Cuenta cuántas filas hay"], a: 1, exp: "FETCH FIRST n ROWS ONLY es la sintaxis moderna de Oracle (12c+) para limitar filas, similar a LIMIT en otros motores." },
  { category: "Funciones", q: "¿Qué operador de comparación de patrones usa REGEXP_LIKE frente a LIKE?", options: [
      "Son exactamente iguales", "REGEXP_LIKE admite expresiones regulares completas, LIKE solo admite % y _",
      "LIKE es más potente que REGEXP_LIKE", "REGEXP_LIKE no existe en Oracle"
    ], a: 1, exp: "REGEXP_LIKE permite patrones mucho más ricos (rangos, alternancias, cuantificadores)." },
  { category: "GROUP BY", q: "¿Qué hace GROUPING SETS respecto a ROLLUP y CUBE?", options: [
      "Es sinónimo exacto de ROLLUP", "Permite definir manualmente exactamente qué combinaciones de agrupación calcular, sin generar todas las de CUBE",
      "Solo puede usarse con una columna", "No existe en Oracle"
    ], a: 1, exp: "GROUPING SETS da control total sobre qué subtotales calcular, a diferencia del comportamiento automático de ROLLUP/CUBE." },
  { category: "Subconsultas", q: "¿Qué es más eficiente en general para comprobar existencia de filas relacionadas en tablas grandes: EXISTS o IN?", options: ["IN siempre", "EXISTS suele ser más eficiente porque para en la primera coincidencia", "Son siempre idénticos en rendimiento", "IN no se puede usar con subconsultas"], a: 1, exp: "EXISTS puede parar en cuanto encuentra una fila, mientras IN evalúa toda la lista de valores." },
  { category: "Restricciones", q: "¿Qué ocurre si defines una FOREIGN KEY sin especificar ON DELETE y tratas de borrar la fila padre con hijos existentes?", options: ["Se borra en cascada automáticamente", "Oracle lanza un error de violación de integridad (ORA-02292) y no permite el borrado", "Se pone a NULL la clave foránea", "No pasa nada, se ignora la relación"], a: 1, exp: "El comportamiento por defecto es restrictivo: protege la integridad impidiendo el borrado." },
  { category: "DDL", q: "¿Cuál es la sintaxis correcta para crear un índice compuesto sobre dos columnas?", options: ["CREATE INDEX idx ON tabla(col1); CREATE INDEX idx ON tabla(col2);", "CREATE INDEX idx ON tabla(col1, col2);", "CREATE COMPOUND INDEX idx ON tabla(col1 AND col2);", "CREATE INDEX idx ON tabla USING (col1, col2);"], a: 1, exp: "Basta con listar las columnas separadas por coma dentro del mismo CREATE INDEX." },
  { category: "Funciones", q: "¿Qué devuelve NVL2(commission_pct, 'CON COMISION', 'SIN COMISION') cuando commission_pct es NULL?", options: ["CON COMISION", "SIN COMISION", "NULL", "Error"], a: 1, exp: "NVL2 evalúa la segunda expresión cuando el primer argumento es NULL." },
  { category: "JOINS", q: "¿Qué tipo de JOIN produce el mismo resultado combinado que escribir dos tablas separadas por coma en el FROM sin condición WHERE?", options: ["INNER JOIN", "CROSS JOIN", "FULL JOIN", "NATURAL JOIN"], a: 1, exp: "FROM tabla1, tabla2 sin condición equivale a un CROSS JOIN (producto cartesiano)." },
  { category: "DDL", q: "¿Qué hace 'ALTER TABLE empleados MODIFY (salario NUMBER(4,2))' si ya existen salarios de 5 dígitos?", options: ["Trunca automáticamente los valores", "Da error porque los datos existentes no caben en la nueva precisión", "Redondea los valores al nuevo tamaño", "Convierte la columna a texto"], a: 1, exp: "Oracle valida que los datos existentes sean compatibles antes de aplicar el cambio de tipo." },
  { category: "DML", q: "¿Qué mecanismo usa Oracle para que otras sesiones no vean cambios no confirmados (antes del COMMIT)?", options: ["Bloqueo total de la base de datos", "Consistencia de lectura (read consistency) mediante segmentos de deshacer", "Copia completa de la tabla por cada sesión", "No es posible, todos ven los cambios al instante"], a: 1, exp: "Oracle mantiene una 'foto' consistente para cada consulta usando información de undo." },
  { category: "SELECT", q: "¿Qué produce 'SELECT department_id FROM employees INTERSECT SELECT department_id FROM job_history;'?", options: ["Todos los departamentos de ambas tablas sin duplicar", "Solo los department_id que aparecen en ambas tablas a la vez", "Los department_id de employees que no están en job_history", "Error de sintaxis"], a: 1, exp: "INTERSECT devuelve la intersección: filas presentes en ambos resultados." },
  { category: "DML", q: "¿Qué palabra clave se usa junto a INSERT para introducir varias filas en varias tablas según condiciones en una sola sentencia?", options: ["INSERT MANY", "INSERT ALL", "MULTI INSERT", "INSERT BATCH"], a: 1, exp: "INSERT ALL (o INSERT FIRST) permite repartir una única consulta origen entre varias tablas destino." },
  { category: "SELECT", q: "En 'WHERE salary BETWEEN 3000 AND 6000', ¿se incluyen los valores 3000 y 6000 exactos?", options: ["No, BETWEEN excluye siempre los extremos", "Sí, BETWEEN incluye ambos extremos", "Solo se incluye el valor menor", "Depende del tipo de dato"], a: 1, exp: "BETWEEN es inclusivo en ambos extremos del rango." },
  { category: "DDL", q: "¿Qué diferencia hay entre una vista normal y una vista materializada (concepto avanzado)?", options: [
      "Son idénticas", "La vista materializada almacena físicamente los datos calculados, mejorando el rendimiento a costa de estar potencialmente desactualizada",
      "La vista normal ocupa más espacio en disco", "Las vistas materializadas no pueden usarse en Oracle"
    ], a: 1, exp: "Una vista materializada guarda el resultado, mientras la vista normal recalcula cada vez que se consulta." },
  { category: "Funciones", q: "¿Cuál es el resultado de SUBSTR('ORACLE', -3, 2) en Oracle?", options: ["'OR'", "'CL'", "'AC'", "Error, no se permiten índices negativos"], a: 1, exp: "Un índice negativo en SUBSTR cuenta desde el final: -3 sitúa el inicio en la 'C', y toma 2 caracteres: 'CL'." },
  { category: "GROUP BY", q: "¿Cuál de las siguientes NO es una función de grupo válida en Oracle?", options: ["SUM", "MEDIAN", "UPPER", "STDDEV"], a: 2, exp: "UPPER es una función de una sola fila; el resto son funciones de grupo/estadísticas." },
  { category: "DDL", q: "¿Qué hace ALTER TABLE tabla RENAME COLUMN antigua TO nueva;?", options: ["Cambia el tipo de dato de la columna", "Cambia el nombre de una columna existente", "Elimina la columna", "Crea una columna nueva copiando otra"], a: 1, exp: "RENAME COLUMN cambia únicamente el nombre, conservando datos y tipo." },
  { category: "Funciones", q: "¿Qué resultado da 'SELECT MOD(10,3) FROM DUAL;'?", options: ["3", "1", "3.33", "0"], a: 1, exp: "MOD devuelve el resto de la división entera: 10 = 3*3 + 1." },
  { category: "GROUP BY", q: "¿En qué orden se procesan lógicamente WHERE y HAVING respecto a GROUP BY?", options: ["Ambos antes de GROUP BY", "WHERE antes de GROUP BY, HAVING después", "HAVING antes de GROUP BY, WHERE después", "Ambos después de GROUP BY"], a: 1, exp: "WHERE filtra filas antes de agrupar; HAVING filtra los grupos ya formados." },
  { category: "DDL", q: "¿Qué hace 'CREATE TABLE copia AS SELECT * FROM empleados WHERE 1=0;'?", options: [
      "Copia todos los datos de empleados", "Crea una tabla nueva con la misma estructura que empleados pero sin filas (WHERE 1=0 nunca es verdadero)",
      "Da error porque 1=0 es inválido", "Elimina la tabla empleados"
    ], a: 1, exp: "Es un truco muy usado en Oracle para clonar la estructura de una tabla sin copiar datos." },
  { category: "SELECT", q: "¿Qué representa la pseudocolumna ROWID?", options: [
      "Un número secuencial que se puede reiniciar", "La dirección física única de una fila dentro de la base de datos", "El número de columnas de una fila", "Un alias de ROWNUM"
    ], a: 1, exp: "ROWID identifica la ubicación física de la fila, es distinto de ROWNUM (que es el orden en el resultado)." },
  { category: "Subconsultas", q: "¿Qué hace 'SELECT last_name FROM employees WHERE department_id = ANY (SELECT department_id FROM departments WHERE location_id = 1700);'?", options: [
      "Da error de sintaxis", "Devuelve empleados cuyo departamento coincide con al menos uno de los departamentos ubicados en location_id 1700",
      "Devuelve empleados que no tienen departamento", "Es equivalente a usar ALL"
    ], a: 1, exp: "= ANY con una lista se comporta de forma equivalente a IN." },
  { category: "SELECT", q: "¿Cuál es la forma correcta de escribir un comentario de varias líneas en SQL Oracle?", options: ["// comentario //", "# comentario #", "/* comentario */", "<!-- comentario -->"], a: 2, exp: "Oracle usa /* ... */ para comentarios multilínea, igual que el estándar SQL." },
  { category: "SELECT", q: "¿Qué hace 'SELECT last_name, department_id FROM employees ORDER BY 2, 1;'?", options: [
      "Da error, no se pueden usar números en ORDER BY", "Ordena por la segunda columna del SELECT y luego por la primera (por posición)",
      "Ordena por las columnas 2 y 1 de toda la tabla, no del SELECT", "Es idéntico a no usar ORDER BY"
    ], a: 1, exp: "ORDER BY admite referenciar columnas por su posición en la lista del SELECT." }
]

};

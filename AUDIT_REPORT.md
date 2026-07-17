# AUDIT_REPORT — Oracle SQL Quest → Plataforma de certificación Oracle

**Fase:** 1 — Auditoría (solo análisis, sin cambios de código)
**Fecha:** 2026-07-17
**Alcance:** aplicación actual (`index.html`, `script.js`, `data.js`, `styles.css`, `README.md`) + carpeta `Exámenes/` (4 documentos Word de examen real).

Este documento no modifica ningún archivo de la aplicación. Su único objetivo es dejar constancia de lo que existe hoy, de los riesgos reales encontrados (incluidos los de los propios documentos Word), y de una propuesta de arquitectura para las fases siguientes.

---

## 1. Arquitectura actual

| Aspecto | Estado actual |
|---|---|
| **Framework** | Ninguno. HTML + CSS + JavaScript "vanilla", sin build step, sin bundler, sin transpilación. |
| **Dependencias** | Cero. No hay `package.json`, `node_modules`, ni librerías de terceros (ni siquiera cargadas por CDN). Los gráficos (radar, anillos, heatmap) son SVG hechos a mano; el confeti es Canvas 2D manual; el PDF del certificado usa `window.print()`. |
| **Backend** | No existe. Es un sitio 100% estático desplegado en Vercel (`https://juego-oracle.vercel.app/`) como hosting de ficheros, sin funciones serverless, sin API, sin base de datos remota. |
| **Base de datos** | No hay BD. Todo el contenido educativo vive hardcodeado en `data.js` (18 niveles + 39 preguntas de examen, ~1112 líneas). El progreso del usuario vive en `localStorage` del navegador bajo la clave `oracleSqlQuestState_v1`. |
| **Gestión de usuarios / Auth** | No existe. No hay login, no hay cuentas, no hay sesiones. Cada navegador tiene su propio `localStorage` aislado; no hay forma de identificar a un usuario entre dispositivos. |
| **Ranking** | No implementado (solo mencionado como pendiente en el README). No puede implementarse con datos reales de otros usuarios sin backend, porque no hay ningún sitio donde centralizar los datos de más de una persona. |
| **Estadísticas** | Sí existen, pero son 100% locales y de un solo usuario: XP, insignias, racha, tiempo de estudio, radar de conocimientos por categoría, heatmap, evolución diaria, informe de fortalezas/debilidades tras cada simulacro. Todo calculado en el cliente a partir de `STATE` en memoria/`localStorage`. |
| **Gestión de preguntas** | `APP_DATA.examBank` en `data.js`: array plano de 39 preguntas, todas de opción única, en **español**, redactadas por el propio proyecto (no son del examen real). Estructura: `{ category, q, options[], a: <índice correcto>, exp }`. No admite: varias respuestas correctas, texto en inglés "oficial", imágenes/tablas, dificultad, trazabilidad, estado de revisión. |
| **Componentes reutilizables** | No hay componentes en sentido de framework (no hay React/Vue). Sí hay funciones "render" bien separadas por vista (`renderDashboard`, `renderLevel`, `renderAnalytics`, `renderCertificate`, etc.) que generan HTML por template strings e inyectan con `innerHTML`. |
| **Estructura del proyecto** | 5 archivos en la raíz (`index.html`, `styles.css`, `script.js`, `data.js`, `README.md`) + `logo.png`/`fondo.png` + 2 PDFs de apuntes originales + la nueva carpeta `Exámenes/` con 4 `.docx`. |

### Tamaño real del código actual

- `script.js`: 1591 líneas (lógica de toda la app: gamificación, quiz, simulacro, analytics, certificado, modo demo).
- `data.js`: 1112 líneas (18 niveles + banco de 39 preguntas).
- `styles.css`: 1107 líneas.
- `index.html`: 160 líneas.

---

## 2. Qué funciona bien (no tocar sin necesidad)

- **Separación contenido/lógica**: `data.js` (contenido) y `script.js` (comportamiento) ya están separados. Esto facilita añadir un banco de preguntas nuevo sin reescribir la lógica de renderizado del quiz.
- **`saveState()` con guarda de modo demo** (`if (DEMO_ACTIVE) return;`): patrón correcto y ya probado para que los datos ficticios de demo nunca contaminen el progreso real. Cualquier nueva función de guardado debe respetar este mismo patrón.
- **`escapeHtml()` se usa de forma consistente** (42 usos) antes de insertar texto dinámico (incluido el nombre del usuario para el certificado) en `innerHTML`. Es la defensa correcta contra XSS reflejado vía nombre de usuario u otro texto libre, y ya está aplicada donde hace falta.
- **Sistema de gamificación (XP, rangos, insignias, racha, confeti)** funcionalmente completo y ya validado en varias iteraciones anteriores. Reutilizable tal cual para el nuevo banco de preguntas.
- **Analytics por categoría (radar + heatmap + evolución)** ya usa una taxonomía de 8 categorías y agrega datos reales de respuestas — es la base natural para el "rendimiento por tema" y "rendimiento por dificultad" que pide la nueva especificación.
- **Sistema de repaso de errores** (`errorLog`, pantalla de repaso dirigido) ya implementa parte de lo que pide "repetición espaciada" (aunque sin estados New/Learning/Review/Mastered formales).
- **Sin dependencias externas**: cero riesgo de cadena de suministro, cero mantenimiento de versiones de librerías. Es una ventaja real que conviene preservar el mayor tiempo posible.

## 3. Qué debe mejorarse / riesgos técnicos existentes

1. **Las respuestas correctas están en texto plano en el cliente.** `data.js` se descarga entero al navegador y `a: <índice>` (o el futuro `correctAnswers`) es legible con "Ver código fuente". La especificación nueva exige explícitamente que la validación de respuestas sea segura y no inspeccionable desde el navegador — **esto es estructuralmente incompatible con un sitio 100% estático sin backend.** Es la decisión arquitectónica más importante de todo el proyecto (ver sección 5).
2. **No hay backend ⇒ no hay ranking real, no hay multiusuario, no hay panel de administración persistente entre dispositivos.** Todo lo que la nueva especificación pide sobre "ranking con datos reales", "panel de administración" persistente y "progreso independiente entre usuarios" en el sentido de *cuentas reales* requiere introducir un backend con base de datos. Hoy "independencia entre usuarios" solo existe por accidente (cada navegador tiene su `localStorage`), no por diseño multiusuario.
3. **Sin pruebas automatizadas.** No hay ningún framework de test instalado ni carpeta `tests/`. Cualquier importador de exámenes que se construya debe llevar sus propias pruebas desde el primer commit, tal como exige la especificación.
4. **Sin panel de administración.** Toda edición de contenido hoy es manual, editando `data.js` a mano. No hay UI para aprobar/rechazar preguntas importadas.
5. **`examBank` no soporta lo mínimo que exige el nuevo banco de preguntas**: sin multi-respuesta, sin inglés "oficial" preservado, sin imágenes, sin dificultad, sin trazabilidad, sin duplicados detectados. Es decir, el modelo de datos actual del examen debe ampliarse (no sustituirse) — ver sección 5.
6. **Accesibilidad mínima**: solo 1 atributo `aria-*`/`role` y 2 `alt` en todo `index.html`. Los botones e interacciones dependen de `onclick` inline generado en templates (26 apariciones) en lugar de foco visible / navegación por teclado verificada. No es un bloqueante pero es una brecha real frente al requisito "accesible" de la especificación.
7. **Sin variables de entorno ni configuración de despliegue** (no hay `.env`, no hay `vercel.json`): cualquier futura clave de API (para IA generando explicaciones, por ejemplo) no tiene hoy dónde vivir de forma segura.
8. **OneDrive como carpeta de trabajo**: en la sesión anterior de este mismo proyecto se observó corrupción intermitente de archivos (elementos HTML perdidos, emoji recortados a mitad de edición) consistente con el sincronizado de OneDrive interfiriendo con escrituras en curso. Riesgo operativo a tener en cuenta al automatizar la importación de exámenes (escribir un fichero de salida grande mientras OneDrive sincroniza puede corromperlo).

No se han detectado bugs funcionales activos en la app actual más allá de los ya corregidos en la sesión anterior (el `init()` que podía romperse si faltaba un elemento del DOM, ya solucionado con el helper `on()`).

## 4. Auditoría forense de la carpeta `Exámenes/` (4 documentos Word)

Se han inspeccionado los 4 `.docx` a nivel de XML interno (`word/document.xml`) para verificar, con datos reales y no supuestos, cómo están marcadas las respuestas correctas y qué contenido es texto vs. imagen. **No se ha extraído, movido ni modificado ninguna pregunta** — solo se ha leído la estructura interna en una copia temporal fuera del proyecto.

| Archivo | Preguntas (aprox., por marcador "N. Question") | Runs en negrita (`<w:b/>`) | Resaltados en amarillo | Imágenes incrustadas |
|---|---|---|---|---|
| Examen 1.docx | 41 | 185 | 366 | 78 |
| Examen 2.docx | 36 | 243 | 276 | 30 |
| Examen 3.docx | 43 | 235 | 380 | 46 |
| Examen 4.docx | 10 | 0 | 50 | 13 |

**Total aproximado: ~130 preguntas, 167 imágenes incrustadas.**

### Hallazgo crítico 1 — El resaltado amarillo es la señal fiable; la negrita NO lo es por sí sola

Se verificó el XML real, no una suposición:

- En **Examen 1**, la negrita se usa sobre el **enunciado de la pregunta** ("*View and examine the structure of the ORDER_ITEMS tab...*", "*Identify...*"), no sobre las respuestas. Si el importador tratase "negrita = respuesta correcta" en este documento, marcaría como correctas frases que en realidad son parte del enunciado.
- En **Examen 2**, se encontró una opción con **negrita + resaltado amarillo simultáneos** en la respuesta correcta, pero también otra opción distinta con **negrita sola, sin resaltado**, que es un simple distractor. Es decir, dentro del mismo documento la negrita aparece tanto en respuestas correctas como en texto que no lo es.
- **Examen 4** no usa negrita en absoluto; solo resaltado amarillo.

**Conclusión verificada (no supuesta):** el resaltado amarillo (`w:highlight w:val="yellow"`) es la señal primaria y más consistente de "respuesta correcta" en los 4 documentos. La negrita debe tratarse como señal secundaria/reforzante, nunca como señal única, exactamente como advertía la especificación — y aquí queda confirmado con evidencia real, no en abstracto.

### Hallazgo crítico 2 — Fragmentación de texto en runs de Word

El texto de una misma palabra aparece a menudo partido en varios `<w:t>` distintos por el corrector ortográfico de Word (ejemplo real extraído de Examen 4: `MONTHS_` + `BETWEE` + `N` + `(` + `start_` + `date,end` + `_date` reconstruyen `MONTHS_BETWEEN(start_date,end_date)`). El importador **debe concatenar runs contiguos del mismo párrafo respetando el marcado de resaltado/negrita de cada uno**, no asumir que cada `<w:t>` es una unidad de texto completa. Este es un detalle técnico concreto, no genérico, que el importador de la Fase 2 tiene que resolver.

### Hallazgo crítico 3 — Gran parte del contenido "de examen" es una imagen, no texto

Se abrió una imagen real incrustada en Examen 1 (`image1.png`) y corresponde a una **captura de una tabla de datos** (columnas `ORDER_ID`, `LINE_ITEM_ID`, `PRODUCT_ID`, `UNIT_PRICE`, `QUANTITY` con filas de valores) — es decir, contenido **imprescindible para responder la pregunta**, no una imagen decorativa. Con ~78 imágenes para 41 preguntas en Examen 1, es razonable estimar que **la mayoría de las preguntas de ese documento dependen de una tabla o "Exhibit" que solo existe como imagen**.

Esto tiene consecuencias directas para la Fase 2:
- El importador debe, como mínimo, **extraer y conservar cada imagen** (`word/media/imageN.png`) y **enlazarla a la pregunta correspondiente** por su posición en el documento.
- La especificación pide explícitamente no usar OCR salvo necesidad. Dado que estas imágenes son tablas de datos numéricas y sentencias SQL, un OCR mal ejecutado (confundir un `1` con una `l`, una coma con un punto en un decimal) sería **peor que no tener el dato**: introduciría errores silenciosos en preguntas de examen real. Recomendación: **no hacer OCR automático de estas imágenes en la primera versión**; marcarlas como "pregunta con exhibit visual — requiere revisión manual" y mostrar la imagen tal cual al usuario final (el alumno sí puede leer una tabla en una imagen; el problema es solo para la clasificación automática, no para el estudio).

### Hallazgo 4 — Las opciones no llevan letra "A/B/C/D" en el texto

Las opciones están implementadas como listas de Word con numeración de tipo `bullet` (verificado en `numbering.xml`), no como texto literal "A. ...", "B. ...". El importador tendrá que **asignar él mismo los identificadores A/B/C/D según el orden de aparición**, y esos identificadores nunca deben usarse para inferir significado (evitar el riesgo, ya señalado en la especificación, de romper opciones tipo "Both A and B").

### Riesgo de duplicados entre exámenes

No se ha hecho todavía una comparación de similitud de texto entre los 4 documentos (eso corresponde a la Fase 3, con las preguntas ya extraídas literalmente). Dado que son 4 archivos de examen distintos del mismo curso, es razonable esperar solapamiento parcial de preguntas entre ellos; el diseño de la Fase 2/3 debe incluir detección de duplicados **exactos y casi-exactos** desde el primer commit, tal como pide la especificación.

---

## 5. Decisiones arquitectónicas que hay que tomar antes de la Fase 2

Estas no son bugs del proyecto actual — son elecciones que la nueva especificación exige y que **la app actual no puede cumplir en su forma presente (sitio estático sin backend)**. Se documentan aquí para decidir antes de escribir ningún código:

1. **Backend mínimo, sí o no.** Para cumplir de forma literal "no expongas las respuestas correctas en el código del cliente" y "ranking con datos reales de varios usuarios" se necesita algún tipo de servidor (aunque sea funciones serverless de Vercel + una base de datos gestionada tipo Postgres/SQLite remoto). Sin esto, se puede aproximar la seguridad (no es lo mismo) pero no puede garantizarse. Alternativa intermedia sin backend completo: mantener todo del lado cliente pero aceptar que un usuario que abra las herramientas de desarrollador *podrá* ver las soluciones — igual que hoy — y dejarlo dicho explícitamente como limitación conocida y aceptada, en lugar de prometer algo que la arquitectura no puede dar.
2. **Formato de almacenamiento del banco de preguntas importado.** Puede seguir siendo un fichero generado (`examBank.json` o similar) versionado en el repo — coherente con "no dependencias" — o pasar a una base de datos real si se decide añadir backend. Recomendación: empezar por fichero JSON generado por el importador (Fase 2-4), y solo mover a base de datos si se decide construir el backend del punto 1.
3. **Alcance de "usuarios" en el corto plazo.** Sin backend, "usuario" seguirá siendo "este navegador". Eso es aceptable para práctica individual y simulacro, pero no permite ranking real entre compañeros. Se puede dejar el ranking oculto/deshabilitado (mejor que mostrar datos ficticios, que la especificación prohíbe expresamente) hasta que exista backend.

## 6. Propuesta de arquitectura para las fases siguientes (sin implementar todavía)

- **Fase 2 (Importador)**: script Node.js independiente (o script ejecutable desde consola) que:
  - Lee cada `.docx` de `Exámenes/` como ZIP y parsea `word/document.xml` con un parser XML real (no regex) para evitar los problemas de runs fragmentados descritos arriba.
  - Extrae `word/media/*` y los copia a una carpeta de assets del proyecto, indexados por pregunta.
  - Produce un JSON por documento con la estructura de trazabilidad ya propuesta en la especificación (`sourceFile`, `sourcePosition`, `questionText`, `options[]`, `correctAnswers[]`, `solutionDetectionMethod[]`, `extractionConfidence`, `contentHash`, etc.).
  - Se ejecuta manualmente (o vía un botón en el futuro panel de administración) cada vez que se añadan documentos nuevos a `Exámenes/` — no en cada carga de la app.
- **Fase 3 (Validación)**: comparación de hashes de contenido para duplicados exactos + comparación de similitud de texto (distancia de edición o shingles) para casi-duplicados; verificación de que `correctAnswers.length` coincide con "Choose N" detectado en el enunciado.
- **Fase 4 (Modelo de datos)**: ampliar — no sustituir — `APP_DATA`. Se propone un nuevo campo `APP_DATA.certificationBank` (preguntas reales importadas, en inglés, con todo el modelo de trazabilidad) que convive junto al `examBank` actual (preguntas propias en español, ya probadas). El simulacro actual (`buildQuestionPool`) puede extenderse para elegir de qué banco tomar preguntas sin romper lo que ya funciona.
- **Fase 5 (Panel de administración)**: nueva vista dentro de la misma app (`view-admin`), protegida al menos por una contraseña simple en ausencia de backend real, que lee el JSON generado por el importador y permite aprobar/corregir antes de que una pregunta pueda aparecer en un simulacro oficial.
- **Fases 6-9**: como describe la especificación, integrando sobre lo ya construido (gamificación, analytics, repaso de errores) en lugar de reescribirlo.

## 7. Qué NO se ha hecho en esta fase

- No se ha extraído ninguna pregunta real de los `.docx`.
- No se ha creado ningún importador ni script de procesamiento.
- No se ha modificado `data.js`, `script.js`, `styles.css` ni `index.html`.
- No se ha movido ni copiado ningún archivo del proyecto (los ficheros temporales usados para esta auditoría viven fuera del repositorio, en la carpeta de scratchpad de la sesión, y no forman parte del proyecto).

## 8. Siguiente paso recomendado

Antes de escribir el importador (Fase 2), decidir el punto 1 de la sección 5 (backend sí/no), porque condiciona el formato de salida del importador y si el panel de administración vive solo en el cliente o necesita autenticación real.

## 9. Actualización — Fase 2 completada (importador)

Implementado en `tools/DocxImport.psm1` (parser) + `tools/Import-Exams.ps1` (orquestador re-ejecutable) + `tools/tests/` (13 pruebas Pester, todas en verde). Detalles, decisiones y resultados reales sobre los 4 `.docx` en `tools/README.md`. Resumen: 145 preguntas importadas desde los 4 documentos reales, 139 con resaltado amarillo detectado, 18 con negrita (siempre como señal secundaria, nunca única), 2 duplicados exactos detectados y enlazados, 6 sin solución detectable (marcadas, no inventadas), 111 pendientes de revisión manual (la mayoría por incluir una imagen/tabla que el importador no puede validar automáticamente). Nada de esto está todavía conectado a la interfaz ni a `data.js`/`script.js`.

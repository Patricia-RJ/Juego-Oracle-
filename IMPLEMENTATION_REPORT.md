# IMPLEMENTATION_REPORT — Fase 4: Experiencia final del banco de examen Oracle

**Fecha:** 2026-07-17
**Alcance:** Dashboard completo, repetición espaciada, gamificación, ranking y pulido de diseño/responsive sobre el módulo "Banco de examen Oracle" construido en las Fases 2-3. No afecta a la app original de niveles (Oracle SQL Quest) más allá de dos líneas ya descritas en el informe de Fase 3.

---

## 1. Resumen de lo implementado

### Dashboard
Nueva pestaña "Dashboard" (sustituye a la antigua "Estadísticas", ampliándola):
- Total preguntas, respondidas, correctas, incorrectas, accuracy, tiempo medio (6 tarjetas).
- **Evolución semanal** y **evolución mensual**: gráficos de barras reales agregados desde el historial de actividad (`activityLog`), agrupados por semana ISO y por mes calendario respectivamente. Reutilizan literalmente los mismos estilos (`.evo-chart`/`.evo-bar`) que el gráfico de evolución de la app original, para mantener un único lenguaje visual.
- **Rendimiento por tema** y **rendimiento por dificultad**: mapas de calor con el mismo sistema de color por estado (verde ≥75%, ámbar 50-74%, rojo <50%, gris "sin datos") ya usado en el Analytics original — reutilizado, no reinventado.
- Estado vacío explícito ("Todavía no has respondido ninguna pregunta...") cuando no hay datos reales; nunca se muestran datos ficticios.

### Repetición espaciada
Estados **New → Learning → Review → Mastered** por pregunta (campo `srs` en el progreso), con una regla de programación simple y documentada en el propio código:
- Acertar promociona (New/Learning → Review tras 2 aciertos seguidos; Review → intervalo x2 hasta Mastered a partir de 30 días y 4 aciertos seguidos).
- Fallar siempre vuelve a Learning con intervalo mínimo (1 día) y resetea la racha de SRS.
- "Repaso de errores" ahora incluye un grupo **"Recomendado hoy"** que prioriza, en este orden: preguntas pendientes de repaso (SRS vencido) → falladas → difíciles y falladas → preguntas de **temas débiles** (accuracy < 60% con ≥3 intentos), deduplicadas.
- Los filtros de "Práctica libre" y "Repaso" usan ahora los 4 estados reales (New/Learning/Review/Mastered) en vez de la aproximación provisional de la Fase 3 (Nueva/Vista/Con fallos/Dominada).

### Gamificación
- **XP**: solo se otorga por acierto real (nunca por fallar), con multiplicador por dificultad (x1 a x2.5) y bonus por racha diaria (+2/día hasta +20) y por primera vez que se responde una pregunta (+5). Responder al azar sin acertar no genera puntuación.
- **Niveles**: 5 niveles (Aprendiz Oracle → Preparado/a para el examen) por umbral de XP, con barra de progreso hacia el siguiente.
- **Racha**: días consecutivos con actividad real (misma lógica que la racha de la app original, pero en su propio namespace de estado).
- **Insignias**: 10 definidas (primer paso, 10/50 aciertos, 100 preguntas distintas, racha 3/7 días, simulacro aprobado, simulacro perfecto, niveles Expert/Exam Challenge del modo progresivo desbloqueados), verificadas automáticamente tras cada respuesta y cada simulacro.
- **Misiones diarias**: 3 por día, regeneradas deterministamente por fecha (responder 10 preguntas, conseguir 5 aciertos, volver a acertar 1 pregunta que antes fallaste), con recompensa de XP al completarse.
- Barra de gamificación persistente (nivel, XP, racha, misiones del día) visible en todas las pestañas del módulo.
- Nueva pestaña **"Logros"**: tarjeta de nivel, lista de misiones de hoy con progreso, y galería de insignias (conseguidas/bloqueadas con su condición).

### Ranking
Nueva pestaña **"Ranking"** con filtros Semanal / Mensual / Histórico. **Decisión deliberada y explícita**: no se han creado usuarios ficticios ni datos de ejemplo — la tabla muestra únicamente tu fila real (XP, accuracy, nivel, mejor simulacro), con una nota visible explicando que la plataforma no tiene backend ni cuentas de usuario todavía, por lo que no existe manera real de comparar con otras personas. Esto es continuación directa de la limitación ya documentada en `AUDIT_REPORT.md` (sección 5) y respeta explícitamente la instrucción "Evitar: Datos ficticios" de este mismo encargo.

### Diseño
- Responsive/mobile-first verificado con capturas reales a 1400px y 390px (no solo revisado en el código): la barra de gamificación pasa a columna, las pestañas y filtros se envuelven en varias líneas, las tablas (ranking) se vuelven desplazables horizontalmente.
- Reutilización sistemática de los componentes visuales ya existentes (heatmap por niveles de color, barras de evolución, pills, `progress-track`) en vez de introducir un lenguaje visual nuevo — mantiene consistencia con el resto de la app.
- Accesibilidad básica: los mapas de calor y tarjetas de insignias nunca comunican solo con color (siempre incluyen el número/etiqueta como texto), los `title` nativos aportan detalle en hover sin necesitar JS adicional.
- Se evitó scroll excesivo: el dashboard agrupa todo en un único panel con jerarquía de encabezados (`h4`) en vez de sub-páginas separadas.

---

## 2. Archivos modificados

- `certification.js` — ampliado sustancialmente: estado SRS, motor de gamificación (XP/niveles/racha/insignias/misiones), Dashboard completo, Ranking, Logros, actualización de "Repaso de errores" y de los filtros de estado de aprendizaje.
- `certification.css` — nuevas reglas para la barra de gamificación, tarjeta de nivel, misiones, insignias y tabla de ranking; ajustes responsive.

No se ha modificado `index.html`, `script.js`, `data.js` ni `styles.css` en esta fase (la estructura de navegación ya quedó lista en la Fase 3).

## 3. Archivos nuevos

- `IMPLEMENTATION_REPORT.md` (este documento).

---

## 4. Problemas detectados y corregidos

1. **Falso positivo visual en pruebas headless, no en la app real.** Al capturar una captura de pantalla tras varios clics síncronos seguidos (sin dar tiempo real entre ellos), Chrome headless capturaba el frame a mitad de la animación CSS `fadeIn` de `.view`, produciendo una imagen con todo el contenido atenuado/oscurecido. Verificado con una segunda captura añadiendo esperas reales entre pasos: el problema desaparece por completo y el render es correcto. **No es un bug de la aplicación**, es un artefacto de cómo Chrome headless compone fotogramas cuando el JavaScript no cede el hilo entre animaciones; se documenta aquí para que quede constancia de que se investigó y se descartó como problema real.
2. Sin bugs de lógica nuevos detectados en el motor de SRS/XP/insignias tras las pruebas (a diferencia de la Fase 3, donde sí aparecieron 2 bugs reales de PowerShell y 1 de clasificación SQL).

## 5. Pruebas ejecutadas

- **Pester** (importador, sin cambios de código en esta fase): 21/21 en verde, confirmando que nada de esta fase rompió la Fase 2.
- **Arnés E2E en Chrome headless** (creado para esta fase, borrado al terminar): 16 pasos —
  - Barra de gamificación se renderiza con XP.
  - 10 respuestas mixtas (correctas/incorrectas) en práctica libre.
  - XP aumenta solo con aciertos; racha se registra con la fecha de hoy.
  - Los estados SRS dejan de ser todos "new" tras responder.
  - Pestaña "Logros" muestra tarjeta de nivel, 3 misiones y todas las insignias definidas; al menos una conseguida.
  - La misión "responder 10 preguntas hoy" se completa automáticamente al llegar a 10.
  - El grupo "Recomendado hoy" de Repaso de errores tiene preguntas tras fallar algunas, e inicia sesión correctamente.
  - Dashboard renderiza 6 tarjetas, 2 gráficos de evolución y 2 mapas de calor.
  - Ranking muestra exactamente 1 fila (nunca usuarios ficticios) y la nota honesta sobre la falta de backend.
  - Los 3 filtros de rango del ranking (semanal/mensual/histórico) funcionan.
  - Simulacro completo de 5 preguntas con todas correctas, finalizado manualmente.
  - Insignia "exam_pass" conseguida tras el simulacro.
  - **Lógica pura del motor SRS** verificada directamente (sin pasar por la UI): 2 aciertos seguidos promocionan New/Learning → Review; un fallo devuelve siempre a Learning y resetea la racha; 6 aciertos seguidos llegan a Mastered.
  - Persistencia en `localStorage`: `activityLog` y `xp` se guardan correctamente.
- **Verificación visual real** (capturas de pantalla, no solo DOM): escritorio (1400px) y móvil (390px), con y sin datos de actividad, confirmando diseño legible, responsive y sin scroll horizontal.

## 6. Resultado de las pruebas

- Pester: 21/21 correctas.
- E2E en navegador: 16/16 pasos correctos, sin errores de consola, sin literal `"undefined"` en el DOM.
- Verificación visual: sin roturas de layout en escritorio ni móvil; el aparente "oscurecimiento" inicial se investigó, se explicó (artefacto de captura, no de la app) y se confirmó su ausencia con una segunda captura correcta.

## 7. Qué queda fuera de esta fase (no pedido explícitamente o bloqueado por diseño)

- Backend/cuentas de usuario reales para un ranking multiusuario genuino — limitación arquitectónica ya documentada en `AUDIT_REPORT.md`, no resoluble sin construir un servidor.
- Reconstrucción de tablas del examen como datos estructurados (siguen siendo imagen, ver limitación de Fase 2/3): no se ha tocado en esta fase porque no formaba parte de lo pedido.
- Explicaciones educativas generadas por pregunta: no solicitado en esta fase.

---
---

# FASE FINAL — Auditoría funcional y preparación para producción

**Fecha:** 2026-07-17
**Naturaleza de esta fase:** solo auditoría y pruebas. No se ha añadido ninguna funcionalidad nueva y no se ha modificado ningún archivo de código (`certification.js`, `certification.css`, `script.js`, `tools/*`) durante esta auditoría — todos los hallazgos de abajo son el resultado de inspeccionar los datos reales, ejecutar pruebas y leer el código ya existente, no de cambios hechos ahora.

---

## A. Validación del banco de preguntas (contra los datos reales)

### Conteos reales (recalculados ahora mismo sobre `certification-bank.json`)

| Archivo | Preguntas |
|---|---|
| Examen 1.docx | 45 |
| Examen 2.docx | 40 |
| Examen 3.docx | 49 |
| Examen 4.docx | 11 |
| **Total** | **145** |

| Categoría | Cantidad |
|---|---|
| Con una respuesta correcta | 59 |
| Con varias respuestas correctas | 80 |
| Sin solución detectada (no inventada) | 6 |
| Con al menos una imagen | 95 |
| Con tabla **estructurada** (filas/columnas) | **0** — ver limitación abajo |
| Pendientes de revisión | 111 |
| Duplicadas | 2 |

(59 + 80 + 6 = 145, cuadra con el total.)

### Muestras verificadas literalmente contra el `.docx` original

Se reabrió el XML interno de los 4 documentos (no solo el JSON ya importado) y se comparó carácter a carácter con lo que guarda la aplicación:

- **`examen-2-q27`** (una respuesta, True/False): texto y opciones idénticos al Word; el resaltado amarillo real está sobre `TRUE`, coincide con `correctAnswers: ["A"]`. ✅
- **`examen-4-q1`** (varias respuestas, con imagen): stem, las 4 opciones SQL y el orden se conservan literalmente (incluyendo el error de sintaxis real `ADD_MONTHS(END_DATE,1)SYSDATE` de la opción C, que **no se ha corregido**, tal como exige la especificación); `correctAnswers: ["B","D"]` coincide con el resaltado real; la imagen (`image1.png`, la tabla PROGRAMS) está enlazada a esta pregunta y a ninguna otra. ✅
- **`examen-2-q3`** (multirrespuesta, 5 opciones): coincide con el original. ✅
- **`examen-4-q11`** (sin solución detectada): se comprobó que el documento realmente no tiene ni resaltado ni negrita en ninguna opción — la aplicación **no ha inventado** una respuesta, correctamente marcada `pending_review`. ✅

### Hallazgo crítico nuevo, encontrado en esta auditoría: contaminación cruzada de idioma en 12 preguntas

Al revisar `examen-1-q1` en detalle (13 opciones en vez de las 4 reales) se descubrió la causa raíz: **los documentos Word contienen, después de las preguntas en inglés, un apéndice en español con explicaciones ("Consulta y examina las siguientes respuestas disponibles", "Correcto porque…") numerado como "N. Pregunta"** en vez de "N. Question". El importador (Fase 2) solo reconoce el marcador en inglés, así que ese apéndice en español **no se detecta como un límite de pregunta nueva** y su contenido se fusiona con la última pregunta en inglés reconocida antes de él.

Se localizó y confirmó exactamente dónde ocurre:

| Archivo | Apariciones de "N. Pregunta" | Preguntas contaminadas (options infladas) |
|---|---|---|
| Examen 1.docx | 1 | `examen-1-q1`, `examen-1-q3`, `examen-1-q4`, `examen-1-q5` |
| Examen 2.docx | 5 | `examen-2-q1`, `examen-2-q8`, `examen-2-q9`, `examen-2-q13`, `examen-2-q14`, `examen-2-q23` |
| Examen 3.docx | 1 | `examen-3-q2`, `examen-3-q6` |
| Examen 4.docx | 0 | ninguna |

**Dato tranquilizador, verificado explícitamente:** las 12 preguntas contaminadas están **las 12 en `pending_review`** — ninguna llegó a `validated`. El sistema de confianza de la Fase 2 (que penaliza "número de opciones inusual" y "el enunciado indica N respuestas pero se detectaron M") capturó el síntoma de la contaminación en el 100% de los casos, aunque no conocía la causa. Ningún usuario ha visto ni verá estas 12 preguntas como fiables mientras sigan `pending_review`.

**Esto no se ha corregido en esta fase** (auditoría, sin nuevas funcionalidades). Se documenta como hallazgo **crítico antes de presentar** en la sección de recomendaciones.

### `contentBlocks` y orden original

Verificado sobre `examen-1-q1` y `examen-4-q1`: el orden texto → imagen → texto se conserva tal como aparece en el Word (el bloque de imagen incluye una nota explícita: *"Captura original del documento… no se ha reconstruido como tabla estructurada"*). Ninguna pregunta se reconstruye solo con `questionText`.

### Tablas: limitación confirmada, no un bug

Las "tablas" del examen (p. ej. la tabla PROGRAMS, ORDER_ITEMS) **solo existen como imagen** (capturas de pantalla), nunca como filas/columnas estructuradas — confirmado de nuevo en esta auditoría (0 bloques `type: "table"` en las 145 preguntas). Esto es una limitación conocida y documentada desde la Fase 1 (evitar OCR), no un defecto nuevo.

---

## B. Verificación de integración

**Confirmado: la aplicación usa `data/certification-bank/certification-bank.js`** (variable global `CERTIFICATION_BANK`) como única fuente del banco de examen Oracle. `certification-bank.json` existe solo como artefacto de las herramientas (`tools/Import-Exams.ps1` y un futuro backend), **nunca se carga en el navegador** (no hay ningún `fetch()` ni `<script>` que lo referencie).

**No conviven de forma conflictiva** en el sentido de compartir variables o datos: son dos sistemas completamente separados —

| | `data.js` (`APP_DATA.examBank`) | `certification-bank.js` (`CERTIFICATION_BANK`) |
|---|---|---|
| Preguntas | 39, redactadas por el proyecto, en español | 145, importadas literalmente de los `.docx`, en inglés |
| Usado por | `script.js` (simulacro de niveles N16/N17 del juego original) | `certification.js` (módulo "Banco de examen Oracle") |
| Estado guardado | `oracleSqlQuestState_v1` | `oracleCertBankState_v1` |

No hay ninguna variable compartida ni colisión de nombres. **Sí hay un problema real, aunque no de datos sino de producto**: existen ahora **dos funcionalidades distintas llamadas de forma parecida** — el botón de la landing "Realizar simulador" lleva al simulacro del juego original (preguntas propias en español), mientras que dentro de "Banco de examen Oracle" hay una pestaña "Simulacro Oracle" con las 145 preguntas reales en inglés. Alguien que no conozca la app por dentro puede no saber cuál de los dos es "el simulacro real". Ver recomendaciones (Importante).

### Datos ficticios: no se ha encontrado nada obsoleto que eliminar

Se revisó explícitamente si había datos de demostración o bancos antiguos huérfanos que desactivar:
- El modo demo (`buildDemoState()`, `enterDemoMode()`) sigue siendo una funcionalidad activa y deseada (para presentaciones internas), ya auditado y correctamente aislado de `localStorage` desde la fase de cumplimiento anterior. **No se ha eliminado nada**, porque no es "dato ficticio ya innecesario": sigue en uso.
- No existen bancos de preguntas antiguos o de prueba abandonados en el repositorio.

**Dos gaps de integración reales, encontrados al comprobar el alcance exacto de dos acciones existentes:**

1. **"Reiniciar progreso" no reinicia el banco de examen Oracle.** Se comprobó en código y con una prueba real: `resetProgress()` solo pone a cero `STATE` (`oracleSqlQuestState_v1`). El XP, insignias, racha y progreso de `CERT_STATE` (`oracleCertBankState_v1`) **sobreviven intactos**. Un usuario que pulse "Reiniciar progreso" esperando empezar de cero se encontrará su progreso del banco Oracle intacto. No es un fallo de seguridad ni pérdida de datos — es lo contrario de lo que un usuario razonablemente espera del botón.
2. **El modo demo no cubre el banco de examen Oracle.** `enterDemoMode()` solo sustituye `STATE`. Si alguien activa el modo demo para presentar la app y navega a "Banco de examen Oracle", verá **su progreso real** (posiblemente vacío) en vez de datos de demostración, rompiendo la coherencia de la demo.

Clasificados como **Importante** en la sección de recomendaciones (no crítico: no hay pérdida de datos ni riesgo de seguridad, pero sí una expectativa de usuario incumplida).

---

## C. Seguridad de las respuestas — riesgo real, no mitigado

**Comprobado directamente, no supuesto:** el archivo `data/certification-bank/certification-bank.js` que se sirve a cualquier visitante contiene, en texto plano y legible, el array `options` completo con la propiedad `"isCorrect": true/false` en cada opción, **y además** el array `correctAnswers` redundante. Ejemplo real extraído del propio archivo servido (pregunta `examen-4-q1`):

```
"correctAnswers":  ["B", "D"],
"options": [
  { "id": "A", "text": "...", "isCorrect": false },
  { "id": "B", "text": "...", "isCorrect": true },
  ...
]
```

**Vías reales por las que cualquiera puede ver las respuestas correctas, verificadas todas:**
- **Ver código fuente / DevTools → Sources**: el archivo aparece listado tal cual, sin minificar ni ofuscar (664 KB en texto plano).
- **Variable global**: abrir la consola del navegador y escribir `CERTIFICATION_BANK` expone el array completo con todas las soluciones, sin necesidad de buscar nada.
- **Descarga directa**: navegar a `https://<dominio>/data/certification-bank/certification-bank.js` (o el `.json` equivalente) descarga el banco completo con las 145 respuestas, sin autenticación de ningún tipo.
- **HTML**: el HTML en sí no contiene las respuestas (se inyectan por JS), pero eso es irrelevante porque las otras tres vías bastan.

**No se afirma que esto esté protegido.** No lo está. Cualquier persona con conocimientos básicos de "Ver código fuente" (no hace falta ser desarrollador) puede obtener las 145 respuestas correctas en segundos. Esto es idéntico, en naturaleza, a lo que ya advertía `AUDIT_REPORT.md` para el banco original de 39 preguntas — pero ahora aplica también a las 145 preguntas reales del examen, lo cual es más sensible porque son contenido de un curso de pago, no preguntas de autor propio.

**Riesgo real, explicado sin eufemismos:**
- Un alumno puede memorizar respuestas en vez de aprender, invalidando el propósito de la práctica y del simulacro.
- Si esta app se comparte más ampliamente, cualquiera podría extraer y redistribuir el banco de respuestas del curso de pago del que proceden las preguntas, con el riesgo legal/reputacional que eso conlleva para Stemdo si el curso es de terceros con derechos de autor.
- El simulacro "cronometrado sin mostrar respuestas" es una protección **cosmética**: impide que el usuario vea la respuesta *en la interfaz* durante el examen, pero no impide que la vea *en el código* en cualquier momento, incluso a mitad del simulacro, abriendo DevTools.

### Solución mínima para validación seria (propuesta, no implementada)

No se ha escrito ni una línea de esta solución — se indica explícitamente antes de tocar nada, como se pidió:

1. Mover la verificación de respuesta a una función serverless mínima (p. ej. Vercel Functions, que son gratuitas y no rompen el "sin dependencias" del front): `POST /api/check-answer { questionId, selectedOptionIds }` → `{ correct: true/false }`.
2. El backend guarda el banco completo (`correctAnswers` incluido) **solo en el servidor**; al cliente solo se le sirve `questionText`, `options` (sin `isCorrect`) y `contentBlocks`.
3. El simulacro y la práctica llaman a ese endpoint en vez de comparar en el cliente; el resultado final del simulacro (puntuación, temas débiles) se calcula en el servidor a partir de las respuestas enviadas, no en el navegador.
4. Esto requiere una base de datos o almacenamiento serverless mínimo (p. ej. Vercel KV/Postgres) para el banco — es el mismo punto ya señalado como decisión pendiente en `AUDIT_REPORT.md` sección 5 ("Backend mínimo, sí o no").
5. Alcance estimado: no trivial pero tampoco enorme — un endpoint, una copia del banco solo accesible desde el servidor, y cambiar las funciones `answerCurrentQuestion`/`finishExam` de `certification.js` para que hagan `fetch()` en vez de comparar `arraysEqual` localmente.

**No se ha implementado nada de esto.** Se indica aquí para que se decida conscientemente, tal como se pidió.

---

## D. Pruebas funcionales reales ejecutadas

Todas las pruebas de esta sección se ejecutaron contra la aplicación real con el banco de 145 preguntas real, en Chrome headless, con un arnés de pruebas temporal (creado y borrado en esta misma sesión, no forma parte del repositorio).

| Funcionalidad | Resultado |
|---|---|
| Práctica libre | ✅ Superada |
| Filtro por tema (JOINS) | ✅ Superada — el resultado respeta el filtro |
| Filtro por dificultad | ✅ Superada (ya cubierta en Fase 4) |
| Pregunta de respuesta única (radio) | ✅ Superada — confirmado `input type="radio"` |
| Pregunta multirrespuesta (checkbox) | ✅ Superada — confirmado `input type="checkbox"` |
| Pregunta con imagen | ✅ Superada — la imagen se renderiza con `src` válido |
| Pregunta con tabla | ⚠️ **No aplicable**: no existen tablas estructuradas (solo imagen). El filtro "solo con tablas" se comprobó y muestra un estado vacío honesto en vez de fallar o mentir. |
| Simulacro con temporizador | ✅ Superada |
| Marcar para revisar | ✅ Superada |
| Omitir preguntas | ✅ Superada |
| Finalizar manualmente | ✅ Superada (con confirmación) |
| **Finalizar por tiempo agotado** | ✅ Superada — simulado forzando que el tiempo restante llegue a 0 sin pulsar el botón de finalizar; el simulacro se cierra solo y muestra resultado |
| Repaso de errores | ✅ Superada (grupos verificados en Fase 4; smoke test repetido ahora, 7 grupos incluido "Recomendado hoy") |
| Repetición espaciada (SRS) | ✅ Superada — lógica pura verificada: 2 aciertos promocionan, 1 fallo siempre vuelve a Learning, 6 aciertos seguidos llegan a Mastered |
| XP | ✅ Superada — solo aumenta con aciertos |
| Niveles | ✅ Superada (verificado en Fase 4, subida de nivel real observada en captura) |
| Racha | ✅ Superada — incrementa si hubo actividad ayer, se resetea a 1 si hay un hueco de un día |
| Insignias | ✅ Superada |
| Misiones diarias | ✅ Superada — se regeneran solas al cambiar de fecha (probado forzando `dailyMissions.date` a una fecha antigua) |
| Dashboard | ✅ Superada |
| Ranking | ✅ Superada — 1 sola fila real, nunca ficticia; los 3 filtros de rango funcionan |
| **Reinicio de partida** | ⚠️ **Funciona solo parcialmente**: reinicia el juego original pero no el banco de examen Oracle (ver hallazgo en sección B) |
| **Recarga de página** | ✅ Superada — releer `localStorage` tras guardar reproduce exactamente el mismo XP y progreso |
| **Cierre y reapertura del navegador** | ✅ Superada — simulado con dos procesos de Chrome headless independientes sobre el mismo perfil: el segundo arranque recupera exactamente el mismo XP/progreso que dejó el primero |

**Pruebas fallidas: ninguna funcionalidad probada ha fallado en el sentido de "no funciona".** Las dos únicas incidencias (⚠️) son gaps de alcance/expectativa (reinicio parcial, tablas inexistentes por diseño), no errores de ejecución.

---

## E. Persistencia y aislamiento

- **Dónde se guarda:** únicamente `localStorage` del navegador, en dos claves: `oracleSqlQuestState_v1` (juego original) y `oracleCertBankState_v1` (banco Oracle). **No existe Firebase ni ningún otro sistema remoto** — confirmado revisando la ausencia total de llamadas de red (`fetch`/`XMLHttpRequest`) en todo el código.
- **Al borrar el almacenamionto local:** se pierde todo — progreso, XP, insignias, racha, overrides de administración. No hay copia de seguridad en ningún otro sitio. Es el comportamiento esperado de una app sin backend, pero debe ser explícito para quien la presente: **borrar datos del navegador = perder todo el progreso sin posibilidad de recuperación.**
- **Al entrar desde otro navegador (o perfil):** verificado con dos perfiles de Chrome completamente independientes — cada uno empieza con su propio progreso, sin ningún dato compartido. **Dos usuarios no pueden compartir progreso accidentalmente** porque no existe ningún mecanismo (cookie, dominio compartido, backend) que pudiera causarlo; cada instalación de navegador es una "cuenta" aislada de facto.
- **Racha y misiones al cambiar de día:** verificado con la lógica real (no solo revisado el código): la racha incrementa correctamente si la última actividad fue "ayer", y se resetea a 1 si hay un hueco de más de un día. Las misiones diarias detectan el cambio de fecha y se regeneran solas, sin intervención del usuario ni pérdida de las insignias ya ganadas.

---

## F. Producción en Vercel

**No se ha podido probar la aplicación desplegada porque no está desplegada.** Se comprobó con `git status` y `git log`: todo el trabajo de las Fases 2, 3, 4 y esta auditoría está **sin confirmar (commit) y sin subir a GitHub**. El último commit real (`0aad302`) es anterior a todo el banco de examen Oracle. La URL pública `https://juego-oracle.vercel.app/` todavía sirve la versión antigua del juego, sin ninguno de los cambios auditados aquí. Esto se declara explícitamente en vez de fingir haber probado algo que no se pudo probar.

En su lugar, se ha hecho un análisis estático de lo que ocurriría al desplegar, comprobando exactamente los puntos pedidos:

- **Rutas relativas:** todas las rutas en `index.html` y en el banco (`data/certification-bank/media/...`) son relativas, sin ninguna ruta absoluta de Windows (`C:\...`) filtrada por error — comprobado explícitamente tras el arreglo que ya se hizo en la Fase 3.
- **Compatibilidad con nombres de carpeta con tilde:** la carpeta `Exámenes/` (con tilde) **nunca se referencia desde el navegador** — solo la usa `tools/Import-Exams.ps1` en local. El sitio que se serviría en Vercel no necesita esa carpeta para nada.
- **Sensibilidad a mayúsculas/minúsculas:** Vercel sirve sobre Linux (sistema de archivos sensible a mayúsculas), a diferencia de Windows. Se comprobó que **todos los nombres de archivo referenciados coinciden exactamente en mayúsculas/minúsculas** con los archivos reales (`certification.js`, `certification.css`, `data/certification-bank/certification-bank.js`, carpetas `media/examen-1`…`examen-4` en minúsculas) — no se detectó ningún desajuste que solo se manifestaría en Linux.
- **Errores 404 / de red esperables:** ninguno detectado en el análisis estático; todas las rutas referenciadas existen en disco.
- **Riesgo real no relacionado con rutas, sí con `git`:** **no existe archivo `.gitignore`**. Si en algún momento se hace `git add .` sin cuidado, se subiría y desplegaría públicamente la carpeta `Exámenes/` completa (5,6 MB de documentos Word con el contenido original del curso de pago). Esto es un riesgo real de distribución de material con derechos de autor de terceros, no solo un problema de tamaño de repositorio. **Recomendación crítica**: añadir `Exámenes/` a un `.gitignore` antes de cualquier commit/push futuro.
- **Rendimiento inicial:** `certification-bank.js` pesa 664 KB y se carga con un `<script>` normal en **todas** las páginas, aunque el visitante nunca abra "Banco de examen Oracle". No rompe nada, pero es peso innecesario en la carga inicial para quien solo usa el juego original.
- **Caché:** al no tener el archivo un nombre con hash de contenido (a diferencia de lo que haría un build tool), si en el futuro se vuelve a ejecutar el importador con preguntas corregidas y se despliega, es posible que navegadores o CDN sirvan una versión en caché desactualizada durante un tiempo. No es grave (los datos no son de alta frecuencia de cambio) pero conviene saberlo.
- **Móvil:** no se ha podido probar en un móvil real ni en el dominio de producción; sí se verificó el diseño responsive en local con capturas a 390 px de ancho (ver informe de Fase 4), sin problemas de layout.

---

## G. Resumen de estado por funcionalidad

| Funcionalidad | Estado |
|---|---|
| Importación de preguntas (Fase 2) | ✅ Funciona, con la limitación de contaminación de 12 preguntas (ver A), todas correctamente marcadas `pending_review` |
| contentBlocks / orden original | ✅ Funciona |
| Imágenes/exhibits | ✅ Funciona |
| Tablas estructuradas | ❌ No implementado (limitación de diseño, no un fallo) |
| Práctica libre + filtros | ✅ Funciona |
| Simulacro (temporizador, navegación, marcar, finalizar manual/por tiempo) | ✅ Funciona |
| Repaso de errores + "Recomendado hoy" | ✅ Funciona |
| Repetición espaciada (SRS) | ✅ Funciona |
| Gamificación (XP/niveles/racha/insignias/misiones) | ✅ Funciona |
| Dashboard | ✅ Funciona |
| Ranking | ✅ Funciona (single-user honesto; multiusuario real requiere backend) |
| Panel de administración | ✅ Funciona (verificado en Fase 3) |
| Reinicio de progreso | ⚠️ Incompleto (no incluye el banco Oracle) |
| Modo demo | ⚠️ Incompleto (no incluye el banco Oracle) |
| Seguridad de respuestas | ❌ No protegidas — requiere backend para estarlo de verdad |
| Despliegue en Vercel | ⏳ Pendiente — nunca se ha hecho commit/push de este trabajo |

## H. Limitaciones reales

1. Las tablas del examen original solo existen como imagen; no hay ni habrá filas/columnas estructuradas sin implementar OCR (explícitamente desaconsejado desde la Fase 1).
2. 111 de 145 preguntas siguen `pending_review` — la mayoría por incluir una imagen no verificable automáticamente, no porque la extracción esté mal.
3. 12 preguntas tienen contenido contaminado por el apéndice en español del documento (ver A) — correctamente aisladas en `pending_review`, pero no utilizables hasta corregirlas.
4. Sin backend: ni las respuestas están protegidas, ni el ranking puede ser multiusuario real, ni el progreso se puede compartir entre dispositivos.
5. El progreso vive solo en el navegador: borrar datos de navegación implica pérdida total sin recuperación posible.

## I. Riesgos de seguridad

1. **Respuestas correctas expuestas en texto plano** en el cliente, accesibles por código fuente, consola o descarga directa del archivo — riesgo real, no mitigado (ver sección C).
2. **Ausencia de `.gitignore`**: riesgo de publicar accidentalmente el contenido del curso de pago (`Exámenes/`) en un repositorio público y en el despliegue de Vercel.
3. Ningún otro riesgo de seguridad detectado (no hay backend, no hay autenticación que comprometer, no hay inyección de HTML sin escapar en el nuevo módulo — se revisó que `certification.js` usa `escapeHtml()` de forma consistente igual que el resto de la app).

## J. Problemas de producción

1. No hay despliegue real que auditar todavía (ver sección F) — es en sí mismo el problema de producción más urgente si se quiere presentar la app desplegada.
2. Ausencia de `.gitignore` (repetido aquí porque es simultáneamente un problema de producción y de seguridad/legal).
3. Carga innecesaria de 664 KB en cada visita, incluso para quien no usa el banco Oracle.
4. Sin estrategia de caché/versión de archivo para el banco de preguntas ante futuras reimportaciones.

## K. Funcionalidades que requieren backend para ser completas

1. Validación de respuestas segura del lado servidor (sección C).
2. Ranking multiusuario real (sección Ranking, ya documentado desde `AUDIT_REPORT.md`).
3. Progreso compartido entre dispositivos/navegadores del mismo usuario.
4. Panel de administración persistente y compartido entre quien revisa el contenido (hoy cada override vive solo en el navegador de quien lo hizo).

## L. Archivos obsoletos o duplicados

- **No se ha encontrado código muerto ni bancos de preguntas abandonados.**
- `certification-bank.json` y `certification-bank.js` son **duplicados intencionados** (mismo contenido, uno para herramientas/futuro backend, otro para que el navegador lo cargue sin servidor) — no es un descuido, pero duplica el peso en disco (~1,3 MB entre los dos, más `import-report.json`/`.js`). Candidato a limpieza si se construye un backend (entonces `certification-bank.json` ya no haría falta servirlo).
- `data/certification-bank/raw/<archivo>.json` (uno por documento) son redundantes con el banco combinado, pero se mantienen deliberadamente por trazabilidad (requisito de la Fase 2), no por descuido.
- La carpeta `Exámenes/` (documentos Word originales) no es "obsoleta" pero **no debería desplegarse** — ver recomendación crítica de `.gitignore`.

## M. Recomendaciones priorizadas

### Crítico antes de presentar
1. Añadir un `.gitignore` que excluya `Exámenes/` antes de cualquier `git add`/commit — evita publicar contenido de un curso de pago de terceros.
2. Decidir y comunicar explícitamente que las respuestas del banco Oracle **no están protegidas** frente a quien mire el código — al menos como aviso interno, antes de compartir el enlace ampliamente.
3. Revisar manualmente las 12 preguntas contaminadas por el apéndice en español (listadas en la sección A) antes de aprobarlas nunca en el panel de administración.
4. Hacer commit y desplegar (push a `main`, dejar que Vercel construya) antes de poder afirmar que "funciona en producción" — hoy no se puede afirmar porque no se ha probado lo desplegado.

### Importante
5. Hacer que "Reiniciar progreso" también reinicie `oracleCertBankState_v1`, o separar claramente los dos botones ("Reiniciar juego" / "Reiniciar banco Oracle") para que no parezca un fallo.
6. Extender el modo demo para que también sustituya `CERT_STATE` por datos ficticios coherentes mientras esté activo (igual que ya hace con `STATE`).
7. Renombrar o diferenciar visualmente los dos "simulacros" (el del juego original en español y el del banco Oracle en inglés) para evitar confusión sobre cuál es cuál.
8. Si se decide construir el backend de validación de respuestas (sección C), es el cambio de arquitectura más profundo pendiente — planificarlo como proyecto propio, no como tarea suelta.

### Mejora futura
9. Cargar `certification-bank.js` de forma diferida (solo cuando el usuario entra en "Banco de examen Oracle") para no penalizar la carga inicial de quien no lo usa.
10. Añadir una estrategia de invalidación de caché (nombre de archivo con versión/hash) para cuando se reimporten preguntas corregidas.
11. Dejar de servir `certification-bank.json` en producción si algún día existe backend (solo hace falta el `.js` para el cliente actual).

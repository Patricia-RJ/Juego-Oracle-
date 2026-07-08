# 🧭 Oracle SQL Quest

**Una app web gratuita y gamificada para aprender SQL de Oracle desde cero, pensada para preparar la certificación oficial Oracle Database SQL (1Z0-071).**

### 🚀 Pruébala ahora, sin instalar nada

## 👉 [juego-oracle.vercel.app](https://juego-oracle.vercel.app/)

Ábrelo en el navegador (móvil, tablet u ordenador) y empieza a jugar. No hace falta cuenta, ni instalar nada, ni saber programar.

---

## ¿Qué es esto?

Es un curso interactivo con forma de videojuego: en vez de leer un PDF o ver vídeos, vas avanzando por **niveles** (como en Duolingo), cada uno con teoría corta, ejemplos, preguntas tipo test, ejercicios prácticos y retos. Vas ganando experiencia (XP), insignias y subiendo de "rango" a medida que completas niveles, hasta llegar a un simulacro de examen cronometrado igual que el oficial.

Está pensado tanto para quien no ha tocado SQL en su vida como para quien ya sabe lo básico y quiere prepararse específicamente para la certificación de Oracle.

No necesitas tener Oracle Database instalado ni ninguna cuenta: todo el contenido (teoría, preguntas, ejemplos) está integrado en la propia app, y tu progreso se guarda automáticamente en tu navegador.

## ¿Qué puedes hacer en la app?

- 📘 **Aprender por niveles**, de "qué es una base de datos" hasta los temas más avanzados del examen oficial (subconsultas, transacciones, vistas, secuencias...).
- ❓ **Responder quiz** con explicación al momento de por qué una respuesta es correcta o no.
- ✏️ **Practicar con ejercicios y retos** de dificultad creciente, con pista y solución explicada.
- ⏱️ **Hacer simulacros cronometrados** con preguntas mezcladas, igual que en el examen real.
- 🧠 **Repasar solo lo que has fallado**, con una sección dedicada a tus errores.
- 🏅 **Ganar insignias y subir de rango** (de "SQL Explorer" a "Certification Ready") según tu progreso real.

Todo tu avance queda guardado en el propio navegador: si cierras la pestaña y vuelves otro día, sigues donde lo dejaste.

---

## Para quien quiera mirar "por debajo del capó"

El resto de este documento es más técnico: pensado para quien quiera ejecutar el proyecto en su propio ordenador, modificarlo o entender cómo está construido.

### Cómo ejecutarlo en local

No hace falta ni servidor ni instalar dependencias: es HTML, CSS y JavaScript puro.

1. Descarga o clona este repositorio.
2. Abre el archivo `index.html` haciendo doble clic (o arrástralo a una pestaña del navegador).

Eso es todo. El progreso se guarda en el `localStorage` del navegador que uses.

### Despliegue

La versión pública está desplegada en **Vercel** como sitio estático: [https://juego-oracle.vercel.app/](https://juego-oracle.vercel.app/). Al no tener build ni backend, cualquier plataforma de hosting estático (Vercel, Netlify, GitHub Pages...) sirve igual de bien: basta con publicar los archivos tal cual.

### Cómo se navega dentro de la app

Al entrar aparece primero una **landing** (portada con logo, hero y tarjetas de acceso). Desde ahí:
- **🚀 Comenzar misión** te lleva directo al siguiente nivel pendiente.
- **📚 Continuar aprendizaje** te lleva al dashboard con tu progreso.
- Haciendo clic en el logo de la barra lateral, dentro de la app, vuelves a la landing en cualquier momento.

### Estructura de archivos

- `index.html` — landing + esqueleto de la app y pantallas.
- `styles.css` — estilos visuales (tema oscuro con la paleta de marca Stemdo, landing, dashboard con KPIs/anillos de progreso, tarjetas, confeti, microinteracciones, responsive).
- `data.js` — todo el contenido educativo: los 18 niveles (teoría, ejemplos, errores típicos, quiz, ejercicios, retos) y el banco de preguntas para los simulacros.
- `script.js` — lógica de la aplicación: landing, navegación, gamificación (XP/insignias/confeti), progreso, tiempo de estudio, repaso de errores, simulacro cronometrado.
- `logo.png` / `fondo.png` — activos de marca Stemdo (logo en cabecera/sidebar, fondo usado como banner del hero de la landing).

### Diseño y marca

La paleta de color (`:root` en `styles.css`) se extrajo directamente de `fondo.png`: negro carbón de fondo + índigo (`--accent`) como color principal, más teal, rojo y violeta como acentos secundarios en tarjetas, KPIs, anillos de progreso y confeti. Cambiar la marca en el futuro es tan sencillo como editar esas variables.

### Origen del contenido

Este proyecto parte de dos documentos de apuntes básicos de SQL (uno en dialecto PostgreSQL, otro académico genérico con toques de MySQL). **Ninguno de los dos usaba sintaxis Oracle real.**

Por eso, dentro de cada nivel, cada bloque de teoría lleva una etiqueta:

- 🟦 **De tus apuntes** — contenido adaptado directamente de los documentos originales (traducido a sintaxis Oracle cuando era necesario).
- 🟧 **Contenido añadido para certificación** — contenido nuevo, necesario para el temario oficial 1Z0-071, que no estaba en los apuntes originales (funciones de una fila, `MERGE`, jerárquicas, `ROLLUP`/`CUBE`, secuencias, control de transacciones, expresiones regulares, etc.).

Así siempre se sabe qué es una adaptación de los apuntes originales y qué es material nuevo añadido específicamente para la certificación.

### Niveles

0. Introducción a bases de datos y SQL
1. SELECT básico
2. WHERE, operadores, comparaciones y condiciones
3. ORDER BY, DISTINCT, alias y concatenación
4. Funciones de una sola fila (visión general)
5. Funciones numéricas, texto, fechas y conversión
6. Funciones de grupo
7. GROUP BY y HAVING
8. JOINs
9. Subconsultas
10. Operadores de conjunto
11. INSERT, UPDATE y DELETE
12. CREATE TABLE, ALTER TABLE y DROP TABLE
13. Constraints
14. Vistas, secuencias, sinónimos e índices
15. Control de transacciones: COMMIT, ROLLBACK, SAVEPOINT
16. Simulacros tipo Oracle 1Z0-071
17. Nivel experto — retos mezclados tipo examen real

### Mecánica de juego (detalle)

- **XP y rangos nominales**: cada quiz acertado, ejercicio resuelto y reto superado da puntos de experiencia. Además, según los niveles base (0-15) que completes, subes de rango: 🧭 SQL Explorer → 🧱 Query Builder → 🔗 Join Master → 📊 Aggregate Expert → 🛡️ Oracle Specialist → 🎓 Certification Ready. El rango se ve en la barra lateral, en la landing y en un stepper visual del dashboard.
- **Insignias**: dos grupos en la pantalla "Insignias". *Progreso de certificación* — 6 insignias nominales (SQL Explorer, Join Master, Aggregate Expert, Subquery Hunter, Oracle Specialist, Certification Ready) ligadas a completar el nivel del temario correspondiente (N1, N8, N7, N9, N15 y los 16 niveles base respectivamente). *Logros* — hitos adicionales (primer paso, quiz perfecto, primer simulacro superado, nivel experto superado, repasador aplicado, racha de 3 días). Las insignias bloqueadas muestran su condición exacta de desbloqueo.
- **Progreso por nivel**: barra de avance y estado (bloqueado / en curso / completado) por nivel, guardado en `localStorage`.
- **Dashboard con KPIs**: rango actual, XP, insignias, quiz completados, % de aciertos, errores pendientes, tiempo de estudio activo y racha de días, con anillos de progreso circulares y un mensaje motivacional que cambia según el avance real.
- **Confeti y microinteracciones**: al completar un nivel o aprobar un simulacro se lanza una animación de confeti (Canvas, sin librerías externas); botones, tarjetas e insignias tienen hover/press sutiles.
- **Repaso inteligente de errores**: cada fallo en un quiz o simulacro se guarda con la pregunta, la respuesta dada y la explicación correcta. Los ejercicios y retos donde se marca "🙈 Necesité la solución" también quedan registrados (con el enunciado y la solución) para repasarlos más tarde. La pantalla "Repaso de errores" muestra un anillo de **evolución** (dominados vs. pendientes) y un botón **"Repasar solo estos errores"** que lanza una ronda dirigida solo con lo pendiente: las preguntas se responden de nuevo tipo test, los ejercicios/retos se autoevalúan con "Ahora sí lo tengo" / "Todavía no".
- **Simulacro cronometrado**: en el nivel 16 y el nivel experto se genera un examen de N preguntas aleatorias del banco completo con temporizador, igual que en Oracle.

### Hoja de ruta

Ya implementados: rebranding con landing y KPIs, y el sistema de rangos/insignias nominales con repaso inteligente. Pendientes en la hoja de ruta más amplia: análisis de debilidades por categoría del temario, certificado descargable y ranking.

### Extender el contenido

Todo el contenido vive en `data.js` como un único objeto `APP_DATA`. Para añadir preguntas, ejercicios o niveles nuevos solo hay que editar ese archivo siguiendo la misma estructura; `script.js` no necesita cambios para contenido nuevo dentro de un nivel existente.

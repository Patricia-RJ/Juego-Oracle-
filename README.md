# Oracle SQL Quest — Preparación gamificada para 1Z0-071

Aplicación web (HTML + CSS + JS puro, sin dependencias ni build) para aprender SQL Oracle desde cero hasta el nivel de la certificación **Oracle Database SQL 1Z0-071**.

## Cómo abrirla

Abre `index.html` directamente en el navegador (doble clic). No necesita servidor, ni instalación, ni conexión a internet. El progreso se guarda en `localStorage` del navegador.

## Estructura de archivos

- `index.html` — esqueleto de la app y pantallas.
- `styles.css` — estilos visuales (tema oscuro, tarjetas, barras de progreso, etc.).
- `data.js` — todo el contenido educativo: los 18 niveles (teoría, ejemplos, errores típicos, quiz, ejercicios, retos) y el banco de preguntas para los simulacros.
- `script.js` — lógica de la aplicación: navegación, puntuación, progreso, repaso de errores, simulacro cronometrado.

## Origen del contenido

Este proyecto parte de dos documentos de apuntes básicos de SQL (uno en dialecto PostgreSQL, otro académico genérico con toques de MySQL). **Ninguno de los dos usaba sintaxis Oracle real.**

Por eso, dentro de cada nivel, cada bloque de teoría lleva una etiqueta:

- 🟦 **De tus apuntes** — contenido adaptado directamente de tus documentos (traducido a sintaxis Oracle cuando era necesario).
- 🟧 **Contenido añadido para certificación** — contenido nuevo, necesario para el temario oficial 1Z0-071, que no estaba en tus apuntes originales (funciones de una fila, `MERGE`, jerárquicas, `ROLLUP`/`CUBE`, secuencias, control de transacciones, expresiones regulares, etc.).

Así siempre sabes qué es una adaptación de lo tuyo y qué es material nuevo que debes estudiar con más atención por ser desconocido.

## Niveles

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

## Mecánica de juego

- **XP y niveles**: cada quiz acertado, ejercicio resuelto y reto superado da puntos de experiencia.
- **Progreso por nivel**: barra de avance y estado (bloqueado / en curso / completado) por nivel, guardado en `localStorage`.
- **Registro de errores**: cada fallo en un quiz o simulacro se guarda con la pregunta, tu respuesta y la explicación correcta, disponible en la pantalla "Repaso de errores".
- **Simulacro cronometrado**: en el nivel 16 y el nivel experto se genera un examen de N preguntas aleatorias del banco completo con temporizador, igual que en Oracle.

## Extender el contenido

Todo el contenido vive en `data.js` como un único objeto `APP_DATA`. Para añadir preguntas, ejercicios o niveles nuevos solo hay que editar ese archivo siguiendo la misma estructura; `script.js` no necesita cambios para contenido nuevo dentro de un nivel existente.

#!/usr/bin/env node
/*
Validador de export/ (banco de preguntas Oracle exportado como JSON + imagenes).

USO:
  node validate.js            (ejecutar desde dentro de export/)
  node export/validate.js     (ejecutar desde la raiz del proyecto)

Es de solo lectura: nunca modifica ningun archivo. Analiza exams/*.json (estructura, contenido
y consistencia con las imagenes) y genera un informe de errores/avisos por consola.

Codigo de salida: 0 si no hay errores (puede haber avisos), 1 si hay al menos un error.
No depende de nada del proyecto original: es autocontenido, pensado para viajar junto a
esta carpeta export/ si se entrega a otra persona.

Historial: ampliado tras la auditoria de contenido del 2026-09-24, que reviso las 714
preguntas una por una (no solo estructura) y encontro clases de error que la version anterior
de este validador no detectaba (ver seccion "COMPROBACIONES DE CONTENIDO" mas abajo).
*/
const fs = require("fs");
const path = require("path");

const EXPORT_ROOT = __dirname;
const EXAMS_DIR = path.join(EXPORT_ROOT, "exams");

const REQUIRED_FIELDS = [
  "id", "bankId", "set", "category", "type", "question", "question_en",
  "imagePath", "options", "correct", "solution", "solution_en",
  "explanation", "explanation_en", "source"
];
const REQUIRED_OPTION_FIELDS = ["letter", "text", "text_en"];
const ALLOWED_CATEGORIES = new Set([
  "Consultas y funciones", "Combinación de datos", "Manipulación y definición de datos",
  "Seguridad y diccionario de datos", "Otros"
]);
const ALLOWED_TYPES = new Set(["single-choice", "multiple-choice", "true-false"]);

const NUMBER_WORDS = { one: 1, uno: 1, two: 2, dos: 2, three: 3, tres: 3, four: 4, cuatro: 4, five: 5, cinco: 5 };
function detectStatedCount(questionText) {
  const t = questionText || "";
  let m = t.match(/\bchoose\s+(one|two|three|four|five|\d+)\b/i);
  if (!m) m = t.match(/\bselect\s+(one|two|three|four|five|\d+)\s+(option|answer|statement|response)/i);
  if (!m) m = t.match(/\b(?:elige|seleccion[ae])\s+(uno|dos|tres|cuatro|cinco|\d+)\b/i);
  if (!m) return null;
  const w = m[1].toLowerCase();
  return NUMBER_WORDS[w] !== undefined ? NUMBER_WORDS[w] : parseInt(w, 10);
}

// Normalizacion "fuerte": colapsa espacios/saltos de linea, quita un prefijo de letra pegado
// en el propio texto ("A. ", "B )") y un punto final suelto. Dos opciones que solo difieren en
// eso son, en la practica, la misma opcion repetida -- descubierto en la auditoria del
// 2026-09-24 (examen-2-q36 tenia "B. Foo." y "C .Foo" como si fueran opciones distintas).
function normText(t) {
  let s = (t || "").replace(/\r\n?/g, "\n").split("\n").map(l => l.trim().replace(/[ \t]+/g, " ")).join("\n").trim();
  s = s.replace(/^[A-Za-z]\s*[\.\)]\s*/, "").replace(/\.\s*$/, "");
  return s.toLowerCase();
}

// --- Comprobaciones de CONTENIDO (mas alla de la estructura) ---
const MOJIBAKE_RE = /Ã©|Ã¡|Ã­|Ã³|Ãº|Ã±|â€™|â€œ|â€\x9d|Â |�/;
const HTML_RE = /<\/?[a-zA-Z][^>]*>|&nbsp;|&amp;|&lt;|&gt;|&quot;/;
const DUMP_PROMO_RE = /\bdump(s)?\b|braindump|pass4sure|examtopics|certkiller|\bvce\b|www\.\S+\.\w+|copyright|all rights reserved|100%\s*(valid|guaranteed)/i;
const PLATFORM_UI_RE = /\bquestion\s+\d+\s+of\s+\d+\b|\bunattempted\b|^\s*(answer|review)\s*$/i;
const LEAKED_NUMBERING_RE = /^\d+\.\s+\S/;

function textContentIssues(label, text) {
  const issues = [];
  if (!text) return issues;
  if (MOJIBAKE_RE.test(text)) issues.push(`${label}: posibles caracteres corruptos (mojibake)`);
  if (HTML_RE.test(text)) issues.push(`${label}: restos de HTML`);
  if (DUMP_PROMO_RE.test(text)) issues.push(`${label}: texto promocional/de sitio de examenes de dudosa procedencia`);
  if (PLATFORM_UI_RE.test(text)) issues.push(`${label}: restos de interfaz de una plataforma de examen (numeracion de pregunta, botones Answer/Review/Unattempted)`);
  if (LEAKED_NUMBERING_RE.test(text.trim())) issues.push(`${label}: empieza con numeracion tipo lista ("N. ") -- posible fragmento de otra pregunta pegado por error`);
  return issues;
}

const CATEGORY_KEYWORDS = {
  "Consultas y funciones": ["select", "where", "order by", "group by", "having", "distinct", "round(", "trunc(", "ceil(", "floor(", "mod(", "to_char", "to_date", "to_number", "substr", "instr", "nvl", "decode(", "case when", "sysdate", "count(", "sum(", "avg(", "min(", "max("],
  "Combinación de datos": ["join", "subquery", "sub-query", "correlated", "union", "intersect", "minus", "exists", "in (select", "cartesian"],
  "Manipulación y definición de datos": ["insert into", "update ", "delete from", "merge into", "create table", "alter table", "drop table", "truncate table", "constraint", "primary key", "foreign key", "commit", "rollback", "savepoint", "create view", "create sequence", "create synonym", "create index"],
  "Seguridad y diccionario de datos": ["grant", "revoke", "privilege", "role", "dba_", "user_", "all_", "data dictionary"]
};

// --- Deteccion de casi-duplicados entre preguntas (no solo texto identico) ---
const BOILERPLATE_LINE_RE = /^view and examine the following (available responses|sql exhibit)\.?$|^view (the )?exhibit and examine\b|^exhibit:?\s*\d*:?$|^identity? the result of the query execution\.?$/i;
function coreSignature(text) {
  const lines = (text || "").split("\n").map(l => l.trim()).filter(Boolean);
  const meaningful = lines.filter(l => !BOILERPLATE_LINE_RE.test(l));
  return meaningful.join(" ")
    .replace(/[‘’‚′]/g, "'").replace(/[“”″]/g, '"')
    .replace(/\s+/g, " ").trim().toLowerCase();
}
function tokenSet(text) {
  return new Set((text || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(w => w.length > 3));
}
function jaccard(a, b) {
  const inter = new Set([...a].filter(x => b.has(x)));
  const union = new Set([...a, ...b]);
  return union.size === 0 ? 0 : inter.size / union.size;
}

const errors = [];
const warnings = [];
function err(file, id, msg) { errors.push({ file, id, msg }); }
function warn(file, id, msg) { warnings.push({ file, id, msg }); }

if (!fs.existsSync(EXAMS_DIR)) { console.error(`No se encuentra la carpeta ${EXAMS_DIR}`); process.exit(1); }
const files = fs.readdirSync(EXAMS_DIR).filter(f => f.endsWith(".json")).sort();
if (files.length === 0) { console.error("No hay ningun archivo .json en exams/"); process.exit(1); }

const idsSeenGlobally = new Map();
const allQuestions = []; // { file, q } -- para la comparacion cruzada de casi-duplicados
let totalQuestions = 0;

for (const file of files) {
  const filePath = path.join(EXAMS_DIR, file);
  let questions;
  try { questions = JSON.parse(fs.readFileSync(filePath, "utf8")); }
  catch (e) { err(file, null, `JSON invalido: ${e.message}`); continue; }
  if (!Array.isArray(questions)) { err(file, null, "El archivo no contiene un array de preguntas en la raiz."); continue; }

  const idsInFile = new Set();

  for (const q of questions) {
    totalQuestions++;
    const id = q.id || "(sin id)";
    allQuestions.push({ file, q });

    for (const field of REQUIRED_FIELDS) if (!(field in q)) err(file, id, `Falta el campo obligatorio "${field}".`);

    if (!q.id) err(file, id, "Pregunta sin id.");
    else {
      if (idsInFile.has(q.id)) err(file, id, `id duplicado dentro del mismo archivo.`);
      idsInFile.add(q.id);
      if (idsSeenGlobally.has(q.id) && idsSeenGlobally.get(q.id) !== file) err(file, id, `id duplicado con ${idsSeenGlobally.get(q.id)}.`);
      else idsSeenGlobally.set(q.id, file);
    }

    if (!q.question || !String(q.question).trim()) err(file, id, "Falta el texto de la pregunta (question).");
    else textContentIssues("question", q.question).forEach(m => warn(file, id, m));

    if (!Array.isArray(q.options) || q.options.length === 0) { err(file, id, "La pregunta no tiene opciones."); continue; }
    if (q.options.length > 8) warn(file, id, `numero de opciones inusualmente alto (${q.options.length}) -- posible contenido ajeno fusionado con las opciones reales`);

    q.options.forEach(o => {
      const okeys = Object.keys(o);
      REQUIRED_OPTION_FIELDS.filter(f => !okeys.includes(f)).forEach(f => err(file, id, `opcion "${o.letter}" sin campo "${f}".`));
      textContentIssues(`opcion ${o.letter}`, o.text).forEach(m => warn(file, id, m));
    });

    const letterCounts = {};
    q.options.forEach(o => { letterCounts[o.letter] = (letterCounts[o.letter] || 0) + 1; });
    Object.entries(letterCounts).filter(([, c]) => c > 1).forEach(([letter]) => err(file, id, `Letra de opcion duplicada: "${letter}" aparece mas de una vez.`));

    const textGroups = new Map();
    q.options.forEach(o => { const k = normText(o.text); if (!textGroups.has(k)) textGroups.set(k, []); textGroups.get(k).push(o.letter); });
    Array.from(textGroups.values()).filter(g => g.length > 1).forEach(g => err(file, id, `Opciones con texto equivalente (ignorando prefijo de letra/punto final): [${g.join(", ")}].`));

    const validLetters = new Set(q.options.map(o => o.letter));
    const correct = Array.isArray(q.correct) ? q.correct : null;
    if (correct === null) err(file, id, `"correct" debe ser un array (aunque este vacio).`);
    else correct.filter(l => !validLetters.has(l)).forEach(l => err(file, id, `"correct" referencia la letra "${l}", que no existe entre las opciones.`));

    const n = correct ? correct.length : 0;
    if (n === 0) warn(file, id, `Sin ninguna respuesta correcta marcada (correct: []) -- no se puede verificar el type.`);
    else if (n === 1) { if (q.type === "multiple-choice") err(file, id, `type="multiple-choice" pero solo hay 1 respuesta correcta.`); }
    else {
      if (q.type === "single-choice" || q.type === "true-false") err(file, id, `type="${q.type}" pero hay ${n} respuestas correctas -- la interfaz de una sola seleccion no permitira acertar.`);
      else if (q.type !== "multiple-choice") warn(file, id, `type="${q.type}" no reconocido con ${n} respuestas correctas.`);
    }
    if (!ALLOWED_TYPES.has(q.type)) err(file, id, `type desconocido: "${q.type}".`);

    const stated = detectStatedCount(q.question);
    if (stated !== null && stated >= 2 && stated !== n) warn(file, id, `El enunciado dice "Choose ${stated}" pero hay ${n} respuesta(s) correcta(s) marcada(s).`);

    if (!ALLOWED_CATEGORIES.has(q.category)) err(file, id, `categoria fuera de las 5 permitidas: "${q.category}".`);
    else if (q.category !== "Otros") {
      const haystack = (q.question + " " + q.options.map(o => o.text).join(" ")).toLowerCase();
      const scores = {};
      for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) scores[cat] = kws.filter(k => haystack.includes(k)).length;
      const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
      if (best && best[1] >= 2 && scores[q.category] === 0) {
        warn(file, id, `categoria "${q.category}" sin coincidencias de palabras clave propias; el contenido parece encajar mejor en "${best[0]}" (revisar clasificacion).`);
      }
    }

    if (q.imagePath) {
      const abs = path.join(EXPORT_ROOT, q.imagePath);
      if (!fs.existsSync(abs)) err(file, id, `imagePath apunta a un archivo que no existe: ${q.imagePath}`);
    }
  }
}

// --- imagenes en disco sin ninguna pregunta que las referencie ---
const IMAGES_DIR = path.join(EXPORT_ROOT, "provider", "certifications", "oracle-database-sql-certified-associate");
if (fs.existsSync(IMAGES_DIR)) {
  const referenced = new Set();
  allQuestions.forEach(({ q }) => { if (q.imagePath) referenced.add(q.imagePath.split("/").pop()); });
  fs.readdirSync(IMAGES_DIR).filter(f => !referenced.has(f)).forEach(f => warn("(global)", null, `Imagen sin ninguna pregunta que la referencie: ${f}`));
}

// --- casi-duplicados entre preguntas (posible mismo contenido con distinta respuesta) ---
const MIN_SIGNATURE_LEN = 60;
for (let i = 0; i < allQuestions.length; i++) {
  const a = allQuestions[i];
  const sigA = coreSignature(a.q.question);
  if (sigA.length < MIN_SIGNATURE_LEN) continue; // depende de una imagen/muy generico: no verificable por texto
  const ta = tokenSet(a.q.question);
  if (ta.size < 4) continue;
  for (let j = i + 1; j < allQuestions.length; j++) {
    const b = allQuestions[j];
    if (a.q.id === b.q.id) continue;
    const sigB = coreSignature(b.q.question);
    if (sigB.length < MIN_SIGNATURE_LEN) continue;
    const tb = tokenSet(b.q.question);
    if (tb.size < 4) continue;
    const sim = jaccard(ta, tb);
    const lenRatio = Math.min(a.q.question.length, b.q.question.length) / Math.max(a.q.question.length, b.q.question.length);
    if (sim < 0.9 || lenRatio < 0.85) continue;
    const sameCore = sigA.includes(sigB.slice(0, Math.min(40, sigB.length))) || sigB.includes(sigA.slice(0, Math.min(40, sigA.length)));
    if (!sameCore) continue;
    const ctA = new Set(a.q.correct.map(l => { const o = a.q.options.find(x => x.letter === l); return o ? normText(o.text) : l; }));
    const ctB = new Set(b.q.correct.map(l => { const o = b.q.options.find(x => x.letter === l); return o ? normText(o.text) : l; }));
    const agree = ctA.size === ctB.size && [...ctA].every(x => ctB.has(x));
    if (!agree) warn(a.file, a.q.id, `posible misma pregunta que ${b.q.id} (${b.file}) con distinta respuesta correcta -- revisar manualmente (similitud ${(sim * 100).toFixed(0)}%).`);
  }
}

console.log(`Archivos analizados: ${files.length}`);
console.log(`Preguntas analizadas: ${totalQuestions}`);
console.log(`Errores: ${errors.length}`);
console.log(`Avisos: ${warnings.length}`);
console.log("");

if (errors.length) {
  console.log("=== ERRORES ===");
  errors.forEach(e => console.log(`[${e.file}] ${e.id || ""}: ${e.msg}`));
  console.log("");
}
if (warnings.length) {
  console.log("=== AVISOS (revisar, no bloquean) ===");
  warnings.forEach(w => console.log(`[${w.file}] ${w.id || ""}: ${w.msg}`));
}

process.exit(errors.length > 0 ? 1 : 0);

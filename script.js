/* ============================================================
   Oracle SQL Quest — lógica de la aplicación
   Sin dependencias externas. Estado persistido en localStorage.
   ============================================================ */

const STORAGE_KEY = "oracleSqlQuestState_v1";

const XP_RULES = { quizCorrect: 10, exercise: 20, challenge: 30, levelComplete: 50, examPass: 80 };
const PASS_RATIO = 0.7; // % mínimo de aciertos en el quiz de un nivel para darlo por completado

/* ---------------- Estado ---------------- */

function defaultState() {
  return {
    xp: 0,
    levels: {},        // { [levelId]: { quizScore, quizTotal, quizDone, exercisesDone: [idx], challengesDone: [idx], completed } }
    errorLog: [],       // { id, question, options, correctIndex, yourIndex, explain, topic, category, ts }
    badges: [],         // lista de ids de insignia conseguidas
    examHistory: [],    // { levelId, score, total, minutes, elapsedSeconds, ts }
    streakDays: 0,
    lastActiveDate: null,
    studyMinutes: 0,    // minutos activos acumulados (Fase 3: tiempo de estudio)
    categoryStats: {},  // { [categoria]: { correct, total } } — base del radar/heatmap de Analytics
    history: [],        // snapshots diarios: { date, xp, certPct, aciertoPct, studyMinutes }
    studentName: ""     // nombre para el certificado
  };
}

let STATE = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return Object.assign(defaultState(), parsed);
  } catch (e) {
    return defaultState();
  }
}

function saveState() {
  if (DEMO_ACTIVE) return; // los datos ficticios del modo demo nunca se persisten
  localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE));
}

function getLevelState(levelId) {
  if (!STATE.levels[levelId]) {
    STATE.levels[levelId] = { quizScore: 0, quizTotal: 0, quizDone: false, exercisesDone: [], challengesDone: [], completed: false };
  }
  return STATE.levels[levelId];
}

function updateStreak() {
  const today = new Date().toISOString().slice(0, 10);
  if (STATE.lastActiveDate === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  STATE.streakDays = (STATE.lastActiveDate === yesterday) ? STATE.streakDays + 1 : 1;
  STATE.lastActiveDate = today;
  recordDailySnapshot(today);
  saveState();
}

function recordDailySnapshot(dateStr) {
  const preguntas = totalQuizPreguntas();
  STATE.history.push({
    date: dateStr,
    xp: STATE.xp,
    certPct: overallCertificationPercent(),
    aciertoPct: preguntas ? Math.round((totalQuizAciertos() / preguntas) * 100) : 0,
    studyMinutes: STATE.studyMinutes
  });
  if (STATE.history.length > 60) STATE.history = STATE.history.slice(-60);
}

function addXP(amount) {
  STATE.xp += amount;
  saveState();
  renderTopStats();
  toast(`+${amount} XP`);
}

/* ---------------- Rangos (Fase 4) ---------------- */
/* Progresión nominal ligada al número de niveles base (0-15) completados. */

const RANKS = [
  { id: "r1", name: "SQL Explorer", min: 0 },
  { id: "r2", name: "Query Builder", min: 3 },
  { id: "r3", name: "Join Master", min: 6 },
  { id: "r4", name: "Aggregate Expert", min: 9 },
  { id: "r5", name: "Oracle Specialist", min: 12 },
  { id: "r6", name: "Certification Ready", min: 16 }
];

function getCurrentRank() {
  const n = completedCoreLevelsCount();
  let current = RANKS[0];
  RANKS.forEach(r => { if (n >= r.min) current = r; });
  return current;
}

function getNextRank() {
  const n = completedCoreLevelsCount();
  return RANKS.find(r => r.min > n) || null;
}

function getRankProgressPercent() {
  const n = completedCoreLevelsCount();
  const current = getCurrentRank();
  const next = getNextRank();
  if (!next) return 100;
  const span = next.min - current.min;
  return Math.round(((n - current.min) / span) * 100);
}

function renderRankStepper() {
  const n = completedCoreLevelsCount();
  const currentId = getCurrentRank().id;
  const steps = RANKS.map(r => {
    const reached = n >= r.min;
    return `<div class="rank-step ${reached ? "reached" : ""} ${r.id === currentId ? "current" : ""}">
      <span class="rank-step-name">${r.name}</span>
    </div>`;
  });
  return `<div class="rank-stepper">${steps.join(`<div class="rank-step-connector"></div>`)}</div>`;
}

/* ---------------- Insignias (Fase 4) ---------------- */
/* group "rango": ligadas a un nivel concreto del temario.
   group "logro": hitos adicionales de constancia/rendimiento. */

const BADGE_DEFS = [
  { id: "badge_sql_explorer", name: "SQL Explorer", group: "rango", desc: "Completa el Nivel 1 · SELECT básico.", check: s => !!(s.levels[1] && s.levels[1].completed) },
  { id: "badge_join_master", name: "Join Master", group: "rango", desc: "Completa el Nivel 8 · JOINs.", check: s => !!(s.levels[8] && s.levels[8].completed) },
  { id: "badge_aggregate_expert", name: "Aggregate Expert", group: "rango", desc: "Completa el Nivel 7 · GROUP BY y HAVING.", check: s => !!(s.levels[7] && s.levels[7].completed) },
  { id: "badge_subquery_hunter", name: "Subquery Hunter", group: "rango", desc: "Completa el Nivel 9 · Subconsultas.", check: s => !!(s.levels[9] && s.levels[9].completed) },
  { id: "badge_oracle_specialist", name: "Oracle Specialist", group: "rango", desc: "Completa el Nivel 15 · Control de transacciones.", check: s => !!(s.levels[15] && s.levels[15].completed) },
  { id: "badge_certification_ready", name: "Certification Ready", group: "rango", desc: "Completa los 16 niveles base (N0 a N15).", check: s => APP_DATA.levels.filter(l => !l.isExamLevel).every(l => s.levels[l.id] && s.levels[l.id].completed) },

  { id: "b_start", name: "Primer paso", group: "logro", desc: "Empieza a trabajar en cualquier nivel.", check: s => Object.values(s.levels).some(l => l.completed || l.quizDone || l.exercisesDone.length > 0 || l.challengesDone.length > 0) },
  { id: "b_perfectquiz", name: "Quiz perfecto", group: "logro", desc: "Acierta el 100% de las preguntas del quiz de un nivel.", check: s => Object.values(s.levels).some(l => l.quizDone && l.quizTotal > 0 && l.quizScore === l.quizTotal) },
  { id: "b_exam1", name: "Primer simulacro superado", group: "logro", desc: "Aprueba (≥70%) cualquier simulacro cronometrado.", check: s => s.examHistory.some(e => e.score / e.total >= 0.7) },
  { id: "b_expert", name: "Nivel experto superado", group: "logro", desc: "Aprueba (≥70%) el simulacro del Nivel Experto.", check: s => s.examHistory.some(e => e.levelId === 17 && e.score / e.total >= 0.7) },
  { id: "b_reviewer", name: "Repasador aplicado", group: "logro", desc: "Acumula 10 elementos en tu registro de errores (señal de que practicas de verdad).", check: s => s.errorLog.length >= 10 },
  { id: "b_streak3", name: "Racha de 3 días", group: "logro", desc: "Entra a estudiar 3 días seguidos.", check: s => s.streakDays >= 3 }
];

function checkBadges() {
  let newOnes = [];
  BADGE_DEFS.forEach(b => {
    if (!STATE.badges.includes(b.id) && b.check(STATE)) {
      STATE.badges.push(b.id);
      newOnes.push(b);
    }
  });
  if (newOnes.length) {
    saveState();
    newOnes.forEach(b => toast(`Insignia desbloqueada: ${b.name}`));
  }
}

/* ---------------- Categorías del temario (Analytics / informe del simulador) ---------------- */

const CATEGORIES = [
  { id: "SELECT" },
  { id: "JOINS" },
  { id: "Funciones" },
  { id: "GROUP BY" },
  { id: "Subconsultas" },
  { id: "DDL" },
  { id: "DML" },
  { id: "Restricciones" }
];

const CATEGORY_TO_LEVELS = {
  "SELECT": [0, 1, 2, 3, 10],
  "JOINS": [8],
  "Funciones": [4, 5],
  "GROUP BY": [6, 7],
  "Subconsultas": [9],
  "DDL": [12, 14],
  "DML": [11, 15],
  "Restricciones": [13]
};

function recordCategoryAnswer(category, correct) {
  if (!category) return;
  if (!STATE.categoryStats[category]) STATE.categoryStats[category] = { correct: 0, total: 0 };
  STATE.categoryStats[category].total++;
  if (correct) STATE.categoryStats[category].correct++;
  saveState();
}

function categoryMasteryPercent(category) {
  const s = STATE.categoryStats[category];
  if (!s || s.total === 0) return null;
  return Math.round((s.correct / s.total) * 100);
}

/* ---------------- Demo mode (Fase 6) ---------------- */

let DEMO_ACTIVE = false;
let REAL_STATE_SNAPSHOT = null;

function buildDemoState() {
  const demo = defaultState();
  demo.xp = 3200;
  demo.streakDays = 12;
  demo.studyMinutes = 640;
  demo.lastActiveDate = new Date().toISOString().slice(0, 10);
  demo.studentName = "Alumno/a Demo";

  APP_DATA.levels.forEach(level => {
    if (level.isExamLevel) return;
    if (level.id <= 12) {
      demo.levels[level.id] = {
        quizScore: level.quiz.length, quizTotal: level.quiz.length, quizDone: true,
        exercisesDone: level.exercises.map((_, i) => i),
        challengesDone: level.challenges.map((_, i) => i),
        completed: true
      };
    }
  });

  demo.examHistory = [
    { levelId: 16, score: 15, total: 20, minutes: 20, elapsedSeconds: 1080, ts: Date.now() - 86400000 * 5 },
    { levelId: 16, score: 17, total: 20, minutes: 20, elapsedSeconds: 950, ts: Date.now() - 86400000 * 1 }
  ];

  demo.categoryStats = {
    "SELECT": { correct: 27, total: 30 },
    "JOINS": { correct: 8, total: 10 },
    "Funciones": { correct: 18, total: 24 },
    "GROUP BY": { correct: 9, total: 12 },
    "Subconsultas": { correct: 5, total: 10 },
    "DDL": { correct: 10, total: 12 },
    "DML": { correct: 7, total: 8 },
    "Restricciones": { correct: 4, total: 8 }
  };

  demo.history = [];
  for (let i = 5; i >= 0; i--) {
    demo.history.push({
      date: new Date(Date.now() - i * 7 * 86400000).toISOString().slice(0, 10),
      xp: Math.round(3200 * (6 - i) / 6),
      certPct: Math.round(82 * (6 - i) / 6),
      aciertoPct: 68 + (5 - i) * 3,
      studyMinutes: Math.round(640 * (6 - i) / 6)
    });
  }

  demo.badges = BADGE_DEFS.filter(b => b.check(demo)).map(b => b.id);
  demo.errorLog = [];
  return demo;
}

function enterDemoMode() {
  if (DEMO_ACTIVE) return;
  REAL_STATE_SNAPSHOT = STATE;
  STATE = buildDemoState();
  DEMO_ACTIVE = true;
  if (typeof enterCertDemoMode === "function") enterCertDemoMode();
  const banner = document.getElementById("demo-banner");
  if (banner) banner.classList.remove("hidden");
  document.body.classList.add("demo-mode");
  toast("Modo demostración activado: los datos son ficticios, no representan progreso real");
  if (!document.getElementById("app").classList.contains("hidden")) {
    navigate(CURRENT_VIEW === "level" ? "dashboard" : CURRENT_VIEW);
  } else {
    renderHeroStats();
    renderLandingCards();
  }
  renderSidebar();
}

function exitDemoMode() {
  if (!DEMO_ACTIVE) return;
  STATE = REAL_STATE_SNAPSHOT;
  REAL_STATE_SNAPSHOT = null;
  DEMO_ACTIVE = false;
  if (typeof exitCertDemoMode === "function") exitCertDemoMode();
  const banner = document.getElementById("demo-banner");
  if (banner) banner.classList.add("hidden");
  document.body.classList.remove("demo-mode");
  toast("Modo demo desactivado: has vuelto a tu progreso real");
  if (!document.getElementById("app").classList.contains("hidden")) {
    navigate("dashboard");
  } else {
    renderHeroStats();
    renderLandingCards();
  }
  renderSidebar();
}

/* ---------------- Utilidades ---------------- */

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 2200);
}

function isLevelUnlocked(levelId) {
  if (levelId === 0) return true;
  const prev = APP_DATA.levels.find(l => l.id === levelId - 1);
  if (!prev) return true;
  const prevState = STATE.levels[prev.id];
  return !!(prevState && prevState.completed);
}

function levelProgressPercent(level) {
  const ls = getLevelState(level.id);
  if (level.isExamLevel) {
    const done = STATE.examHistory.some(e => e.levelId === level.id);
    return done ? 100 : 0;
  }
  const totalTasks = 1 + level.exercises.length + level.challenges.length; // 1 = quiz
  let done = 0;
  if (ls.quizDone) done += 1;
  done += ls.exercisesDone.length;
  done += ls.challengesDone.length;
  return totalTasks === 0 ? 0 : Math.round((done / totalTasks) * 100);
}

function maybeCompleteLevel(level) {
  const ls = getLevelState(level.id);
  if (level.isExamLevel) return;
  const pct = levelProgressPercent(level);
  if (pct >= 100 && !ls.completed) {
    ls.completed = true;
    addXP(XP_RULES.levelComplete);
    saveState();
    checkBadges();
    toast(`Nivel completado: ${level.title}`);
    launchConfetti();
  }
  saveState();
  checkBadges();
}

/* ---------------- Métricas agregadas (dashboard / landing) ---------------- */

function completedCoreLevelsCount() {
  // Solo cuenta niveles base (0-15), nunca los niveles de simulacro (16/EXP),
  // para que el % de certificación no se infle al aprobar un examen cronometrado.
  return APP_DATA.levels.filter(l => !l.isExamLevel && getLevelState(l.id).completed).length;
}

function totalExercisesCount() { return APP_DATA.levels.reduce((s, l) => s + l.exercises.length, 0); }
function totalExercisesDoneCount() { return Object.values(STATE.levels).reduce((s, l) => s + (l.exercisesDone ? l.exercisesDone.length : 0), 0); }
function totalChallengesCount() { return APP_DATA.levels.reduce((s, l) => s + l.challenges.length, 0); }
function totalChallengesDoneCount() { return Object.values(STATE.levels).reduce((s, l) => s + (l.challengesDone ? l.challengesDone.length : 0), 0); }
function totalQuizzesCompletedCount() { return Object.values(STATE.levels).filter(l => l.quizDone).length; }
function totalQuizAciertos() { return Object.values(STATE.levels).reduce((s, l) => s + (l.quizScore || 0), 0); }
function totalQuizPreguntas() { return Object.values(STATE.levels).reduce((s, l) => s + (l.quizTotal || 0), 0); }
function pendingErrorsCount() { return STATE.errorLog.filter(e => !e.mastered).length; }

function overallCertificationPercent() {
  const completed = completedCoreLevelsCount();
  const totalLevels = APP_DATA.levels.filter(l => !l.isExamLevel).length;
  return totalLevels === 0 ? 0 : Math.round((completed / totalLevels) * 100);
}

function formatMinutes(m) {
  m = m || 0;
  const h = Math.floor(m / 60), mm = m % 60;
  return h > 0 ? `${h}h ${mm}m` : `${mm} min`;
}

function findNextLevelToStudy() {
  const lvl = APP_DATA.levels.find(l => !l.isExamLevel && isLevelUnlocked(l.id) && !getLevelState(l.id).completed);
  return lvl || APP_DATA.levels[0];
}

function getMotivationalMessage() {
  const pct = overallCertificationPercent();
  const completed = completedCoreLevelsCount();
  const remainingToSim = Math.max(0, 16 - completed);
  if (pct >= 100) return { text: "¡Has completado todos los niveles! Estás listo para el simulacro final y el nivel experto." };
  if (STATE.examHistory.some(e => e.levelId === 17 && e.score / e.total >= PASS_RATIO)) return { text: "Has superado el nivel experto. ¡Dominas la certificación Oracle 1Z0-071!" };
  if (remainingToSim > 0 && remainingToSim <= 2) return { text: `Solo ${remainingToSim === 1 ? "queda 1 nivel" : "quedan " + remainingToSim + " niveles"} para desbloquear el simulador de examen.` };
  if (pct >= 70) return { text: `Has completado el ${pct}% de la certificación. ¡Excelente progreso!` };
  if (STATE.streakDays >= 3) return { text: `Llevas ${STATE.streakDays} días seguidos estudiando. La constancia es la clave del 1Z0-071.` };
  if (pendingErrorsCount() >= 8) return { text: `Tienes ${pendingErrorsCount()} errores pendientes de repasar. Un buen repaso vale más que un nivel nuevo.` };
  if (completed === 0) return { text: "Cada experto en Oracle empezó por el Nivel 0. ¡Vamos con la primera lección!" };
  return { text: `Vas por el ${pct}% del camino hacia la certificación Oracle 1Z0-071. Sigue así.` };
}

/* ---------------- Indicador circular (SVG, sin librerías) ---------------- */

function circularProgressSVG(percent, colorVar, size, stroke) {
  size = size || 84; stroke = stroke || 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const safePct = Math.min(100, Math.max(0, percent || 0));
  const offset = c - (safePct / 100) * c;
  return `
    <svg class="progress-ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--border)" stroke-width="${stroke}"></circle>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${colorVar}" stroke-width="${stroke}"
        stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${offset}"
        transform="rotate(-90 ${size / 2} ${size / 2})"></circle>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">${Math.round(safePct)}%</text>
    </svg>`;
}

/* ---------------- Confeti vanilla (Canvas, sin dependencias) ---------------- */

function launchConfetti(durationMs) {
  durationMs = durationMs || 2200;
  const canvas = document.createElement("canvas");
  canvas.id = "confetti-canvas";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const colors = ["#4f46e5", "#6d64ff", "#14b8a6", "#ef4444", "#8b7ff0", "#22c55e"];
  const pieces = Array.from({ length: 140 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height * 0.5,
    w: 6 + Math.random() * 6,
    h: 8 + Math.random() * 10,
    color: colors[Math.floor(Math.random() * colors.length)],
    speedY: 2 + Math.random() * 3,
    speedX: -1.5 + Math.random() * 3,
    rotation: Math.random() * 360,
    rotSpeed: -6 + Math.random() * 12
  }));
  const start = performance.now();
  function frame(now) {
    const elapsed = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.rotation += p.rotSpeed;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (elapsed < durationMs) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  }
  requestAnimationFrame(frame);
}

/* ---------------- Estado de preparación ---------------- */

function getPreparationStatus() {
  const pct = overallCertificationPercent();
  const examCount = STATE.examHistory.length;
  const examAvg = examCount ? STATE.examHistory.reduce((s, h) => s + (h.score / h.total * 100), 0) / examCount : 0;
  if (pct >= 90 && examAvg >= 70) return { level: "green", label: "Preparado para certificación" };
  if (pct >= 50 || examCount > 0) return { level: "yellow", label: "En progreso" };
  return { level: "red", label: "Riesgo alto" };
}

/* ---------------- Analytics (Fase 5) ---------------- */

function renderRadarChart() {
  const size = 360, center = size / 2, maxR = 82;
  const labelR = maxR + 52;
  const n = CATEGORIES.length;
  const angleStep = (Math.PI * 2) / n;
  const points = CATEGORIES.map((cat, i) => {
    const pct = categoryMasteryPercent(cat.id);
    const r = pct === null ? 0 : (pct / 100) * maxR;
    const angle = -Math.PI / 2 + i * angleStep;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  });
  const polygonPoints = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const rings = [0.25, 0.5, 0.75, 1].map(f => {
    const ringPts = CATEGORIES.map((c, i) => {
      const angle = -Math.PI / 2 + i * angleStep;
      const r = f * maxR;
      return `${(center + r * Math.cos(angle)).toFixed(1)},${(center + r * Math.sin(angle)).toFixed(1)}`;
    }).join(" ");
    return `<polygon points="${ringPts}" class="radar-ring"></polygon>`;
  }).join("");
  const labels = CATEGORIES.map((c, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const lx = center + labelR * Math.cos(angle);
    const ly = center + labelR * Math.sin(angle);
    const anchor = Math.cos(angle) > 0.3 ? "end" : Math.cos(angle) < -0.3 ? "start" : "middle";
    return `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" class="radar-label" text-anchor="${anchor}" dominant-baseline="middle">${c.id}</text>`;
  }).join("");
  return `
    <svg viewBox="0 0 ${size} ${size}" class="radar-svg">
      ${rings}
      <polygon points="${polygonPoints}" class="radar-shape"></polygon>
      ${points.map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" class="radar-dot"></circle>`).join("")}
      ${labels}
    </svg>`;
}

function renderCategoryHeatmap() {
  return `<div class="heatmap-grid">${CATEGORIES.map(c => {
    const pct = categoryMasteryPercent(c.id);
    const tier = pct === null ? "nodata" : pct >= 75 ? "high" : pct >= 50 ? "mid" : "low";
    return `<div class="heatmap-cell tier-${tier}">
      <span class="hm-name">${c.id}</span>
      <span class="hm-pct">${pct === null ? "Sin datos" : pct + "%"}</span>
    </div>`;
  }).join("")}</div>`;
}

function xpDistribution() {
  const quizXP = totalQuizAciertos() * XP_RULES.quizCorrect;
  const exerciseXP = totalExercisesDoneCount() * XP_RULES.exercise;
  const challengeXP = totalChallengesDoneCount() * XP_RULES.challenge;
  const examXP = STATE.examHistory.reduce((s, h) => s + h.score * 5 + (h.score / h.total >= PASS_RATIO ? XP_RULES.examPass : 0), 0);
  const levelBonusXP = completedCoreLevelsCount() * XP_RULES.levelComplete;
  const total = quizXP + exerciseXP + challengeXP + examXP + levelBonusXP || 1;
  return [
    { label: "Quiz", value: quizXP, color: "var(--teal)" },
    { label: "Ejercicios", value: exerciseXP, color: "var(--accent)" },
    { label: "Retos", value: challengeXP, color: "var(--purple)" },
    { label: "Simulacros", value: examXP, color: "var(--red)" },
    { label: "Bonus de nivel", value: levelBonusXP, color: "var(--green)" }
  ].map(d => ({ ...d, pct: Math.round((d.value / total) * 100) }));
}

function renderXpDistribution() {
  const dist = xpDistribution();
  return `
    <div class="dist-bar">${dist.map(d => `<div style="width:${d.pct}%; background:${d.color};" title="${d.label}: ${d.pct}%"></div>`).join("")}</div>
    <div class="dist-legend">${dist.map(d => `<span class="dist-legend-item"><span class="dist-dot" style="background:${d.color}"></span>${d.label} · ${d.pct}%</span>`).join("")}</div>`;
}

function renderEvolutionChart() {
  if (!STATE.history.length) {
    return `<p style="color:var(--text-faint); font-size:13px;">Todavía no hay historial suficiente: cada día que abras la app se añadirá un punto real a este gráfico. (En modo demo se simulan varias semanas.)</p>`;
  }
  const maxXp = Math.max(...STATE.history.map(h => h.xp), 1);
  return `<div class="evo-chart">${STATE.history.map(h => `
    <div class="evo-bar-wrap" title="${h.date}: ${h.xp} XP">
      <div class="evo-bar" style="height:${Math.max(4, Math.round((h.xp / maxXp) * 100))}%"></div>
      <span class="evo-date">${h.date.slice(5)}</span>
    </div>`).join("")}</div>`;
}

function renderAnalytics() {
  const el = document.getElementById("view-analytics");
  el.innerHTML = `
    <div class="dash-header">
      <h2>Analytics</h2>
      <p>Tu dominio real por categoría del temario 1Z0-071, calculado a partir de tus respuestas en quiz, repasos y simulacros.</p>
    </div>
    <div class="card">
      <h4>Radar de conocimientos</h4>
      ${renderRadarChart()}
    </div>
    <div class="card">
      <h4>Mapa de calor por tema</h4>
      ${renderCategoryHeatmap()}
    </div>
    <div class="card">
      <h4>Distribución del aprendizaje (XP por tipo de actividad)</h4>
      ${renderXpDistribution()}
    </div>
    <div class="card">
      <h4>Evolución</h4>
      ${renderEvolutionChart()}
    </div>
  `;
}

/* ---------------- Certificado final (Fase 8) ---------------- */

function isCertificateEligible() {
  const totalLevels = APP_DATA.levels.filter(l => !l.isExamLevel).length;
  const allDone = completedCoreLevelsCount() === totalLevels;
  const examPassed = STATE.examHistory.some(h => h.levelId === 16 && h.score / h.total >= PASS_RATIO);
  return allDone && examPassed;
}

function certificateAverageScore() {
  if (!STATE.examHistory.length) return 0;
  return Math.round(STATE.examHistory.reduce((s, h) => s + (h.score / h.total * 100), 0) / STATE.examHistory.length);
}

function editCertificateName() {
  const name = prompt("Escribe tu nombre para el certificado:", STATE.studentName || "");
  if (name) { STATE.studentName = name; saveState(); renderCertificate(); }
}

function renderCertificate() {
  const el = document.getElementById("view-certificate");
  const totalLevels = APP_DATA.levels.filter(l => !l.isExamLevel).length;

  if (!isCertificateEligible()) {
    const examOk = STATE.examHistory.some(h => h.levelId === 16 && h.score / h.total >= PASS_RATIO);
    el.innerHTML = `
      <div class="dash-header"><h2>Certificado</h2><p>Todavía no has completado los requisitos para desbloquearlo.</p></div>
      <div class="card">
        <ul class="mistake-list">
          <li>${completedCoreLevelsCount()}/${totalLevels} niveles base completados ${completedCoreLevelsCount() === totalLevels ? "(completo)" : "(pendiente)"}</li>
          <li>Simulacro del Nivel 16 aprobado (≥70%): ${examOk ? "sí" : "todavía no"}</li>
        </ul>
      </div>`;
    return;
  }

  if (!STATE.studentName) {
    const name = prompt("Escribe tu nombre para el certificado:");
    STATE.studentName = name || "Alumno/a";
    saveState();
  }

  const avg = certificateAverageScore();
  const rank = getCurrentRank();
  el.innerHTML = `
    <div class="dash-header no-print"><h2>Tu certificado</h2><p>Descárgalo como PDF con el botón de imprimir de tu navegador.</p></div>
    <div class="certificate">
      <div class="cert-brand"> STEMDO</div>
      <h1 class="cert-title">Certificado de Preparación</h1>
      <p class="cert-sub">Oracle Database SQL — 1Z0-071</p>
      <p class="cert-name">${escapeHtml(STATE.studentName)}</p>
      <p class="cert-body">ha completado el itinerario formativo de Oracle SQL Quest, alcanzando el rango
      <strong>${rank.name}</strong> con una nota media de simulacro del <strong>${avg}%</strong>
      y ${STATE.xp} XP acumulada.</p>
      <p class="cert-date">${new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}</p>
    </div>
    <div class="no-print" style="text-align:center; margin-top:20px; display:flex; gap:10px; justify-content:center;">
      <button class="btn" onclick="window.print()">Imprimir / Guardar como PDF</button>
      <button class="btn secondary" onclick="editCertificateName()">Cambiar nombre</button>
    </div>
  `;
}

/* ---------------- Landing ---------------- */

function showLanding() {
  document.getElementById("landing").classList.remove("hidden");
  document.getElementById("app").classList.add("hidden");
  renderHeroStats();
  renderLandingCards();
}

function enterApp(startView, levelId) {
  document.getElementById("landing").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  if (startView === "level") navigate("level", levelId);
  else if (startView === "certbank") navigate("certbank");
  else navigate("dashboard");
}

function renderHeroStats() {
  const el = document.getElementById("hero-stats");
  if (!el) return;
  if (STATE.xp === 0 && Object.keys(STATE.levels).length === 0) {
    el.innerHTML = `<div class="hero-stat">Aún no has empezado. ¡Dale al botón y arrancamos!</div>`;
    return;
  }
  const pct = overallCertificationPercent();
  const rank = getCurrentRank();
  const prep = getPreparationStatus();
  el.innerHTML = `
    <div class="hero-stat"><strong>${prep.label}</strong>estado del alumno</div>
    <div class="hero-stat"><strong>${rank.name}</strong>rango actual</div>
    <div class="hero-stat"><strong>${STATE.xp}</strong>XP acumulada</div>
    <div class="hero-stat"><strong>${pct}%</strong>hacia la certificación</div>
    <div class="hero-stat"><strong>${STATE.badges.length}</strong>insignias</div>
    <div class="hero-stat"><strong>${STATE.streakDays}</strong>días de racha</div>
  `;
}

function renderLandingCards() {
  const el = document.getElementById("landing-cards");
  if (!el) return;
  const exTotal = totalExercisesCount(), exDone = totalExercisesDoneCount();
  const chTotal = totalChallengesCount(), chDone = totalChallengesDoneCount();
  const certExamHistory = (typeof CERT_STATE !== "undefined") ? CERT_STATE.examHistory : [];
  const bestExam = certExamHistory.length ? Math.max(...certExamHistory.map(h => Math.round((h.score / h.total) * 100))) : null;
  const certPct = overallCertificationPercent();
  const totalLevels = APP_DATA.levels.filter(l => !l.isExamLevel).length;

  const cards = [
    { title: "Teoría", desc: "18 niveles con contenido Oracle real, marcado por origen.", status: `${totalLevels} niveles disponibles`, action: () => enterApp("level", findNextLevelToStudy().id) },
    { title: "Ejercicios", desc: "Practica cada bloque con ejercicios guiados y solución explicada.", status: `${exDone}/${exTotal} resueltos`, action: () => enterApp("level", findNextLevelToStudy().id) },
    { title: "Retos", desc: "Dificultad progresiva para poner a prueba lo aprendido.", status: `${chDone}/${chTotal} superados`, action: () => enterApp("level", findNextLevelToStudy().id) },
    { title: "Simuladores", desc: "Exámenes cronometrados con las preguntas reales importadas de los exámenes Oracle.", status: bestExam !== null ? `Mejor resultado: ${bestExam}%` : "Aún no realizado", action: () => { if (typeof CERT_TAB !== "undefined") CERT_TAB = "exam"; enterApp("certbank"); } },
    { title: "Certificación", desc: "Sigue tu progreso real hacia el examen Oracle 1Z0-071.", status: `${certPct}% completado`, action: () => enterApp("dashboard") }
  ];

  el.innerHTML = cards.map(c => `
    <div class="landing-card">
      <h3>${c.title}</h3>
      <p>${c.desc}</p>
      <span class="lcard-status">${c.status}</span>
    </div>
  `).join("");

  el.querySelectorAll(".landing-card").forEach((cardEl, i) => {
    cardEl.onclick = cards[i].action;
  });
}

/* ---------------- Navegación ---------------- */

let CURRENT_VIEW = "dashboard";
let CURRENT_LEVEL_ID = null;
let CURRENT_TAB = "teoria";

function navigate(view, levelId) {
  CURRENT_VIEW = view;
  if (levelId !== undefined) CURRENT_LEVEL_ID = levelId;
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById("view-" + view).classList.add("active");
  renderSidebar();
  if (view === "dashboard") renderDashboard();
  if (view === "level") renderLevel(CURRENT_LEVEL_ID);
  if (view === "errors") renderErrors();
  if (view === "badges") renderBadges();
  if (view === "analytics") renderAnalytics();
  if (view === "certificate") renderCertificate();
  if (view === "certbank" && typeof renderCertBank === "function") renderCertBank();
  window.scrollTo(0, 0);
}

/* ---------------- Sidebar ---------------- */

function renderTopStats() {
  document.getElementById("xp-value").textContent = STATE.xp;
  const completed = completedCoreLevelsCount();
  const totalLevels = APP_DATA.levels.filter(l => !l.isExamLevel).length;
  document.getElementById("xp-levels-done").textContent = `${completed}/${totalLevels} niveles`;
  document.getElementById("xp-streak").textContent = STATE.streakDays;
  const topbarStreak = document.getElementById("topbar-streak");
  if (topbarStreak) topbarStreak.textContent = STATE.streakDays; // antes quedaba siempre en 0
  const pct = Math.min(100, Math.round((completed / totalLevels) * 100));
  document.getElementById("xp-progress-fill").style.width = pct + "%";
  const rank = getCurrentRank();
  const sidebarRank = document.getElementById("sidebar-rank");
  if (sidebarRank) sidebarRank.textContent = rank.name;
}

function renderSidebar() {
  const list = document.getElementById("level-list");
  list.innerHTML = "";
  APP_DATA.levels.forEach(level => {
    const unlocked = isLevelUnlocked(level.id);
    const ls = getLevelState(level.id);
    const li = document.createElement("li");
    li.className = "level-item" + (!unlocked ? " locked" : "") + (ls.completed ? " completed" : "") + (CURRENT_VIEW === "level" && CURRENT_LEVEL_ID === level.id ? " active" : "");
    const statusText = ls.completed ? "Completado" : (unlocked ? "En curso" : "Bloqueado");
    li.innerHTML = `<span class="lv-title">${level.code} · ${level.title}</span><span class="lv-status">${statusText}</span>`;
    if (unlocked) li.onclick = () => navigate("level", level.id);
    list.appendChild(li);
  });
  document.querySelectorAll(".ghost-btn[data-view]").forEach(btn => {
    btn.classList.toggle("active", CURRENT_VIEW === btn.dataset.view);
  });
  renderTopStats();
}

/* ---------------- Dashboard ---------------- */

function renderDashboard() {
  const el = document.getElementById("view-dashboard");
  const completed = completedCoreLevelsCount();
  const totalLevels = APP_DATA.levels.filter(l => !l.isExamLevel).length;
  const certPct = overallCertificationPercent();
  const rank = getCurrentRank();
  const nextRank = getNextRank();
  const quizDoneCount = totalQuizzesCompletedCount();
  const aciertos = totalQuizAciertos();
  const preguntas = totalQuizPreguntas();
  const aciertoPct = preguntas ? Math.round((aciertos / preguntas) * 100) : 0;
  const pendErrors = pendingErrorsCount();
  const bestExam16Runs = STATE.examHistory.filter(e => e.levelId === 16);
  const bestExam16Pct = bestExam16Runs.length ? Math.max(...bestExam16Runs.map(h => Math.round((h.score / h.total) * 100))) : 0;
  const msg = getMotivationalMessage();
  const prep = getPreparationStatus();
  const examCount = STATE.examHistory.length;
  const examAvgPct = examCount ? Math.round(STATE.examHistory.reduce((s, h) => s + (h.score / h.total * 100), 0) / examCount) : 0;

  const cards = APP_DATA.levels.map(level => {
    const unlocked = isLevelUnlocked(level.id);
    const ls = getLevelState(level.id);
    const pct = levelProgressPercent(level);
    const tag = ls.completed ? "Completado" : (level.isExamLevel ? "Simulacro" : "");
    return `
      <div class="level-card ${unlocked ? "" : "locked"}" ${unlocked ? `onclick="navigate('level', ${level.id})"` : ""}>
        <span class="lc-tag">${tag}</span>
        <div class="lc-code">${level.code}${level.isExamLevel ? " · SIMULACRO" : ""}</div>
        <h3>${level.title}</h3>
        ${unlocked ? `
          <div class="lc-progress">
            <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
          </div>` : `<p style="color:var(--text-faint); font-size:12.5px; margin-top:8px;">Completa el nivel anterior para desbloquear</p>`}
      </div>`;
  }).join("");

  el.innerHTML = `
    <div class="dash-header">
      <h2>Tu ruta hacia el 1Z0-071</h2>
      <p>Progreso general y acceso rápido a todos los niveles.</p>
    </div>

    <div class="motivational-banner"><span>${msg.text}</span><span class="prep-pill prep-${prep.level}">${prep.label}</span></div>

    <div class="rank-card">
      ${renderRankStepper()}
      <p class="rank-caption">${nextRank ? `Te ${(nextRank.min - completed) === 1 ? "falta 1 nivel" : "faltan " + (nextRank.min - completed) + " niveles"} para alcanzar <strong>${nextRank.name}</strong>.` : `Has alcanzado el rango máximo: <strong>${rank.name}</strong>.`}</p>
    </div>

    <div class="progress-ring-row">
      <div class="ring-card">
        ${circularProgressSVG(certPct, "var(--accent)")}
        <div><div class="ring-label">Certificación</div><div class="ring-value">${certPct}% completado</div></div>
      </div>
      <div class="ring-card">
        ${circularProgressSVG(aciertoPct, "var(--teal)")}
        <div><div class="ring-label">Precisión en quizzes</div><div class="ring-value">${aciertos}/${preguntas} aciertos</div></div>
      </div>
      <div class="ring-card">
        ${circularProgressSVG(bestExam16Pct, "var(--purple)")}
        <div><div class="ring-label">Mejor simulacro (N16)</div><div class="ring-value">${bestExam16Runs.length ? bestExam16Pct + "%" : "Sin intentos"}</div></div>
      </div>
    </div>

    <div class="kpi-row">
      <div class="kpi-card"><div class="num">${rank.name}</div><div class="lbl">Rango actual · ${completed}/${totalLevels} niveles</div></div>
      <div class="kpi-card"><div class="num">${STATE.xp}</div><div class="lbl">XP acumulada</div></div>
      <div class="kpi-card"><div class="num">${STATE.badges.length}/${BADGE_DEFS.length}</div><div class="lbl">Insignias desbloqueadas</div></div>
      <div class="kpi-card"><div class="num">${quizDoneCount}/${totalLevels}</div><div class="lbl">Quiz completados</div></div>
      <div class="kpi-card">
        <div class="num">${aciertoPct}%</div><div class="lbl">Aciertos (${aciertos}/${preguntas})</div>
        <div class="sub-bar"><div class="seg-correct" style="width:${aciertoPct}%"></div><div class="seg-wrong" style="width:${100 - aciertoPct}%"></div></div>
      </div>
      <div class="kpi-card"><div class="num">${pendErrors}</div><div class="lbl">Errores pendientes</div></div>
      <div class="kpi-card"><div class="num">${formatMinutes(STATE.studyMinutes)}</div><div class="lbl">Tiempo de estudio</div></div>
      <div class="kpi-card"><div class="num">${STATE.streakDays}</div><div class="lbl">Días seguidos</div></div>
      <div class="kpi-card"><div class="num">${examCount}</div><div class="lbl">Simuladores realizados</div></div>
      <div class="kpi-card"><div class="num">${examAvgPct}%</div><div class="lbl">Nota media de simulacro</div></div>
    </div>

    <div class="card">
      <h4>Distribución del aprendizaje</h4>
      ${renderXpDistribution()}
    </div>

    <div class="level-grid">${cards}</div>
  `;
}

/* ---------------- Vista de nivel ---------------- */

function renderLevel(levelId) {
  const level = APP_DATA.levels.find(l => l.id === levelId);
  const el = document.getElementById("view-level");
  if (!level) { el.innerHTML = ""; return; }
  const ls = getLevelState(level.id);

  if (level.isExamLevel) {
    renderExamIntro(level, el);
    return;
  }

  CURRENT_TAB = CURRENT_TAB || "teoria";
  const completedBanner = ls.completed ? `<div class="complete-banner">Has completado este nivel. Puedes repasarlo cuando quieras.</div>` : "";

  el.innerHTML = `
    <div class="level-header">
      <div>
        <h2>${level.code} · ${level.title}</h2>
        <p>${level.intro}</p>
      </div>
    </div>
    ${completedBanner}
    <div class="tabs">
      <button class="tab-btn" data-tab="teoria">Teoría</button>
      <button class="tab-btn" data-tab="ejemplos">Ejemplos</button>
      <button class="tab-btn" data-tab="errores">Errores típicos</button>
      <button class="tab-btn" data-tab="quiz">Quiz (${ls.quizDone ? "hecho" : level.quiz.length + " preguntas"})</button>
      <button class="tab-btn" data-tab="ejercicios">Ejercicios</button>
      <button class="tab-btn" data-tab="retos">Retos</button>
    </div>
    <div id="tab-teoria" class="tab-pane">${renderTheory(level)}</div>
    <div id="tab-ejemplos" class="tab-pane">${renderExamples(level)}</div>
    <div id="tab-errores" class="tab-pane">${renderMistakes(level)}</div>
    <div id="tab-quiz" class="tab-pane"><div id="quiz-container"></div></div>
    <div id="tab-ejercicios" class="tab-pane">${renderExercises(level)}</div>
    <div id="tab-retos" class="tab-pane">${renderChallenges(level)}</div>
  `;

  el.querySelectorAll(".tab-btn").forEach(btn => {
    btn.onclick = () => selectTab(btn.dataset.tab);
  });
  selectTab(CURRENT_TAB, level);
}

function selectTab(tab, level) {
  CURRENT_TAB = tab;
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
  const pane = document.getElementById("tab-" + tab);
  if (pane) pane.classList.add("active");
  if (tab === "quiz") {
    const lvl = level || APP_DATA.levels.find(l => l.id === CURRENT_LEVEL_ID);
    startLevelQuiz(lvl);
  }
}

const ORACLE_OFFICIAL_DOCS_URL = "https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/index.html";

function renderTheory(level) {
  const t = level.theory;
  if (!t || !t.concepts || !t.concepts.length) return `<article class="theory-doc"><p>Sin teoría adicional en este nivel: es un bloque de simulacro.</p></article>`;

  const concepts = t.concepts.map(c => `
    <section class="theory-section">
      <h3>${escapeHtml(c.heading)}</h3>
      <p>${escapeHtml(c.explanation)}</p>
      ${c.syntax ? `<pre class="code-block theory-syntax">${escapeHtml(c.syntax)}</pre>` : ""}
      ${(c.examples || []).map(ex => `
        <pre class="code-block theory-example">${escapeHtml(ex.code)}</pre>
        ${ex.output ? `
          <div class="theory-output">
            <span class="theory-output-label">Salida esperada</span>
            <pre class="code-block theory-output-block">${escapeHtml(ex.output)}</pre>
          </div>` : ""}
      `).join("")}
    </section>
  `).join("");

  const notes = (t.oracleNotes && t.oracleNotes.length) ? `
    <section class="theory-callout theory-exam-focus">
      <h4>Matices y reglas especiales de Oracle</h4>
      <ul>${t.oracleNotes.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
    </section>` : "";

  const summary = (level.summary && level.summary.length) ? `
    <section class="theory-callout theory-summary">
      <h4>Resumen rápido</h4>
      <ul>${level.summary.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
    </section>` : "";

  const sources = (level.sourceRefs && level.sourceRefs.length) ? `
    <p class="theory-sources">Fuentes: ${level.sourceRefs.map(s => escapeHtml(s)).join(" · ")}</p>` : "";

  const docsLink = `
    <p class="theory-docs-link">
      <a href="${ORACLE_OFFICIAL_DOCS_URL}" target="_blank" rel="noopener noreferrer">
        Consultar la documentación oficial de Oracle (Database SQL Language Reference)
      </a>
    </p>`;
  return `<article class="theory-doc">${concepts}${notes}${summary}${sources}${docsLink}</article>`;
}

function renderExamples(level) {
  if (!level.examples.length) return `<div class="card"><p>Este nivel no tiene ejemplos de código propios.</p></div>`;
  return level.examples.map(ex => `
    <div class="card">
      <p class="example-title">${escapeHtml(ex.title)}</p>
      <pre class="code-block">${escapeHtml(ex.code)}</pre>
      ${ex.note ? `<p style="margin-top:8px;">${escapeHtml(ex.note)}</p>` : ""}
    </div>
  `).join("");
}

function renderMistakes(level) {
  if (!level.mistakes.length) return `<div class="card"><p>No hay errores típicos registrados para este nivel.</p></div>`;
  return `<ul class="mistake-list">${level.mistakes.map(m => `<li>${escapeHtml(m)}</li>`).join("")}</ul>`;
}

function renderExercises(level) {
  if (!level.exercises.length) return `<div class="card"><p>Este nivel no tiene ejercicios guiados.</p></div>`;
  const ls = getLevelState(level.id);
  return level.exercises.map((ex, idx) => {
    const done = ls.exercisesDone.includes(idx);
    return `
    <div class="card exercise-card">
      <h4>${escapeHtml(ex.title)} ${done ? "(hecho)" : ""}</h4>
      <p>${escapeHtml(ex.prompt)}</p>
      <details><summary>Ver pista</summary><div>${escapeHtml(ex.hint)}</div></details>
      <details><summary>Ver solución</summary><div><pre class="code-block">${escapeHtml(ex.solution)}</pre></div></details>
      <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn ${done ? "secondary" : ""}" ${done ? "disabled" : ""} onclick="markExerciseDone(${level.id}, ${idx}, false)">
          ${done ? "Ejercicio completado" : "Lo conseguí (+" + XP_RULES.exercise + " XP)"}
        </button>
        ${!done ? `<button class="btn secondary" onclick="markExerciseDone(${level.id}, ${idx}, true)">Necesité la solución</button>` : ""}
      </div>
    </div>`;
  }).join("");
}

function markExerciseDone(levelId, idx, neededHelp) {
  const ls = getLevelState(levelId);
  if (ls.exercisesDone.includes(idx)) return;
  ls.exercisesDone.push(idx);
  saveState();
  addXP(XP_RULES.exercise);
  const level = APP_DATA.levels.find(l => l.id === levelId);
  if (neededHelp) {
    const ex = level.exercises[idx];
    logError({ kind: "exercise", title: ex.title, prompt: ex.prompt, solution: ex.solution, topic: level.title });
  }
  maybeCompleteLevel(level);
  renderLevel(levelId);
  selectTab("ejercicios");
}

function renderChallenges(level) {
  if (!level.challenges.length) return `<div class="card"><p>Este nivel no tiene retos adicionales.</p></div>`;
  const ls = getLevelState(level.id);
  return level.challenges.map((ch, idx) => {
    const done = ls.challengesDone.includes(idx);
    const diffLabel = ch.level === 1 ? "Reto 1" : ch.level === 2 ? "Reto 2 (difícil)" : "Reto " + ch.level;
    return `
    <div class="card exercise-card">
      <h4>${diffLabel} ${done ? "(hecho)" : ""}<span class="diff-badge">Dificultad ${ch.level}</span></h4>
      <p>${escapeHtml(ch.prompt)}</p>
      <details><summary>Ver solución propuesta</summary><div><pre class="code-block">${escapeHtml(ch.solution)}</pre></div></details>
      <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn ${done ? "secondary" : ""}" ${done ? "disabled" : ""} onclick="markChallengeDone(${level.id}, ${idx}, false)">
          ${done ? "Reto superado" : "Lo conseguí (+" + XP_RULES.challenge + " XP)"}
        </button>
        ${!done ? `<button class="btn secondary" onclick="markChallengeDone(${level.id}, ${idx}, true)">Necesité la solución</button>` : ""}
      </div>
    </div>`;
  }).join("");
}

function markChallengeDone(levelId, idx, neededHelp) {
  const ls = getLevelState(levelId);
  if (ls.challengesDone.includes(idx)) return;
  ls.challengesDone.push(idx);
  saveState();
  addXP(XP_RULES.challenge);
  const level = APP_DATA.levels.find(l => l.id === levelId);
  if (neededHelp) {
    const ch = level.challenges[idx];
    logError({ kind: "challenge", title: "Reto de nivel " + ch.level, prompt: ch.prompt, solution: ch.solution, topic: level.title });
  }
  maybeCompleteLevel(level);
  renderLevel(levelId);
  selectTab("retos");
}

/* ---------------- Quiz de nivel ---------------- */

let QUIZ_STATE = null;

function startLevelQuiz(level) {
  const container = document.getElementById("quiz-container");
  if (!container) return;
  if (!level.quiz.length) {
    container.innerHTML = `<div class="card"><p>Este nivel no tiene preguntas de quiz.</p></div>`;
    return;
  }
  QUIZ_STATE = { level, index: 0, correct: 0, answered: false, results: [] };
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const container = document.getElementById("quiz-container");
  const { level, index } = QUIZ_STATE;
  if (index >= level.quiz.length) {
    finishLevelQuiz();
    return;
  }
  const q = level.quiz[index];
  QUIZ_STATE.answered = false;
  container.innerHTML = `
    <div class="card">
      <div class="quiz-progress">Pregunta ${index + 1} de ${level.quiz.length}</div>
      <p class="quiz-question">${escapeHtml(q.q)}</p>
      <div class="option-list">
        ${q.options.map((opt, i) => `<button class="option-btn" data-i="${i}">${escapeHtml(opt)}</button>`).join("")}
      </div>
      <div id="quiz-explain"></div>
      <button class="btn" id="quiz-next-btn" style="display:none;">Siguiente</button>
    </div>
  `;
  container.querySelectorAll(".option-btn").forEach(btn => {
    btn.onclick = () => answerQuizQuestion(parseInt(btn.dataset.i, 10));
  });
}

function answerQuizQuestion(selectedIdx) {
  if (QUIZ_STATE.answered) return;
  QUIZ_STATE.answered = true;
  const { level, index } = QUIZ_STATE;
  const q = level.quiz[index];
  const correct = selectedIdx === q.a;
  document.querySelectorAll(".option-btn").forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.a) btn.classList.add("correct");
    else if (i === selectedIdx) btn.classList.add("incorrect");
  });
  document.getElementById("quiz-explain").innerHTML = `<div class="explain-box">${correct ? "¡Correcto! " : "No es correcto. "}${escapeHtml(q.exp)}</div>`;
  document.getElementById("quiz-next-btn").style.display = "inline-block";
  document.getElementById("quiz-next-btn").onclick = () => { QUIZ_STATE.index++; renderQuizQuestion(); };

  recordCategoryAnswer(level.category, correct);
  if (correct) {
    QUIZ_STATE.correct++;
    addXP(XP_RULES.quizCorrect);
  } else {
    logError({ question: q.q, options: q.options, correctIndex: q.a, yourIndex: selectedIdx, explain: q.exp, topic: level.title, category: level.category });
  }
  QUIZ_STATE.results.push(correct);
}

function finishLevelQuiz() {
  const container = document.getElementById("quiz-container");
  const { level, correct } = QUIZ_STATE;
  const total = level.quiz.length;
  const ls = getLevelState(level.id);
  ls.quizScore = correct;
  ls.quizTotal = total;
  ls.quizDone = true;
  saveState();
  maybeCompleteLevel(level);

  const ratio = correct / total;
  container.innerHTML = `
    <div class="card quiz-result">
      <div class="big-score">${correct}/${total}</div>
      <p style="margin-top:8px;">${ratio >= PASS_RATIO ? "¡Muy bien! Dominas este bloque." : "Repasa la teoría y vuelve a intentarlo cuando quieras."}</p>
      <button class="btn secondary" style="margin-top:16px;" onclick="startLevelQuiz(APP_DATA.levels.find(l=>l.id===${level.id}))">Repetir quiz</button>
    </div>
  `;
}

/* ---------------- Registro y repaso de errores ---------------- */

function logError(entry) {
  entry.id = "err_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
  entry.ts = Date.now();
  entry.mastered = false;
  entry.kind = entry.kind || "quiz"; // "quiz" (pregunta fallada) | "exercise" | "challenge" (necesitó la solución)
  STATE.errorLog.unshift(entry);
  saveState();
  checkBadges();
}

function renderErrorCard(e, canMaster) {
  if (e.kind === "exercise" || e.kind === "challenge") {
    return `
    <div class="error-card">
      <div class="eq">${e.kind === "exercise" ? "Ejercicio" : "Reto"} · ${escapeHtml(e.title || "")}</div>
      <p style="color:var(--text-dim); font-size:13px; margin:0 0 10px;">${escapeHtml(e.prompt)}</p>
      <details><summary>Ver solución</summary><div><pre class="code-block">${escapeHtml(e.solution)}</pre></div></details>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
        <span class="pill">${escapeHtml(e.topic)}</span>
        ${canMaster ? `<button class="btn secondary" onclick="masterError('${e.id}')">Ya lo domino</button>` : ""}
      </div>
    </div>`;
  }
  return `
    <div class="error-card">
      <div class="eq">${escapeHtml(e.question)}</div>
      <div class="your-answer">Tu respuesta: ${escapeHtml(e.options[e.yourIndex])}</div>
      <div class="right-answer">Correcta: ${escapeHtml(e.options[e.correctIndex])}</div>
      <div class="explain-box">${escapeHtml(e.explain)}</div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
        <span class="pill">${escapeHtml(e.topic)}</span>
        ${canMaster ? `<button class="btn secondary" onclick="masterError('${e.id}')">Ya lo domino</button>` : ""}
      </div>
    </div>`;
}

function renderErrors() {
  const el = document.getElementById("view-errors");
  const pending = STATE.errorLog.filter(e => !e.mastered);
  const mastered = STATE.errorLog.filter(e => e.mastered);

  if (!STATE.errorLog.length) {
    el.innerHTML = `<div class="empty-state">Todavía no tienes errores registrados.<br>¡Sigue así!</div>`;
    return;
  }

  const total = STATE.errorLog.length;
  const masteredPct = total ? Math.round((mastered.length / total) * 100) : 0;

  el.innerHTML = `
    <div class="dash-header">
      <h2>Repaso de errores</h2>
      <p>${pending.length} pendientes de repasar · ${mastered.length} ya dominados</p>
    </div>

    <div class="ring-card evolution-card">
      ${circularProgressSVG(masteredPct, "var(--green)")}
      <div><div class="ring-label">Evolución</div><div class="ring-value">${mastered.length}/${total} errores dominados</div></div>
    </div>

    ${pending.length ? `<button class="btn" style="margin-bottom:20px;" onclick="startErrorReview()">Repasar solo estos errores (${pending.length})</button>` : ""}

    ${pending.map(e => renderErrorCard(e, true)).join("") || "<div class='card'><p>No tienes errores pendientes ahora mismo.</p></div>"}
    ${mastered.length ? `<h3 style="margin-top:26px; color:var(--text-dim); font-size:14px;">Dominados</h3>${mastered.map(e => renderErrorCard(e, false)).join("")}` : ""}
  `;
}

function masterError(id) {
  const e = STATE.errorLog.find(x => x.id === id);
  if (e) e.mastered = true;
  saveState();
  checkBadges();
  renderErrors();
}

/* ---------------- Repaso dirigido: "repetir solo errores" (Fase 5) ---------------- */

let REVIEW_STATE = null;

function startErrorReview() {
  const pending = STATE.errorLog.filter(e => !e.mastered);
  if (!pending.length) return;
  REVIEW_STATE = { items: shuffle(pending), index: 0, correct: 0 };
  renderReviewItem();
}

function renderReviewItem() {
  const el = document.getElementById("view-errors");
  const { items, index } = REVIEW_STATE;
  if (index >= items.length) { finishErrorReview(); return; }
  const e = items[index];

  if (e.kind === "exercise" || e.kind === "challenge") {
    el.innerHTML = `
      <div class="dash-header"><h2>Repasando errores</h2><p>Elemento ${index + 1} de ${items.length}</p></div>
      <div class="card">
        <span class="pill">${e.kind === "exercise" ? "Ejercicio" : "Reto"} · ${escapeHtml(e.topic)}</span>
        <h4 style="margin-top:10px;">${escapeHtml(e.title || "")}</h4>
        <p>${escapeHtml(e.prompt)}</p>
        <details><summary>Ver solución</summary><div><pre class="code-block">${escapeHtml(e.solution)}</pre></div></details>
        <div style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn" onclick="reviewAnswer(true)">Ahora sí lo tengo</button>
          <button class="btn secondary" onclick="reviewAnswer(false)">Todavía no</button>
        </div>
      </div>`;
    return;
  }

  el.innerHTML = `
    <div class="dash-header"><h2>Repasando errores</h2><p>Pregunta ${index + 1} de ${items.length}</p></div>
    <div class="card">
      <span class="pill">${escapeHtml(e.topic)}</span>
      <p class="quiz-question" style="margin-top:10px;">${escapeHtml(e.question)}</p>
      <div class="option-list">
        ${e.options.map((opt, i) => `<button class="option-btn" data-i="${i}">${escapeHtml(opt)}</button>`).join("")}
      </div>
      <div id="review-explain"></div>
      <button class="btn" id="review-next-btn" style="display:none;">Siguiente</button>
    </div>`;
  el.querySelectorAll(".option-btn").forEach(btn => {
    btn.onclick = () => reviewAnswerQuiz(parseInt(btn.dataset.i, 10));
  });
}

function reviewAnswerQuiz(selectedIdx) {
  const { items, index } = REVIEW_STATE;
  const e = items[index];
  const correct = selectedIdx === e.correctIndex;
  document.querySelectorAll(".option-btn").forEach((btn, i) => {
    btn.disabled = true;
    if (i === e.correctIndex) btn.classList.add("correct");
    else if (i === selectedIdx) btn.classList.add("incorrect");
  });
  document.getElementById("review-explain").innerHTML = `<div class="explain-box">${correct ? "¡Correcto! " : "Todavía no. "}${escapeHtml(e.explain)}</div>`;
  document.getElementById("review-next-btn").style.display = "inline-block";
  recordCategoryAnswer(e.category, correct);
  if (correct) { masterErrorSilent(e.id); REVIEW_STATE.correct++; }
  document.getElementById("review-next-btn").onclick = () => { REVIEW_STATE.index++; renderReviewItem(); };
}

function reviewAnswer(gotIt) {
  const { items, index } = REVIEW_STATE;
  if (gotIt) { masterErrorSilent(items[index].id); REVIEW_STATE.correct++; }
  REVIEW_STATE.index++;
  renderReviewItem();
}

function masterErrorSilent(id) {
  const e = STATE.errorLog.find(x => x.id === id);
  if (e) e.mastered = true;
  saveState();
}

function finishErrorReview() {
  const el = document.getElementById("view-errors");
  const { items, correct } = REVIEW_STATE;
  checkBadges();
  el.innerHTML = `
    <div class="card quiz-result">
      <div class="big-score">${correct}/${items.length}</div>
      <p style="margin-top:8px;">Errores dominados en esta ronda de repaso.</p>
      <button class="btn" style="margin-top:16px;" onclick="navigate('errors')">Volver al listado</button>
    </div>`;
  REVIEW_STATE = null;
}

/* ---------------- Insignias ---------------- */

function renderBadgeGroup(list) {
  return list.map(b => {
    const unlocked = STATE.badges.includes(b.id);
    return `<div class="badge-item ${unlocked ? "" : "locked"}">
      <span class="b-name">${b.name}</span>
      <span class="b-state ${unlocked ? "unlocked" : ""}">${unlocked ? "Desbloqueada" : "Pendiente"}</span>
      ${!unlocked ? `<span class="b-desc">${escapeHtml(b.desc)}</span>` : ""}
    </div>`;
  }).join("");
}

function renderBadges() {
  const el = document.getElementById("view-badges");
  const rankBadges = BADGE_DEFS.filter(b => b.group === "rango");
  const achievementBadges = BADGE_DEFS.filter(b => b.group === "logro");
  el.innerHTML = `
    <div class="dash-header">
      <h2>Insignias</h2>
      <p>${STATE.badges.length} de ${BADGE_DEFS.length} desbloqueadas</p>
    </div>
    <h3 class="badge-section-title">Progreso de certificación</h3>
    <div class="badge-grid">${renderBadgeGroup(rankBadges)}</div>
    <h3 class="badge-section-title">Logros</h3>
    <div class="badge-grid">${renderBadgeGroup(achievementBadges)}</div>
  `;
}

/* ---------------- Simulacro cronometrado ---------------- */

let EXAM_STATE = null;

function buildQuestionPool() {
  const pool = [];
  APP_DATA.levels.forEach(level => {
    level.quiz.forEach(q => pool.push({ ...q, topic: level.title, category: q.category || level.category }));
  });
  APP_DATA.examBank.forEach(q => pool.push({ ...q, topic: "Banco de examen" }));
  return pool;
}

function renderExamIntro(level, el) {
  const history = STATE.examHistory.filter(e => e.levelId === level.id);
  const best = history.length ? Math.max(...history.map(h => Math.round((h.score / h.total) * 100))) : null;
  el.innerHTML = `
    <div class="level-header">
      <div>
        <h2>${level.code} · ${level.title}</h2>
        <p>${level.intro}</p>
      </div>
    </div>
    <div class="card">
      <h4>${escapeHtml(level.theory.concepts[0].heading)}</h4>
      <p>${escapeHtml(level.theory.concepts[0].explanation)}</p>
    </div>
    <div class="card">
      <h4>Configuración del simulacro</h4>
      <p>${level.examConfig.numQuestions} preguntas · ${level.examConfig.minutes} minutos · banco mezclado de todos los temas.</p>
      ${best !== null ? `<p style="margin-top:8px;">Tu mejor resultado hasta ahora: <strong style="color:var(--accent-strong)">${best}%</strong> (${history.length} intento/s)</p>` : ""}
      <button class="btn" style="margin-top:14px;" onclick="startExam(${level.id})">Empezar simulacro</button>
    </div>
    ${history.length ? `<div class="card"><h4>Historial</h4>${history.map(h => `<p>${new Date(h.ts).toLocaleString()} — ${h.score}/${h.total} (${Math.round(h.score/h.total*100)}%)</p>`).join("")}</div>` : ""}
  `;
}

function startExam(levelId) {
  const level = APP_DATA.levels.find(l => l.id === levelId);
  const pool = shuffle(buildQuestionPool());
  const n = Math.min(level.examConfig.numQuestions, pool.length);
  const questions = pool.slice(0, n);
  EXAM_STATE = {
    level, questions, index: 0, answers: new Array(n).fill(null),
    secondsLeft: level.examConfig.minutes * 60,
    timerId: null
  };
  renderExamScreen();
  EXAM_STATE.timerId = setInterval(examTick, 1000);
}

function examTick() {
  EXAM_STATE.secondsLeft--;
  updateExamTimer();
  if (EXAM_STATE.secondsLeft <= 0) {
    clearInterval(EXAM_STATE.timerId);
    submitExam();
  }
}

function updateExamTimer() {
  const t = document.getElementById("exam-timer");
  if (!t) return;
  const m = Math.floor(EXAM_STATE.secondsLeft / 60);
  const s = EXAM_STATE.secondsLeft % 60;
  t.textContent = `${m}:${s.toString().padStart(2, "0")}`;
  t.classList.toggle("warning", EXAM_STATE.secondsLeft <= 60);
}

function renderExamScreen() {
  const el = document.getElementById("view-level");
  const { level, questions, index, answers } = EXAM_STATE;
  const q = questions[index];
  el.innerHTML = `
    <div class="exam-topbar">
      <div><strong>${level.title}</strong> — pregunta ${index + 1}/${questions.length}</div>
      <div class="timer" id="exam-timer">--:--</div>
    </div>
    <div class="exam-nav-dots">
      ${questions.map((_, i) => `<div class="dot ${i === index ? "current" : ""} ${answers[i] !== null ? "answered" : ""}" onclick="goToExamQuestion(${i})">${i + 1}</div>`).join("")}
    </div>
    <div class="card">
      <p class="quiz-question">${escapeHtml(q.q)}</p>
      <div class="option-list">
        ${q.options.map((opt, i) => `<button class="option-btn ${answers[index] === i ? "correct" : ""}" data-i="${i}" onclick="answerExamQuestion(${i})">${escapeHtml(opt)}</button>`).join("")}
      </div>
      <div style="display:flex; gap:10px; margin-top:14px; flex-wrap:wrap;">
        <button class="btn secondary" ${index === 0 ? "disabled" : ""} onclick="goToExamQuestion(${index - 1})">Anterior</button>
        ${index < questions.length - 1 ? `<button class="btn secondary" onclick="goToExamQuestion(${index + 1})">Siguiente</button>` : ""}
        <button class="btn" onclick="renderExamReview()">Revisar y finalizar</button>
      </div>
    </div>
  `;
  updateExamTimer();
}

function answerExamQuestion(i) {
  EXAM_STATE.answers[EXAM_STATE.index] = i;
  renderExamScreen();
}

function goToExamQuestion(i) {
  EXAM_STATE.index = i;
  renderExamScreen();
}

function renderExamReview() {
  const el = document.getElementById("view-level");
  const { level, questions, answers } = EXAM_STATE;
  const answeredCount = answers.filter(a => a !== null).length;
  el.innerHTML = `
    <div class="level-header">
      <div><h2>Revisión final</h2><p>${answeredCount}/${questions.length} preguntas respondidas</p></div>
    </div>
    <div class="card">
      ${questions.map((q, i) => `
        <div class="review-row" onclick="goToExamQuestion(${i})">
          <span class="review-num ${answers[i] !== null ? "answered" : "unanswered"}">${i + 1}</span>
          <span class="review-q-text">${escapeHtml(q.q.length > 90 ? q.q.slice(0, 90) + "…" : q.q)}</span>
          <span class="review-status">${answers[i] !== null ? "Respondida" : "Sin responder"}</span>
        </div>`).join("")}
    </div>
    <div style="display:flex; gap:10px; margin-top:14px;">
      <button class="btn secondary" onclick="goToExamQuestion(0)">Seguir respondiendo</button>
      <button class="btn danger" onclick="submitExam()">Finalizar simulacro</button>
    </div>
  `;
}

function buildExamReport(questions, answers) {
  const perCat = {};
  questions.forEach((q, i) => {
    const cat = q.category || "SELECT";
    if (!perCat[cat]) perCat[cat] = { correct: 0, total: 0 };
    perCat[cat].total++;
    if (answers[i] === q.a) perCat[cat].correct++;
  });
  const rows = Object.keys(perCat).map(cat => ({ cat, correct: perCat[cat].correct, total: perCat[cat].total, pct: Math.round((perCat[cat].correct / perCat[cat].total) * 100) }));
  rows.sort((a, b) => b.pct - a.pct);
  const strengths = rows.filter(r => r.pct >= 75);
  const weaknesses = rows.filter(r => r.pct < 60);
  const levelsToReview = [...new Set(weaknesses.flatMap(w => CATEGORY_TO_LEVELS[w.cat] || []))].sort((a, b) => a - b);
  return { rows, strengths, weaknesses, levelsToReview };
}

function formatSeconds(s) {
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}m ${sec}s`;
}

function submitExam() {
  clearInterval(EXAM_STATE.timerId);
  const { level, questions, answers } = EXAM_STATE;
  const elapsedSeconds = level.examConfig.minutes * 60 - EXAM_STATE.secondsLeft;
  let score = 0;
  questions.forEach((q, i) => {
    const yourIndex = answers[i];
    const correct = yourIndex === q.a;
    if (correct) score++;
    recordCategoryAnswer(q.category, correct);
    if (!correct) {
      if (yourIndex !== null) {
        logError({ question: q.q, options: q.options, correctIndex: q.a, yourIndex, explain: q.exp, topic: q.topic, category: q.category });
      } else {
        logError({ question: q.q, options: q.options, correctIndex: q.a, yourIndex: q.a === 0 ? (q.options.length - 1) : 0, explain: q.exp + " (no respondiste a tiempo)", topic: q.topic, category: q.category });
      }
    }
  });
  const total = questions.length;
  const report = buildExamReport(questions, answers);
  STATE.examHistory.push({ levelId: level.id, score, total, minutes: level.examConfig.minutes, elapsedSeconds, ts: Date.now() });
  addXP(score * 5);
  if (score / total >= PASS_RATIO) {
    addXP(XP_RULES.examPass);
    const ls = getLevelState(level.id);
    ls.completed = true;
    launchConfetti(2600);
  }
  saveState();
  checkBadges();
  renderExamResult(level, score, total, elapsedSeconds, report);
}

function renderExamResult(level, score, total, elapsedSeconds, report) {
  const el = document.getElementById("view-level");
  const pct = Math.round((score / total) * 100);
  const statusLabel = pct >= 70 ? "Preparado para certificación" : pct >= 50 ? "Necesita repaso" : "No apto todavía";
  const statusColor = pct >= 70 ? "var(--green)" : pct >= 50 ? "#eab308" : "var(--red)";

  const examRuns = STATE.examHistory.filter(h => h.levelId === level.id);
  const bestPct = Math.max(...examRuns.map(h => Math.round((h.score / h.total) * 100)));
  const rankingLine = examRuns.length > 1
    ? `Tu mejor resultado en este simulacro: ${bestPct}% (de ${examRuns.length} intentos).`
    : `Este ha sido tu primer intento en este simulacro.`;

  el.innerHTML = `
    <div class="card quiz-result">
      <div class="big-score">${score}/${total}</div>
      <p style="font-size:20px; margin-top:6px;">${pct}%</p>
      <p style="margin-top:6px; color:var(--text-dim);">Tiempo empleado: ${formatSeconds(elapsedSeconds)}</p>
      <p style="margin-top:10px; font-weight:700; color:${statusColor};">${statusLabel}</p>
      <p style="margin-top:6px; color:var(--text-faint); font-size:13px;">${rankingLine}</p>
    </div>

    <div class="card">
      <h4>Informe del simulador</h4>
      ${report.strengths.length ? `<p><strong style="color:var(--green)">Fortalezas:</strong> ${report.strengths.map(s => escapeHtml(s.cat)).join(", ")}</p>` : ""}
      ${report.weaknesses.length
        ? `<p style="margin-top:8px;"><strong style="color:var(--red)">Necesitas reforzar:</strong> ${report.weaknesses.map(w => `${escapeHtml(w.cat)} (${w.pct}%)`).join(", ")}</p>`
        : `<p style="color:var(--text-dim);">Sin debilidades claras detectadas en este intento.</p>`}
      ${report.levelsToReview.length ? `<p style="margin-top:10px;">Se recomienda revisar los niveles: ${report.levelsToReview.map(id => "N" + id).join(", ")} antes de repetir el simulacro.</p>` : ""}
    </div>

    <div style="margin-top:10px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
      <button class="btn" onclick="navigate('level', ${level.id})">Volver al nivel</button>
      <button class="btn secondary" onclick="navigate('errors')">Ver errores</button>
      <button class="btn secondary" onclick="navigate('analytics')">Ver Analytics</button>
    </div>
  `;
}

/* ---------------- Reinicio de progreso ---------------- */

function resetProgress() {
  if (DEMO_ACTIVE) { toast("Sal del modo demo antes de reiniciar tu progreso real."); return; }
  if (!confirm("¿Seguro que quieres borrar todo tu progreso, incluido el banco de examen Oracle? Esta acción no se puede deshacer.")) return;
  STATE = defaultState();
  saveState();
  if (typeof resetCertState === "function") resetCertState();
  navigate("dashboard");
  toast("Progreso reiniciado");
}

/* ---------------- Arranque ---------------- */

function on(id, handler) {
  const el = document.getElementById(id);
  if (el) el.onclick = handler;
}

function init() {
  updateStreak();
  checkBadges();
  on("btn-dashboard", () => navigate("dashboard"));
  on("btn-analytics", () => navigate("analytics"));
  on("btn-errors", () => navigate("errors"));
  on("btn-badges", () => navigate("badges"));
  on("btn-certificate", () => navigate("certificate"));
  on("btn-certbank", () => navigate("certbank"));
  on("btn-reset", resetProgress);
  on("btn-go-landing", () => showLanding());
  on("btn-start-mission", () => enterApp("level", findNextLevelToStudy().id));
  on("btn-continue-learning", () => enterApp("dashboard"));
  on("btn-take-exam", () => { if (typeof CERT_TAB !== "undefined") CERT_TAB = "exam"; enterApp("certbank"); });
  on("btn-demo", () => enterDemoMode());
  on("btn-exit-demo", () => exitDemoMode());

  renderSidebar();
  showLanding();

  // Tiempo de estudio: cuenta minutos solo mientras la pestaña está activa
  setInterval(() => {
    if (!document.hidden) {
      STATE.studyMinutes = (STATE.studyMinutes || 0) + 1;
      saveState();
      if (CURRENT_VIEW === "dashboard") renderDashboard();
    }
  }, 60000);
}

document.addEventListener("DOMContentLoaded", init);

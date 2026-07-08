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
    errorLog: [],       // { id, question, options, correctIndex, yourIndex, explain, topic, ts }
    badges: [],         // lista de ids de insignia conseguidas
    examHistory: [],    // { levelId, score, total, minutes, ts }
    streakDays: 0,
    lastActiveDate: null,
    studyMinutes: 0     // minutos activos acumulados (Fase 3: tiempo de estudio)
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
  saveState();
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
  { id: "r1", name: "SQL Explorer", min: 0, icon: "🧭" },
  { id: "r2", name: "Query Builder", min: 3, icon: "🧱" },
  { id: "r3", name: "Join Master", min: 6, icon: "🔗" },
  { id: "r4", name: "Aggregate Expert", min: 9, icon: "📊" },
  { id: "r5", name: "Oracle Specialist", min: 12, icon: "🛡️" },
  { id: "r6", name: "Certification Ready", min: 16, icon: "🎓" }
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
      <span class="rank-step-icon">${reached ? r.icon : "🔒"}</span>
      <span class="rank-step-name">${r.name}</span>
    </div>`;
  });
  return `<div class="rank-stepper">${steps.join(`<div class="rank-step-connector"></div>`)}</div>`;
}

/* ---------------- Insignias (Fase 4) ---------------- */
/* group "rango": ligadas a un nivel concreto del temario.
   group "logro": hitos adicionales de constancia/rendimiento. */

const BADGE_DEFS = [
  { id: "badge_sql_explorer", icon: "🏅", name: "SQL Explorer", group: "rango", desc: "Completa el Nivel 1 · SELECT básico.", check: s => !!(s.levels[1] && s.levels[1].completed) },
  { id: "badge_join_master", icon: "🏅", name: "Join Master", group: "rango", desc: "Completa el Nivel 8 · JOINs.", check: s => !!(s.levels[8] && s.levels[8].completed) },
  { id: "badge_aggregate_expert", icon: "🏅", name: "Aggregate Expert", group: "rango", desc: "Completa el Nivel 7 · GROUP BY y HAVING.", check: s => !!(s.levels[7] && s.levels[7].completed) },
  { id: "badge_subquery_hunter", icon: "🏅", name: "Subquery Hunter", group: "rango", desc: "Completa el Nivel 9 · Subconsultas.", check: s => !!(s.levels[9] && s.levels[9].completed) },
  { id: "badge_oracle_specialist", icon: "🏅", name: "Oracle Specialist", group: "rango", desc: "Completa el Nivel 15 · Control de transacciones.", check: s => !!(s.levels[15] && s.levels[15].completed) },
  { id: "badge_certification_ready", icon: "🏅", name: "Certification Ready", group: "rango", desc: "Completa los 16 niveles base (N0 a N15).", check: s => APP_DATA.levels.filter(l => !l.isExamLevel).every(l => s.levels[l.id] && s.levels[l.id].completed) },

  { id: "b_start", icon: "🌱", name: "Primer paso", group: "logro", desc: "Empieza a trabajar en cualquier nivel.", check: s => Object.keys(s.levels).length > 0 },
  { id: "b_perfectquiz", icon: "🎯", name: "Quiz perfecto", group: "logro", desc: "Acierta el 100% de las preguntas del quiz de un nivel.", check: s => Object.values(s.levels).some(l => l.quizDone && l.quizTotal > 0 && l.quizScore === l.quizTotal) },
  { id: "b_exam1", icon: "🏁", name: "Primer simulacro superado", group: "logro", desc: "Aprueba (≥70%) cualquier simulacro cronometrado.", check: s => s.examHistory.some(e => e.score / e.total >= 0.7) },
  { id: "b_expert", icon: "🏆", name: "Nivel experto superado", group: "logro", desc: "Aprueba (≥70%) el simulacro del Nivel Experto.", check: s => s.examHistory.some(e => e.levelId === 17 && e.score / e.total >= 0.7) },
  { id: "b_reviewer", icon: "🧠", name: "Repasador aplicado", group: "logro", desc: "Acumula 10 elementos en tu registro de errores (señal de que practicas de verdad).", check: s => s.errorLog.length >= 10 },
  { id: "b_streak3", icon: "📅", name: "Racha de 3 días", group: "logro", desc: "Entra a estudiar 3 días seguidos.", check: s => s.streakDays >= 3 }
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
    newOnes.forEach(b => toast(`🏅 Insignia desbloqueada: ${b.name}`));
  }
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
    toast(`✅ Nivel completado: ${level.title}`);
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
  if (pct >= 100) return { icon: "🏆", text: "¡Has completado todos los niveles! Estás listo para el simulacro final y el nivel experto." };
  if (STATE.examHistory.some(e => e.levelId === 17 && e.score / e.total >= PASS_RATIO)) return { icon: "👑", text: "Has superado el nivel experto. ¡Dominas la certificación Oracle 1Z0-071!" };
  if (remainingToSim > 0 && remainingToSim <= 2) return { icon: "⏱️", text: `Solo ${remainingToSim === 1 ? "queda 1 nivel" : "quedan " + remainingToSim + " niveles"} para desbloquear el simulador de examen.` };
  if (pct >= 70) return { icon: "🔥", text: `Has completado el ${pct}% de la certificación. ¡Excelente progreso!` };
  if (STATE.streakDays >= 3) return { icon: "📅", text: `Llevas ${STATE.streakDays} días seguidos estudiando. La constancia es la clave del 1Z0-071.` };
  if (pendingErrorsCount() >= 8) return { icon: "🧠", text: `Tienes ${pendingErrorsCount()} errores pendientes de repasar. Un buen repaso vale más que un nivel nuevo.` };
  if (completed === 0) return { icon: "🚀", text: "Cada experto en Oracle empezó por el Nivel 0. ¡Vamos con la primera lección!" };
  return { icon: "💪", text: `Vas por el ${pct}% del camino hacia la certificación Oracle 1Z0-071. Sigue así.` };
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
  else navigate("dashboard");
}

function renderHeroStats() {
  const el = document.getElementById("hero-stats");
  if (!el) return;
  if (STATE.xp === 0 && Object.keys(STATE.levels).length === 0) {
    el.innerHTML = `<div class="hero-stat">Aún no has empezado. ¡Dale al botón y arrancamos! 🚀</div>`;
    return;
  }
  const pct = overallCertificationPercent();
  const rank = getCurrentRank();
  el.innerHTML = `
    <div class="hero-stat"><strong>${rank.icon} ${rank.name}</strong>rango actual</div>
    <div class="hero-stat"><strong>${STATE.xp}</strong>XP acumulada</div>
    <div class="hero-stat"><strong>${pct}%</strong>hacia la certificación</div>
    <div class="hero-stat"><strong>${STATE.badges.length}</strong>insignias</div>
    <div class="hero-stat"><strong>🔥 ${STATE.streakDays}</strong>días de racha</div>
  `;
}

function renderLandingCards() {
  const el = document.getElementById("landing-cards");
  if (!el) return;
  const exTotal = totalExercisesCount(), exDone = totalExercisesDoneCount();
  const chTotal = totalChallengesCount(), chDone = totalChallengesDoneCount();
  const examLevel16 = STATE.examHistory.filter(e => e.levelId === 16);
  const bestExam = examLevel16.length ? Math.max(...examLevel16.map(h => Math.round((h.score / h.total) * 100))) : null;
  const certPct = overallCertificationPercent();
  const totalLevels = APP_DATA.levels.filter(l => !l.isExamLevel).length;

  const cards = [
    { icon: "📘", title: "Teoría", desc: "18 niveles con contenido Oracle real, marcado por origen.", status: `${totalLevels} niveles disponibles`, action: () => enterApp("level", findNextLevelToStudy().id) },
    { icon: "✏️", title: "Ejercicios", desc: "Practica cada bloque con ejercicios guiados y solución explicada.", status: `${exDone}/${exTotal} resueltos`, action: () => enterApp("level", findNextLevelToStudy().id) },
    { icon: "🚀", title: "Retos", desc: "Dificultad progresiva para poner a prueba lo aprendido.", status: `${chDone}/${chTotal} superados`, action: () => enterApp("level", findNextLevelToStudy().id) },
    { icon: "⏱️", title: "Simuladores", desc: "Exámenes cronometrados con banco de preguntas mezclado.", status: bestExam !== null ? `Mejor resultado: ${bestExam}%` : "Aún no realizado", action: () => enterApp("level", 16) },
    { icon: "🎓", title: "Certificación", desc: "Sigue tu progreso real hacia el examen Oracle 1Z0-071.", status: `${certPct}% completado`, action: () => enterApp("dashboard") }
  ];

  el.innerHTML = cards.map(c => `
    <div class="landing-card">
      <span class="lcard-icon">${c.icon}</span>
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
  if (sidebarRank) sidebarRank.textContent = `${rank.icon} ${rank.name}`;
}

function renderSidebar() {
  const list = document.getElementById("level-list");
  list.innerHTML = "";
  APP_DATA.levels.forEach(level => {
    const unlocked = isLevelUnlocked(level.id);
    const ls = getLevelState(level.id);
    const li = document.createElement("li");
    li.className = "level-item" + (!unlocked ? " locked" : "") + (ls.completed ? " completed" : "") + (CURRENT_VIEW === "level" && CURRENT_LEVEL_ID === level.id ? " active" : "");
    const statusIcon = ls.completed ? "✅" : (unlocked ? "▶️" : "🔒");
    li.innerHTML = `<span class="lv-icon">${level.icon}</span><span class="lv-title">${level.code} · ${level.title}</span><span class="lv-status">${statusIcon}</span>`;
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

  const cards = APP_DATA.levels.map(level => {
    const unlocked = isLevelUnlocked(level.id);
    const ls = getLevelState(level.id);
    const pct = levelProgressPercent(level);
    const tag = ls.completed ? "✅" : (level.isExamLevel ? "⏱️" : "");
    return `
      <div class="level-card ${unlocked ? "" : "locked"}" ${unlocked ? `onclick="navigate('level', ${level.id})"` : ""}>
        <span class="lc-tag">${tag}</span>
        <div class="lc-top">
          <span class="lc-icon">${level.icon}</span>
        </div>
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

    <div class="motivational-banner"><span class="mb-icon">${msg.icon}</span><span>${msg.text}</span></div>

    <div class="rank-card">
      ${renderRankStepper()}
      <p class="rank-caption">${nextRank ? `Te ${(nextRank.min - completed) === 1 ? "falta 1 nivel" : "faltan " + (nextRank.min - completed) + " niveles"} para alcanzar <strong>${nextRank.icon} ${nextRank.name}</strong>.` : `🎉 Has alcanzado el rango máximo: <strong>${rank.icon} ${rank.name}</strong>.`}</p>
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
      <div class="kpi-card"><div class="num">${rank.icon} ${rank.name}</div><div class="lbl">Rango actual · ${completed}/${totalLevels} niveles</div></div>
      <div class="kpi-card"><div class="num">${STATE.xp}</div><div class="lbl">XP acumulada</div></div>
      <div class="kpi-card"><div class="num">${STATE.badges.length}/${BADGE_DEFS.length}</div><div class="lbl">Insignias desbloqueadas</div></div>
      <div class="kpi-card"><div class="num">${quizDoneCount}/${totalLevels}</div><div class="lbl">Quiz completados</div></div>
      <div class="kpi-card">
        <div class="num">${aciertoPct}%</div><div class="lbl">Aciertos (${aciertos}/${preguntas})</div>
        <div class="sub-bar"><div class="seg-correct" style="width:${aciertoPct}%"></div><div class="seg-wrong" style="width:${100 - aciertoPct}%"></div></div>
      </div>
      <div class="kpi-card"><div class="num">${pendErrors}</div><div class="lbl">Errores pendientes</div></div>
      <div class="kpi-card"><div class="num">${formatMinutes(STATE.studyMinutes)}</div><div class="lbl">Tiempo de estudio</div></div>
      <div class="kpi-card"><div class="num">🔥 ${STATE.streakDays}</div><div class="lbl">Días seguidos</div></div>
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
  const completedBanner = ls.completed ? `<div class="complete-banner">✅ Has completado este nivel. Puedes repasarlo cuando quieras.</div>` : "";

  el.innerHTML = `
    <div class="level-header">
      <span class="lh-icon">${level.icon}</span>
      <div>
        <h2>${level.code} · ${level.title}</h2>
        <p>${level.intro}</p>
      </div>
    </div>
    ${completedBanner}
    <div class="tabs">
      <button class="tab-btn" data-tab="teoria">📘 Teoría</button>
      <button class="tab-btn" data-tab="ejemplos">💻 Ejemplos</button>
      <button class="tab-btn" data-tab="errores">⚠️ Errores típicos</button>
      <button class="tab-btn" data-tab="quiz">❓ Quiz (${ls.quizDone ? "hecho" : level.quiz.length + " preguntas"})</button>
      <button class="tab-btn" data-tab="ejercicios">✏️ Ejercicios</button>
      <button class="tab-btn" data-tab="retos">🚀 Retos</button>
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

function sourceTag(source) {
  return source === "apuntes"
    ? `<span class="source-tag apuntes">🟦 De tus apuntes</span>`
    : `<span class="source-tag added">🟧 Contenido añadido para certificación</span>`;
}

function renderTheory(level) {
  if (!level.theory.length) return `<div class="card"><p>Sin teoría adicional en este nivel: es un bloque de simulacro.</p></div>`;
  return level.theory.map(t => `
    <div class="card">
      ${sourceTag(t.source)}
      <h4>${escapeHtml(t.heading)}</h4>
      <p>${escapeHtml(t.body)}</p>
    </div>
  `).join("");
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
  return `<ul class="mistake-list">${level.mistakes.map(m => `<li>⚠️ ${escapeHtml(m)}</li>`).join("")}</ul>`;
}

function renderExercises(level) {
  if (!level.exercises.length) return `<div class="card"><p>Este nivel no tiene ejercicios guiados.</p></div>`;
  const ls = getLevelState(level.id);
  return level.exercises.map((ex, idx) => {
    const done = ls.exercisesDone.includes(idx);
    return `
    <div class="card exercise-card">
      <h4>${escapeHtml(ex.title)} ${done ? "✅" : ""}</h4>
      <p>${escapeHtml(ex.prompt)}</p>
      <details><summary>💡 Ver pista</summary><div>${escapeHtml(ex.hint)}</div></details>
      <details><summary>🔎 Ver solución</summary><div><pre class="code-block">${escapeHtml(ex.solution)}</pre></div></details>
      <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn ${done ? "secondary" : ""}" ${done ? "disabled" : ""} onclick="markExerciseDone(${level.id}, ${idx}, false)">
          ${done ? "Ejercicio completado" : "✅ Lo conseguí (+" + XP_RULES.exercise + " XP)"}
        </button>
        ${!done ? `<button class="btn secondary" onclick="markExerciseDone(${level.id}, ${idx}, true)">🙈 Necesité la solución</button>` : ""}
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
      <h4>${diffLabel} ${done ? "✅" : ""}<span class="diff-badge">${"⭐".repeat(ch.level)}</span></h4>
      <p>${escapeHtml(ch.prompt)}</p>
      <details><summary>🔎 Ver solución propuesta</summary><div><pre class="code-block">${escapeHtml(ch.solution)}</pre></div></details>
      <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn ${done ? "secondary" : ""}" ${done ? "disabled" : ""} onclick="markChallengeDone(${level.id}, ${idx}, false)">
          ${done ? "Reto superado" : "✅ Lo conseguí (+" + XP_RULES.challenge + " XP)"}
        </button>
        ${!done ? `<button class="btn secondary" onclick="markChallengeDone(${level.id}, ${idx}, true)">🙈 Necesité la solución</button>` : ""}
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
      <button class="btn" id="quiz-next-btn" style="display:none;">Siguiente ➜</button>
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
  document.getElementById("quiz-explain").innerHTML = `<div class="explain-box">${correct ? "✅ ¡Correcto! " : "❌ No es correcto. "}${escapeHtml(q.exp)}</div>`;
  document.getElementById("quiz-next-btn").style.display = "inline-block";
  document.getElementById("quiz-next-btn").onclick = () => { QUIZ_STATE.index++; renderQuizQuestion(); };

  if (correct) {
    QUIZ_STATE.correct++;
    addXP(XP_RULES.quizCorrect);
  } else {
    logError({ question: q.q, options: q.options, correctIndex: q.a, yourIndex: selectedIdx, explain: q.exp, topic: level.title });
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
      <div class="eq">${e.kind === "exercise" ? "✏️" : "🚀"} ${escapeHtml(e.title || "")}</div>
      <p style="color:var(--text-dim); font-size:13px; margin:0 0 10px;">${escapeHtml(e.prompt)}</p>
      <details><summary>🔎 Ver solución</summary><div><pre class="code-block">${escapeHtml(e.solution)}</pre></div></details>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
        <span class="pill">${escapeHtml(e.topic)}</span>
        ${canMaster ? `<button class="btn secondary" onclick="masterError('${e.id}')">Ya lo domino ✓</button>` : ""}
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
        ${canMaster ? `<button class="btn secondary" onclick="masterError('${e.id}')">Ya lo domino ✓</button>` : ""}
      </div>
    </div>`;
}

function renderErrors() {
  const el = document.getElementById("view-errors");
  const pending = STATE.errorLog.filter(e => !e.mastered);
  const mastered = STATE.errorLog.filter(e => e.mastered);

  if (!STATE.errorLog.length) {
    el.innerHTML = `<div class="empty-state"><span class="big-icon">🎉</span>Todavía no tienes errores registrados.<br>¡Sigue así!</div>`;
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

    ${pending.length ? `<button class="btn" style="margin-bottom:20px;" onclick="startErrorReview()">🔁 Repasar solo estos errores (${pending.length})</button>` : ""}

    ${pending.map(e => renderErrorCard(e, true)).join("") || "<div class='card'><p>No tienes errores pendientes ahora mismo. 🎉</p></div>"}
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
        <span class="pill">${e.kind === "exercise" ? "✏️ Ejercicio" : "🚀 Reto"} · ${escapeHtml(e.topic)}</span>
        <h4 style="margin-top:10px;">${escapeHtml(e.title || "")}</h4>
        <p>${escapeHtml(e.prompt)}</p>
        <details><summary>🔎 Ver solución</summary><div><pre class="code-block">${escapeHtml(e.solution)}</pre></div></details>
        <div style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn" onclick="reviewAnswer(true)">✅ Ahora sí lo tengo</button>
          <button class="btn secondary" onclick="reviewAnswer(false)">🔁 Todavía no</button>
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
      <button class="btn" id="review-next-btn" style="display:none;">Siguiente ➜</button>
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
  document.getElementById("review-explain").innerHTML = `<div class="explain-box">${correct ? "✅ ¡Correcto! " : "❌ Todavía no. "}${escapeHtml(e.explain)}</div>`;
  document.getElementById("review-next-btn").style.display = "inline-block";
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
      <span class="b-icon">${b.icon}</span>
      <span class="b-name">${b.name}</span>
      <span class="b-state ${unlocked ? "unlocked" : ""}">${unlocked ? "✓ Desbloqueada" : "Pendiente"}</span>
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
    <h3 class="badge-section-title">🎓 Progreso de certificación</h3>
    <div class="badge-grid">${renderBadgeGroup(rankBadges)}</div>
    <h3 class="badge-section-title">🏆 Logros</h3>
    <div class="badge-grid">${renderBadgeGroup(achievementBadges)}</div>
  `;
}

/* ---------------- Simulacro cronometrado ---------------- */

let EXAM_STATE = null;

function buildQuestionPool() {
  const pool = [];
  APP_DATA.levels.forEach(level => {
    level.quiz.forEach(q => pool.push({ ...q, topic: level.title }));
  });
  APP_DATA.examBank.forEach(q => pool.push({ ...q, topic: "Banco de examen" }));
  return pool;
}

function renderExamIntro(level, el) {
  const history = STATE.examHistory.filter(e => e.levelId === level.id);
  const best = history.length ? Math.max(...history.map(h => Math.round((h.score / h.total) * 100))) : null;
  el.innerHTML = `
    <div class="level-header">
      <span class="lh-icon">${level.icon}</span>
      <div>
        <h2>${level.code} · ${level.title}</h2>
        <p>${level.intro}</p>
      </div>
    </div>
    <div class="card">
      ${sourceTag("added")}
      <h4>${escapeHtml(level.theory[0].heading)}</h4>
      <p>${escapeHtml(level.theory[0].body)}</p>
    </div>
    <div class="card">
      <h4>Configuración del simulacro</h4>
      <p>${level.examConfig.numQuestions} preguntas · ${level.examConfig.minutes} minutos · banco mezclado de todos los temas.</p>
      ${best !== null ? `<p style="margin-top:8px;">Tu mejor resultado hasta ahora: <strong style="color:var(--accent-strong)">${best}%</strong> (${history.length} intento/s)</p>` : ""}
      <button class="btn" style="margin-top:14px;" onclick="startExam(${level.id})">Empezar simulacro ⏱️</button>
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
      <div style="display:flex; gap:10px; margin-top:14px;">
        <button class="btn secondary" ${index === 0 ? "disabled" : ""} onclick="goToExamQuestion(${index - 1})">◀ Anterior</button>
        ${index < questions.length - 1
          ? `<button class="btn" onclick="goToExamQuestion(${index + 1})">Siguiente ▶</button>`
          : `<button class="btn danger" onclick="submitExam()">Finalizar simulacro ✔</button>`}
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

function submitExam() {
  clearInterval(EXAM_STATE.timerId);
  const { level, questions, answers } = EXAM_STATE;
  let score = 0;
  questions.forEach((q, i) => {
    const yourIndex = answers[i];
    if (yourIndex === q.a) {
      score++;
    } else if (yourIndex !== null) {
      logError({ question: q.q, options: q.options, correctIndex: q.a, yourIndex, explain: q.exp, topic: q.topic });
    } else {
      logError({ question: q.q, options: q.options, correctIndex: q.a, yourIndex: q.a === 0 ? (q.options.length - 1) : 0, explain: q.exp + " (no respondiste a tiempo)", topic: q.topic });
    }
  });
  const total = questions.length;
  STATE.examHistory.push({ levelId: level.id, score, total, minutes: level.examConfig.minutes, ts: Date.now() });
  addXP(score * 5);
  if (score / total >= PASS_RATIO) {
    addXP(XP_RULES.examPass);
    const ls = getLevelState(level.id);
    ls.completed = true;
    launchConfetti(2600);
  }
  saveState();
  checkBadges();
  renderExamResult(level, score, total);
}

function renderExamResult(level, score, total) {
  const el = document.getElementById("view-level");
  const pct = Math.round((score / total) * 100);
  const passed = score / total >= PASS_RATIO;
  el.innerHTML = `
    <div class="card quiz-result">
      <div class="big-score">${score}/${total}</div>
      <p style="font-size:20px; margin-top:6px;">${pct}%</p>
      <p style="margin-top:10px; color:${passed ? "var(--green)" : "var(--red)"}">
        ${passed ? "✅ ¡Aprobado! Nivel similar al del examen real." : "❌ Todavía no llegas al 70%. Repasa el registro de errores y vuelve a intentarlo."}
      </p>
      <div style="margin-top:20px; display:flex; gap:10px; justify-content:center;">
        <button class="btn" onclick="navigate('level', ${level.id})">Volver al nivel</button>
        <button class="btn secondary" onclick="navigate('errors')">Ver errores</button>
      </div>
    </div>
  `;
}

/* ---------------- Reinicio de progreso ---------------- */

function resetProgress() {
  if (!confirm("¿Seguro que quieres borrar todo tu progreso? Esta acción no se puede deshacer.")) return;
  STATE = defaultState();
  saveState();
  navigate("dashboard");
  toast("Progreso reiniciado");
}

/* ---------------- Arranque ---------------- */

function init() {
  updateStreak();
  checkBadges();
  document.getElementById("btn-dashboard").onclick = () => navigate("dashboard");
  document.getElementById("btn-errors").onclick = () => navigate("errors");
  document.getElementById("btn-badges").onclick = () => navigate("badges");
  document.getElementById("btn-reset").onclick = resetProgress;
  document.getElementById("btn-go-landing").onclick = () => showLanding();
  document.getElementById("btn-start-mission").onclick = () => enterApp("level", findNextLevelToStudy().id);
  document.getElementById("btn-continue-learning").onclick = () => enterApp("dashboard");

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

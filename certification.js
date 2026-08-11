/*
Banco de examen Oracle (Fase 3) — construido sobre CERTIFICATION_BANK (data/certification-bank/certification-bank.js)
generado por tools/Import-Exams.ps1 a partir de los .docx de Exámenes/.

No modifica ningún dato del banco importado en disco: todas las acciones de administración
(aprobar/rechazar, editar tema/dificultad, fusionar/eliminar duplicados) se guardan como
"overrides" en localStorage, por encima de los datos base. No hay backend, así que estas
decisiones viven solo en este navegador (ver AUDIT_REPORT.md, limitación conocida).

Reutiliza de script.js: escapeHtml, toast, shuffle, formatSeconds, formatMinutes, on.
*/

const CERT_STORAGE_KEY = "oracleCertBankState_v1";
const CERT_BANK = (typeof CERTIFICATION_BANK !== "undefined") ? CERTIFICATION_BANK : [];
const CERT_REPORT = (typeof CERTIFICATION_IMPORT_REPORT !== "undefined") ? CERTIFICATION_IMPORT_REPORT : null;

const CERT_DIFFICULTY_LABELS = { 1: "Easy", 2: "Intermediate", 3: "Advanced", 4: "Expert", 5: "Exam Challenge" };
const CERT_ALL_TOPICS = Array.from(new Set(CERT_BANK.reduce((acc, q) => acc.concat(q.topics || [q.topic]), []))).sort();

function defaultCertState() {
  return {
    progress: {},        // id -> { attempts, correct, incorrect, lastResult, lastAnsweredAt, totalTimeMs, timesSkipped, flagged, srs }
    admin: {},           // id -> { reviewStatus, topics, difficulty, deleted, mergedInto, note }
    examHistory: [],     // { date, count, score, total, elapsedSeconds, weakTopics, strongTopics }
    progressiveLevel: 1, // nivel maximo desbloqueado (1..5)
    activityLog: [],     // { at, id, correct, xp, topics, difficulty, mode } -- una entrada por respuesta real
    xp: 0,
    streak: { count: 0, lastActiveDate: null },
    badges: {},          // badgeId -> ISOstring de cuando se consiguio
    dailyMissions: null  // { date, items: [{id, desc, target, xpReward, done}] }
  };
}

let CERT_STATE = loadCertState();

function loadCertState() {
  try {
    const raw = localStorage.getItem(CERT_STORAGE_KEY);
    if (!raw) return defaultCertState();
    const parsed = JSON.parse(raw);
    return Object.assign(defaultCertState(), parsed);
  } catch (e) {
    return defaultCertState();
  }
}

function saveCertState() {
  localStorage.setItem(CERT_STORAGE_KEY, JSON.stringify(CERT_STATE));
}

/* Usada por resetProgress() en script.js para que "Reiniciar progreso" borre tambien
   el banco de examen Oracle, y no solo el juego original. */
function resetCertState() {
  CERT_STATE = defaultCertState();
  saveCertState();
  CERT_SESSION = null;
  CERT_TAB = "practice";
}

function defaultSrs() {
  return { state: "new", dueAt: null, intervalDays: 0, streak: 0 };
}

function getQuestionProgress(id) {
  if (!CERT_STATE.progress[id]) {
    CERT_STATE.progress[id] = { attempts: 0, correct: 0, incorrect: 0, lastResult: null, lastAnsweredAt: null, totalTimeMs: 0, timesSkipped: 0, flagged: false, srs: defaultSrs() };
  }
  if (!CERT_STATE.progress[id].srs) CERT_STATE.progress[id].srs = defaultSrs(); // defensivo por si viene de un estado antiguo
  return CERT_STATE.progress[id];
}

/* ---------------- Repeticion espaciada: New -> Learning -> Review -> Mastered ---------------- */
/* Regla simple e intencionadamente legible (no es SM-2 completo): acertar hace crecer el
   intervalo y promociona de estado; fallar siempre vuelve a Learning con intervalo minimo. */

function applySrsUpdate(progress, correct) {
  const srs = progress.srs;
  const now = Date.now();
  if (!correct) {
    srs.state = "learning";
    srs.intervalDays = 1;
    srs.streak = 0;
    srs.dueAt = new Date(now + 1 * 86400000).toISOString();
    return;
  }
  srs.streak = (srs.streak || 0) + 1;
  if (srs.state === "new" || srs.state === "learning") {
    if (srs.streak >= 2) { srs.state = "review"; srs.intervalDays = 3; }
    else { srs.state = "learning"; srs.intervalDays = 1; }
  } else if (srs.state === "review") {
    srs.intervalDays = Math.min(60, (srs.intervalDays || 3) * 2);
    if (srs.intervalDays >= 30 && srs.streak >= 4) srs.state = "mastered";
  } else if (srs.state === "mastered") {
    srs.intervalDays = Math.min(90, (srs.intervalDays || 30) * 1.5);
  }
  srs.dueAt = new Date(now + srs.intervalDays * 86400000).toISOString();
}

function isDueForReview(progress) {
  if (!progress || !progress.srs || !progress.srs.dueAt) return false;
  return new Date(progress.srs.dueAt).getTime() <= Date.now();
}

/* ---------------- Gamificacion: XP, niveles, racha, insignias, misiones diarias ---------------- */
/* Solo se otorga XP por acierto real: responder al azar muchas preguntas no da mas puntos que
   acertar pocas con criterio (bonus de dificultad y de racha, cero XP por fallar). */

const CERT_LEVELS = [
  { name: "Aprendiz Oracle", min: 0 },
  { name: "Practicante SQL", min: 200 },
  { name: "Analista de consultas", min: 600 },
  { name: "Especialista Oracle", min: 1500 },
  { name: "Preparado/a para el examen", min: 3000 }
];

function getCertLevel(xp) {
  let current = CERT_LEVELS[0];
  for (const l of CERT_LEVELS) { if (xp >= l.min) current = l; }
  return current;
}

function getCertLevelProgress(xp) {
  const idx = CERT_LEVELS.indexOf(getCertLevel(xp));
  const next = CERT_LEVELS[idx + 1];
  if (!next) return { pct: 100, next: null };
  const cur = CERT_LEVELS[idx];
  const pct = Math.round(((xp - cur.min) / (next.min - cur.min)) * 100);
  return { pct, next };
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

function updateCertStreak() {
  const today = todayStr();
  const s = CERT_STATE.streak;
  if (s.lastActiveDate === today) return; // ya contabilizado hoy
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  s.count = (s.lastActiveDate === yesterday) ? s.count + 1 : 1;
  s.lastActiveDate = today;
}

function computeXpForAnswer(q, correct, isFirstAttemptEver) {
  if (!correct) return 0;
  const diffMultiplier = { 1: 1, 2: 1.2, 3: 1.5, 4: 2, 5: 2.5 }[getDynamicDifficulty(q)] || 1;
  let xp = Math.round(10 * diffMultiplier);
  if (isFirstAttemptEver) xp += 5;
  xp += Math.min(20, (CERT_STATE.streak.count || 0) * 2);
  return xp;
}

function logCertActivity(q, correct, xpEarned, mode) {
  CERT_STATE.activityLog.push({
    at: new Date().toISOString(), id: q.id, correct, xp: xpEarned,
    topics: q.topics || [q.topic], difficulty: getDynamicDifficulty(q), mode
  });
  CERT_STATE.xp += xpEarned;
}

const CERT_BADGE_DEFS = [
  { id: "first_answer", name: "Primer paso", desc: "Responde tu primera pregunta.", check: s => Object.keys(s.progress).some(id => s.progress[id].attempts > 0) },
  { id: "ten_correct", name: "Diez aciertos", desc: "Consigue 10 respuestas correctas.", check: s => totalCorrectCount(s) >= 10 },
  { id: "fifty_correct", name: "Cincuenta aciertos", desc: "Consigue 50 respuestas correctas.", check: s => totalCorrectCount(s) >= 50 },
  { id: "hundred_answered", name: "Explorador del banco", desc: "Responde 100 preguntas distintas.", check: s => Object.keys(s.progress).filter(id => s.progress[id].attempts > 0).length >= 100 },
  { id: "streak_3", name: "Racha de 3 días", desc: "Practica 3 días seguidos.", check: s => s.streak.count >= 3 },
  { id: "streak_7", name: "Racha de 7 días", desc: "Practica 7 días seguidos.", check: s => s.streak.count >= 7 },
  { id: "exam_pass", name: "Simulacro superado", desc: "Aprueba un simulacro con 70% o más.", check: s => s.examHistory.some(h => h.score / h.total >= 0.7) },
  { id: "perfect_exam", name: "Simulacro perfecto", desc: "Consigue el 100% en un simulacro.", check: s => s.examHistory.some(h => h.score === h.total && h.total > 0) },
  { id: "progressive_expert", name: "Nivel Expert desbloqueado", desc: "Llega al nivel Expert en el modo progresivo.", check: s => s.progressiveLevel >= 4 },
  { id: "progressive_exam_challenge", name: "Nivel Exam Challenge desbloqueado", desc: "Desbloquea el nivel máximo del modo progresivo.", check: s => s.progressiveLevel >= 5 }
];

function totalCorrectCount(s) { return Object.values(s.progress).reduce((sum, p) => sum + p.correct, 0); }

function checkCertBadges() {
  const newlyEarned = [];
  CERT_BADGE_DEFS.forEach(b => {
    if (!CERT_STATE.badges[b.id] && b.check(CERT_STATE)) {
      CERT_STATE.badges[b.id] = new Date().toISOString();
      newlyEarned.push(b);
    }
  });
  newlyEarned.forEach(b => toast(`Insignia conseguida: ${b.name}`));
}

function ensureDailyMissions() {
  const today = todayStr();
  if (CERT_STATE.dailyMissions && CERT_STATE.dailyMissions.date === today) return CERT_STATE.dailyMissions;
  CERT_STATE.dailyMissions = {
    date: today,
    items: [
      { id: "answer_10", desc: "Responde 10 preguntas hoy", target: 10, xpReward: 30, done: false },
      { id: "correct_5", desc: "Consigue 5 respuestas correctas hoy", target: 5, xpReward: 30, done: false },
      { id: "review_failed", desc: "Vuelve a acertar 1 pregunta que antes fallaste", target: 1, xpReward: 20, done: false }
    ]
  };
  saveCertState();
  return CERT_STATE.dailyMissions;
}

function todaysActivity() {
  const today = todayStr();
  return CERT_STATE.activityLog.filter(a => a.at.slice(0, 10) === today);
}

function getMissionProgress(mission) {
  const today = todaysActivity();
  if (mission.id === "answer_10") return today.length;
  if (mission.id === "correct_5") return today.filter(a => a.correct).length;
  if (mission.id === "review_failed") return today.filter(a => a.correct && wasFailingBeforeToday(a.id)).length;
  return 0;
}

function wasFailingBeforeToday(id) {
  const p = CERT_STATE.progress[id];
  return !!(p && p.incorrect > 0);
}

function updateDailyMissions() {
  const missions = ensureDailyMissions();
  let changed = false;
  missions.items.forEach(m => {
    const progress = getMissionProgress(m);
    if (!m.done && progress >= m.target) {
      m.done = true;
      CERT_STATE.xp += m.xpReward;
      toast(`Misión completada: ${m.desc} (+${m.xpReward} XP)`);
      changed = true;
    }
  });
  if (changed) saveCertState();
}

/* Punto unico donde una respuesta real (correcta o no) impacta XP/SRS/racha/misiones/insignias. */
function registerAnswer(q, correct, mode) {
  const p = getQuestionProgress(q.id);
  const isFirstAttemptEver = p.attempts === 0;
  applySrsUpdate(p, correct);
  updateCertStreak();
  const xpEarned = computeXpForAnswer(q, correct, isFirstAttemptEver);
  logCertActivity(q, correct, xpEarned, mode);
  updateDailyMissions();
  checkCertBadges();
}

/* ---------------- Capa de pregunta efectiva (base + overrides de administración) ---------------- */

function getEffectiveQuestions() {
  return CERT_BANK
    .map(q => {
      const admin = CERT_STATE.admin[q.id];
      if (!admin) return q;
      if (admin.deleted || admin.mergedInto) return null;
      const merged = Object.assign({}, q);
      if (admin.reviewStatus) merged.reviewStatus = admin.reviewStatus;
      if (admin.topics && admin.topics.length) merged.topics = admin.topics;
      if (admin.difficulty) merged.dynamicDifficulty = admin.difficulty;
      return merged;
    })
    .filter(q => q !== null);
}

function getEffectiveQuestionById(id) {
  return getEffectiveQuestions().find(q => q.id === id) || null;
}

function getDynamicDifficulty(q) {
  const admin = CERT_STATE.admin[q.id];
  if (admin && admin.difficulty) return admin.difficulty;
  const p = CERT_STATE.progress[q.id];
  if (!p || p.attempts < 3) return q.initialDifficulty;
  const accuracy = p.correct / p.attempts;
  if (accuracy < 0.4) return Math.min(5, q.initialDifficulty + 1);
  if (accuracy > 0.9) return Math.max(1, q.initialDifficulty - 1);
  return q.initialDifficulty;
}

function getLearningState(id) {
  const p = CERT_STATE.progress[id];
  if (!p || !p.srs) return "new";
  return p.srs.state;
}

function isFailing(id) {
  const p = CERT_STATE.progress[id];
  return !!(p && p.lastResult === "incorrect");
}

const CERT_LEARNING_LABELS = { new: "New", learning: "Learning", review: "Review", mastered: "Mastered" };

/* ---------------- Render de contenido (contentBlocks) ---------------- */

function renderContentBlocks(blocks) {
  if (!blocks || blocks.length === 0) return "";
  return blocks.map(b => {
    if (b.type === "sql") {
      return `<pre class="cb-block cb-sql"><code>${escapeHtml(b.text)}</code></pre>`;
    }
    if (b.type === "image") {
      return `<div class="cb-block cb-image-wrap">
        <img class="cb-image" src="${escapeHtml(b.path)}" alt="Imagen del examen original (posible tabla/exhibit)" loading="lazy" onclick="this.classList.toggle('zoomed')">
        <span class="cb-image-hint">Captura original del examen · clic para ampliar</span>
      </div>`;
    }
    return `<p class="cb-block cb-text">${escapeHtml(b.text).replace(/\n/g, "<br>")}</p>`;
  }).join("");
}

function renderOptionsForm(q, sessionId, disabled) {
  const inputType = q.expectedAnswerCount > 1 ? "checkbox" : "radio";
  return `<div class="cert-options" data-input-type="${inputType}">
    ${q.options.map(opt => `
      <label class="cert-option ${disabled ? "disabled" : ""}">
        <input type="${inputType}" name="cert-opt-${sessionId}" value="${escapeHtml(opt.id)}" ${disabled ? "disabled" : ""}>
        <span class="cert-option-id">${escapeHtml(opt.id)}</span>
        <span class="cert-option-text">${escapeHtml(opt.text)}</span>
      </label>`).join("")}
  </div>`;
}

function getSelectedOptionIds(container) {
  return Array.from(container.querySelectorAll("input:checked")).map(i => i.value).sort();
}

function arraysEqual(a, b) {
  const x = [...a].sort(), y = [...b].sort();
  return x.length === y.length && x.every((v, i) => v === y[i]);
}

/* ---------------- Filtros compartidos ---------------- */

function filterQuestions(questions, filters) {
  return questions.filter(q => {
    if (filters.topics && filters.topics.length && !q.topics.some(t => filters.topics.includes(t))) return false;
    if (filters.difficulties && filters.difficulties.length && !filters.difficulties.includes(getDynamicDifficulty(q))) return false;
    if (filters.types && filters.types.length && !filters.types.includes(q.questionType)) return false;
    if (filters.learningStates && filters.learningStates.length && !filters.learningStates.includes(getLearningState(q.id))) return false;
    if (filters.onlyImages && (!q.exhibitImages || q.exhibitImages.length === 0)) return false;
    if (filters.onlySql && !(q.contentBlocks || []).some(b => b.type === "sql")) return false;
    if (filters.onlyTables) return false; // no hay tablas estructuradas (ver limitaciones); el filtro nunca devuelve nada
    if (filters.excludePendingAndDuplicate && (q.reviewStatus === "pending_review" || q.reviewStatus === "duplicate")) return false;
    return true;
  });
}

/* ---------------- Router del modulo ---------------- */

let CERT_TAB = "practice";

function renderGamifyBar() {
  const level = getCertLevel(CERT_STATE.xp);
  const levelProgress = getCertLevelProgress(CERT_STATE.xp);
  const missions = ensureDailyMissions();
  const doneCount = missions.items.filter(m => m.done).length;
  return `
    <div class="cert-gamify-bar">
      <div class="cert-gamify-level">
        <span class="cert-gamify-level-name">${escapeHtml(level.name)}</span>
        <div class="progress-track small"><div class="progress-fill" style="width:${levelProgress.pct}%"></div></div>
      </div>
      <span class="pill">${CERT_STATE.xp} XP</span>
      <span class="pill">Racha: ${CERT_STATE.streak.count} días</span>
      <span class="pill">Misiones hoy: ${doneCount}/${missions.items.length}</span>
    </div>
  `;
}

function renderCertBank() {
  const el = document.getElementById("view-certbank");
  el.innerHTML = `
    <div class="certbank-header">
      <h2>Banco de examen Oracle</h2>
      <p>${CERT_BANK.length} preguntas importadas de la carpeta <code>Exámenes/</code>, en inglés y literales al documento original. Las marcadas como pendientes de revisión no deben tratarse todavía como fiables al 100%.</p>
    </div>
    ${renderGamifyBar()}
    <div class="certbank-tabs" id="certbank-tabs">
      <button data-tab="practice">Niveles</button>
      <button data-tab="exam">Simulacro Oracle</button>
      <button data-tab="review">Repaso de errores</button>
      <button data-tab="dashboard">Dashboard</button>
      <button data-tab="ranking">Ranking</button>
      <button data-tab="achievements">Logros</button>
      <button data-tab="admin">Administración</button>
    </div>
    <div id="certbank-tab-content"></div>
  `;
  document.querySelectorAll("#certbank-tabs button").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === CERT_TAB);
    btn.onclick = () => { CERT_TAB = btn.dataset.tab; renderCertBank(); };
  });
  const content = document.getElementById("certbank-tab-content");
  if (CERT_TAB === "practice") renderCertLevelSelection(content);
  else if (CERT_TAB === "exam") renderCertExamSetup(content);
  else if (CERT_TAB === "review") renderCertReviewSetup(content);
  else if (CERT_TAB === "dashboard") renderCertDashboard(content);
  else if (CERT_TAB === "ranking") renderCertRanking(content);
  else if (CERT_TAB === "achievements") renderCertAchievements(content);
  else if (CERT_TAB === "admin") renderCertAdmin(content);
}

/* ================= NIVELES (pantalla de seleccion de nivel) ================= */
/* Sustituye al antiguo "Banco de preguntas Oracle" (filtros por tema/dificultad/tipo/estado).
   Las preguntas se organizan directamente por los 5 niveles de dificultad ya presentes en
   certification-bank.json (initialDifficulty 1-5 = Easy..Exam Challenge). Sin filtros: se
   entra directamente a un nivel. */

let CERT_SESSION = null; // { mode, ids, index, startedAt(per-question), config, results:{correct,incorrect}, examMeta }

const CERT_LEVEL_ORDER = [1, 2, 3, 4, 5];

const CERT_LEVEL_DESCRIPTIONS = {
  1: "Preguntas básicas, sintaxis sencilla, conceptos directos y consultas simples.",
  2: "Preguntas que requieren aplicar reglas: JOINs, GROUP BY, funciones y subconsultas sencillas.",
  3: "Consultas más complejas, varios conceptos combinados, varias respuestas correctas y análisis de resultados.",
  4: "Casos complejos, distractores muy similares y comportamientos específicos de Oracle.",
  5: "Preguntas de mayor dificultad, con más fallos habituales y escenarios similares al examen real."
};

function levelQuestionPool(level) {
  // Se incluyen las "pending_review" para que los niveles no queden casi vacios mientras se
  // revisan en Administracion; cada una se marca en la propia pregunta con el aviso
  // "Pendiente de revisión" (ver renderCertSession) para no presentarla como 100% fiable.
  // Los duplicados si se excluyen: no aportan nada nuevo, solo repiten otra pregunta.
  return getEffectiveQuestions().filter(q => q.initialDifficulty === level && q.reviewStatus !== "duplicate");
}

function renderCertLevelSelection(container) {
  container.innerHTML = `
    <div class="cert-panel">
      <h3>Niveles</h3>
      <p>Las preguntas reales importadas de los exámenes Oracle, organizadas por dificultad. Elige un nivel para empezar.</p>
      <div class="cert-difficulty-grid">
        ${CERT_LEVEL_ORDER.map(level => {
          const pool = levelQuestionPool(level);
          const stats = progressiveLevelStats(level);
          const hasProgress = stats.attempts > 0;
          return `
            <div class="cert-difficulty-card">
              <span class="cert-difficulty-card-tag">${level}</span>
              <h4>${CERT_DIFFICULTY_LABELS[level]}</h4>
              <p class="cert-difficulty-card-desc">${escapeHtml(CERT_LEVEL_DESCRIPTIONS[level])}</p>
              <span class="cert-difficulty-card-count">${pool.length} preguntas disponibles</span>
              <span class="cert-difficulty-card-progress">${hasProgress ? `${stats.attempts} respondidas · ${Math.round(stats.accuracy * 100)}% acierto` : "Todavía sin empezar"}</span>
              <button class="btn" data-level="${level}" ${pool.length === 0 ? "disabled" : ""}>${hasProgress ? "Continue" : "Start level"}</button>
            </div>`;
        }).join("")}
      </div>
      <div id="level-empty" class="cert-empty-state hidden"></div>
    </div>
    <div id="cert-session-area"></div>
  `;
  container.querySelectorAll("[data-level]").forEach(btn => {
    btn.onclick = () => {
      const level = parseInt(btn.dataset.level, 10);
      const pool = shuffle(levelQuestionPool(level));
      const emptyEl = document.getElementById("level-empty");
      if (pool.length === 0) {
        emptyEl.classList.remove("hidden");
        emptyEl.textContent = "Este nivel no tiene preguntas disponibles todavía.";
        return;
      }
      emptyEl.classList.add("hidden");
      CERT_SESSION = { mode: "practice", ids: pool.map(q => q.id), index: 0, config: { level }, results: { correct: 0, incorrect: 0 }, questionShownAt: Date.now() };
      renderCertSession();
      maybeUnlockNextLevel(level);
    };
  });
}

function renderCertSession() {
  const area = document.getElementById("cert-session-area");
  if (!CERT_SESSION) { area.innerHTML = ""; return; }
  const s = CERT_SESSION;
  if (s.index >= s.ids.length) {
    area.innerHTML = renderSessionSummary(s);
    const again = document.getElementById("session-again");
    if (again) again.onclick = () => { CERT_SESSION = null; renderCertBank(); };
    return;
  }
  const q = getEffectiveQuestionById(s.ids[s.index]);
  s.questionShownAt = s.questionShownAt || Date.now();
  const isExam = s.mode === "exam";
  area.innerHTML = `
    <div class="cert-session ${isExam ? "cert-exam" : ""}">
      ${isExam ? renderExamChrome(s) : ""}
      <div class="cert-question-card">
        <div class="cert-question-meta">
          <span class="pill">${escapeHtml(q.sourceFile)} · #${q.sourcePosition}</span>
          <span class="pill">${escapeHtml((q.topics || [q.topic]).join(", "))}</span>
          <span class="pill">${CERT_DIFFICULTY_LABELS[getDynamicDifficulty(q)]}</span>
          ${q.expectedAnswerCount > 1 ? `<span class="pill accent">Elige ${q.expectedAnswerCount}</span>` : ""}
          ${q.reviewStatus === "pending_review" ? `<span class="pill warn" title="La extracción de esta pregunta todavía no se ha revisado manualmente: la respuesta marcada podría no ser exacta.">Sin revisar todavía — respuesta no garantizada</span>` : ""}
        </div>
        <div class="cert-question-body">${renderContentBlocks(q.contentBlocks)}</div>
        ${renderOptionsForm(q, "s", false)}
        <div class="cert-question-actions">
          ${!isExam ? `<button class="btn" id="cert-check">Comprobar respuesta</button>` : ""}
          ${isExam ? `<button class="btn secondary" id="cert-flag">${s.flags && s.flags[q.id] ? "Quitar marca" : "Marcar para revisar"}</button>` : ""}
          <button class="btn secondary" id="cert-skip">${isExam ? "Ir a la siguiente" : "Omitir"}</button>
          ${isExam ? `<button class="btn secondary" id="cert-finish-exam">Finalizar simulacro</button>` : ""}
        </div>
        <div id="cert-feedback"></div>
      </div>
    </div>
  `;

  const optsContainer = area.querySelector(".cert-options");
  const checkBtn = document.getElementById("cert-check");
  if (checkBtn) checkBtn.onclick = () => answerCurrentQuestion(q, optsContainer);
  document.getElementById("cert-skip").onclick = () => { if (isExam) examAdvance(); else skipCurrentQuestion(q); };
  if (isExam) {
    document.getElementById("cert-flag").onclick = () => {
      s.flags = s.flags || {};
      s.flags[q.id] = !s.flags[q.id];
      renderCertSession();
    };
    document.getElementById("cert-finish-exam").onclick = () => finishExam(true);
    wireExamPalette(s);
  }
}

function answerCurrentQuestion(q, optsContainer) {
  const selected = getSelectedOptionIds(optsContainer);
  if (selected.length === 0) { toast("Selecciona al menos una opción."); return; }
  const correct = arraysEqual(selected, q.correctAnswers);
  const elapsedMs = Date.now() - (CERT_SESSION.questionShownAt || Date.now());
  registerAnswer(q, correct, CERT_SESSION.mode); // XP/racha/SRS/misiones/insignias, antes de tocar attempts
  const p = getQuestionProgress(q.id);
  p.attempts++;
  p.totalTimeMs += elapsedMs;
  p.lastAnsweredAt = new Date().toISOString();
  if (correct) { p.correct++; p.lastResult = "correct"; CERT_SESSION.results.correct++; }
  else { p.incorrect++; p.lastResult = "incorrect"; CERT_SESSION.results.incorrect++; }
  saveCertState();

  optsContainer.querySelectorAll("input").forEach(i => i.disabled = true);
  optsContainer.querySelectorAll("label.cert-option").forEach(lbl => {
    const val = lbl.querySelector("input").value;
    if (q.correctAnswers.includes(val)) lbl.classList.add("is-correct");
    else if (selected.includes(val)) lbl.classList.add("is-incorrect");
  });

  document.getElementById("cert-feedback").innerHTML = `
    <div class="cert-feedback ${correct ? "ok" : "bad"}">
      <strong>${correct ? "Correcto" : "Incorrecto"}</strong>
      <span>Respuesta(s) correcta(s): ${q.correctAnswers.join(", ")}</span>
      <span>Tema: ${escapeHtml((q.topics || [q.topic]).join(", "))} · Dificultad: ${CERT_DIFFICULTY_LABELS[getDynamicDifficulty(q)]} · Tiempo: ${Math.round(elapsedMs / 1000)}s${correct ? ` · +${CERT_STATE.activityLog[CERT_STATE.activityLog.length - 1].xp} XP` : ""}</span>
      <button class="btn" id="cert-next">${CERT_SESSION.index + 1 < CERT_SESSION.ids.length ? "Siguiente pregunta" : "Ver resumen"}</button>
      <button class="btn secondary" id="cert-toggle-flag">${p.flagged ? "Quitar de marcadas" : "Marcar para repasar más tarde"}</button>
    </div>
  `;
  document.getElementById("cert-check").remove();
  document.getElementById("cert-skip").remove();
  document.getElementById("cert-next").onclick = () => { CERT_SESSION.index++; CERT_SESSION.questionShownAt = Date.now(); renderCertSession(); };
  document.getElementById("cert-toggle-flag").onclick = () => { p.flagged = !p.flagged; saveCertState(); renderCertSession(); };
}

function skipCurrentQuestion(q) {
  const p = getQuestionProgress(q.id);
  p.timesSkipped++;
  saveCertState();
  CERT_SESSION.index++;
  CERT_SESSION.questionShownAt = Date.now();
  renderCertSession();
}

function renderSessionSummary(s) {
  const total = s.results.correct + s.results.incorrect;
  const pct = total > 0 ? Math.round((s.results.correct / total) * 100) : 0;
  return `
    <div class="cert-panel cert-summary">
      <h3>Resumen de la sesión</h3>
      <p>${s.results.correct} de ${total} correctas (${pct}%).</p>
      <button class="btn" id="session-again">Volver a los filtros</button>
    </div>
  `;
}

/* ================= SIMULACRO ORACLE ================= */

function renderCertExamSetup(container) {
  const eligible = filterQuestions(getEffectiveQuestions(), { excludePendingAndDuplicate: true });
  container.innerHTML = `
    <div class="cert-panel">
      <h3>Simulacro Oracle</h3>
      <p>Genera un examen con preguntas aleatorias del banco validado (se excluyen automáticamente las pendientes de revisión y los duplicados). No se muestran las respuestas hasta finalizar.</p>
      <div class="cert-filter-group">
        <label>Número de preguntas
          <input type="number" id="exam-count" min="5" max="${Math.max(5, eligible.length)}" value="${Math.min(20, eligible.length)}">
        </label>
        <label>Minutos por pregunta
          <input type="number" id="exam-minutes-per-q" min="0.5" max="5" step="0.5" value="1.5">
        </label>
      </div>
      <p class="cert-hint">${eligible.length} preguntas validadas disponibles actualmente para simulacro.</p>
      <button class="btn" id="exam-start" ${eligible.length === 0 ? "disabled" : ""}>Comenzar simulacro</button>
    </div>
    <div id="cert-session-area"></div>
  `;
  document.getElementById("exam-start").onclick = () => {
    const count = Math.min(eligible.length, Math.max(1, parseInt(document.getElementById("exam-count").value, 10) || 20));
    const minutesPerQ = parseFloat(document.getElementById("exam-minutes-per-q").value) || 1.5;
    const pool = shuffle(eligible).slice(0, count);
    CERT_SESSION = {
      mode: "exam", ids: pool.map(q => q.id), index: 0, flags: {}, answers: {},
      config: { minutesPerQ }, results: { correct: 0, incorrect: 0 },
      startedAt: Date.now(), timeLimitSec: Math.round(count * minutesPerQ * 60), questionShownAt: Date.now()
    };
    startExamTimer();
    renderCertSession();
  };
}

let CERT_EXAM_TICK = null;

function startExamTimer() {
  if (CERT_EXAM_TICK) clearInterval(CERT_EXAM_TICK);
  CERT_EXAM_TICK = setInterval(() => {
    if (!CERT_SESSION || CERT_SESSION.mode !== "exam") { clearInterval(CERT_EXAM_TICK); return; }
    const elapsed = Math.floor((Date.now() - CERT_SESSION.startedAt) / 1000);
    const remaining = CERT_SESSION.timeLimitSec - elapsed;
    const timerEl = document.getElementById("exam-timer");
    if (timerEl) timerEl.textContent = formatSeconds(Math.max(0, remaining));
    if (remaining <= 0) { clearInterval(CERT_EXAM_TICK); finishExam(false); }
  }, 1000);
}

function renderExamChrome(s) {
  return `
    <div class="cert-exam-chrome">
      <div class="cert-exam-timer">Tiempo restante: <strong id="exam-timer">${formatSeconds(Math.max(0, s.timeLimitSec - Math.floor((Date.now() - s.startedAt) / 1000)))}</strong></div>
      <div class="cert-exam-palette" id="exam-palette">
        ${s.ids.map((id, i) => {
          const answered = s.answers[id] !== undefined;
          const flagged = s.flags && s.flags[id];
          const current = i === s.index;
          return `<button class="palette-btn ${answered ? "answered" : ""} ${flagged ? "flagged" : ""} ${current ? "current" : ""}" data-idx="${i}">${i + 1}</button>`;
        }).join("")}
      </div>
    </div>
  `;
}

function wireExamPalette(s) {
  document.querySelectorAll("#exam-palette .palette-btn").forEach(btn => {
    btn.onclick = () => {
      persistCurrentExamAnswer();
      s.index = parseInt(btn.dataset.idx, 10);
      s.questionShownAt = Date.now();
      renderCertSession();
    };
  });
}

function persistCurrentExamAnswer() {
  const s = CERT_SESSION;
  if (!s || s.mode !== "exam") return;
  const container = document.querySelector(".cert-options");
  if (!container) return;
  const selected = getSelectedOptionIds(container);
  const id = s.ids[s.index];
  if (selected.length > 0) s.answers[id] = selected;
}

// En modo examen, "Ir a la siguiente" solo avanza (sin corregir ni contar como omitida).
function examAdvance() {
  persistCurrentExamAnswer();
  CERT_SESSION.index = Math.min(CERT_SESSION.ids.length - 1, CERT_SESSION.index + 1);
  CERT_SESSION.questionShownAt = Date.now();
  renderCertSession();
}

function finishExam(manual) {
  persistCurrentExamAnswer();
  if (manual && !confirm("¿Finalizar el simulacro? No podrás cambiar más respuestas.")) return;
  if (CERT_EXAM_TICK) clearInterval(CERT_EXAM_TICK);
  const s = CERT_SESSION;
  const topicStats = {};
  let correctCount = 0;
  const failedQuestions = [];
  s.ids.forEach(id => {
    const q = getEffectiveQuestionById(id);
    const given = s.answers[id] || [];
    const correct = given.length > 0 && arraysEqual(given, q.correctAnswers);
    if (given.length > 0) registerAnswer(q, correct, "exam"); // XP/racha/SRS/misiones/insignias; solo si hubo respuesta real
    const p = getQuestionProgress(id);
    p.attempts++;
    if (given.length === 0) p.timesSkipped++;
    if (correct) { p.correct++; p.lastResult = "correct"; correctCount++; }
    else { p.incorrect++; p.lastResult = given.length === 0 ? p.lastResult : "incorrect"; failedQuestions.push(id); }
    (q.topics || [q.topic]).forEach(t => {
      topicStats[t] = topicStats[t] || { correct: 0, total: 0 };
      topicStats[t].total++;
      if (correct) topicStats[t].correct++;
    });
  });
  saveCertState();

  const weak = Object.entries(topicStats).filter(([, v]) => v.total > 0 && v.correct / v.total < 0.6).map(([k]) => k);
  const strong = Object.entries(topicStats).filter(([, v]) => v.total > 0 && v.correct / v.total >= 0.8).map(([k]) => k);
  const elapsedSeconds = Math.floor((Date.now() - s.startedAt) / 1000);

  CERT_STATE.examHistory.push({
    date: new Date().toISOString(), count: s.ids.length, score: correctCount, total: s.ids.length,
    elapsedSeconds, weakTopics: weak, strongTopics: strong
  });
  checkCertBadges(); // ahora si con el examHistory ya actualizado (insignias "exam_pass"/"perfect_exam")
  saveCertState();

  const area = document.getElementById("cert-session-area");
  area.innerHTML = `
    <div class="cert-panel cert-summary">
      <h3>Resultado del simulacro</h3>
      <p class="cert-exam-score">${correctCount} / ${s.ids.length} (${Math.round((correctCount / s.ids.length) * 100)}%)</p>
      <p>Tiempo empleado: ${formatSeconds(elapsedSeconds)}</p>
      <p><strong>Temas débiles:</strong> ${weak.length ? escapeHtml(weak.join(", ")) : "ninguno destacado"}</p>
      <p><strong>Temas fuertes:</strong> ${strong.length ? escapeHtml(strong.join(", ")) : "ninguno destacado"}</p>
      <h4>Preguntas falladas u omitidas (${failedQuestions.length})</h4>
      <ul class="cert-fail-list">
        ${failedQuestions.map(id => {
          const q = getEffectiveQuestionById(id);
          return `<li>${escapeHtml(q.sourceFile)} #${q.sourcePosition} — ${escapeHtml(q.questionText.slice(0, 90))}...</li>`;
        }).join("")}
      </ul>
      <button class="btn" id="session-again">Volver</button>
    </div>
  `;
  document.getElementById("session-again").onclick = () => { CERT_SESSION = null; renderCertBank(); };
}

/* ================= REPASO DE ERRORES ================= */

function computeTopicAccuracy() {
  const stats = {};
  getEffectiveQuestions().forEach(q => {
    const p = CERT_STATE.progress[q.id];
    if (!p || p.attempts === 0) return;
    (q.topics || [q.topic]).forEach(t => {
      stats[t] = stats[t] || { correct: 0, total: 0 };
      stats[t].correct += p.correct;
      stats[t].total += p.attempts;
    });
  });
  return stats;
}

function getWeakTopics() {
  const stats = computeTopicAccuracy();
  return Object.entries(stats).filter(([, v]) => v.total >= 3 && v.correct / v.total < 0.6).map(([t]) => t);
}

function renderCertReviewSetup(container) {
  const all = getEffectiveQuestions();
  const failed = all.filter(q => isFailing(q.id));
  const skipped = all.filter(q => { const p = CERT_STATE.progress[q.id]; return p && p.timesSkipped > 0; });
  const flagged = all.filter(q => { const p = CERT_STATE.progress[q.id]; return p && p.flagged; });
  const timed = all.filter(q => { const p = CERT_STATE.progress[q.id]; return p && p.attempts > 0; })
    .map(q => ({ q, avg: CERT_STATE.progress[q.id].totalTimeMs / CERT_STATE.progress[q.id].attempts }))
    .sort((a, b) => b.avg - a.avg).slice(0, 15).map(x => x.q);
  const difficult = all.filter(q => getDynamicDifficulty(q) >= 4 && isFailing(q.id));
  const dueForReview = all.filter(q => isDueForReview(CERT_STATE.progress[q.id]));
  const weakTopics = getWeakTopics();
  const weakTopicQuestions = all.filter(q => (q.topics || [q.topic]).some(t => weakTopics.includes(t)));

  const recommendedSet = new Map();
  [...dueForReview, ...failed, ...difficult, ...weakTopicQuestions].forEach(q => { if (!recommendedSet.has(q.id)) recommendedSet.set(q.id, q); });
  const recommended = Array.from(recommendedSet.values()).slice(0, 25);

  container.innerHTML = `
    <div class="cert-panel">
      <h3>Repaso de errores</h3>
      <p>Sesiones dirigidas a partir de tu historial real en este navegador. "Recomendado" prioriza preguntas falladas, difíciles y de temas débiles${weakTopics.length ? ` (${escapeHtml(weakTopics.join(", "))})` : ""}.</p>
      <div class="cert-review-groups">
        <button class="cert-review-card recommended" data-group="recommended">Recomendado hoy <span>${recommended.length}</span></button>
        <button class="cert-review-card" data-group="failed">Falladas <span>${failed.length}</span></button>
        <button class="cert-review-card" data-group="dueForReview">Pendientes de repaso (SRS) <span>${dueForReview.length}</span></button>
        <button class="cert-review-card" data-group="skipped">Omitidas <span>${skipped.length}</span></button>
        <button class="cert-review-card" data-group="flagged">Marcadas <span>${flagged.length}</span></button>
        <button class="cert-review-card" data-group="timed">Mayor tiempo <span>${timed.length}</span></button>
        <button class="cert-review-card" data-group="difficult">Difíciles y falladas <span>${difficult.length}</span></button>
      </div>
    </div>
    <div id="cert-session-area"></div>
  `;
  const groups = { recommended, failed, dueForReview, skipped, flagged, timed, difficult };
  document.querySelectorAll(".cert-review-card").forEach(btn => {
    btn.onclick = () => {
      const pool = groups[btn.dataset.group];
      if (!pool || pool.length === 0) { toast("No hay preguntas en este grupo todavía."); return; }
      CERT_SESSION = { mode: "practice", ids: shuffle(pool).map(q => q.id), index: 0, config: {}, results: { correct: 0, incorrect: 0 }, questionShownAt: Date.now() };
      renderCertSession();
    };
  });
}

/* ================= Estadisticas por nivel (usadas por la pantalla de Niveles) ================= */
/* CERT_STATE.progressiveLevel ya no bloquea el acceso a ningun nivel (se puede elegir
   cualquiera directamente desde las tarjetas), pero se sigue actualizando para las
   insignias "progressive_expert"/"progressive_exam_challenge". */

const CERT_PROGRESSIVE_ORDER = [1, 2, 3, 4, 5];

function progressiveLevelStats(level) {
  const qs = getEffectiveQuestions().filter(q => q.initialDifficulty === level);
  let attempts = 0, correct = 0;
  qs.forEach(q => { const p = CERT_STATE.progress[q.id]; if (p) { attempts += p.attempts; correct += p.correct; } });
  return { total: qs.length, attempts, correct, accuracy: attempts > 0 ? correct / attempts : 0 };
}

function maybeUnlockNextLevel(level) {
  const stats = progressiveLevelStats(level);
  const idx = CERT_PROGRESSIVE_ORDER.indexOf(level);
  if (stats.attempts >= 5 && stats.accuracy >= 0.7 && idx >= 0 && idx + 1 < CERT_PROGRESSIVE_ORDER.length) {
    const nextLevel = CERT_PROGRESSIVE_ORDER[idx + 1];
    if (CERT_STATE.progressiveLevel < nextLevel) {
      CERT_STATE.progressiveLevel = nextLevel;
      saveCertState();
      toast(`Nivel ${CERT_DIFFICULTY_LABELS[nextLevel]} desbloqueado`);
    }
  }
}

/* ================= DASHBOARD ================= */

function isoWeekKey(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-S${String(weekNo).padStart(2, "0")}`;
}

function bucketActivity(keyFn, limit) {
  const buckets = {};
  CERT_STATE.activityLog.forEach(a => {
    const key = keyFn(new Date(a.at));
    buckets[key] = buckets[key] || { total: 0, correct: 0 };
    buckets[key].total++;
    if (a.correct) buckets[key].correct++;
  });
  const keys = Object.keys(buckets).sort();
  return keys.slice(-limit).map(k => ({ key: k, total: buckets[k].total, accuracy: Math.round((buckets[k].correct / buckets[k].total) * 100) }));
}

function renderBarEvolution(buckets, emptyMsg) {
  if (buckets.length === 0) return `<p class="cert-empty-state">${emptyMsg}</p>`;
  const maxTotal = Math.max(...buckets.map(b => b.total), 1);
  return `<div class="evo-chart">${buckets.map(b => `
    <div class="evo-bar-wrap" title="${escapeHtml(b.key)}: ${b.total} respondidas, ${b.accuracy}% de acierto">
      <div class="evo-bar" style="height:${Math.max(4, Math.round((b.total / maxTotal) * 100))}%"></div>
      <span class="evo-date">${escapeHtml(b.key.slice(5))}</span>
    </div>`).join("")}</div>`;
}

function renderPerformanceHeatmap(entries) {
  // entries: [{ label, accuracy: number|null, total }]
  return `<div class="heatmap-grid">${entries.map(e => {
    const tier = e.accuracy === null ? "nodata" : e.accuracy >= 75 ? "high" : e.accuracy >= 50 ? "mid" : "low";
    return `<div class="heatmap-cell tier-${tier}" title="${e.total || 0} respuestas">
      <span class="hm-name">${escapeHtml(e.label)}</span>
      <span class="hm-pct">${e.accuracy === null ? "Sin datos" : e.accuracy + "%"}</span>
    </div>`;
  }).join("")}</div>`;
}

function renderCertDashboard(container) {
  const entries = Object.values(CERT_STATE.progress);
  const answered = entries.filter(p => p.attempts > 0).length;
  const correct = entries.reduce((s, p) => s + p.correct, 0);
  const incorrect = entries.reduce((s, p) => s + p.incorrect, 0);
  const totalAttempts = correct + incorrect;
  const accuracy = totalAttempts > 0 ? Math.round((correct / totalAttempts) * 100) : 0;
  const totalTimeMs = entries.reduce((s, p) => s + p.totalTimeMs, 0);
  const avgTimeSec = totalAttempts > 0 ? Math.round(totalTimeMs / totalAttempts / 1000) : 0;

  if (answered === 0) {
    container.innerHTML = `<div class="cert-panel"><h3>Dashboard</h3><p class="cert-empty-state">Todavía no has respondido ninguna pregunta del banco de examen Oracle. Practica primero para ver aquí tu dashboard real (no se muestran datos de ejemplo).</p></div>`;
    return;
  }

  const weekly = bucketActivity(d => isoWeekKey(d), 8);
  const monthly = bucketActivity(d => d.toISOString().slice(0, 7), 6);

  const topicStats = computeTopicAccuracy();
  const topicEntries = CERT_ALL_TOPICS.map(t => {
    const s = topicStats[t];
    return { label: t, accuracy: s ? Math.round((s.correct / s.total) * 100) : null, total: s ? s.total : 0 };
  });

  const diffStats = {};
  getEffectiveQuestions().forEach(q => {
    const p = CERT_STATE.progress[q.id];
    if (!p || p.attempts === 0) return;
    const d = q.initialDifficulty;
    diffStats[d] = diffStats[d] || { correct: 0, total: 0 };
    diffStats[d].correct += p.correct;
    diffStats[d].total += p.attempts;
  });
  const diffEntries = [1, 2, 3, 4, 5].map(d => {
    const s = diffStats[d];
    return { label: `${d}. ${CERT_DIFFICULTY_LABELS[d]}`, accuracy: s ? Math.round((s.correct / s.total) * 100) : null, total: s ? s.total : 0 };
  });

  container.innerHTML = `
    <div class="cert-panel">
      <h3>Dashboard</h3>
      <div class="cert-stats-grid">
        <div class="cert-stat-tile"><span class="num">${CERT_BANK.length}</span><span class="lbl">Total preguntas</span></div>
        <div class="cert-stat-tile"><span class="num">${answered}</span><span class="lbl">Respondidas</span></div>
        <div class="cert-stat-tile"><span class="num">${correct}</span><span class="lbl">Correctas</span></div>
        <div class="cert-stat-tile"><span class="num">${incorrect}</span><span class="lbl">Incorrectas</span></div>
        <div class="cert-stat-tile"><span class="num">${accuracy}%</span><span class="lbl">Accuracy</span></div>
        <div class="cert-stat-tile"><span class="num">${avgTimeSec}s</span><span class="lbl">Tiempo medio</span></div>
      </div>

      <h4>Evolución semanal</h4>
      ${renderBarEvolution(weekly, "Sin actividad suficiente todavía para ver una evolución semanal.")}

      <h4>Evolución mensual</h4>
      ${renderBarEvolution(monthly, "Sin actividad suficiente todavía para ver una evolución mensual.")}

      <h4>Rendimiento por tema</h4>
      ${renderPerformanceHeatmap(topicEntries)}

      <h4>Rendimiento por dificultad</h4>
      ${renderPerformanceHeatmap(diffEntries)}

      <h4>Historial de simulacros</h4>
      ${CERT_STATE.examHistory.length === 0 ? `<p class="cert-empty-state">Todavía no has hecho ningún simulacro.</p>` : `
        <ul class="cert-exam-history">
          ${CERT_STATE.examHistory.slice().reverse().map(h => `
            <li>${new Date(h.date).toLocaleString()} — ${h.score}/${h.total} (${Math.round((h.score / h.total) * 100)}%) en ${formatSeconds(h.elapsedSeconds)}</li>
          `).join("")}
        </ul>
      `}
    </div>
  `;
}

/* ================= RANKING ================= */
/* Honesto: no hay backend ni cuentas de usuario (ver AUDIT_REPORT.md), asi que no existe forma
   real de comparar tu progreso con el de otras personas todavia. En vez de simular companeros
   ficticios (prohibido explicitamente), se muestra solo tu fila real y se explica la limitacion. */

let CERT_RANKING_RANGE = "historical";

function activityInRange(range) {
  const now = Date.now();
  const cutoff = range === "weekly" ? now - 7 * 86400000 : range === "monthly" ? now - 30 * 86400000 : 0;
  return CERT_STATE.activityLog.filter(a => new Date(a.at).getTime() >= cutoff);
}

function renderCertRanking(container) {
  const renderTable = () => {
    const activity = activityInRange(CERT_RANKING_RANGE);
    const xpInRange = activity.reduce((s, a) => s + a.xp, 0);
    const correctInRange = activity.filter(a => a.correct).length;
    const accuracyInRange = activity.length > 0 ? Math.round((correctInRange / activity.length) * 100) : 0;
    const level = getCertLevel(CERT_STATE.xp);
    const bestExam = CERT_STATE.examHistory.reduce((best, h) => {
      const pct = Math.round((h.score / h.total) * 100);
      return pct > best ? pct : best;
    }, 0);
    const name = (typeof STATE !== "undefined" && STATE.studentName) ? STATE.studentName : "Tú";

    document.getElementById("cert-ranking-table").innerHTML = `
      <table class="cert-ranking-table">
        <thead><tr><th>Usuario</th><th>XP${CERT_RANKING_RANGE !== "historical" ? " (periodo)" : ""}</th><th>Accuracy${CERT_RANKING_RANGE !== "historical" ? " (periodo)" : ""}</th><th>Nivel</th><th>Mejor simulacro</th></tr></thead>
        <tbody>
          <tr>
            <td>${escapeHtml(name)}</td>
            <td>${CERT_RANKING_RANGE === "historical" ? CERT_STATE.xp : xpInRange}</td>
            <td>${CERT_RANKING_RANGE === "historical" ? Math.round((Object.values(CERT_STATE.progress).reduce((s, p) => s + p.correct, 0) / Math.max(1, Object.values(CERT_STATE.progress).reduce((s, p) => s + p.correct + p.incorrect, 0))) * 100) : accuracyInRange}%</td>
            <td>${escapeHtml(level.name)}</td>
            <td>${bestExam}%</td>
          </tr>
        </tbody>
      </table>
    `;
  };

  container.innerHTML = `
    <div class="cert-panel">
      <h3>Ranking</h3>
      <div class="cert-admin-tabs">
        <button data-r="weekly">Semanal</button>
        <button data-r="monthly">Mensual</button>
        <button data-r="historical">Histórico</button>
      </div>
      <div id="cert-ranking-table"></div>
      <p class="cert-hint">Esta aplicación no tiene servidor: no existe todavía una forma real de comparar tu progreso con el de compañeros. Aquí solo se muestra tu propio progreso real (no se simulan otros usuarios). Cuando exista un backend, este ranking podrá mostrar a más gente.</p>
    </div>
  `;
  container.querySelectorAll("[data-r]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.r === CERT_RANKING_RANGE);
    btn.onclick = () => { CERT_RANKING_RANGE = btn.dataset.r; renderCertRanking(container); };
  });
  renderTable();
}

/* ================= LOGROS: insignias y misiones diarias ================= */

function renderCertAchievements(container) {
  const missions = ensureDailyMissions();
  const level = getCertLevel(CERT_STATE.xp);
  const levelProgress = getCertLevelProgress(CERT_STATE.xp);

  container.innerHTML = `
    <div class="cert-panel">
      <h3>Logros</h3>
      <div class="cert-level-card">
        <div>
          <span class="cert-level-name">${escapeHtml(level.name)}</span>
          <span class="cert-level-xp">${CERT_STATE.xp} XP</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${levelProgress.pct}%"></div></div>
        <span class="cert-hint">${levelProgress.next ? `${levelProgress.pct}% hacia ${levelProgress.next.name}` : "Nivel máximo alcanzado"}</span>
      </div>

      <h4>Misiones de hoy</h4>
      <ul class="cert-missions">
        ${missions.items.map(m => {
          const progress = Math.min(m.target, getMissionProgress(m));
          return `<li class="${m.done ? "done" : ""}">
            <span>${m.done ? "✔" : "○"} ${escapeHtml(m.desc)}</span>
            <span class="cert-mission-progress">${progress}/${m.target} · +${m.xpReward} XP</span>
          </li>`;
        }).join("")}
      </ul>

      <h4>Insignias</h4>
      <div class="cert-badges-grid">
        ${CERT_BADGE_DEFS.map(b => {
          const earned = CERT_STATE.badges[b.id];
          return `<div class="cert-badge ${earned ? "earned" : "locked"}" title="${escapeHtml(b.desc)}">
            <span class="cert-badge-name">${escapeHtml(b.name)}</span>
            <span class="cert-badge-desc">${escapeHtml(b.desc)}</span>
            ${earned ? `<span class="cert-badge-date">Conseguida el ${new Date(earned).toLocaleDateString()}</span>` : `<span class="cert-badge-date">Bloqueada</span>`}
          </div>`;
        }).join("")}
      </div>
    </div>
  `;
}

/* ================= PANEL DE ADMINISTRACION ================= */

let CERT_ADMIN_FILTER = "all";
let CERT_ADMIN_PAGE = 0;
const CERT_ADMIN_PAGE_SIZE = 20;

function renderCertAdmin(container) {
  container.innerHTML = `
    <div class="cert-panel">
      <h3>Administración del banco de examen</h3>
      <p class="cert-hint">Los cambios de este panel (aprobar/rechazar, editar tema/dificultad, fusionar duplicados) se guardan solo en este navegador: no hay backend que los comparta entre equipos (ver AUDIT_REPORT.md).</p>
      <div class="cert-admin-tabs">
        <button data-f="all">Todas</button>
      </div>
      <div id="cert-admin-content"></div>
    </div>
  `;
  document.querySelectorAll(".cert-admin-tabs button").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.f === CERT_ADMIN_FILTER);
    btn.onclick = () => { CERT_ADMIN_FILTER = btn.dataset.f; CERT_ADMIN_PAGE = 0; renderCertAdminContent(); };
  });
  renderCertAdminContent();
}

function renderCertAdminContent() {
  const el = document.getElementById("cert-admin-content");
  if (CERT_ADMIN_FILTER === "validation") { renderCertAdminValidation(el); return; }
  if (CERT_ADMIN_FILTER === "images") { renderCertAdminVisual(el); return; }

  let list = getEffectiveQuestions();
  if (CERT_ADMIN_FILTER !== "all") list = list.filter(q => q.reviewStatus === CERT_ADMIN_FILTER);

  const totalPages = Math.max(1, Math.ceil(list.length / CERT_ADMIN_PAGE_SIZE));
  CERT_ADMIN_PAGE = Math.min(CERT_ADMIN_PAGE, totalPages - 1);
  const pageItems = list.slice(CERT_ADMIN_PAGE * CERT_ADMIN_PAGE_SIZE, (CERT_ADMIN_PAGE + 1) * CERT_ADMIN_PAGE_SIZE);

  el.innerHTML = `
    <p class="cert-hint">${list.length} preguntas en este filtro.</p>
    <div class="cert-admin-list">
      ${pageItems.map(q => renderAdminRow(q)).join("")}
    </div>
    <div class="cert-admin-pager">
      <button class="btn secondary" id="admin-prev" ${CERT_ADMIN_PAGE === 0 ? "disabled" : ""}>Anterior</button>
      <span>${CERT_ADMIN_PAGE + 1} / ${totalPages}</span>
      <button class="btn secondary" id="admin-next" ${CERT_ADMIN_PAGE >= totalPages - 1 ? "disabled" : ""}>Siguiente</button>
    </div>
  `;
  const prevBtn = document.getElementById("admin-prev");
  const nextBtn = document.getElementById("admin-next");
  if (prevBtn) prevBtn.onclick = () => { CERT_ADMIN_PAGE--; renderCertAdminContent(); };
  if (nextBtn) nextBtn.onclick = () => { CERT_ADMIN_PAGE++; renderCertAdminContent(); };

  wireAdminRowActions(el);
}

function renderAdminRow(q) {
  const admin = CERT_STATE.admin[q.id] || {};
  return `
    <div class="cert-admin-row" data-id="${escapeHtml(q.id)}">
      <div class="cert-admin-row-head">
        <span class="pill">${escapeHtml(q.id)}</span>
        <span class="pill">${escapeHtml(q.sourceFile)}</span>
        <span class="pill">${q.reviewStatus}</span>
        <span class="pill">confianza ${q.extractionConfidence}</span>
      </div>
      <div class="cert-admin-row-body">${renderContentBlocks(q.contentBlocks)}</div>
      <ul class="cert-admin-options">
        ${q.options.map(o => `<li class="${o.isCorrect ? "is-correct" : ""}">${escapeHtml(o.id)}. ${escapeHtml(o.text)}</li>`).join("")}
      </ul>
      ${q.reviewReasons && q.reviewReasons.length ? `<p class="cert-admin-reasons">Motivo de revisión: ${escapeHtml(q.reviewReasons.join("; "))}</p>` : ""}
      ${q.duplicateOf ? `<p class="cert-admin-reasons">Posible duplicado de <strong>${escapeHtml(q.duplicateOf)}</strong></p>` : ""}
      <div class="cert-admin-edit">
        <label>Tema(s)
          <input type="text" class="admin-topics-input" value="${escapeHtml((q.topics || [q.topic]).join(", "))}">
        </label>
        <label>Dificultad
          <select class="admin-difficulty-input">
            ${[1, 2, 3, 4, 5].map(d => `<option value="${d}" ${getDynamicDifficulty(q) === d ? "selected" : ""}>${d}. ${CERT_DIFFICULTY_LABELS[d]}</option>`).join("")}
          </select>
        </label>
        <button class="btn secondary admin-save">Guardar cambios</button>
      </div>
      <div class="cert-admin-actions">
        <button class="btn admin-approve">Aprobar</button>
        <button class="btn secondary admin-reject">Rechazar</button>
        ${q.duplicateOf ? `<button class="btn secondary admin-merge">Fusionar (descartar esta)</button>
        <button class="btn secondary admin-keep-both">Mantener ambas</button>` : ""}
      </div>
    </div>
  `;
}

function wireAdminRowActions(container) {
  container.querySelectorAll(".cert-admin-row").forEach(row => {
    const id = row.dataset.id;
    const getAdmin = () => CERT_STATE.admin[id] || (CERT_STATE.admin[id] = {});
    const approveBtn = row.querySelector(".admin-approve");
    const rejectBtn = row.querySelector(".admin-reject");
    const saveBtn = row.querySelector(".admin-save");
    const mergeBtn = row.querySelector(".admin-merge");
    const keepBtn = row.querySelector(".admin-keep-both");
    if (approveBtn) approveBtn.onclick = () => { getAdmin().reviewStatus = "approved"; saveCertState(); toast("Pregunta aprobada"); renderCertAdminContent(); };
    if (rejectBtn) rejectBtn.onclick = () => { getAdmin().reviewStatus = "rejected"; saveCertState(); toast("Pregunta rechazada"); renderCertAdminContent(); };
    if (saveBtn) saveBtn.onclick = () => {
      const topics = row.querySelector(".admin-topics-input").value.split(",").map(t => t.trim()).filter(Boolean);
      const difficulty = parseInt(row.querySelector(".admin-difficulty-input").value, 10);
      const a = getAdmin();
      if (topics.length) a.topics = topics;
      a.difficulty = difficulty;
      saveCertState();
      toast("Cambios guardados");
      renderCertAdminContent();
    };
    if (mergeBtn) mergeBtn.onclick = () => { getAdmin().deleted = true; saveCertState(); toast("Pregunta descartada como duplicado"); renderCertAdminContent(); };
    if (keepBtn) keepBtn.onclick = () => { getAdmin().reviewStatus = "approved"; saveCertState(); toast("Se mantienen ambas preguntas"); renderCertAdminContent(); };
  });
}

function renderCertAdminVisual(el) {
  const withImages = getEffectiveQuestions().filter(q => q.exhibitImages && q.exhibitImages.length > 0);
  el.innerHTML = `
    <p class="cert-hint">${withImages.length} preguntas incluyen al menos una imagen del examen original (tabla o exhibit). Clic para ampliar.</p>
    <div class="cert-visual-grid">
      ${withImages.map(q => `
        <div class="cert-visual-card">
          <span class="pill">${escapeHtml(q.id)}</span>
          ${q.exhibitImages.map(p => `<img src="${escapeHtml(p)}" alt="Exhibit ${escapeHtml(q.id)}" loading="lazy" onclick="this.classList.toggle('zoomed')">`).join("")}
        </div>
      `).join("")}
    </div>
  `;
}

function renderCertAdminValidation(el) {
  if (!CERT_REPORT || !CERT_REPORT.validation) {
    el.innerHTML = `<p class="cert-empty-state">No se encontró import-report.js. Ejecuta tools/Import-Exams.ps1 para generarlo.</p>`;
    return;
  }
  const v = CERT_REPORT.validation;
  el.innerHTML = `
    <p class="cert-hint">Generado: ${CERT_REPORT.generatedAt}</p>
    <ul class="cert-validation-list">
      <li>Preguntas sin opciones: ${v.questionsWithoutOptions.length}${v.questionsWithoutOptions.length ? " — " + escapeHtml(v.questionsWithoutOptions.join(", ")) : ""}</li>
      <li>Preguntas sin contentBlocks: ${v.questionsWithoutContentBlocks.length}${v.questionsWithoutContentBlocks.length ? " — " + escapeHtml(v.questionsWithoutContentBlocks.join(", ")) : ""}</li>
      <li>Imágenes referenciadas que no existen en disco: ${v.missingImages.length}${v.missingImages.length ? " — " + escapeHtml(v.missingImages.map(m => m.id).join(", ")) : ""}</li>
      <li>Preguntas con desajuste entre "Choose N" y respuestas detectadas: ${v.answerCountMismatch.length}${v.answerCountMismatch.length ? " — " + escapeHtml(v.answerCountMismatch.join(", ")) : ""}</li>
    </ul>
  `;
}

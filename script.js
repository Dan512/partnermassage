// PartnerMassage — timer, wake lock, controls, start/begin flow.
// Pre-start and in-progress are two states of one #massage-screen; CSS hides
// the appropriate elements via the `body.pre-start` class.
// Depends on ROUTINE (global) from routine.js.

const state = {
  index: 0,
  techniqueRemaining: 0,
  totalRemaining: 0,
  totalDuration: 0,
  paused: true,
  tickHandle: null,
  wakeLock: null,
  routineLengthMin: 60,   // 30 or 60 — derives duration multiplier
};

const ROUTINE_LENGTH_LS_KEY = "mb_routineLengthMin";
const BASE_ROUTINE_MIN = 60;  // ROUTINE durations are tuned for 60 min total

// ---------- DOM refs ----------
const $ = (id) => document.getElementById(id);

const massageScreen = $("massage-screen");
const completeScreen = $("complete-screen");
const beginBtn = $("begin-btn");
const restartBtn = $("restart-btn");

const stepCounterEl = $("step-counter");
const totalRemainingEl = $("total-remaining");
const regionLabelEl = $("region-label");
const techniqueNameEl = $("technique-name");
const techniqueDescriptionEl = $("technique-description");
const techniqueTimeEl = $("technique-time");

const prevBtn = $("prev-btn");
const pauseBtn = $("pause-btn");
const nextBtn = $("next-btn");

const silhouetteEl = $("silhouette");
const visualWrapEl = $("visual-wrap");
const techniqueImageEl = $("technique-image");
const techniqueCompositionEl = $("technique-composition");
const genderToggleEl = $("gender-toggle");

const duration30Btn = $("duration-30");
const duration60Btn = $("duration-60");

// flash overlay (created once)
const flashEl = document.createElement("div");
flashEl.className = "flash-overlay";
document.body.appendChild(flashEl);

// ---------- Audio chime ----------
let audioCtx = null;
function playChime() {
  if (typeof getSettingsBool === "function" && !getSettingsBool("playSound")) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    const tones = [523.25, 659.25]; // C5, E5 — soft major third
    tones.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.12, now + i * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 1.4);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 1.5);
    });
  } catch (_) { /* audio is non-essential */ }
}

// ---------- Wake Lock ----------
async function requestWakeLock() {
  if (!("wakeLock" in navigator)) return;
  try {
    state.wakeLock = await navigator.wakeLock.request("screen");
    state.wakeLock.addEventListener("release", () => { state.wakeLock = null; });
  } catch (_) { /* user may deny or browser may not support */ }
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && !state.wakeLock && isInProgress()) {
    requestWakeLock();
  }
});

// ---------- State helpers ----------
function isInProgress() {
  return !document.body.classList.contains("pre-start") &&
         massageScreen.classList.contains("active");
}

function setPreStart(on) {
  document.body.classList.toggle("pre-start", on);
}

function showScreen(screen) {
  [massageScreen, completeScreen].forEach(s => s && s.classList.remove("active"));
  screen.classList.add("active");
}

// ---------- Duration multiplier ----------
function durationMultiplier() {
  return state.routineLengthMin / BASE_ROUTINE_MIN;
}

function scaledDurationSec(stepDurationSec) {
  return Math.max(1, Math.round(stepDurationSec * durationMultiplier()));
}

// ---------- Routine totals ----------
function computeTotalDuration() {
  const m = durationMultiplier();
  return Math.round(ROUTINE.reduce((sum, step) => sum + step.durationSec, 0) * m);
}

function remainingAfterStep(idx) {
  const m = durationMultiplier();
  let sum = 0;
  for (let i = idx; i < ROUTINE.length; i++) sum += ROUTINE[i].durationSec;
  return Math.round(sum * m);
}

// ---------- Format ----------
function fmtTime(secs) {
  secs = Math.max(0, Math.round(secs));
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ---------- Silhouette highlight ----------
function highlightRegion(regionId) {
  if (!silhouetteEl) return;
  silhouetteEl.querySelectorAll(".highlights .active-region").forEach(el => el.classList.remove("active-region"));
  const targets = silhouetteEl.querySelectorAll(`.highlights [data-region="${regionId}"]`);
  targets.forEach(el => el.classList.add("active-region"));
}

// ---------- Visual loading: composition → image → silhouette ----------
function loadTechniqueVisual(idx, step) {
  visualWrapEl.classList.remove("has-image", "has-composition");
  techniqueImageEl.removeAttribute("src");
  if (techniqueCompositionEl) techniqueCompositionEl.innerHTML = "";

  const techId = `${String(idx + 1).padStart(2, "0")}-${step.regionId || ""}`;
  const compSpec = (typeof getTechniqueSpec === "function")
    ? (getTechniqueSpec(techId) || getTechniqueSpec(idx))
    : null;

  if (compSpec && techniqueCompositionEl) {
    const bodyTemplate = compSpec.body || "";
    const gender = (typeof getRecipientGender === "function") ? getRecipientGender() : "female";
    const tone = (typeof getBodyTone === "function") ? getBodyTone() : "lighter";
    const bodyUrl = `images/${bodyTemplate.replace("{gender}", gender)}-${tone}.webp`;

    const probe = new Image();
    probe.onload = () => {
      renderTechnique(techniqueCompositionEl, compSpec, gender);
      visualWrapEl.classList.add("has-composition");
    };
    probe.onerror = () => fallbackToImage(step.imageFile);
    probe.src = bodyUrl;
    return;
  }

  fallbackToImage(step.imageFile);
}

function fallbackToImage(imageFile) {
  if (!imageFile) return;
  const probe = new Image();
  probe.onload = () => {
    techniqueImageEl.src = imageFile;
    techniqueImageEl.alt = "";
    visualWrapEl.classList.add("has-image");
  };
  probe.onerror = () => { /* stay on silhouette fallback */ };
  probe.src = imageFile;
}

// ---------- Load technique ----------
// updateTechniqueLabels is separated from loadTechniqueVisual so a caller
// can refresh text/state without destroying the composition's DOM (which
// would interrupt any in-flight CSS transition on the composition).
function updateTechniqueLabels(idx, step) {
  if (stepCounterEl) stepCounterEl.textContent = `Step ${idx + 1} of ${ROUTINE.length}`;
  if (regionLabelEl) regionLabelEl.textContent = step.region.toUpperCase();
  if (techniqueNameEl) techniqueNameEl.textContent = step.technique;
  if (techniqueDescriptionEl) techniqueDescriptionEl.textContent = step.description;
}

function loadTechnique(idx, { flash = true, updateTimerFromStep = true } = {}) {
  state.index = idx;
  const step = ROUTINE[idx];
  if (updateTimerFromStep) {
    state.techniqueRemaining = scaledDurationSec(step.durationSec);
  }

  updateTechniqueLabels(idx, step);
  highlightRegion(step.regionId);
  loadTechniqueVisual(idx, step);
  updateTimes();

  if (flash) {
    flashEl.classList.add("flashing");
    setTimeout(() => flashEl.classList.remove("flashing"), 400);
    playChime();
  }
}

// ---------- Update DOM ----------
function updateTimes() {
  if (techniqueTimeEl) techniqueTimeEl.textContent = fmtTime(state.techniqueRemaining);
  if (totalRemainingEl) totalRemainingEl.textContent = `Remaining ${fmtTime(state.totalRemaining)}`;
}

// ---------- Tick ----------
function startTick() {
  stopTick();
  state.tickHandle = setInterval(() => {
    if (state.paused) return;
    state.techniqueRemaining -= 1;
    state.totalRemaining -= 1;

    if (state.techniqueRemaining <= 0) {
      if (state.index + 1 >= ROUTINE.length) {
        finishMassage();
        return;
      }
      loadTechnique(state.index + 1);
    } else {
      updateTimes();
    }
  }, 1000);
}

function stopTick() {
  if (state.tickHandle) {
    clearInterval(state.tickHandle);
    state.tickHandle = null;
  }
}

// ---------- Controls ----------
function setPaused(paused) {
  state.paused = paused;
  if (!pauseBtn) return;
  const icon = pauseBtn.querySelector(".ctrl-icon");
  const label = pauseBtn.querySelector(".ctrl-label");
  if (icon) icon.textContent = paused ? "▶" : "⏸";
  if (label) label.textContent = paused ? "Resume" : "Pause";
  pauseBtn.title = paused ? "Resume (Space)" : "Pause (Space)";
  pauseBtn.setAttribute("aria-label", paused ? "Resume" : "Pause");
}

function goPrev() {
  if (state.index === 0) {
    // Back on the very first technique returns to the pre-start home view.
    returnToHome();
    return;
  }
  state.totalRemaining = remainingAfterStep(state.index - 1);
  loadTechnique(state.index - 1, { flash: false });
}

function returnToHome() {
  stopTick();
  setPaused(true);
  if (state.wakeLock) {
    state.wakeLock.release().catch(() => {});
    state.wakeLock = null;
  }
  renderPreStart();
}

function goNext() {
  if (state.index + 1 >= ROUTINE.length) {
    finishMassage();
    return;
  }
  state.totalRemaining = remainingAfterStep(state.index + 1);
  loadTechnique(state.index + 1, { flash: false });
}

if (prevBtn) prevBtn.addEventListener("click", goPrev);
if (nextBtn) nextBtn.addEventListener("click", goNext);
if (pauseBtn) pauseBtn.addEventListener("click", () => setPaused(!state.paused));

document.addEventListener("keydown", (e) => {
  if (!isInProgress()) return;
  if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
  else if (e.key === "ArrowRight") { e.preventDefault(); goNext(); }
  else if (e.key === " " || e.code === "Space") { e.preventDefault(); setPaused(!state.paused); }
});

// ---------- Duration toggle (30 / 60 min) ----------
function readSavedRoutineLength() {
  const v = parseInt(localStorage.getItem(ROUTINE_LENGTH_LS_KEY) || "60", 10);
  return v === 30 ? 30 : 60;
}

function setRoutineLength(min) {
  state.routineLengthMin = min === 30 ? 30 : 60;
  localStorage.setItem(ROUTINE_LENGTH_LS_KEY, String(state.routineLengthMin));
  refreshDurationToggleUI();
}

function refreshDurationToggleUI() {
  if (duration30Btn) duration30Btn.classList.toggle("is-selected", state.routineLengthMin === 30);
  if (duration60Btn) duration60Btn.classList.toggle("is-selected", state.routineLengthMin === 60);
}

if (duration30Btn) duration30Btn.addEventListener("click", () => setRoutineLength(30));
if (duration60Btn) duration60Btn.addEventListener("click", () => setRoutineLength(60));

state.routineLengthMin = readSavedRoutineLength();
refreshDurationToggleUI();

// ---------- Pre-start: render technique 1 so the painterly art shows up ----------
function renderPreStart() {
  setPreStart(true);
  // Reset state to step 0 but DON'T start the timer.
  state.index = 0;
  state.totalDuration = computeTotalDuration();
  state.totalRemaining = state.totalDuration;
  state.techniqueRemaining = scaledDurationSec(ROUTINE[0].durationSec);
  loadTechnique(0, { flash: false });
  setPaused(true);
  showScreen(massageScreen);
}

// ---------- Start / finish ----------
async function startMassage() {
  state.totalDuration = computeTotalDuration();
  state.totalRemaining = state.totalDuration;
  state.index = 0;
  state.techniqueRemaining = scaledDurationSec(ROUTINE[0].durationSec);
  setPaused(false);

  setPreStart(false);
  showScreen(massageScreen);
  await requestWakeLock();
  // The composition for technique 0 is already rendered from pre-start mode.
  // Re-rendering it would tear down the DOM and interrupt the in-flight CSS
  // transition (scale 2.2 → 1), which is what was causing the snap. Just
  // sync the labels and timer; let the composition transition smoothly.
  updateTechniqueLabels(0, ROUTINE[0]);
  highlightRegion(ROUTINE[0].regionId);
  updateTimes();
  startTick();
}

function finishMassage() {
  stopTick();
  setPaused(true);
  if (state.wakeLock) {
    state.wakeLock.release().catch(() => {});
    state.wakeLock = null;
  }
  showScreen(completeScreen);
}

if (beginBtn) beginBtn.addEventListener("click", startMassage);
if (restartBtn) restartBtn.addEventListener("click", () => {
  // Restart returns to pre-start so the painterly art is the first thing
  // the user sees — same as the initial visit.
  renderPreStart();
});

// ---------- First-visit disclaimer modal ----------
const DISCLAIMER_LS_KEY = "mb_disclaimer_accepted_v1";
const disclaimerModalEl = $("disclaimer-modal");
const disclaimerAcceptBtn = $("disclaimer-accept-btn");

function showDisclaimerModal() {
  if (!disclaimerModalEl) return;
  disclaimerModalEl.classList.add("active");
  if (disclaimerAcceptBtn) {
    setTimeout(() => disclaimerAcceptBtn.focus(), 100);
  }
}

function hideDisclaimerModal() {
  if (disclaimerModalEl) disclaimerModalEl.classList.remove("active");
}

if (disclaimerModalEl && disclaimerAcceptBtn) {
  if (!localStorage.getItem(DISCLAIMER_LS_KEY)) {
    showDisclaimerModal();
  }
  disclaimerAcceptBtn.addEventListener("click", () => {
    localStorage.setItem(DISCLAIMER_LS_KEY, "1");
    hideDisclaimerModal();
  });
}

// ---------- Gender toggle ----------
function refreshGenderToggleUI() {
  if (!genderToggleEl) return;
  const gender = (typeof getRecipientGender === "function") ? getRecipientGender() : "female";
  const label = gender === "male" ? "masculine" : "feminine";
  genderToggleEl.textContent = gender === "male" ? "♂" : "♀";
  genderToggleEl.title = `Recipient: ${label} — click to switch`;
  genderToggleEl.setAttribute("aria-pressed", gender === "male" ? "true" : "false");
}

if (genderToggleEl) {
  genderToggleEl.addEventListener("click", () => {
    const current = (typeof getRecipientGender === "function") ? getRecipientGender() : "female";
    const next = current === "male" ? "female" : "male";
    if (typeof setRecipientGender === "function") setRecipientGender(next);
    refreshGenderToggleUI();
    const step = ROUTINE[state.index];
    if (step) loadTechniqueVisual(state.index, step);
  });
}

refreshGenderToggleUI();

// ---------- Skin-tone cycle buttons (top bar) ----------
const bodyToneBtn = $("body-tone-btn");
const handToneBtn = $("hand-tone-btn");
const TONE_CYCLE = ["lighter", "medium", "darker"];

function cycleNextTone(current) {
  const i = TONE_CYCLE.indexOf(current);
  return TONE_CYCLE[(i + 1) % TONE_CYCLE.length];
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

function refreshToneButtons() {
  if (bodyToneBtn && typeof getBodyTone === "function") {
    bodyToneBtn.textContent = `Body: ${capitalize(getBodyTone())}`;
  }
  if (handToneBtn && typeof getHandTone === "function") {
    handToneBtn.textContent = `Hands: ${capitalize(getHandTone())}`;
  }
}
window.refreshToneButtons = refreshToneButtons;

function handleToneCycle(getter, setter) {
  if (typeof getter !== "function" || typeof setter !== "function") return;
  setter(cycleNextTone(getter()));
  refreshToneButtons();
  const step = ROUTINE[state.index];
  if (step) loadTechniqueVisual(state.index, step);
  // Keep the settings popover dropdowns in sync.
  if (typeof window.applySettings === "function") window.applySettings();
}

if (bodyToneBtn) {
  bodyToneBtn.addEventListener("click", () => handleToneCycle(getBodyTone, setBodyTone));
}
if (handToneBtn) {
  handToneBtn.addEventListener("click", () => handleToneCycle(getHandTone, setHandTone));
}

refreshToneButtons();

// ---------- Boot: render the first technique immediately (pre-start mode) ----------
renderPreStart();

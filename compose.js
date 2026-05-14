// Render a technique's animated composition: body image with one or more
// hand PNG overlays positioned and animated via CSS keyframes.
//
// Reads the spec for the current technique from TECHNIQUES (techniques.js),
// keyed by the same id used in routine.js (e.g. "01-scalp").
//
// Body filename template uses {gender}; resolved at render time from
// localStorage `mb_recipient` (default: "female").

const COMPOSE_DEFAULT_GENDER = "female";

function getRecipientGender() {
  const saved = localStorage.getItem("mb_recipient");
  return saved === "male" ? "male" : COMPOSE_DEFAULT_GENDER;
}

function setRecipientGender(gender) {
  if (gender !== "male" && gender !== "female") return;
  localStorage.setItem("mb_recipient", gender);
}

// ---------- Skin tone (separate for recipient body vs masseuse hands) -------
const SKIN_TONES = ["lighter", "medium", "darker"];

const DEFAULT_TONE = "medium";

function getBodyTone() {
  const v = localStorage.getItem("mb_bodyTone");
  return SKIN_TONES.includes(v) ? v : DEFAULT_TONE;
}

function setBodyTone(tone) {
  if (SKIN_TONES.includes(tone)) localStorage.setItem("mb_bodyTone", tone);
}

function getHandTone() {
  const v = localStorage.getItem("mb_handTone");
  return SKIN_TONES.includes(v) ? v : DEFAULT_TONE;
}

function setHandTone(tone) {
  if (SKIN_TONES.includes(tone)) localStorage.setItem("mb_handTone", tone);
}

function resolveBodyFilename(template, gender) {
  // All facedown-* assets (including close-ups with a baked-in cradling hand)
  // get the body tone. The baked-in cradling hand in close-ups will always
  // match the body tone, not the user's separate hand-tone choice.
  const tone = getBodyTone();
  return `images/${template.replace("{gender}", gender)}-${tone}.webp`;
}

// Set a CSS-variable length, preferring a screen-relative fraction (0-1 of
// the hand's own width via CSS `%`) when provided, falling back to fixed px.
// This keeps motion proportional to the hand as the viewport resizes.
function setLengthVar(el, name, pct, px) {
  if (pct != null && pct !== "") {
    el.style.setProperty(name, `${pct * 100}%`);
  } else if (px != null && px !== "") {
    el.style.setProperty(name, `${px}px`);
  }
}

function setMotionVars(el, motion) {
  if (motion.durationMs) el.style.setProperty("--mb-duration", `${motion.durationMs}ms`);
  setLengthVar(el, "--mb-radius", motion.radius, motion.radiusPx);
  setLengthVar(el, "--mb-dx",     motion.dx,     motion.dxPx);
  setLengthVar(el, "--mb-dy",     motion.dy,     motion.dyPx);
  setLengthVar(el, "--mb-depth",  motion.depth,  motion.depthPx);
  // Motion angle rotates the direction of travel/compression independently of
  // the hand's visual rotation. Default 0deg = unchanged.
  if (motion.angle != null && motion.angle !== "") {
    el.style.setProperty("--mb-motion-angle", `${motion.angle}deg`);
  }
  // Phase: negative animation-delay jumps the cycle forward so paired hands offset.
  if (motion.phaseMs) el.style.setProperty("--mb-phase", `-${motion.phaseMs}ms`);
}

function makeHandImg(pose, side, className = "hand") {
  // Standalone hand poses (hand-flat-left.webp etc.) are the masseuse's
  // animated hands — they use the user's HAND tone, separate from the body.
  const tone = getHandTone();
  const img = document.createElement("img");
  img.className = className;
  img.src = `images/hand-${pose}-${side}-${tone}.webp`;
  img.alt = "";
  return img;
}

/**
 * Render a technique spec into the container element.
 * @param {HTMLElement} container - empty container to fill
 * @param {object} spec - technique spec from TECHNIQUES
 * @param {string} [gender] - "female" | "male"; defaults to localStorage value
 */
function renderTechnique(container, spec, gender) {
  if (!container) return;
  gender = gender || getRecipientGender();

  // Clear and start fresh.
  container.innerHTML = "";
  container.classList.add("technique-composition");

  if (!spec || !spec.body || !Array.isArray(spec.hands)) {
    // No spec wired — leave container empty so silhouette fallback shows through.
    return;
  }

  // Body layer.
  const body = document.createElement("img");
  body.className = "body-image";
  body.src = resolveBodyFilename(spec.body, gender);
  body.alt = "";
  body.onerror = () => {
    // If body image is missing (e.g. facedown-male-lower-body), hide the
    // composition entirely so the silhouette behind it can show through.
    container.classList.add("composition-missing");
  };
  body.onload = () => container.classList.remove("composition-missing");
  container.appendChild(body);

  // Hand layers.
  spec.hands.forEach((hand) => {
    const wrap = document.createElement("div");
    wrap.className = `hand-wrap motion-${hand.motion?.type || "static"}`;
    wrap.style.left = `${(hand.position?.x ?? 0.5) * 100}%`;
    wrap.style.top = `${(hand.position?.y ?? 0.5) * 100}%`;
    wrap.style.width = `${(hand.size ?? 0.1) * 100}%`;
    if (hand.rotation !== undefined) {
      wrap.style.setProperty("--mb-rotation", `${hand.rotation}deg`);
    }
    // Optional visibility group (for alternating sets of hands).
    if (hand.group === "a" || hand.group === "b") {
      wrap.classList.add(`vis-group-${hand.group}`);
    }
    setMotionVars(wrap, hand.motion || {});

    if (hand.motion?.type === "swap") {
      // Crossfade between poseA and poseB.
      wrap.appendChild(makeHandImg(hand.motion.poseA, hand.side, "hand hand-a"));
      wrap.appendChild(makeHandImg(hand.motion.poseB, hand.side, "hand hand-b"));
    } else {
      wrap.appendChild(makeHandImg(hand.pose, hand.side, "hand"));
    }

    container.appendChild(wrap);
  });
}

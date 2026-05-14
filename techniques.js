// Per-technique animation specs. Keys match `id` from routine.js entries
// (using a positional id derived from the order: 01-scalp, 02-neck, etc.).
//
// Body template uses {gender} placeholder, resolved at render time.
// Position values are 0-1 fractions of the body image.
// radius / dx / dy / depth are fractions of the HAND's own width (use the
// "Px" variants if you ever need fixed pixels instead).
//
// Motion types:
//   "circle"      — hand traces a small circle (radius)
//   "travel"      — hand glides A → B → A (dx, dy)
//   "compression" — hand presses down then up (depth)
//   "swap"        — crossfade poseA ↔ poseB (squeeze/release)
//   "static"      — no motion
//
// Numbers for techniques 02-15 are LIBERAL DEFAULTS. Use the debug panel
// (bottom-left) to tune. Each Dump gives you the JSON to paste back here.

const TECHNIQUES = {
  // ============================================================
  // 01 — Scalp · Circular Fingertip Pressure (DIALED IN)
  // ============================================================
  "01-scalp": {
    body: "facedown-{gender}-upper-body",
    hands: [
      {
        pose: "fingertips",
        side: "left",
        position: { x: 0.25, y: 0.20 },
        size: 0.25,
        rotation: 180,
        motion: { type: "circle", radius: 0.07, durationMs: 5000 },
      },
      {
        pose: "fingertips",
        side: "right",
        position: { x: 0.38, y: 0.20 },
        size: 0.25,
        rotation: 180,
        motion: { type: "circle", radius: 0.07, durationMs: 5000, phaseMs: 2250 },
      },
    ],
  },

  // ============================================================
  // 02 — Neck · Squeeze and Glide (DIALED IN)
  // ============================================================
  "02-neck": {
    body: "facedown-{gender}-upper-body",
    hands: [
      {
        pose: "cupped",
        side: "right",
        position: { x: 0.46, y: 0.29 },
        size: 0.20,
        rotation: 45,
        motion: { type: "compression", depth: 0.23, durationMs: 5000, angle: -100 },
      },
    ],
  },

  // ============================================================
  // 03 — Shoulders · Kneading Trapezius (DIALED IN)
  // ============================================================
  "03-shoulders": {
    body: "facedown-{gender}-upper-body",
    hands: [
      {
        pose: "cupped",
        side: "left",
        position: { x: 0.59, y: 0.30 },
        size: 0.25,
        rotation: -40,
        motion: { type: "swap", poseA: "flat", poseB: "cupped", durationMs: 3000 },
      },
      {
        pose: "cupped",
        side: "right",
        position: { x: 0.43, y: 0.40 },
        size: 0.25,
        rotation: -40,
        motion: { type: "swap", poseA: "flat", poseB: "cupped", durationMs: 3000, phaseMs: 800 },
      },
    ],
  },

  // ============================================================
  // 04 — Upper Back · Long Strokes Around Shoulder Blades (DIALED IN)
  // ============================================================
  "04-upper-back": {
    body: "facedown-{gender}-upper-body",
    hands: [
      {
        pose: "flat",
        side: "left",
        position: { x: 0.66, y: 0.42 },
        size: 0.24,
        rotation: -35,
        motion: { type: "travel", dx: 0.3, dy: 0, durationMs: 3500 },
      },
      {
        pose: "flat",
        side: "right",
        position: { x: 0.58, y: 0.50 },
        size: 0.24,
        rotation: -35,
        motion: { type: "travel", dx: -0.3, dy: 0, durationMs: 3500 },
      },
    ],
  },

  // ============================================================
  // 05 — Spine · Thumb Walk Along Paraspinals (DIALED IN)
  // ============================================================
  "05-spine": {
    body: "facedown-{gender}-upper-body",
    hands: [
      {
        pose: "thumb",
        side: "left",
        position: { x: 0.56, y: 0.30 },
        size: 0.16,
        rotation: -25,
        motion: { type: "travel", dx: 0, dy: 2.1, durationMs: 9000, angle: -25 },
      },
      {
        pose: "thumb",
        side: "right",
        position: { x: 0.47, y: 0.39 },
        size: 0.16,
        rotation: -55,
        motion: { type: "travel", dx: 0, dy: 2.1, durationMs: 9000, angle: 10 },
      },
    ],
  },

  // ============================================================
  // 06 — Mid Back · Palm Circles (DIALED IN)
  // ============================================================
  "06-mid-back": {
    body: "facedown-{gender}-mid-body",
    hands: [
      {
        pose: "flat",
        side: "left",
        position: { x: 0.36, y: 0.32 },
        size: 0.22,
        rotation: 230,
        motion: { type: "circle", radius: 0.10, durationMs: 5000 },
      },
      {
        pose: "flat",
        side: "right",
        position: { x: 0.47, y: 0.41 },
        size: 0.22,
        rotation: 230,
        motion: { type: "circle", radius: 0.10, durationMs: 5000, phaseMs: 2000 },
      },
    ],
  },

  // ============================================================
  // 07 — Lower Back · Circles and Kneading (DIALED IN)
  // ============================================================
  "07-lower-back": {
    body: "facedown-{gender}-mid-body",
    hands: [
      {
        pose: "flat",
        side: "left",
        position: { x: 0.45, y: 0.46 },
        size: 0.22,
        rotation: 130,
        motion: { type: "circle", radius: 0.10, durationMs: 3700 },
      },
      {
        pose: "flat",
        side: "right",
        position: { x: 0.55, y: 0.33 },
        size: 0.22,
        rotation: 125,
        motion: { type: "circle", radius: 0.10, durationMs: 3500, phaseMs: 1850 },
      },
    ],
  },

  // ============================================================
  // 08 — Glutes & Hips · Kneading and Compression (DIALED IN)
  // ============================================================
  "08-glutes": {
    body: "facedown-{gender}-mid-body",
    hands: [
      {
        pose: "cupped",
        side: "left",
        position: { x: 0.58, y: 0.57 },
        size: 0.24,
        rotation: 110,
        motion: { type: "compression", depth: 0.08, durationMs: 2000 },
      },
      {
        pose: "cupped",
        side: "right",
        position: { x: 0.80, y: 0.48 },
        size: 0.24,
        rotation: 155,
        motion: { type: "compression", depth: 0.08, durationMs: 2000, phaseMs: 1000 },
      },
    ],
  },

  // ============================================================
  // 09 — Left Hamstring · Long Strokes and Kneading (DIALED IN)
  // ============================================================
  "09-left-hamstring": {
    body: "facedown-{gender}-lower-body-left",
    hands: [
      {
        pose: "flat",
        side: "left",
        position: { x: 0.19, y: 0.38 },
        size: 0.20,
        rotation: 125,
        motion: { type: "travel", dx: 0, dy: -0.75, durationMs: 4500 },
      },
      {
        pose: "flat",
        side: "right",
        position: { x: 0.28, y: 0.34 },
        size: 0.20,
        rotation: 130,
        motion: { type: "travel", dx: 0, dy: -0.75, durationMs: 4500 },
      },
    ],
  },

  // ============================================================
  // 10 — Right Hamstring · MIRROR of #9 (DIALED IN)
  // Rotations differ from a pure geometric mirror because the left/right
  // hand-pose PNGs are themselves already mirrored versions of each other.
  // ============================================================
  "10-right-hamstring": {
    body: "facedown-{gender}-lower-body-right",
    hands: [
      {
        pose: "flat",
        side: "right",
        position: { x: 0.81, y: 0.38 },
        size: 0.20,
        rotation: 230,
        motion: { type: "travel", dx: 0, dy: -0.75, durationMs: 4500 },
      },
      {
        pose: "flat",
        side: "left",
        position: { x: 0.72, y: 0.34 },
        size: 0.20,
        rotation: 225,
        motion: { type: "travel", dx: 0, dy: -0.75, durationMs: 4500 },
      },
    ],
  },

  // ============================================================
  // 11 — Calves · Squeeze and Glide
  // ============================================================
  // Alternating visibility: group "a" (left calf) and group "b" (right calf)
  // fade in/out on a 16-second cycle so the visualization works each calf
  // in turn instead of showing all four hands at once.
  "11-calves": {
    body: "facedown-{gender}-lower-body-left",
    hands: [
      // ---- Left calf (group A) ----
      {
        pose: "fingertips",
        side: "left",
        position: { x: 0.44, y: 0.59 },
        size: 0.22,
        rotation: 130,
        group: "a",
        motion: { type: "compression", depth: -0.8, durationMs: 5000 },
      },
      {
        pose: "fingertips",
        side: "right",
        position: { x: 0.52, y: 0.53 },
        size: 0.22,
        rotation: 140,
        group: "a",
        motion: { type: "compression", depth: -0.8, durationMs: 5000 },
      },
      // ---- Right calf (group B) ----
      {
        pose: "fingertips",
        side: "left",
        position: { x: 0.57, y: 0.48 },
        size: 0.22,
        rotation: 140,
        group: "b",
        motion: { type: "compression", depth: -0.8, durationMs: 5000 },
      },
      {
        pose: "fingertips",
        side: "right",
        position: { x: 0.67, y: 0.45 },
        size: 0.22,
        rotation: 150,
        group: "b",
        motion: { type: "compression", depth: -0.8, durationMs: 5000 },
      },
    ],
  },

  // ============================================================
  // 12 — Left Foot · Thumb Circles on Sole (DIALED IN, close-up)
  // ============================================================
  "12-left-foot": {
    body: "facedown-{gender}-left-foot",
    hands: [
      {
        pose: "thumb",
        side: "right",
        position: { x: 0.31, y: 0.50 },
        size: 0.29,
        rotation: 180,
        motion: { type: "circle", radius: 0.10, durationMs: 3000 },
      },
    ],
  },

  // ============================================================
  // 13 — Right Foot · Thumb Circles on Sole (DIALED IN, close-up)
  // ============================================================
  "13-right-foot": {
    body: "facedown-{gender}-right-foot",
    hands: [
      {
        pose: "thumb",
        side: "right",
        position: { x: 0.80, y: 0.48 },
        size: 0.26,
        rotation: 180,
        motion: { type: "circle", radius: 0.08, durationMs: 3000 },
      },
    ],
  },

  // ============================================================
  // 14 — Full Body · Long Sweep, Neck to Feet (DIALED IN)
  // ============================================================
  "14-full-body-sweep": {
    body: "facedown-{gender}-mid-body",
    hands: [
      {
        pose: "flat",
        side: "left",
        position: { x: 0.28, y: 0.25 },
        size: 0.24,
        rotation: 145,
        motion: { type: "travel", dx: 0, dy: -3, durationMs: 8100 },
      },
      {
        pose: "flat",
        side: "right",
        position: { x: 0.40, y: 0.21 },
        size: 0.24,
        rotation: 130,
        motion: { type: "travel", dx: 0, dy: -3, durationMs: 8100 },
      },
    ],
  },

  // ============================================================
  // 15 — Closing Rest Hold (static) (DIALED IN)
  // ============================================================
  "15-rest-hold": {
    body: "facedown-{gender}-upper-body",
    hands: [
      {
        pose: "flat",
        side: "left",
        position: { x: 0.57, y: 0.41 },
        size: 0.24,
        rotation: -130,
        motion: { type: "static" },
      },
      {
        pose: "flat",
        side: "right",
        position: { x: 0.78, y: 0.62 },
        size: 0.24,
        rotation: -140,
        motion: { type: "static" },
      },
    ],
  },
};

function getTechniqueSpec(idOrIndex) {
  // Allow lookup by id ("01-scalp") OR by 0-based numeric index.
  if (typeof idOrIndex === "number") {
    const ids = Object.keys(TECHNIQUES);
    return TECHNIQUES[ids[idOrIndex]] || null;
  }
  return TECHNIQUES[idOrIndex] || null;
}

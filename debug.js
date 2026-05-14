// Debug panel for live-tuning the currently-displayed technique's hand specs.
// Hidden in production — injects HTML only when ?debug=1 is in the URL
// (or localStorage.mb_debug === "1"). All other times this file is a no-op.
//
// Mutates TECHNIQUES[currentId] in memory and re-renders the composition.
// Globals (TECHNIQUES, ROUTINE, state, renderTechnique) come from sibling scripts.

(function () {
  // Gate: only run when explicitly enabled.
  const urlParams = new URLSearchParams(window.location.search);
  const debugEnabled = urlParams.get("debug") === "1" ||
                       localStorage.getItem("mb_debug") === "1";
  if (!debugEnabled) return;

  // ---------- Inject the panel HTML ----------
  const panel = document.createElement("div");
  panel.id = "debug-panel";
  panel.className = "debug-panel";
  panel.style.display = "block";
  panel.innerHTML = `
    <header class="dbg-head">
      <span class="dbg-title">DEBUG · <span id="dbg-tech-id">…</span></span>
      <button id="dbg-toggle" class="dbg-toggle-btn" title="Collapse">_</button>
    </header>
    <div class="dbg-body">
      <div class="dbg-row">
        <label>Hand 1</label>
        <div class="dbg-num"><button class="dbg-step" data-dir="-1">−</button><input id="dbg-h1-x" type="number" step="0.01" placeholder="x" /><button class="dbg-step" data-dir="1">+</button></div>
        <div class="dbg-num"><button class="dbg-step" data-dir="-1">−</button><input id="dbg-h1-y" type="number" step="0.01" placeholder="y" /><button class="dbg-step" data-dir="1">+</button></div>
      </div>
      <div class="dbg-row">
        <label>Hand 2</label>
        <div class="dbg-num"><button class="dbg-step" data-dir="-1">−</button><input id="dbg-h2-x" type="number" step="0.01" placeholder="x" /><button class="dbg-step" data-dir="1">+</button></div>
        <div class="dbg-num"><button class="dbg-step" data-dir="-1">−</button><input id="dbg-h2-y" type="number" step="0.01" placeholder="y" /><button class="dbg-step" data-dir="1">+</button></div>
      </div>
      <div class="dbg-row">
        <label>Speed (ms)</label>
        <div class="dbg-num"><button class="dbg-step" data-dir="-1">−</button><input id="dbg-h1-speed" type="number" step="100" placeholder="h1" /><button class="dbg-step" data-dir="1">+</button></div>
        <div class="dbg-num"><button class="dbg-step" data-dir="-1">−</button><input id="dbg-h2-speed" type="number" step="100" placeholder="h2" /><button class="dbg-step" data-dir="1">+</button></div>
      </div>
      <div class="dbg-row">
        <label>Rotation (°)</label>
        <div class="dbg-num"><button class="dbg-step" data-dir="-1">−</button><input id="dbg-h1-rot" type="number" step="5" placeholder="h1" /><button class="dbg-step" data-dir="1">+</button></div>
        <div class="dbg-num"><button class="dbg-step" data-dir="-1">−</button><input id="dbg-h2-rot" type="number" step="5" placeholder="h2" /><button class="dbg-step" data-dir="1">+</button></div>
      </div>
      <div class="dbg-row">
        <label>Radius (frac)</label>
        <div class="dbg-num"><button class="dbg-step" data-dir="-1">−</button><input id="dbg-h1-radius" type="number" step="0.01" placeholder="h1" /><button class="dbg-step" data-dir="1">+</button></div>
        <div class="dbg-num"><button class="dbg-step" data-dir="-1">−</button><input id="dbg-h2-radius" type="number" step="0.01" placeholder="h2" /><button class="dbg-step" data-dir="1">+</button></div>
      </div>
      <div class="dbg-row">
        <label>dx (frac)</label>
        <div class="dbg-num"><button class="dbg-step" data-dir="-1">−</button><input id="dbg-h1-dx" type="number" step="0.05" placeholder="h1" /><button class="dbg-step" data-dir="1">+</button></div>
        <div class="dbg-num"><button class="dbg-step" data-dir="-1">−</button><input id="dbg-h2-dx" type="number" step="0.05" placeholder="h2" /><button class="dbg-step" data-dir="1">+</button></div>
      </div>
      <div class="dbg-row">
        <label>dy (frac)</label>
        <div class="dbg-num"><button class="dbg-step" data-dir="-1">−</button><input id="dbg-h1-dy" type="number" step="0.05" placeholder="h1" /><button class="dbg-step" data-dir="1">+</button></div>
        <div class="dbg-num"><button class="dbg-step" data-dir="-1">−</button><input id="dbg-h2-dy" type="number" step="0.05" placeholder="h2" /><button class="dbg-step" data-dir="1">+</button></div>
      </div>
      <div class="dbg-row">
        <label>Depth (frac)</label>
        <div class="dbg-num"><button class="dbg-step" data-dir="-1">−</button><input id="dbg-h1-depth" type="number" step="0.01" placeholder="h1" /><button class="dbg-step" data-dir="1">+</button></div>
        <div class="dbg-num"><button class="dbg-step" data-dir="-1">−</button><input id="dbg-h2-depth" type="number" step="0.01" placeholder="h2" /><button class="dbg-step" data-dir="1">+</button></div>
      </div>
      <div class="dbg-row">
        <label>Motion ∠ (°)</label>
        <div class="dbg-num"><button class="dbg-step" data-dir="-1">−</button><input id="dbg-h1-angle" type="number" step="5" placeholder="h1" /><button class="dbg-step" data-dir="1">+</button></div>
        <div class="dbg-num"><button class="dbg-step" data-dir="-1">−</button><input id="dbg-h2-angle" type="number" step="5" placeholder="h2" /><button class="dbg-step" data-dir="1">+</button></div>
      </div>
      <div class="dbg-row">
        <label>Size · Phase</label>
        <div class="dbg-num"><button class="dbg-step" data-dir="-1">−</button><input id="dbg-size" type="number" step="0.01" placeholder="size" /><button class="dbg-step" data-dir="1">+</button></div>
        <div class="dbg-num"><button class="dbg-step" data-dir="-1">−</button><input id="dbg-phase" type="number" step="100" placeholder="phase" /><button class="dbg-step" data-dir="1">+</button></div>
      </div>
      <div class="dbg-row dbg-buttons">
        <button id="dbg-apply" class="dbg-btn dbg-apply">Apply</button>
        <button id="dbg-dump" class="dbg-btn dbg-dump" title="Print JSON to console + copy">Dump</button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  // ---------- Wire up handlers ----------
  const get = (id) => document.getElementById(id);

  const h1x = get("dbg-h1-x");
  const h1y = get("dbg-h1-y");
  const h2x = get("dbg-h2-x");
  const h2y = get("dbg-h2-y");
  const h1s = get("dbg-h1-speed");
  const h2s = get("dbg-h2-speed");
  const h1r = get("dbg-h1-radius");
  const h2r = get("dbg-h2-radius");
  const h1rot = get("dbg-h1-rot");
  const h2rot = get("dbg-h2-rot");
  const h1dx = get("dbg-h1-dx");
  const h2dx = get("dbg-h2-dx");
  const h1dy = get("dbg-h1-dy");
  const h2dy = get("dbg-h2-dy");
  const h1depth = get("dbg-h1-depth");
  const h2depth = get("dbg-h2-depth");
  const h1angle = get("dbg-h1-angle");
  const h2angle = get("dbg-h2-angle");
  const sizeIn = get("dbg-size");
  const phaseIn = get("dbg-phase");
  const techIdLabel = get("dbg-tech-id");
  const applyBtn = get("dbg-apply");
  const dumpBtn = get("dbg-dump");
  const toggleBtn = get("dbg-toggle");

  function currentTechId() {
    const idx = (typeof state !== "undefined" && typeof state.index === "number") ? state.index : 0;
    const routine = (typeof ROUTINE !== "undefined") ? ROUTINE : [];
    const step = routine[idx];
    if (!step) return null;
    const techs = (typeof TECHNIQUES !== "undefined") ? TECHNIQUES : {};
    const numeric = String(idx + 1).padStart(2, "0");
    const exact = `${numeric}-${step.regionId || ""}`;
    if (techs[exact]) return exact;
    const match = Object.keys(techs).find((k) => k.startsWith(`${numeric}-`));
    return match || exact;
  }

  function currentSpec() {
    const id = currentTechId();
    if (!id) return null;
    const techs = (typeof TECHNIQUES !== "undefined") ? TECHNIQUES : null;
    return techs ? techs[id] || null : null;
  }

  function loadInputsFromSpec() {
    const id = currentTechId();
    if (techIdLabel) techIdLabel.textContent = id || "(none)";
    const spec = currentSpec();
    const allInputs = [
      h1x, h1y, h2x, h2y, h1s, h2s, h1r, h2r,
      h1rot, h2rot, h1dx, h2dx, h1dy, h2dy, h1depth, h2depth,
      h1angle, h2angle, sizeIn, phaseIn,
    ];
    if (!spec || !spec.hands || spec.hands.length < 1) {
      allInputs.forEach(el => { if (el) el.value = ""; });
      return;
    }
    const h1 = spec.hands[0];
    const h2 = spec.hands[1];
    if (h1x) h1x.value = h1.position?.x ?? "";
    if (h1y) h1y.value = h1.position?.y ?? "";
    if (h1s) h1s.value = h1.motion?.durationMs ?? "";
    if (h1r) h1r.value = (h1.motion?.radius ?? h1.motion?.radiusPx) ?? "";
    if (h1rot) h1rot.value = h1.rotation ?? "";
    if (h1dx) h1dx.value = (h1.motion?.dx ?? h1.motion?.dxPx) ?? "";
    if (h1dy) h1dy.value = (h1.motion?.dy ?? h1.motion?.dyPx) ?? "";
    if (h1depth) h1depth.value = (h1.motion?.depth ?? h1.motion?.depthPx) ?? "";
    if (h1angle) h1angle.value = h1.motion?.angle ?? "";
    if (sizeIn) sizeIn.value = h1.size ?? "";
    if (h2) {
      if (h2x) h2x.value = h2.position?.x ?? "";
      if (h2y) h2y.value = h2.position?.y ?? "";
      if (h2s) h2s.value = h2.motion?.durationMs ?? "";
      if (h2r) h2r.value = (h2.motion?.radius ?? h2.motion?.radiusPx) ?? "";
      if (h2rot) h2rot.value = h2.rotation ?? "";
      if (h2dx) h2dx.value = (h2.motion?.dx ?? h2.motion?.dxPx) ?? "";
      if (h2dy) h2dy.value = (h2.motion?.dy ?? h2.motion?.dyPx) ?? "";
      if (h2depth) h2depth.value = (h2.motion?.depth ?? h2.motion?.depthPx) ?? "";
      if (h2angle) h2angle.value = h2.motion?.angle ?? "";
      if (phaseIn) phaseIn.value = h2.motion?.phaseMs ?? "";
    } else {
      [h2x, h2y, h2s, h2r, h2rot, h2dx, h2dy, h2depth, h2angle, phaseIn].forEach(el => { if (el) el.value = ""; });
    }
  }

  function parseNum(el) {
    if (!el) return undefined;
    const v = parseFloat(el.value);
    return Number.isFinite(v) ? v : undefined;
  }

  function applyToSpec() {
    const spec = currentSpec();
    if (!spec || !spec.hands || spec.hands.length < 1) return;
    const sizeVal = parseNum(sizeIn);

    const h1 = spec.hands[0];
    if (h1) {
      h1.position = h1.position || {};
      const x = parseNum(h1x); if (x !== undefined) h1.position.x = x;
      const y = parseNum(h1y); if (y !== undefined) h1.position.y = y;
      if (sizeVal !== undefined) h1.size = sizeVal;
      const rot = parseNum(h1rot); if (rot !== undefined) h1.rotation = rot;
      h1.motion = h1.motion || { type: "circle" };
      const s = parseNum(h1s); if (s !== undefined) h1.motion.durationMs = s;
      const r = parseNum(h1r); if (r !== undefined) { h1.motion.radius = r; delete h1.motion.radiusPx; }
      const dx = parseNum(h1dx); if (dx !== undefined) { h1.motion.dx = dx; delete h1.motion.dxPx; }
      const dy = parseNum(h1dy); if (dy !== undefined) { h1.motion.dy = dy; delete h1.motion.dyPx; }
      const dp = parseNum(h1depth); if (dp !== undefined) { h1.motion.depth = dp; delete h1.motion.depthPx; }
      const ang = parseNum(h1angle); if (ang !== undefined) h1.motion.angle = ang;
    }

    const h2 = spec.hands[1];
    if (h2) {
      h2.position = h2.position || {};
      const x = parseNum(h2x); if (x !== undefined) h2.position.x = x;
      const y = parseNum(h2y); if (y !== undefined) h2.position.y = y;
      if (sizeVal !== undefined) h2.size = sizeVal;
      const rot = parseNum(h2rot); if (rot !== undefined) h2.rotation = rot;
      h2.motion = h2.motion || { type: "circle" };
      const s = parseNum(h2s); if (s !== undefined) h2.motion.durationMs = s;
      const r = parseNum(h2r); if (r !== undefined) { h2.motion.radius = r; delete h2.motion.radiusPx; }
      const dx = parseNum(h2dx); if (dx !== undefined) { h2.motion.dx = dx; delete h2.motion.dxPx; }
      const dy = parseNum(h2dy); if (dy !== undefined) { h2.motion.dy = dy; delete h2.motion.dyPx; }
      const dp = parseNum(h2depth); if (dp !== undefined) { h2.motion.depth = dp; delete h2.motion.depthPx; }
      const ang = parseNum(h2angle); if (ang !== undefined) h2.motion.angle = ang;
      const ph = parseNum(phaseIn); if (ph !== undefined) h2.motion.phaseMs = ph;
    }

    const container = document.getElementById("technique-composition");
    if (container && typeof renderTechnique === "function") {
      renderTechnique(container, spec);
    }
  }

  function dumpToConsole() {
    const id = currentTechId();
    const spec = currentSpec();
    if (!spec) return;
    const json = JSON.stringify(spec, null, 2);
    console.log(`--- ${id} ---\n${json}`);
    if (navigator.clipboard) navigator.clipboard.writeText(json).catch(() => {});
  }

  function togglePanel() {
    panel.classList.toggle("collapsed");
  }

  if (applyBtn) applyBtn.addEventListener("click", applyToSpec);
  if (dumpBtn) dumpBtn.addEventListener("click", dumpToConsole);
  if (toggleBtn) toggleBtn.addEventListener("click", togglePanel);

  panel.addEventListener("click", (e) => {
    const btn = e.target.closest(".dbg-step");
    if (!btn) return;
    const wrap = btn.closest(".dbg-num");
    const input = wrap && wrap.querySelector("input[type='number']");
    if (!input) return;
    const dir = parseInt(btn.dataset.dir, 10) > 0 ? 1 : -1;
    const step = parseFloat(input.step) || 0.01;
    const cur = parseFloat(input.value);
    const next = Number.isFinite(cur) ? cur + dir * step : dir * step;
    const decimals = (input.step.toString().split(".")[1] || "").length;
    input.value = decimals ? next.toFixed(decimals) : Math.round(next).toString();
    applyToSpec();
  });

  panel.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.matches("input[type='number']")) {
      e.preventDefault();
      applyToSpec();
    }
  });

  // Re-populate inputs whenever the active technique changes.
  let lastIdx = -1;
  setInterval(() => {
    if (typeof state !== "undefined" && state.index !== lastIdx) {
      lastIdx = state.index;
      loadInputsFromSpec();
    }
  }, 200);

  loadInputsFromSpec();
})();

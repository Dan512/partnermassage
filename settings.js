// Settings: checkbox preferences persisted in localStorage, applied to the
// UI via a single applySettings() pass. Follows the same pattern used by
// other noadsdude tools — see the gear button on the start screen.
//
// Adding a new setting:
//   1) Add <label><input data-setting="key" checked> Label</label> to popover
//   2) Add a block to applySettings() that mirrors that key to UI behavior
//   3) Add a line to the Restore Defaults handler

(function () {
  // Settings whose default is FALSE when not yet set. Anything not in this
  // set defaults to TRUE on first visit.
  const SETTINGS_DEFAULT_FALSE = new Set([]);

  // Expose globally so script.js (and others) can read settings.
  window.getSettingsBool = function (key) {
    const v = localStorage.getItem(key);
    if (v === null) return !SETTINGS_DEFAULT_FALSE.has(key);
    return v === "true";
  };

  const $ = (id) => document.getElementById(id);
  const toggleBtn = $("settings-toggle");
  const popover = $("settings-popover");
  const revertBtn = $("settings-revert");
  const bodyToneSelect = $("body-tone-select");
  const handToneSelect = $("hand-tone-select");

  function applySettings() {
    // Hand animations: when off, kill all motion keyframes via body class.
    document.body.classList.toggle(
      "mb-no-anim",
      !window.getSettingsBool("handAnimations")
    );

    // Support button: hide via class when setting is off. (Active-screen
    // hiding is handled separately by the body.mb-on-active class set in
    // script.js's showScreen().)
    const donate = document.getElementById("donate-btn");
    if (donate) {
      donate.classList.toggle("hidden-by-setting", !window.getSettingsBool("showSupportBtn"));
    }

    // (Sound is read inline by playChime() — nothing to do here.)

    // Mirror checkbox state from storage, in case toggles changed elsewhere.
    document.querySelectorAll("#settings-popover input[data-setting]").forEach((cb) => {
      cb.checked = window.getSettingsBool(cb.dataset.setting);
    });

    // Sync skin-tone selects with localStorage values.
    if (bodyToneSelect && typeof getBodyTone === "function") {
      bodyToneSelect.value = getBodyTone();
    }
    if (handToneSelect && typeof getHandTone === "function") {
      handToneSelect.value = getHandTone();
    }
    // Keep the top-bar tone-cycle buttons in sync too.
    if (typeof window.refreshToneButtons === "function") {
      window.refreshToneButtons();
    }
  }
  window.applySettings = applySettings;

  // Re-render the current technique so a tone (or gender) change shows up
  // immediately without requiring the user to step forward/back.
  function rerenderCurrentVisual() {
    if (typeof state !== "undefined" &&
        typeof loadTechniqueVisual === "function" &&
        typeof ROUTINE !== "undefined") {
      const step = ROUTINE[state.index];
      if (step) loadTechniqueVisual(state.index, step);
    }
  }

  if (bodyToneSelect) {
    bodyToneSelect.addEventListener("change", (e) => {
      if (typeof setBodyTone === "function") setBodyTone(e.target.value);
      rerenderCurrentVisual();
    });
  }
  if (handToneSelect) {
    handToneSelect.addEventListener("change", (e) => {
      if (typeof setHandTone === "function") setHandTone(e.target.value);
      rerenderCurrentVisual();
    });
  }

  // Toggle popover open/closed.
  if (toggleBtn && popover) {
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      popover.hidden = !popover.hidden;
    });

    // Close on outside click.
    document.addEventListener("click", (e) => {
      if (popover.hidden) return;
      if (popover.contains(e.target)) return;
      if (e.target === toggleBtn || toggleBtn.contains(e.target)) return;
      popover.hidden = true;
    });

    // Close on Escape.
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !popover.hidden) popover.hidden = true;
    });
  }

  // Checkbox change → save → reapply.
  document.querySelectorAll("#settings-popover input[data-setting]").forEach((cb) => {
    cb.addEventListener("change", (e) => {
      localStorage.setItem(e.target.dataset.setting, e.target.checked);
      applySettings();
    });
  });

  // Restore Defaults button — explicitly write the default values.
  if (revertBtn) {
    revertBtn.addEventListener("click", () => {
      localStorage.setItem("playSound", "true");
      localStorage.setItem("handAnimations", "true");
      localStorage.setItem("showSupportBtn", "true");
      localStorage.setItem("mb_bodyTone", "medium");
      localStorage.setItem("mb_handTone", "medium");
      applySettings();
      rerenderCurrentVisual();
    });
  }

  // Apply once on load.
  applySettings();
})();

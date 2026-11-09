(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const isHex = (value) => /^#[0-9a-f]{6}$/i.test(value);

  const HILTS = {
    aegis: { name: "AEGIS", model: "AEGIS / MARK IV", object: "SF–AEGIS–04" },
    nox: { name: "NOX", model: "NOX / DARK MATTER", object: "SF–NOX–02" },
    ronin: { name: "RONIN", model: "RONIN / FREE FORM", object: "SF–RONIN–07" }
  };

  const FACTIONS = {
    jedi: { label: "СВЕТЛАЯ СТОРОНА", className: "Джедай", color: "#64D9FF", colorName: "Синий · Илюм", hilt: "aegis" },
    sith: { label: "ТЁМНАЯ СТОРОНА", className: "Ситх", color: "#FF404D", colorName: "Красный · Мустафар", hilt: "nox" },
    custom: { label: "СВОЙ ПУТЬ", className: "Свой путь", color: "#B785FF", colorName: "Фиолетовый · Хейст", hilt: "ronin" }
  };

  const state = {
    faction: "jedi",
    color: "#64D9FF",
    colorName: "Синий · Илюм",
    hilt: "aegis",
    bladeLength: 100,
    glow: 72,
    rotation: 35,
    scale: 1,
    bladeOn: true,
    sound: false,
    autoRotate: false
  };

  const el = {
    root: document.documentElement,
    stage: $("#stage"),
    stagePanel: $("#stagePanel"),
    saberSvg: $("#saberSvg"),
    saberTransform: $("#saberTransform"),
    bladeScaler: $("#bladeScaler"),
    bladeGroup: $("#bladeGroup"),
    bladeLength: $("#bladeLength"),
    bladeLengthValue: $("#bladeLengthValue"),
    glowStrength: $("#glowStrength"),
    glowValue: $("#glowValue"),
    colorPicker: $("#colorPicker"),
    hexInput: $("#hexInput"),
    hexLabel: $("#hexLabel"),
    colorName: $("#colorName"),
    crystalLabel: $("#crystalLabel"),
    pathLabel: $("#pathLabel"),
    classSpec: $("#classSpec"),
    saberModel: $("#saberModel"),
    objectLabel: $("#objectLabel"),
    stabilityValue: $("#stabilityValue"),
    stabilityBar: $("#stabilityBar"),
    rotationRange: $("#rotationRange"),
    rotationInput: $("#rotationInput"),
    rotationToolbarValue: $("#rotationToolbarValue"),
    scaleRange: $("#scaleRange"),
    scaleValue: $("#scaleValue"),
    scaleToolbarValue: $("#scaleToolbarValue"),
    viewRotation: $("#viewRotation"),
    viewScale: $("#viewScale"),
    igniteButton: $("#igniteButton"),
    igniteButtonLabel: $("#igniteButtonLabel"),
    stageStatus: $("#stageStatus"),
    soundToggle: $("#soundToggle"),
    autoRotateToggle: $("#autoRotateToggle"),
    exportButton: $("#exportButton"),
    collectionCount: $("#collectionCount"),
    collectionDialog: $("#collectionDialog"),
    collectionGrid: $("#collectionGrid"),
    helpDialog: $("#helpDialog"),
    toast: $("#toast"),
    toastMessage: $("#toastMessage"),
    canvas: $("#starsCanvas"),
    stageToolbar: $(".stage-toolbar"),
    exportLabel: $("#exportLabel"),
    composeStage: $("#composeStage"),
    composeEmpty: $("#composeEmpty"),
    composeViewport: $("#composeViewport"),
    composeFrame: $("#composeFrame"),
    composeImage: $("#composeImage"),
    composeSvg: $("#composeSvg"),
    composeDefs: $("#composeDefs"),
    composeToolbar: $("#composeToolbar"),
    composeHint: $("#composeHint"),
    composeRotationValue: $("#composeRotationValue"),
    composeScaleValue: $("#composeScaleValue"),
    studioModeButton: $("#studioModeButton"),
    composeModeButton: $("#composeModeButton"),
    photoInput: $("#photoInput"),
    flipButton: $("#flipSaberButton"),
    ovRoot: $("#ovRoot"),
    ovBladeScaler: $("#ovBladeScaler"),
    ovHilt: $("#ovHilt"),
    ovGuideLine: $("#ovGuideLine"),
    ovPivot: $("#ovPivot"),
    ovRotateHandle: $("#ovRotateHandle"),
    ovScaleHandle: $("#ovScaleHandle")
  };

  // Composite mode: saber placed on top of a user photo.
  const compose = {
    active: false,
    image: null,
    name: "",
    url: "",
    nx: 0.5,
    ny: 0.58,
    rot: -32,
    size: 0.52,
    flip: false,
    displayScale: 1,
    loaded: false
  };

  let toastTimer = 0;
  function showToast(message, icon = "✓") {
    clearTimeout(toastTimer);
    el.toastMessage.textContent = message;
    $(".toast-icon", el.toast).textContent = icon;
    el.toast.classList.add("visible");
    toastTimer = window.setTimeout(() => el.toast.classList.remove("visible"), 2800);
  }

  function hexToRgb(hex) {
    const value = parseInt(hex.slice(1), 16);
    return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
  }

  function updateRangeTrack(input) {
    const min = Number(input.min);
    const max = Number(input.max);
    const value = clamp(Number(input.value), min, max);
    const progress = ((value - min) / (max - min)) * 100;
    input.style.setProperty("--range-progress", `${progress}%`);
  }

  function normalizeDegrees(value) {
    return ((value + 180) % 360 + 360) % 360 - 180;
  }

  function updateColor() {
    const rgb = hexToRgb(state.color);
    const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
    el.root.style.setProperty("--saber-color", state.color);
    el.root.style.setProperty("--saber-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    el.root.style.setProperty("--on-saber", luminance > 0.53 ? "#071016" : "#ffffff");

    $$('[data-blade-color]').forEach((node) => node.setAttribute("stroke", state.color));
    $$('[data-blade-fill]').forEach((node) => node.setAttribute("fill", state.color));
    $$('[data-accent-fill]').forEach((node) => node.setAttribute("fill", state.color));
    $$('[data-accent-stroke]').forEach((node) => node.setAttribute("stroke", state.color));

    el.colorPicker.value = state.color;
    el.hexLabel.textContent = state.color;
    el.crystalLabel.textContent = state.color;
    el.colorName.textContent = state.colorName;
    if (document.activeElement !== el.hexInput) el.hexInput.value = state.color.slice(1);

    $$(".swatch").forEach((button) => {
      const active = button.dataset.color.toUpperCase() === state.color;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function setColor(hex, name = "Пользовательский кристалл", preserveHex = false) {
    const normalized = hex.toUpperCase();
    if (!isHex(normalized)) return false;
    state.color = normalized;
    state.colorName = name;
    updateColor();
    if (preserveHex && document.activeElement === el.hexInput) el.hexInput.value = hex.replace("#", "");
    return true;
  }

  function updateFaction() {
    const faction = FACTIONS[state.faction];
    el.pathLabel.textContent = faction.label;
    el.classSpec.textContent = faction.className;
    $$(".faction-button").forEach((button) => {
      const active = button.dataset.faction === state.faction;
      button.classList.toggle("active", active);
      button.setAttribute("aria-checked", String(active));
    });
  }

  function updateHilt() {
    const hilt = HILTS[state.hilt];
    el.saberModel.textContent = hilt.model;
    el.objectLabel.textContent = hilt.object;
    $$(".hilt-card").forEach((button) => {
      const active = button.dataset.hilt === state.hilt;
      button.classList.toggle("active", active);
      button.setAttribute("aria-checked", String(active));
    });
    $("#hiltAegis").style.display = state.hilt === "aegis" ? "inline" : "none";
    $("#hiltNox").style.display = state.hilt === "nox" ? "inline" : "none";
    $("#hiltRonin").style.display = state.hilt === "ronin" ? "inline" : "none";
    syncComposeHilt();
    updateColor();
  }

  function updateBladeSettings() {
    el.bladeLength.value = String(state.bladeLength);
    el.glowStrength.value = String(state.glow);
    el.bladeLengthValue.innerHTML = `${state.bladeLength} <span>см</span>`;
    el.glowValue.innerHTML = `${state.glow} <span>%</span>`;
    updateRangeTrack(el.bladeLength);
    updateRangeTrack(el.glowStrength);

    const heavyOpacity = (0.09 + state.glow * 0.00225).toFixed(2);
    const heavyWidth = String(52 + state.glow * 0.3);
    const mediumOpacity = (0.35 + state.glow * 0.0051).toFixed(2);
    const mediumWidth = String(36 + state.glow * 0.16);
    $$("[data-glow-heavy]").forEach((node) => {
      node.setAttribute("opacity", heavyOpacity);
      node.setAttribute("stroke-width", heavyWidth);
    });
    $$("[data-glow-medium]").forEach((node) => {
      node.setAttribute("opacity", mediumOpacity);
      node.setAttribute("stroke-width", mediumWidth);
    });

    const stability = clamp(99.8 - (state.bladeLength - 70) * 0.025 - (state.glow - 20) * 0.01, 92, 99.8);
    el.stabilityValue.textContent = `${stability.toFixed(1)}%`;
    el.stabilityBar.style.width = `${stability}%`;
    updateBladeScale();
  }

  function updatePosition() {
    el.saberTransform.setAttribute("transform", `rotate(${state.rotation.toFixed(2)}) scale(${state.scale.toFixed(3)})`);
    const sign = state.rotation < 0 ? "−" : "+";
    el.viewRotation.textContent = `Y ${sign}${String(Math.abs(Math.round(state.rotation))).padStart(3, "0")}.0`;
    el.viewScale.textContent = `Z ${state.scale.toFixed(2)}`;
    syncPositionControls();
  }

  // The rotation / scale sliders are shared: in composite mode they drive the saber on the photo.
  function syncPositionControls() {
    const composing = compose.active;
    const rotation = composing ? compose.rot : state.rotation;
    const roundedRotation = Math.round(rotation);
    const percent = composing ? Math.round(compose.size * 100) : Math.round(state.scale * 100);

    el.scaleRange.min = composing ? "8" : "50";
    el.scaleRange.max = composing ? "240" : "160";
    const scaleExtents = $$(".position-section .range-extents")[1];
    if (scaleExtents && scaleExtents.children.length === 2) {
      scaleExtents.children[0].textContent = composing ? "8%" : "50%";
      scaleExtents.children[1].textContent = composing ? "240%" : "160%";
    }

    el.rotationRange.value = String(roundedRotation);
    el.rotationInput.value = String(roundedRotation);
    el.rotationToolbarValue.textContent = `${roundedRotation}°`;
    el.scaleRange.value = String(percent);
    el.scaleValue.textContent = String(percent);
    el.scaleToolbarValue.textContent = `${percent}%`;
    if (el.composeRotationValue) el.composeRotationValue.textContent = `${roundedRotation}°`;
    if (el.composeScaleValue) el.composeScaleValue.textContent = `${percent}%`;

    updateRangeTrack(el.rotationRange);
    updateRangeTrack(el.scaleRange);
  }

  function setRotation(value) {
    if (!Number.isFinite(value)) return;
    const normalized = normalizeDegrees(value);
    if (compose.active) {
      compose.rot = normalized;
      renderCompose();
    } else {
      state.rotation = normalized;
      updatePosition();
    }
    syncPositionControls();
  }

  function setScale(value) {
    if (!Number.isFinite(value)) return;
    if (compose.active) {
      compose.size = clamp(value, 0.08, 2.4);
      renderCompose();
    } else {
      state.scale = clamp(value, 0.5, 1.6);
      updatePosition();
    }
    syncPositionControls();
  }

  let ignition = 1;
  let ignitionFrame = 0;
  function updateBladeScale() {
    const lengthFactor = state.bladeLength / 100;
    const yScale = Math.max(0.0001, lengthFactor * ignition);
    el.bladeScaler.setAttribute("transform", `translate(0 60) scale(1 ${yScale.toFixed(4)}) translate(0 -60)`);
    el.bladeGroup.setAttribute("opacity", ignition.toFixed(3));
    if (el.ovBladeScaler) {
      el.ovBladeScaler.setAttribute("transform", `translate(0 60) scale(1 ${yScale.toFixed(4)}) translate(0 -60)`);
      el.ovBladeScaler.setAttribute("opacity", ignition.toFixed(3));
    }
  }

  function animateIgnition() {
    cancelAnimationFrame(ignitionFrame);
    const tick = () => {
      const target = state.bladeOn ? 1 : 0;
      ignition += (target - ignition) * 0.18;
      if (Math.abs(target - ignition) < 0.002) ignition = target;
      updateBladeScale();
      if (ignition !== target) ignitionFrame = requestAnimationFrame(tick);
    };
    tick();
  }

  function updatePowerUI() {
    el.stage.classList.toggle("is-off", !state.bladeOn);
    el.stagePanel.classList.toggle("blade-off", !state.bladeOn);
    $$(".ignite-button").forEach((button) => button.setAttribute("aria-pressed", String(state.bladeOn)));
    $$(".ignite-label").forEach((label) => { label.textContent = state.bladeOn ? "Выключить меч" : "Зажечь меч"; });
    $("span", el.stageStatus).textContent = state.bladeOn ? "КЛИНОК СТАБИЛЕН" : "КЛИНОК ОТКЛЮЧЁН";
  }

  function setBlade(on, playEffect = true) {
    const changed = state.bladeOn !== on;
    state.bladeOn = on;
    updatePowerUI();
    animateIgnition();
    updateAudio();
    if (changed && playEffect && state.sound) playPowerSound(on);
  }

  function syncAll() {
    updateFaction();
    updateColor();
    updateHilt();
    updateBladeSettings();
    updatePosition();
    updatePowerUI();
    el.soundToggle.setAttribute("aria-checked", String(state.sound));
    el.autoRotateToggle.setAttribute("aria-checked", String(state.autoRotate));
  }

  // Faction, crystal and hilt controls
  $$(".faction-button").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.faction;
      const preset = FACTIONS[key];
      state.faction = key;
      state.hilt = preset.hilt;
      setColor(preset.color, preset.colorName);
      updateFaction();
      updateHilt();
      if (state.sound && state.bladeOn) playCrystalPing();
    });
  });

  $$(".swatch").forEach((button) => {
    button.addEventListener("click", () => {
      setColor(button.dataset.color, button.dataset.name);
      if (state.sound && state.bladeOn) playCrystalPing();
    });
  });

  el.colorPicker.addEventListener("input", (event) => setColor(event.target.value, "Пользовательский кристалл"));
  el.hexInput.addEventListener("input", () => {
    const raw = el.hexInput.value.trim().replace(/^#/, "");
    if (/^[0-9a-fA-F]{6}$/.test(raw)) setColor(`#${raw}`, "Пользовательский кристалл", true);
  });
  el.hexInput.addEventListener("blur", () => { el.hexInput.value = state.color.slice(1); });
  el.hexInput.addEventListener("keydown", (event) => { if (event.key === "Enter") el.hexInput.blur(); });

  $$(".hilt-card").forEach((button) => {
    button.addEventListener("click", () => {
      state.hilt = button.dataset.hilt;
      updateHilt();
    });
  });

  el.bladeLength.addEventListener("input", () => {
    state.bladeLength = Number(el.bladeLength.value);
    updateBladeSettings();
  });
  el.glowStrength.addEventListener("input", () => {
    state.glow = Number(el.glowStrength.value);
    updateBladeSettings();
  });
  el.rotationRange.addEventListener("input", () => setRotation(Number(el.rotationRange.value)));
  el.rotationInput.addEventListener("change", () => {
    const value = Number(el.rotationInput.value);
    setRotation(Number.isFinite(value) ? value : 35);
  });
  el.scaleRange.addEventListener("input", () => setScale(Number(el.scaleRange.value) / 100));

  $("#rotateLeftButton").addEventListener("click", () => setRotation(state.rotation - 15));
  $("#rotateRightButton").addEventListener("click", () => setRotation(state.rotation + 15));
  $("#zoomOutButton").addEventListener("click", () => setScale(state.scale - 0.1));
  $("#zoomInButton").addEventListener("click", () => setScale(state.scale + 0.1));
  $("#resetViewButton").addEventListener("click", resetView);
  el.igniteButton.addEventListener("click", () => setBlade(!state.bladeOn));

  function resetView() {
    if (compose.active) {
      if (!compose.loaded) return;
      compose.nx = 0.5;
      compose.ny = 0.58;
      compose.rot = -32;
      compose.size = 0.52;
      renderCompose();
      syncPositionControls();
      showToast("Меч возвращён в исходную точку", "↺");
      return;
    }
    state.rotation = 35;
    state.scale = 1;
    updatePosition();
    showToast("Положение модели сброшено", "↺");
  }

  // Drag, wheel and keyboard manipulation
  let dragging = false;
  let dragStartX = 0;
  let dragStartRotation = 0;
  let parallaxTarget = { x: 0, y: 0 };
  const parallax = { x: 0, y: 0 };

  el.stage.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    dragging = true;
    dragStartX = event.clientX;
    dragStartRotation = state.rotation;
    el.stage.setPointerCapture(event.pointerId);
    el.stage.classList.add("dragging", "has-interacted");
    el.stage.focus({ preventScroll: true });
  });

  el.stage.addEventListener("pointermove", (event) => {
    const rect = el.stage.getBoundingClientRect();
    parallaxTarget.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    parallaxTarget.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    if (dragging) setRotation(dragStartRotation + (event.clientX - dragStartX) * 0.55);
  });

  function finishDrag(event) {
    if (!dragging) return;
    dragging = false;
    el.stage.classList.remove("dragging");
    if (event && el.stage.hasPointerCapture(event.pointerId)) el.stage.releasePointerCapture(event.pointerId);
  }
  el.stage.addEventListener("pointerup", finishDrag);
  el.stage.addEventListener("pointercancel", finishDrag);
  el.stage.addEventListener("pointerleave", () => { parallaxTarget = { x: 0, y: 0 }; });
  el.stage.addEventListener("wheel", (event) => {
    event.preventDefault();
    el.stage.classList.add("has-interacted");
    setScale(state.scale * Math.exp(-event.deltaY * 0.001));
  }, { passive: false });
  el.stage.addEventListener("dblclick", resetView);

  el.soundToggle.addEventListener("click", async () => {
    state.sound = !state.sound;
    el.soundToggle.setAttribute("aria-checked", String(state.sound));
    if (state.sound) {
      try {
        await ensureAudio();
        updateAudio();
        if (state.bladeOn) playCrystalPing();
        showToast("Звук меча включён", "♪");
      } catch (error) {
        state.sound = false;
        el.soundToggle.setAttribute("aria-checked", "false");
        showToast("Браузер не разрешил включить звук", "!");
      }
    } else {
      updateAudio();
      showToast("Звук меча выключен", "♪");
    }
  });

  el.autoRotateToggle.addEventListener("click", () => {
    state.autoRotate = !state.autoRotate;
    el.autoRotateToggle.setAttribute("aria-checked", String(state.autoRotate));
    if (state.autoRotate) el.stage.classList.add("has-interacted");
  });

  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      saveToCollection();
      return;
    }
    if ($("dialog[open]")) return;
    const tag = event.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || event.target.isContentEditable) return;
    if (event.key === "ArrowLeft") { event.preventDefault(); setRotation(state.rotation - 5); }
    if (event.key === "ArrowRight") { event.preventDefault(); setRotation(state.rotation + 5); }
    if (event.key === "+" || event.key === "=") { event.preventDefault(); setScale(state.scale + 0.05); }
    if (event.key === "-" || event.key === "_") { event.preventDefault(); setScale(state.scale - 0.05); }
    if (event.code === "Space" && tag !== "BUTTON") { event.preventDefault(); setBlade(!state.bladeOn); }
  });

  // Lightweight synthesized lightsaber audio; only starts after a user gesture.
  let audioContext = null;
  let humMaster = null;
  async function ensureAudio() {
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error("Web Audio is unavailable");
      audioContext = new AudioContextClass();
      humMaster = audioContext.createGain();
      humMaster.gain.value = 0;
      const filter = audioContext.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 310;
      filter.Q.value = 1.2;
      const gainA = audioContext.createGain();
      const gainB = audioContext.createGain();
      gainA.gain.value = 0.16;
      gainB.gain.value = 0.055;
      const oscA = audioContext.createOscillator();
      const oscB = audioContext.createOscillator();
      oscA.type = "sawtooth";
      oscB.type = "sine";
      oscA.frequency.value = 58;
      oscB.frequency.value = 116.4;
      oscA.connect(gainA).connect(filter);
      oscB.connect(gainB).connect(filter);
      filter.connect(humMaster).connect(audioContext.destination);
      oscA.start();
      oscB.start();
    }
    if (audioContext.state === "suspended") await audioContext.resume();
  }

  function updateAudio() {
    if (!audioContext || !humMaster) return;
    const now = audioContext.currentTime;
    const target = state.sound && state.bladeOn ? 0.12 : 0;
    humMaster.gain.cancelScheduledValues(now);
    humMaster.gain.setValueAtTime(humMaster.gain.value, now);
    humMaster.gain.linearRampToValueAtTime(target, now + 0.18);
  }

  function playPowerSound(turningOn) {
    if (!audioContext || !state.sound) return;
    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    osc.type = "sawtooth";
    filter.type = "lowpass";
    filter.frequency.value = 500;
    osc.frequency.setValueAtTime(turningOn ? 48 : 170, now);
    osc.frequency.exponentialRampToValueAtTime(turningOn ? 190 : 38, now + 0.42);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.035, now + 0.035);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);
    osc.connect(filter).connect(gain).connect(audioContext.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  function playCrystalPing() {
    if (!audioContext || !state.sound) return;
    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(410, now);
    osc.frequency.exponentialRampToValueAtTime(650, now + 0.12);
    gain.gain.setValueAtTime(0.025, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    osc.connect(gain).connect(audioContext.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Local collection
  const STORAGE_KEY = "saberforge.collection.v1";
  let collection = [];

  function cleanConfig(item) {
    if (!item || typeof item !== "object") return null;
    const faction = Object.hasOwn(FACTIONS, item.faction) ? item.faction : "custom";
    const hilt = Object.hasOwn(HILTS, item.hilt) ? item.hilt : "aegis";
    return {
      id: Number.isFinite(Number(item.id)) ? Number(item.id) : Date.now(),
      faction,
      hilt,
      color: isHex(item.color) ? item.color.toUpperCase() : "#64D9FF",
      colorName: typeof item.colorName === "string" ? item.colorName.slice(0, 60) : "Пользовательский кристалл",
      bladeLength: clamp(Number(item.bladeLength) || 100, 70, 130),
      glow: clamp(Number(item.glow) || 72, 20, 100),
      rotation: normalizeDegrees(Number(item.rotation) || 0),
      scale: clamp(Number(item.scale) || 1, 0.5, 1.6),
      bladeOn: item.bladeOn !== false,
      createdAt: Number(item.createdAt) || Date.now()
    };
  }

  function readCollection() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      collection = Array.isArray(saved) ? saved.map(cleanConfig).filter(Boolean).slice(0, 12) : [];
    } catch (_) {
      collection = [];
    }
    updateCollectionCount();
  }

  function persistCollection() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
      return true;
    } catch (_) {
      return false;
    }
  }

  function updateCollectionCount() {
    el.collectionCount.textContent = String(collection.length);
  }

  function saveToCollection() {
    const config = cleanConfig({
      ...state,
      id: Date.now(),
      createdAt: Date.now(),
      sound: undefined,
      autoRotate: undefined
    });
    collection.unshift(config);
    collection = collection.slice(0, 12);
    if (persistCollection()) {
      updateCollectionCount();
      renderCollection();
      showToast(`${HILTS[state.hilt].name} сохранён в коллекции`);
    } else {
      collection.shift();
      showToast("Не удалось получить доступ к локальному архиву", "!");
    }
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }

  function renderCollection() {
    if (!collection.length) {
      el.collectionGrid.innerHTML = `<div class="empty-collection"><div class="empty-collection-gem">✦</div><strong>Здесь пока тихо</strong><p>Собери меч и нажми «В коллекцию», чтобы сохранить его конфигурацию в этом браузере.</p></div>`;
      return;
    }
    el.collectionGrid.innerHTML = collection.map((item) => {
      const hilt = HILTS[item.hilt];
      const faction = FACTIONS[item.faction];
      const date = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short" }).format(new Date(item.createdAt));
      return `<article class="collection-card" style="--mini-color:${item.color}">
        <div class="collection-card-preview"><div class="mini-saber"></div></div>
        <div class="collection-card-info">
          <div class="collection-card-title"><strong>${hilt.name} / ${escapeHTML(faction.className.toUpperCase())}</strong><span>${item.color}</span></div>
          <div class="collection-card-meta">${item.bladeLength} см · ${Math.round(item.scale * 100)}% · ${escapeHTML(date)}</div>
          <div class="collection-card-actions"><button class="collection-load" data-load-id="${item.id}">Загрузить меч</button><button class="collection-delete" data-delete-id="${item.id}" aria-label="Удалить ${hilt.name}">×</button></div>
        </div>
      </article>`;
    }).join("");
  }

  el.collectionGrid.addEventListener("click", (event) => {
    const loadButton = event.target.closest("[data-load-id]");
    const deleteButton = event.target.closest("[data-delete-id]");
    if (loadButton) {
      const item = collection.find((entry) => entry.id === Number(loadButton.dataset.loadId));
      if (!item) return;
      const keepSound = state.sound;
      const keepAutoRotate = state.autoRotate;
      Object.assign(state, item, { sound: keepSound, autoRotate: keepAutoRotate });
      ignition = state.bladeOn ? Math.min(ignition, 0.15) : Math.max(ignition, 0.85);
      syncAll();
      animateIgnition();
      updateAudio();
      el.collectionDialog.close();
      showToast(`${HILTS[state.hilt].name} загружен в мастерскую`, "◆");
    }
    if (deleteButton) {
      collection = collection.filter((entry) => entry.id !== Number(deleteButton.dataset.deleteId));
      persistCollection();
      updateCollectionCount();
      renderCollection();
      showToast("Конфигурация удалена", "×");
    }
  });

  function openDialog(dialog) {
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  $("#collectionButton").addEventListener("click", () => { renderCollection(); openDialog(el.collectionDialog); });
  $("#helpButton").addEventListener("click", () => openDialog(el.helpDialog));
  $$('[data-close]').forEach((button) => button.addEventListener("click", () => {
    const dialog = document.getElementById(button.dataset.close);
    if (dialog) dialog.close();
  }));
  $$("dialog").forEach((dialog) => dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  }));
  $("#saveCollectionButton").addEventListener("click", saveToCollection);
  $("#constructorButton").addEventListener("click", () => {
    $$("dialog[open]").forEach((dialog) => dialog.close());
    el.stage.focus({ preventScroll: true });
  });
  $("#brandButton").addEventListener("click", () => {
    $$("dialog[open]").forEach((dialog) => dialog.close());
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Fullscreen preview
  $("#fullscreenButton").addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (el.stagePanel.requestFullscreen) await el.stagePanel.requestFullscreen();
      else showToast("Полноэкранный режим недоступен", "!");
    } catch (_) {
      showToast("Полноэкранный режим недоступен", "!");
    }
  });

  // PNG renderer: the exported image is generated locally, without a server.
  el.exportButton.addEventListener("click", async () => {
    if (compose.active) {
      await runComposeExport();
      return;
    }
    const label = $("span", el.exportButton);
    const original = label.textContent;
    el.exportButton.disabled = true;
    label.textContent = "Рендер...";
    try {
      const width = 1600;
      const height = 1280;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      const rgb = hexToRgb(state.color);

      const background = context.createRadialGradient(820, 520, 20, 800, 640, 950);
      background.addColorStop(0, "#14212d");
      background.addColorStop(0.48, "#0a1017");
      background.addColorStop(1, "#05080c");
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);

      const aura = context.createRadialGradient(820, 500, 0, 820, 500, 560);
      aura.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0.10)`);
      aura.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
      context.fillStyle = aura;
      context.fillRect(0, 0, width, height);

      context.strokeStyle = "rgba(115,145,170,0.055)";
      context.lineWidth = 1;
      for (let x = 0; x <= width; x += 64) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke(); }
      for (let y = 0; y <= height; y += 64) { context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); }

      const random = mulberry32(7404);
      for (let i = 0; i < 145; i++) {
        const x = random() * width;
        const y = random() * height;
        const radius = random() * 1.4 + 0.3;
        context.fillStyle = `rgba(166,198,222,${random() * 0.35 + 0.08})`;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      }

      const clone = el.saberSvg.cloneNode(true);
      clone.setAttribute("viewBox", "0 0 1000 800");
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      clone.setAttribute("width", String(width));
      clone.setAttribute("height", String(height));
      clone.removeAttribute("class");
      const source = new XMLSerializer().serializeToString(clone);
      const svgUrl = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" }));
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = svgUrl;
      });
      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(svgUrl);

      context.fillStyle = "rgba(185,205,220,0.6)";
      context.font = "16px monospace";
      context.fillText(`SABERFORGE / ${HILTS[state.hilt].model}`, 58, 64);
      context.fillStyle = state.color;
      context.fillText(state.color, width - 155, 64);
      context.fillStyle = "rgba(104,127,145,0.65)";
      context.font = "13px monospace";
      context.fillText(`${FACTIONS[state.faction].className.toUpperCase()}  ·  ${state.bladeLength} CM  ·  KYBER CRYSTAL`, 58, height - 48);
      context.fillText("DESIGNED IN SABERFORGE LAB / 04", width - 360, height - 48);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("PNG rendering failed");
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = `saberforge-${state.hilt}-${state.color.slice(1).toLowerCase()}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1500);
      showToast("Голограмма сохранена в PNG");
    } catch (error) {
      console.error(error);
      showToast("Не удалось создать PNG. Попробуй ещё раз.", "!");
    } finally {
      el.exportButton.disabled = false;
      label.textContent = original;
    }
  });

  // ==============================================================
  // COMPOSITE MODE — light saber placed over the user's photo
  // ==============================================================
  const SABER_GEOMETRY = { tip: -390, pivotY: 60, pommel: 309 };

  function saberLength() {
    const k = clamp(state.bladeLength, 70, 130) / 100;
    return SABER_GEOMETRY.pommel - (SABER_GEOMETRY.pivotY + (SABER_GEOMETRY.tip - SABER_GEOMETRY.pivotY) * k);
  }

  function prefixFragmentRefs(node) {
    if (!node || node.nodeType !== 1) return;
    const apply = (target) => {
      ["fill", "stroke", "filter", "clip-path", "mask"].forEach((attr) => {
        const value = target.getAttribute(attr);
        if (value && value.includes("url(#")) target.setAttribute(attr, value.replace(/url\(#/g, "url(#ov-"));
      });
    };
    apply(node);
    node.querySelectorAll("*").forEach(apply);
  }

  function prepareComposeDefs() {
    const source = $("#saberSvg defs");
    if (!source || !el.composeDefs) return;
    const clone = source.cloneNode(true);
    prefixFragmentRefs(clone);
    clone.querySelectorAll("[id]").forEach((node) => { node.id = `ov-${node.id.replace(/^ov-/, "")}`; });
    el.composeDefs.replaceChildren(...[...clone.childNodes]);
  }

  function syncComposeHilt() {
    if (!el.ovHilt) return;
    const source = document.getElementById(state.hilt === "nox" ? "hiltNox" : state.hilt === "ronin" ? "hiltRonin" : "hiltAegis");
    if (!source) return;
    const clone = source.cloneNode(true);
    clone.removeAttribute("id");
    clone.style.display = "inline";
    prefixFragmentRefs(clone);
    el.ovHilt.replaceChildren(clone);
  }

  function composeMetrics() {
    const iw = compose.image ? compose.image.naturalWidth : 1000;
    const ih = compose.image ? compose.image.naturalHeight : 1000;
    const length = saberLength();
    const scale = (compose.size * ih) / length;
    return { iw, ih, scale, cx: compose.nx * iw, cy: compose.ny * ih, length };
  }

  function composeLocalToImage(lx, ly) {
    const { scale, cx, cy } = composeMetrics();
    const sy = compose.flip ? -scale : scale;
    const rad = (compose.rot * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const px = lx * scale;
    const py = ly * sy;
    return { x: cx + px * cos - py * sin, y: cy + px * sin + py * cos };
  }

  function renderCompose() {
    if (!compose.loaded) return;
    const { scale, cx, cy } = composeMetrics();
    const sy = compose.flip ? -scale : scale;
    el.ovRoot.setAttribute(
      "transform",
      `translate(${cx.toFixed(2)} ${cy.toFixed(2)}) rotate(${compose.rot.toFixed(2)}) scale(${scale.toFixed(4)} ${sy.toFixed(4)})`
    );
    positionComposeHandles();
  }

  function positionComposeHandles() {
    if (!compose.loaded) return;
    const { iw, ih } = composeMetrics();
    const k = clamp(state.bladeLength, 70, 130) / 100;
    const tipY = SABER_GEOMETRY.pivotY + (SABER_GEOMETRY.tip - SABER_GEOMETRY.pivotY) * k;
    const pivot = composeLocalToImage(0, 0);
    const rotatePoint = composeLocalToImage(0, tipY * 0.68);
    const scalePoint = composeLocalToImage(0, SABER_GEOMETRY.pommel);
    const place = (node, point) => {
      if (!node) return;
      node.style.left = `${((point.x / iw) * 100).toFixed(3)}%`;
      node.style.top = `${((point.y / ih) * 100).toFixed(3)}%`;
    };
    place(el.ovRotateHandle, rotatePoint);
    place(el.ovScaleHandle, scalePoint);
    place(el.ovPivot, pivot);
    if (el.ovGuideLine) {
      el.ovGuideLine.setAttribute("x1", pivot.x.toFixed(1));
      el.ovGuideLine.setAttribute("y1", pivot.y.toFixed(1));
      el.ovGuideLine.setAttribute("x2", rotatePoint.x.toFixed(1));
      el.ovGuideLine.setAttribute("y2", rotatePoint.y.toFixed(1));
    }
  }

  function layoutCompose() {
    if (!compose.loaded) return;
    const vw = el.composeViewport.clientWidth;
    const vh = el.composeViewport.clientHeight;
    if (vw < 24 || vh < 24) return;
    const iw = compose.image.naturalWidth || 1000;
    const ih = compose.image.naturalHeight || 1000;
    const fit = Math.min(vw / iw, vh / ih);
    const width = Math.max(24, Math.round(iw * fit));
    const height = Math.max(24, Math.round(ih * fit));
    el.composeFrame.style.width = `${width}px`;
    el.composeFrame.style.height = `${height}px`;
    el.composeSvg.setAttribute("viewBox", `0 0 ${iw} ${ih}`);
    compose.displayScale = width / iw;
    renderCompose();
  }

  function pointerToImage(event) {
    const rect = el.composeFrame.getBoundingClientRect();
    const { iw, ih } = composeMetrics();
    return {
      x: ((event.clientX - rect.left) / Math.max(1, rect.width)) * iw,
      y: ((event.clientY - rect.top) / Math.max(1, rect.height)) * ih
    };
  }

  // ---------- photo loading ----------
  function setComposeSource(url, name) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        compose.image = image;
        compose.loaded = true;
        compose.name = name || "photo";
        compose.url = url;
        el.composeImage.src = url;
        el.composeImage.alt = `Фото «${compose.name}» с наложенным световым мечом`;
        el.composeEmpty.hidden = true;
        el.composeViewport.hidden = false;
        el.composeHint.hidden = !compose.active;
        el.composeToolbar.hidden = !compose.active;
        [el.ovRotateHandle, el.ovScaleHandle, el.ovPivot].forEach((node) => { if (node) node.hidden = false; });
        syncComposeHilt();
        updateColor();
        updateBladeSettings();
        animateIgnition();
        requestAnimationFrame(() => {
          layoutCompose();
          syncComposeReadyState();
          showToast(`Фото загружено · ${image.naturalWidth}×${image.naturalHeight}`, "✦");
          resolve(true);
        });
      };
      image.onerror = () => {
        showToast("Не удалось открыть это изображение", "!");
        resolve(false);
      };
      image.src = url;
    });
  }

  function loadPhotoFile(file) {
    if (!file) return Promise.resolve(false);
    if (!/^image\//.test(file.type)) {
      showToast("Это не изображение", "!");
      return Promise.resolve(false);
    }
    if (file.size > 30 * 1024 * 1024) {
      showToast("Файл больше 30 МБ", "!");
      return Promise.resolve(false);
    }
    if (compose.url && compose.url.startsWith("blob:")) URL.revokeObjectURL(compose.url);
    const url = URL.createObjectURL(file);
    setMode("compose");
    return setComposeSource(url, file.name || "photo");
  }

  function loadDemoPhoto() {
    if (compose.url && compose.url.startsWith("blob:")) URL.revokeObjectURL(compose.url);
    setMode("compose");
    const source = window.SABERFORGE_DEMO_PHOTO || "assets/demo-portrait.jpg";
    return setComposeSource(source, "demo-portrait.jpg");
  }

  function syncComposeReadyState() {
    const section = $(".position-section");
    if (section) section.classList.toggle("is-inactive", compose.active && !compose.loaded);
  }

  // ---------- mode switching ----------
  function setMode(mode) {
    const composing = mode === "compose";
    if (compose.active === composing && el.composeStage.hidden === composing) return;
    compose.active = composing;
    el.stagePanel.classList.toggle("mode-compose", composing);
    el.stagePanel.dataset.mode = composing ? "compose" : "studio";
    el.stage.hidden = composing;
    el.stageToolbar.hidden = composing;
    el.composeStage.hidden = !composing;
    el.composeToolbar.hidden = !composing || !compose.loaded;
    el.composeViewport.hidden = !compose.loaded;
    el.composeEmpty.hidden = compose.loaded;
    el.composeHint.hidden = !composing || !compose.loaded;
    el.studioModeButton.classList.toggle("active", !composing);
    el.studioModeButton.setAttribute("aria-pressed", String(!composing));
    el.composeModeButton.classList.toggle("active", composing);
    el.composeModeButton.setAttribute("aria-pressed", String(composing));
    el.exportLabel.textContent = composing ? "Сохранить фото" : "Сохранить PNG";
    const modeCaption = $(".stage-mode");
    if (modeCaption) modeCaption.innerHTML = composing ? "ФОТО-КОМПОЗИТ <span>•</span> PNG" : "ГОЛОГРАММНЫЙ РЕЖИМ <span>•</span> SVG";
    $("#composeNavButton").classList.toggle("active", composing);
    $("#constructorButton").classList.toggle("active", !composing);
    syncPositionControls();
    syncComposeReadyState();
    if (composing) {
      requestAnimationFrame(layoutCompose);
    } else {
      resizeCanvas();
    }
  }

  // ---------- pointer interaction ----------
  const composePointers = new Map();
  let composeDrag = null;
  let composePinch = null;

  el.composeFrame.addEventListener("pointerdown", (event) => {
    if (!compose.loaded || event.button > 0) return;
    event.preventDefault();
    el.composeFrame.setPointerCapture(event.pointerId);
    composePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (composePointers.size === 2) {
      const [a, b] = [...composePointers.values()];
      composePinch = {
        distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
        angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
        size: compose.size,
        rot: compose.rot
      };
      composeDrag = null;
      el.composeFrame.classList.add("dragging");
      return;
    }
    if (composePointers.size > 2) return;

    const handle = event.target.closest(".ov-handle");
    const mode = handle === el.ovRotateHandle ? "rotate" : handle === el.ovScaleHandle ? "scale" : "move";
    composeDrag = {
      mode,
      pointerId: event.pointerId,
      origin: pointerToImage(event),
      nx: compose.nx,
      ny: compose.ny,
      rot: compose.rot,
      size: compose.size,
      handle: handle || null
    };
    if (handle) handle.classList.add("dragging");
    el.composeFrame.classList.add("dragging", "has-interacted");
  });

  el.composeFrame.addEventListener("pointermove", (event) => {
    if (!composePointers.has(event.pointerId)) return;
    composePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (composePinch && composePointers.size >= 2) {
      const [a, b] = [...composePointers.values()];
      const distance = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
      const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      compose.size = clamp(composePinch.size * (distance / composePinch.distance), 0.08, 2.4);
      compose.rot = normalizeDegrees(composePinch.rot + (angle - composePinch.angle));
      renderCompose();
      syncPositionControls();
      return;
    }

    if (!composeDrag) return;
    const point = pointerToImage(event);
    const { iw, ih } = composeMetrics();

    if (composeDrag.mode === "move") {
      compose.nx = clamp(composeDrag.nx + (point.x - composeDrag.origin.x) / iw, -0.2, 1.2);
      compose.ny = clamp(composeDrag.ny + (point.y - composeDrag.origin.y) / ih, -0.2, 1.2);
      renderCompose();
      return;
    }

    const pivot = composeLocalToImage(0, 0);
    const dx = point.x - pivot.x;
    const dy = point.y - pivot.y;

    if (composeDrag.mode === "rotate") {
      const radians = compose.flip ? Math.atan2(-dx, dy) : Math.atan2(dx, -dy);
      let degrees = (radians * 180) / Math.PI;
      if (event.shiftKey) degrees = Math.round(degrees / 15) * 15;
      compose.rot = normalizeDegrees(degrees);
      renderCompose();
      syncPositionControls();
      return;
    }

    const distance = Math.hypot(dx, dy);
    const scale = distance / SABER_GEOMETRY.pommel;
    compose.size = clamp((scale * saberLength()) / ih, 0.08, 2.4);
    renderCompose();
    syncPositionControls();
  });

  function endComposePointer(event) {
    composePointers.delete(event.pointerId);
    if (composePointers.size < 2) composePinch = null;
    if (event && el.composeFrame.hasPointerCapture(event.pointerId)) el.composeFrame.releasePointerCapture(event.pointerId);
    if (composePointers.size === 0) {
      composeDrag = null;
      el.composeFrame.classList.remove("dragging");
      $$(".ov-handle").forEach((node) => node.classList.remove("dragging"));
    }
  }

  el.composeFrame.addEventListener("pointerup", endComposePointer);
  el.composeFrame.addEventListener("pointercancel", endComposePointer);
  el.composeFrame.addEventListener("lostpointercapture", (event) => { composePointers.delete(event.pointerId); });

  el.composeStage.addEventListener("wheel", (event) => {
    if (!compose.loaded) return;
    event.preventDefault();
    setScale(compose.size * Math.exp(-event.deltaY * 0.0012));
  }, { passive: false });

  // ---------- photo inputs ----------
  $("#uploadPhotoButton").addEventListener("click", () => el.photoInput.click());
  $("#changePhotoButton").addEventListener("click", () => el.photoInput.click());
  $("#demoPhotoButton").addEventListener("click", () => loadDemoPhoto());
  el.photoInput.addEventListener("change", () => {
    const file = el.photoInput.files && el.photoInput.files[0];
    if (file) loadPhotoFile(file);
    el.photoInput.value = "";
  });

  ["dragenter", "dragover"].forEach((type) => {
    el.composeStage.addEventListener(type, (event) => {
      if (!event.dataTransfer || ![...event.dataTransfer.types].includes("Files")) return;
      event.preventDefault();
      el.composeEmpty.classList.add("is-dragging");
    });
  });
  ["dragleave", "dragend"].forEach((type) => {
    el.composeStage.addEventListener(type, () => el.composeEmpty.classList.remove("is-dragging"));
  });
  el.composeStage.addEventListener("drop", (event) => {
    if (!event.dataTransfer) return;
    const file = [...event.dataTransfer.files].find((item) => /^image\//.test(item.type));
    el.composeEmpty.classList.remove("is-dragging");
    if (!file) return;
    event.preventDefault();
    loadPhotoFile(file);
  });

  document.addEventListener("paste", (event) => {
    if (!event.clipboardData) return;
    const item = [...event.clipboardData.items].find((entry) => /^image\//.test(entry.type));
    if (!item) return;
    const file = item.getAsFile();
    if (file) {
      event.preventDefault();
      loadPhotoFile(file);
    }
  });

  // ---------- composite toolbar ----------
  $("#composeRotateLeft").addEventListener("click", () => setRotation(compose.rot - 5));
  $("#composeRotateRight").addEventListener("click", () => setRotation(compose.rot + 5));
  $("#composeZoomOut").addEventListener("click", () => setScale(compose.size - 0.05));
  $("#composeZoomIn").addEventListener("click", () => setScale(compose.size + 0.05));
  el.flipButton.addEventListener("click", () => {
    compose.flip = !compose.flip;
    el.flipButton.setAttribute("aria-pressed", String(compose.flip));
    renderCompose();
    showToast(compose.flip ? "Меч перевёрнут" : "Меч в исходном направлении", "⇅");
  });
  $("#resetComposeButton").addEventListener("click", resetView);
  $("#composeIgniteButton").addEventListener("click", () => setBlade(!state.bladeOn));

  el.studioModeButton.addEventListener("click", () => setMode("studio"));
  el.composeModeButton.addEventListener("click", () => setMode("compose"));
  $("#composeNavButton").addEventListener("click", () => setMode("compose"));

  // ---------- composite export ----------
  function buildComposeSvgClone(options = {}) {
    const { hideGlow = false, hideSolid = false } = options;
    const clone = el.composeSvg.cloneNode(true);
    clone.removeAttribute("id");
    clone.removeAttribute("class");
    clone.removeAttribute("aria-hidden");
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("viewBox", `0 0 ${compose.image.naturalWidth} ${compose.image.naturalHeight}`);
    const guides = clone.querySelector("#ovGuides");
    if (guides) guides.remove();
    const glow = clone.querySelector("#ovGlow");
    const solid = clone.querySelector("#ovSolid");
    const hilt = clone.querySelector("#ovHilt");
    if (hideGlow && glow) glow.setAttribute("display", "none");
    if (hideSolid) {
      if (solid) solid.setAttribute("display", "none");
      if (hilt) hilt.setAttribute("display", "none");
    }
    return clone;
  }

  async function svgNodeToImage(node, width, height) {
    node.setAttribute("width", String(width));
    node.setAttribute("height", String(height));
    const source = new XMLSerializer().serializeToString(node);
    const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" }));
    try {
      return await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Не удалось отрисовать меч"));
        image.src = url;
      });
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(url), 2500);
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2500);
  }

  async function exportComposeImage() {
    const iw = compose.image.naturalWidth;
    const ih = compose.image.naturalHeight;
    const limit = 3200;
    const ratio = Math.min(1, limit / Math.max(iw, ih));
    const width = Math.max(1, Math.round(iw * ratio));
    const height = Math.max(1, Math.round(ih * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    context.drawImage(compose.image, 0, 0, width, height);

    if (ignition > 0.01) {
      const glowImage = await svgNodeToImage(buildComposeSvgClone({ hideSolid: true }), width, height);
      context.globalCompositeOperation = "screen";
      context.drawImage(glowImage, 0, 0, width, height);
      context.globalCompositeOperation = "source-over";
    }
    const solidImage = await svgNodeToImage(buildComposeSvgClone({ hideGlow: true }), width, height);
    context.drawImage(solidImage, 0, 0, width, height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Не удалось собрать PNG");
    downloadBlob(blob, `saberforge-photo-${state.color.slice(1).toLowerCase()}.png`);
  }

  async function runComposeExport() {
    const original = el.exportLabel.textContent;
    if (!compose.loaded) {
      showToast("Сначала загрузи фото", "!");
      return;
    }
    el.exportButton.disabled = true;
    el.exportLabel.textContent = "Рендер...";
    try {
      await exportComposeImage();
      showToast("Фото с мечом сохранено в PNG", "✦");
    } catch (error) {
      console.error(error);
      showToast("Не удалось сохранить фото. Попробуй ещё раз.", "!");
    } finally {
      el.exportButton.disabled = false;
      el.exportLabel.textContent = original;
    }
  }

  // Ambient star field and auto-rotation loop
  const context = el.canvas.getContext("2d");
  let canvasWidth = 0;
  let canvasHeight = 0;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function mulberry32(seed) {
    return function random() {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  const random = mulberry32(1138);
  const stars = Array.from({ length: 115 }, () => ({
    x: random(), y: random(), depth: random(), size: random() * 1.15 + 0.25,
    alpha: random() * 0.38 + 0.08, phase: random() * Math.PI * 2, speed: random() * 1.2 + 0.25
  }));

  function resizeCanvas() {
    const rect = el.stage.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvasWidth = Math.max(1, rect.width);
    canvasHeight = Math.max(1, rect.height);
    const viewWidth = clamp((canvasWidth / canvasHeight) * 800, 590, 1100);
    const viewX = 500 - viewWidth / 2;
    el.saberSvg.setAttribute("viewBox", `${viewX.toFixed(1)} 0 ${viewWidth.toFixed(1)} 800`);
    el.canvas.width = Math.round(canvasWidth * dpr);
    el.canvas.height = Math.round(canvasHeight * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawStars(time) {
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    parallax.x += (parallaxTarget.x - parallax.x) * 0.035;
    parallax.y += (parallaxTarget.y - parallax.y) * 0.035;
    for (const star of stars) {
      const x = star.x * canvasWidth + parallax.x * star.depth * 8;
      const y = star.y * canvasHeight + parallax.y * star.depth * 8;
      const pulse = reduceMotion ? 1 : 0.78 + Math.sin(time * 0.001 * star.speed + star.phase) * 0.22;
      context.fillStyle = `rgba(153,185,211,${(star.alpha * pulse).toFixed(3)})`;
      context.beginPath();
      context.arc(x, y, star.size, 0, Math.PI * 2);
      context.fill();
      if (star.size > 1.2) {
        context.strokeStyle = `rgba(153,185,211,${(star.alpha * 0.35).toFixed(3)})`;
        context.lineWidth = 0.5;
        context.beginPath();
        context.moveTo(x - 3, y); context.lineTo(x + 3, y);
        context.moveTo(x, y - 3); context.lineTo(x, y + 3);
        context.stroke();
      }
    }
  }

  let previousTime = performance.now();
  function animationLoop(time) {
    const delta = Math.min(50, time - previousTime);
    previousTime = time;
    if (state.autoRotate && !dragging && !$("dialog[open]")) setRotation(state.rotation + delta * 0.012);
    drawStars(time);
    requestAnimationFrame(animationLoop);
  }

  if ("ResizeObserver" in window) new ResizeObserver(resizeCanvas).observe(el.stage);
  else window.addEventListener("resize", resizeCanvas);

  readCollection();
  renderCollection();
  prepareComposeDefs();
  syncAll();
  setMode("studio");
  if ("ResizeObserver" in window) new ResizeObserver(() => layoutCompose()).observe(el.composeViewport);
  updateBladeScale();
  resizeCanvas();
  requestAnimationFrame(animationLoop);
})();

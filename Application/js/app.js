/**
 * FOLD — THE ARCHIVE: Main Application Controller
 * Orchestrates navigation, chamber mechanics, the Folding System,
 * the Witness System, Table-Filling matrix, Product Gate, and Web Audio.
 */

(function () {
  'use strict';

  // Global State
  let currentChamberId = 1;
  let currentMachine = null;
  let activeTrace = null;
  let traceStepIndex = 0;
  let selectedFoldStates = [];
  let gameState = null;

  // DOM Elements cache
  let screens = {};
  let el = {};

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheDOMElements();
    gameState = window.FoldStorage.load();

    // Apply settings
    applySettings(gameState.settings);

    // Wire global events
    setupGlobalNavigation();
    setupChamberControls();
    setupKeypad();
    setupFoldingUI();
    setupWitnessUI();
    setupTableFillingUI();
    setupProductGateUI();

    // Initialize Examiner & Workshop modules
    if (window.FoldExaminer && window.ChambersData) {
      window.FoldExaminer.init(window.ChambersData, (chamberId) => {
        showScreen('chamber');
        loadChamber(chamberId);
      });
    }
    if (window.FoldWorkshop) {
      window.FoldWorkshop.init();
    }

    // Show Title screen initially
    showScreen('title');
    updateCorridorUI();
  }

  function cacheDOMElements() {
    screens = {
      title: document.getElementById('screen-title'),
      corridor: document.getElementById('screen-corridor'),
      chamber: document.getElementById('screen-chamber'),
      workshop: document.getElementById('screen-workshop'),
      examiner: document.getElementById('screen-examiner'),
      completion: document.getElementById('screen-completion')
    };

    el = {
      // Header & HUD
      chamberCode: document.getElementById('hud-chamber-code'),
      chamberTitle: document.getElementById('hud-chamber-title'),
      soundToggle: document.getElementById('btn-sound-toggle'),
      settingsToggle: document.getElementById('btn-settings-toggle'),
      settingsModal: document.getElementById('modal-settings'),
      settingsClose: document.getElementById('btn-settings-close'),

      // Chamber Display
      visualizerContainer: document.getElementById('chamber-visualizer'),
      intercomAvatar: document.getElementById('intercom-speaker'),
      intercomText: document.getElementById('intercom-message'),
      tracesContainer: document.getElementById('chamber-traces-list'),
      hintsContainer: document.getElementById('chamber-hints-list'),
      revealHintBtn: document.getElementById('btn-reveal-hint'),
      hintCounter: document.getElementById('hint-counter'),

      // Input & Simulation
      cipherInput: document.getElementById('cipher-input'),
      runBtn: document.getElementById('btn-run-simulation'),
      stepModeToggle: document.getElementById('step-mode-checkbox'),
      stepControls: document.getElementById('step-controls-panel'),
      stepPrevBtn: document.getElementById('btn-step-prev'),
      stepNextBtn: document.getElementById('btn-step-next'),
      stepResetBtn: document.getElementById('btn-step-reset'),
      stepStatus: document.getElementById('step-status-indicator'),
      resultBanner: document.getElementById('simulation-result-banner'),

      // Special Mechanics Containers
      foldPanel: document.getElementById('mechanic-fold-panel'),
      witnessPanel: document.getElementById('mechanic-witness-panel'),
      tablePanel: document.getElementById('mechanic-table-panel'),
      productPanel: document.getElementById('mechanic-product-panel')
    };
  }

  function showScreen(screenKey) {
    Object.keys(screens).forEach(key => {
      if (screens[key]) {
        screens[key].classList.toggle('active', key === screenKey);
      }
    });

    if (screenKey === 'corridor') {
      updateCorridorUI();
    }
  }

  function setupGlobalNavigation() {
    // Title Screen buttons
    const btnNewGame = document.getElementById('btn-new-game');
    const btnContinue = document.getElementById('btn-continue');
    const btnExaminer = document.getElementById('btn-examiner-mode');
    const btnWorkshop = document.getElementById('btn-workshop-mode');

    if (btnNewGame) {
      btnNewGame.addEventListener('click', () => {
        window.FoldAudio.initContext();
        window.FoldAudio.playKeyClick();
        window.FoldStorage.resetAll();
        gameState = window.FoldStorage.load();
        showScreen('chamber');
        loadChamber(1);
      });
    }

    if (btnContinue) {
      btnContinue.addEventListener('click', () => {
        window.FoldAudio.initContext();
        window.FoldAudio.playKeyClick();
        const unlocked = gameState.unlockedChambers || [1];
        const lastChamber = unlocked[unlocked.length - 1];
        showScreen('chamber');
        loadChamber(lastChamber);
      });
    }

    if (btnExaminer) {
      btnExaminer.addEventListener('click', () => {
        window.FoldAudio.initContext();
        window.FoldAudio.playKeyClick();
        showScreen('examiner');
      });
    }

    if (btnWorkshop) {
      btnWorkshop.addEventListener('click', () => {
        window.FoldAudio.initContext();
        window.FoldAudio.playKeyClick();
        showScreen('workshop');
      });
    }

    // Navigation Back buttons
    document.querySelectorAll('.btn-back-corridor').forEach(btn => {
      btn.addEventListener('click', () => {
        window.FoldAudio.playKeyClick();
        showScreen('corridor');
      });
    });

    document.querySelectorAll('.btn-back-title').forEach(btn => {
      btn.addEventListener('click', () => {
        window.FoldAudio.playKeyClick();
        showScreen('title');
      });
    });

    // Sound toggle in header
    if (el.soundToggle) {
      el.soundToggle.addEventListener('click', () => {
        const nextState = !window.FoldAudio.isEnabled();
        window.FoldAudio.setEnabled(nextState);
        window.FoldStorage.updateSettings({ soundEnabled: nextState });
        el.soundToggle.textContent = nextState ? 'AUDIO: ON' : 'AUDIO: MUTED';
        el.soundToggle.classList.toggle('muted', !nextState);
      });
    }

    // Settings Modal
    if (el.settingsToggle && el.settingsModal && el.settingsClose) {
      el.settingsToggle.addEventListener('click', () => {
        el.settingsModal.classList.add('active');
      });
      el.settingsClose.addEventListener('click', () => {
        el.settingsModal.classList.remove('active');
      });

      // Reduce motion toggle
      const reduceMotionInput = document.getElementById('setting-reduce-motion');
      if (reduceMotionInput) {
        reduceMotionInput.checked = Boolean(gameState.settings.reduceMotion);
        reduceMotionInput.addEventListener('change', () => {
          const val = reduceMotionInput.checked;
          document.body.classList.toggle('reduce-motion', val);
          window.FoldStorage.updateSettings({ reduceMotion: val });
        });
      }

      // CRT Scanlines toggle
      const crtInput = document.getElementById('setting-crt-scanlines');
      if (crtInput) {
        crtInput.checked = Boolean(gameState.settings.crtScanlines);
        crtInput.addEventListener('change', () => {
          const val = crtInput.checked;
          document.body.classList.toggle('crt-scanlines', val);
          window.FoldStorage.updateSettings({ crtScanlines: val });
        });
      }

      // Reset All Data button
      const resetBtn = document.getElementById('btn-reset-data');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          if (confirm('Reset all Archive exploration progress and stored folds?')) {
            window.FoldStorage.resetAll();
            gameState = window.FoldStorage.load();
            el.settingsModal.classList.remove('active');
            showScreen('title');
            updateCorridorUI();
          }
        });
      }
    }
  }

  function applySettings(settings) {
    if (!settings) return;
    window.FoldAudio.setEnabled(settings.soundEnabled !== false);
    if (el.soundToggle) {
      el.soundToggle.textContent = settings.soundEnabled !== false ? 'AUDIO: ON' : 'AUDIO: MUTED';
      el.soundToggle.classList.toggle('muted', settings.soundEnabled === false);
    }
    document.body.classList.toggle('reduce-motion', Boolean(settings.reduceMotion));
    document.body.classList.toggle('crt-scanlines', settings.crtScanlines !== false);
  }

  function updateCorridorUI() {
    const list = document.getElementById('corridor-chambers-list');
    if (!list || !window.ChambersData) return;

    list.innerHTML = '';
    const unlocked = gameState.unlockedChambers || [1];
    const completed = gameState.completedChambers || [];

    window.ChambersData.forEach(c => {
      const isUnlocked = unlocked.includes(c.id);
      const isCompleted = completed.includes(c.id);

      const card = document.createElement('div');
      card.className = `corridor-chamber-card ${isUnlocked ? 'unlocked' : 'locked'} ${isCompleted ? 'completed' : ''}`;

      card.innerHTML = `
        <div class="card-status-badge">${isCompleted ? 'RESOLVED' : isUnlocked ? 'ACTIVE' : 'LOCKED'}</div>
        <div class="card-code">${c.code}</div>
        <h3 class="card-title">${c.title}</h3>
        <div class="card-topic">${c.topic}</div>
        <div class="card-desc">${isUnlocked ? c.objective : 'Access prohibited by The Warden.'}</div>
      `;

      if (isUnlocked) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
          window.FoldAudio.playKeyClick();
          showScreen('chamber');
          loadChamber(c.id);
        });
      }

      list.appendChild(card);
    });
  }

  function loadChamber(id) {
    currentChamberId = id;
    const chamber = window.ChambersData.find(c => c.id === id);
    if (!chamber) return;

    // Reset runtime state
    activeTrace = null;
    traceStepIndex = 0;
    selectedFoldStates = [];

    // Use redundant machine if available and not yet folded
    const pRecord = gameState.chamberProgress[id] || {};
    if (chamber.redundantMachine && !pRecord.folded) {
      currentMachine = JSON.parse(JSON.stringify(chamber.redundantMachine));
    } else {
      currentMachine = JSON.parse(JSON.stringify(chamber.machine));
    }

    // Update Header
    if (el.chamberCode) el.chamberCode.textContent = chamber.code;
    if (el.chamberTitle) el.chamberTitle.textContent = chamber.title;

    // Intercom Story
    playIntercom(chamber.story.mara, 'MARA');

    // Traces & Lore
    if (el.tracesContainer) {
      el.tracesContainer.innerHTML = '';
      chamber.traces.forEach(t => {
        const item = document.createElement('div');
        item.className = 'trace-item';
        item.textContent = t;
        el.tracesContainer.appendChild(item);
      });
    }

    // Hints
    setupHintsUI(chamber);

    // Keypad update
    updateKeypadAlphabet(currentMachine.alphabet);

    // Clear input & result banner
    if (el.cipherInput) el.cipherInput.value = '';
    if (el.resultBanner) {
      el.resultBanner.className = 'result-banner idle';
      el.resultBanner.innerHTML = '<span>ENTER STRING OVER Σ TO INITIATE SEQUENCE</span>';
    }

    // Step mode reset
    if (el.stepControls) el.stepControls.classList.remove('active');
    if (el.stepModeToggle) el.stepModeToggle.checked = false;

    // Render Automata Diagram
    renderChamberVisualizer([currentMachine.start]);

    // Setup Specific Chamber Mechanics
    updateMechanicsPanels(chamber);
  }

  function renderChamberVisualizer(activeStates = [], activeEdge = null) {
    if (!el.visualizerContainer || !currentMachine || !window.FoldVisualizer) return;
    window.FoldVisualizer.render(el.visualizerContainer, currentMachine, {
      width: 680,
      height: 320,
      activeStates,
      activeEdge,
      selectedStates: selectedFoldStates,
      onStateClick: (stateName) => {
        handleStateSelection(stateName);
      }
    });
  }

  function playIntercom(message, speaker = 'MARA') {
    if (!el.intercomText || !el.intercomAvatar) return;
    window.FoldAudio.playIntercomChirp();
    el.intercomAvatar.textContent = speaker;
    el.intercomAvatar.className = `intercom-badge speaker-${speaker.toLowerCase()}`;
    el.intercomText.textContent = message;
  }

  function setupHintsUI(chamber) {
    if (!el.hintsContainer || !el.revealHintBtn) return;
    el.hintsContainer.innerHTML = '';
    const hints = chamber.hints || [];
    let revealed = gameState.chamberProgress[chamber.id]?.hintsRevealed || 0;

    function renderHints() {
      el.hintsContainer.innerHTML = '';
      for (let i = 0; i < revealed; i++) {
        const h = document.createElement('div');
        h.className = 'hint-box';
        h.innerHTML = `<b>CLUE #${i + 1}:</b> ${hints[i]}`;
        el.hintsContainer.appendChild(h);
      }
      if (el.hintCounter) {
        el.hintCounter.textContent = `${revealed} / ${hints.length} REVEALED`;
      }
      if (el.revealHintBtn) {
        el.revealHintBtn.disabled = revealed >= hints.length;
      }
    }

    el.revealHintBtn.onclick = () => {
      if (revealed < hints.length) {
        revealed++;
        window.FoldAudio.playKeyClick();
        window.FoldStorage.updateChamber(chamber.id, { hintsRevealed: revealed });
        renderHints();
      }
    };

    renderHints();
  }

  function updateKeypadAlphabet(alphabet) {
    const keysContainer = document.getElementById('keypad-symbol-buttons');
    if (!keysContainer) return;

    keysContainer.innerHTML = '';
    alphabet.forEach(sym => {
      const btn = document.createElement('button');
      btn.className = 'keypad-btn';
      btn.textContent = sym;
      btn.addEventListener('click', () => {
        window.FoldAudio.playKeyClick();
        if (el.cipherInput) el.cipherInput.value += sym;
      });
      keysContainer.appendChild(btn);
    });

    // Add Epsilon (ε) button
    const epsBtn = document.createElement('button');
    epsBtn.className = 'keypad-btn eps-btn';
    epsBtn.textContent = 'ε';
    epsBtn.title = 'Empty String';
    epsBtn.addEventListener('click', () => {
      window.FoldAudio.playKeyClick();
      if (el.cipherInput) el.cipherInput.value = 'ε';
    });
    keysContainer.appendChild(epsBtn);
  }

  function setupKeypad() {
    const bspBtn = document.getElementById('btn-keypad-backspace');
    const clrBtn = document.getElementById('btn-keypad-clear');

    if (bspBtn) {
      bspBtn.addEventListener('click', () => {
        window.FoldAudio.playKeyClick();
        if (el.cipherInput) el.cipherInput.value = el.cipherInput.value.slice(0, -1);
      });
    }

    if (clrBtn) {
      clrBtn.addEventListener('click', () => {
        window.FoldAudio.playKeyClick();
        if (el.cipherInput) el.cipherInput.value = '';
      });
    }
  }

  function setupChamberControls() {
    if (el.runBtn) {
      el.runBtn.addEventListener('click', () => {
        executeSimulation();
      });
    }

    if (el.cipherInput) {
      el.cipherInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          executeSimulation();
        }
      });
    }

    // Step Mode Toggle
    if (el.stepModeToggle) {
      el.stepModeToggle.addEventListener('change', () => {
        const isStep = el.stepModeToggle.checked;
        if (el.stepControls) el.stepControls.classList.toggle('active', isStep);
      });
    }

    // Step navigation buttons
    if (el.stepNextBtn) {
      el.stepNextBtn.addEventListener('click', stepForward);
    }
    if (el.stepPrevBtn) {
      el.stepPrevBtn.addEventListener('click', stepBackward);
    }
    if (el.stepResetBtn) {
      el.stepResetBtn.addEventListener('click', resetSimulation);
    }
  }

  function executeSimulation() {
    if (!currentMachine || !window.AutomataEngine || !el.cipherInput) return;
    const rawInput = el.cipherInput.value;
    const isNFA = currentMachine.kind === 'NFA';

    // Compute Trace
    const trace = isNFA
      ? window.AutomataEngine.traceNFA(currentMachine, rawInput)
      : window.AutomataEngine.traceDFA(currentMachine, rawInput);

    if (trace.error) {
      window.FoldAudio.playRejectKlaxon();
      if (el.resultBanner) {
        el.resultBanner.className = 'result-banner rejected';
        el.resultBanner.innerHTML = `<span>⚠ INVALID INPUT: ${trace.error}</span>`;
      }
      return;
    }

    activeTrace = trace;
    traceStepIndex = 0;

    const isStepMode = el.stepModeToggle && el.stepModeToggle.checked;
    if (isStepMode) {
      if (el.stepControls) el.stepControls.classList.add('active');
      renderStepFrame();
    } else {
      // Instant execution: advance through steps smoothly
      runInstantAnimation();
    }
  }

  function runInstantAnimation() {
    if (!activeTrace) return;
    const isNFA = currentMachine.kind === 'NFA';
    let idx = 0;
    const totalSteps = activeTrace.steps.length;

    function step() {
      if (idx >= totalSteps) {
        finalizeSimulationResult();
        return;
      }
      const frame = activeTrace.steps[idx];
      const activeStates = isNFA ? frame.states : [frame.state];
      renderChamberVisualizer(activeStates);

      if (isNFA) {
        window.FoldAudio.playEchoBranch(activeStates.length);
      } else {
        window.FoldAudio.playStatePulse(frame.state, frame.isAccepting);
      }

      idx++;
      setTimeout(step, window.document.body.classList.contains('reduce-motion') ? 100 : 250);
    }

    step();
  }

  function renderStepFrame() {
    if (!activeTrace || !activeTrace.steps[traceStepIndex]) return;
    const frame = activeTrace.steps[traceStepIndex];
    const isNFA = currentMachine.kind === 'NFA';
    const activeStates = isNFA ? frame.states : [frame.state];

    renderChamberVisualizer(activeStates);

    if (el.stepStatus) {
      const sym = frame.symbolConsumed !== null ? `'${frame.symbolConsumed}'` : 'START';
      el.stepStatus.textContent = `STEP ${frame.step} / ${activeTrace.steps.length - 1} (Symbol: ${sym})`;
    }

    if (isNFA) {
      window.FoldAudio.playEchoBranch(activeStates.length);
    } else {
      window.FoldAudio.playStatePulse(frame.state, frame.isAccepting);
    }

    if (traceStepIndex === activeTrace.steps.length - 1) {
      finalizeSimulationResult();
    }
  }

  function stepForward() {
    if (!activeTrace || traceStepIndex >= activeTrace.steps.length - 1) return;
    traceStepIndex++;
    window.FoldAudio.playKeyClick();
    renderStepFrame();
  }

  function stepBackward() {
    if (!activeTrace || traceStepIndex <= 0) return;
    traceStepIndex--;
    window.FoldAudio.playKeyClick();
    renderStepFrame();
  }

  function resetSimulation() {
    if (!activeTrace) return;
    traceStepIndex = 0;
    window.FoldAudio.playKeyClick();
    renderStepFrame();
  }

  function finalizeSimulationResult() {
    if (!activeTrace || !el.resultBanner) return;
    const accepted = activeTrace.accepted;

    if (accepted) {
      window.FoldAudio.playAcceptClearance();
      el.resultBanner.className = 'result-banner accepted';
      el.resultBanner.innerHTML = '<span>SEQUENCE ACCEPTED — CLEARANCE GRANTED</span>';

      // Mark chamber solved in progress
      window.FoldStorage.markChamberComplete(currentChamberId);
      gameState = window.FoldStorage.load();

      // Check if final chamber completed
      if (currentChamberId === 7) {
        setTimeout(() => {
          showScreen('completion');
        }, 1200);
      } else {
        setTimeout(() => {
          showScreen('corridor');
        }, 1500);
      }
    } else {
      window.FoldAudio.playRejectKlaxon();
      el.resultBanner.className = 'result-banner rejected';
      el.resultBanner.innerHTML = '<span>SEQUENCE REJECTED — DESTINATION IS NON-ACCEPTING</span>';
    }
  }

  // --- SPECIAL MECHANICS: THE FOLDING SYSTEM ---
  function updateMechanicsPanels(chamber) {
    if (el.foldPanel) el.foldPanel.classList.toggle('active', Boolean(chamber.redundantMachine));
    if (el.witnessPanel) el.witnessPanel.classList.toggle('active', chamber.id === 4);
    if (el.tablePanel) el.tablePanel.classList.toggle('active', chamber.id === 5);
    if (el.productPanel) el.productPanel.classList.toggle('active', chamber.id === 7);
  }

  function handleStateSelection(stateName) {
    const chamber = window.ChambersData.find(c => c.id === currentChamberId);
    if (!chamber || (!chamber.redundantMachine && chamber.id !== 5)) return;

    window.FoldAudio.playKeyClick();
    if (selectedFoldStates.includes(stateName)) {
      selectedFoldStates = selectedFoldStates.filter(s => s !== stateName);
    } else {
      if (selectedFoldStates.length >= 2) {
        selectedFoldStates.shift();
      }
      selectedFoldStates.push(stateName);
    }

    renderChamberVisualizer([currentMachine.start]);

    const selDisplay = document.getElementById('fold-selected-display');
    if (selDisplay) {
      selDisplay.textContent = selectedFoldStates.length > 0 ? selectedFoldStates.join(' & ') : 'None';
    }
  }

  function setupFoldingUI() {
    const proposeBtn = document.getElementById('btn-propose-fold');
    const testContBtn = document.getElementById('btn-test-continuation');
    const foldFeedback = document.getElementById('fold-feedback-msg');

    if (proposeBtn) {
      proposeBtn.addEventListener('click', () => {
        if (selectedFoldStates.length !== 2) {
          if (foldFeedback) foldFeedback.innerHTML = '<span class="warn">Please click 2 states to propose a fold.</span>';
          return;
        }

        const [s1, s2] = selectedFoldStates;
        const res = window.AutomataEngine.distinguishStates(currentMachine, s1, s2);

        if (res.equivalent) {
          window.FoldAudio.playFoldSuccess();
          if (foldFeedback) {
            foldFeedback.innerHTML = `<span class="succ">EQUIVALENCE VERIFIED: States ${s1} and ${s2} behave identically under all continuations! Folding states...</span>`;
          }

          // Execute the fold: Replace with minimal machine
          setTimeout(() => {
            const chamber = window.ChambersData.find(c => c.id === currentChamberId);
            currentMachine = JSON.parse(JSON.stringify(chamber.machine));
            selectedFoldStates = [];
            window.FoldStorage.updateChamber(currentChamberId, { folded: true });
            gameState = window.FoldStorage.load();
            renderChamberVisualizer([currentMachine.start]);
            if (el.foldPanel) el.foldPanel.classList.remove('active');
            playIntercom("Incredible! You folded the redundant memory states into their canonical core. The circuit is stabilized.", "MARA");
          }, 1400);
        } else {
          window.FoldAudio.playRejectKlaxon();
          if (foldFeedback) {
            foldFeedback.innerHTML = `<span class="err">FOLD REJECTED: ${res.explanation}</span>`;
          }
        }
      });
    }

    if (testContBtn) {
      testContBtn.addEventListener('click', () => {
        if (selectedFoldStates.length !== 2) return;
        const [s1, s2] = selectedFoldStates;
        const testWord = prompt(`Enter a test continuation string over Σ={0,1} to run from both ${s1} and ${s2}:`, '1');
        if (testWord === null) return;

        const d1 = window.AutomataEngine.runDFA({ ...currentMachine, start: s1 }, testWord);
        const d2 = window.AutomataEngine.runDFA({ ...currentMachine, start: s2 }, testWord);

        if (foldFeedback) {
          foldFeedback.innerHTML = `
            <div>From <b>${s1}</b> on '${testWord}' → State <b>${d1.finalState}</b> (${d1.accepted ? 'Accepts' : 'Rejects'})</div>
            <div>From <b>${s2}</b> on '${testWord}' → State <b>${d2.finalState}</b> (${d2.accepted ? 'Accepts' : 'Rejects'})</div>
          `;
        }
      });
    }
  }

  // --- SPECIAL MECHANICS: THE WITNESS SYSTEM (CHAMBER 4) ---
  function setupWitnessUI() {
    const witnessBtn = document.getElementById('btn-find-witness');
    const witnessResult = document.getElementById('witness-result-box');

    if (witnessBtn && witnessResult) {
      witnessBtn.addEventListener('click', () => {
        const chamber = window.ChambersData.find(c => c.id === 4);
        if (!chamber) return;

        window.FoldAudio.playWitnessFound();
        const res = window.AutomataEngine.shortestWitness(chamber.machine, chamber.wardenMachine);

        witnessResult.innerHTML = `
          <div class="witness-highlight">SHORTEST WITNESS STRING: <code>${res.witness}</code></div>
          <div class="witness-desc">${res.explanation}</div>
          <div class="witness-actions">
            <button id="btn-inject-witness" class="cipher-btn small">INJECT '${res.witness}' INTO CONSOLE</button>
          </div>
        `;

        const injectBtn = document.getElementById('btn-inject-witness');
        if (injectBtn) {
          injectBtn.addEventListener('click', () => {
            if (el.cipherInput) el.cipherInput.value = res.witness;
            executeSimulation();
          });
        }

        playIntercom("You found The Witness! String '1101' exposes The Warden's dropped transition. Feed it to the terminal to breach the chamber!", "MARA");
      });
    }
  }

  // --- SPECIAL MECHANICS: TABLE-FILLING ALGORITHM (CHAMBER 5) ---
  function setupTableFillingUI() {
    const fillBtn = document.getElementById('btn-step-table-fill');
    const tableMatrix = document.getElementById('table-matrix-display');
    const tableFeedback = document.getElementById('table-feedback-msg');

    if (fillBtn && tableMatrix) {
      fillBtn.addEventListener('click', () => {
        const chamber = window.ChambersData.find(c => c.id === 5);
        if (!chamber || !chamber.redundantMachine) return;

        window.FoldAudio.playFoldSuccess();
        const tf = window.AutomataEngine.tableFillingAlgorithm(chamber.redundantMachine);

        // Build HTML lower-triangular matrix
        const states = chamber.redundantMachine.states;
        let html = '<table class="tf-matrix"><thead><tr><th></th>';
        for (let i = 0; i < states.length - 1; i++) {
          html += `<th>${states[i]}</th>`;
        }
        html += '</tr></thead><tbody>';

        for (let i = 1; i < states.length; i++) {
          const s1 = states[i];
          html += `<tr><th>${s1}</th>`;
          for (let j = 0; j < i; j++) {
            const s2 = states[j];
            const key = s1 < s2 ? `${s1}::${s2}` : `${s2}::${s1}`;
            const cell = tf.table[key];
            const isMarked = cell && cell.marked;
            const marker = isMarked ? (cell.distinguishedBy || 'X') : '—';
            html += `<td class="tf-cell ${isMarked ? 'marked' : 'unmarked'}">${marker}</td>`;
          }
          html += '</tr>';
        }
        html += '</tbody></table>';

        tableMatrix.innerHTML = html;

        if (tableFeedback) {
          tableFeedback.innerHTML = `
            <div class="succ">TABLE FILLING COMPLETE:</div>
            <div>Unmarked indistinguishable pairs: <b>(A0, B0)</b>, <b>(A1, B1)</b>, <b>(A2, B2)</b>.</div>
            <div>Equivalence partitions the 6 rooms into exactly 3 minimal states: rem0, rem1, rem2.</div>
            <button id="btn-apply-tf-fold" class="cipher-btn small mt-2">MERGE INTO 3-STATE MINIMAL DFA</button>
          `;

          const applyBtn = document.getElementById('btn-apply-tf-fold');
          if (applyBtn) {
            applyBtn.addEventListener('click', () => {
              window.FoldAudio.playFoldSuccess();
              currentMachine = JSON.parse(JSON.stringify(chamber.machine));
              renderChamberVisualizer([currentMachine.start]);
              if (el.tablePanel) el.tablePanel.classList.remove('active');
              playIntercom("The 6-room paradox is resolved! You reduced the redundant pod structure to the canonical 3-state divisibility DFA.", "MARA");
            });
          }
        }
      });
    }
  }

  // --- SPECIAL MECHANICS: THE PRODUCT GATE (CHAMBER 7) ---
  function setupProductGateUI() {
    const gridDisplay = document.getElementById('product-grid-display');
    if (gridDisplay) {
      gridDisplay.innerHTML = `
        <div class="product-grid-header">2D STATE GRID: (Parity of 1s) × (Divisible by 3)</div>
        <div class="product-grid-cells">
          <div class="p-cell acc" id="pcell-E-0">(E, 0) ★ EXIT</div>
          <div class="p-cell" id="pcell-E-1">(E, 1)</div>
          <div class="p-cell" id="pcell-E-2">(E, 2)</div>
          <div class="p-cell" id="pcell-O-0">(O, 0)</div>
          <div class="p-cell" id="pcell-O-1">(O, 1)</div>
          <div class="p-cell" id="pcell-O-2">(O, 2)</div>
        </div>
      `;
    }
  }

})();

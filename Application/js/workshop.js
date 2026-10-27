/**
 * FOLD — Machine Construction Workshop
 * Interactive visual automata editor. Players can create states, toggle initial/final,
 * draw transitions, simulate test strings, and export to JFLAP (.jff XML).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FoldWorkshop = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  let customMachine = {
    kind: 'DFA',
    name: 'Custom_Automaton',
    alphabet: ['0', '1'],
    states: ['q0', 'q1'],
    start: 'q0',
    accepting: ['q1'],
    transitions: {
      q0: { '0': 'q0', '1': 'q1' },
      q1: { '0': 'q0', '1': 'q1' }
    },
    layout: {
      q0: { x: 180, y: 160 },
      q1: { x: 420, y: 160 }
    }
  };

  let selectedState = null;
  let activeTrace = null;

  function init() {
    renderCanvas();
    updateUIControls();

    const addStateBtn = document.getElementById('ws-add-state-btn');
    if (addStateBtn) {
      addStateBtn.addEventListener('click', () => {
        let idx = customMachine.states.length;
        let newName = `q${idx}`;
        while (customMachine.states.includes(newName)) {
          idx++;
          newName = `q${idx}`;
        }
        customMachine.states.push(newName);
        customMachine.transitions[newName] = {};
        for (const sym of customMachine.alphabet) {
          customMachine.transitions[newName][sym] = newName;
        }
        customMachine.layout[newName] = {
          x: 100 + (idx % 5) * 110,
          y: 120 + Math.floor(idx / 5) * 100
        };
        renderCanvas();
        updateUIControls();
      });
    }

    const toggleInitBtn = document.getElementById('ws-toggle-init-btn');
    if (toggleInitBtn) {
      toggleInitBtn.addEventListener('click', () => {
        if (!selectedState) return;
        customMachine.start = selectedState;
        renderCanvas();
        updateUIControls();
      });
    }

    const toggleFinalBtn = document.getElementById('ws-toggle-final-btn');
    if (toggleFinalBtn) {
      toggleFinalBtn.addEventListener('click', () => {
        if (!selectedState) return;
        if (customMachine.accepting.includes(selectedState)) {
          customMachine.accepting = customMachine.accepting.filter(s => s !== selectedState);
        } else {
          customMachine.accepting.push(selectedState);
        }
        renderCanvas();
        updateUIControls();
      });
    }

    const deleteStateBtn = document.getElementById('ws-delete-state-btn');
    if (deleteStateBtn) {
      deleteStateBtn.addEventListener('click', () => {
        if (!selectedState || customMachine.states.length <= 1) return;
        const target = selectedState;
        customMachine.states = customMachine.states.filter(s => s !== target);
        customMachine.accepting = customMachine.accepting.filter(s => s !== target);
        delete customMachine.transitions[target];
        delete customMachine.layout[target];

        if (customMachine.start === target) {
          customMachine.start = customMachine.states[0];
        }

        // Clean references
        for (const s of customMachine.states) {
          for (const sym of customMachine.alphabet) {
            if (customMachine.transitions[s][sym] === target) {
              customMachine.transitions[s][sym] = s;
            }
          }
        }
        selectedState = null;
        renderCanvas();
        updateUIControls();
      });
    }

    // Set Transition Form
    const setTransBtn = document.getElementById('ws-set-trans-btn');
    if (setTransBtn) {
      setTransBtn.addEventListener('click', () => {
        const from = document.getElementById('ws-trans-from').value;
        const sym = document.getElementById('ws-trans-sym').value;
        const to = document.getElementById('ws-trans-to').value;
        if (from && sym && to && customMachine.transitions[from]) {
          customMachine.transitions[from][sym] = to;
          renderCanvas();
        }
      });
    }

    // Test run
    const testBtn = document.getElementById('ws-test-btn');
    const inputField = document.getElementById('ws-test-input');
    if (testBtn && inputField) {
      testBtn.addEventListener('click', () => {
        runTest(inputField.value);
      });
      inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') runTest(inputField.value);
      });
    }

    // Export to JFLAP .jff download
    const exportBtn = document.getElementById('ws-export-jflap-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        if (!window.AutomataEngine) return;
        const xml = window.AutomataEngine.exportToJFLAP(customMachine);
        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${customMachine.name || 'custom_automaton'}.jff`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }
  }

  function renderCanvas() {
    const container = document.getElementById('ws-canvas');
    if (!container || !window.FoldVisualizer) return;

    window.FoldVisualizer.render(container, customMachine, {
      width: 650,
      height: 320,
      interactive: true,
      selectedStates: selectedState ? [selectedState] : [],
      onStateClick: (s) => {
        selectedState = s;
        renderCanvas();
        updateUIControls();
      }
    });
  }

  function updateUIControls() {
    const selLabel = document.getElementById('ws-selected-state-label');
    if (selLabel) {
      selLabel.textContent = selectedState ? `Selected State: ${selectedState}` : 'No state selected (click a node)';
    }

    // Update transition dropdowns
    const fromSelect = document.getElementById('ws-trans-from');
    const toSelect = document.getElementById('ws-trans-to');
    if (fromSelect && toSelect) {
      fromSelect.innerHTML = '';
      toSelect.innerHTML = '';
      customMachine.states.forEach(s => {
        const o1 = document.createElement('option');
        o1.value = s;
        o1.textContent = s;
        fromSelect.appendChild(o1);

        const o2 = document.createElement('option');
        o2.value = s;
        o2.textContent = s;
        toSelect.appendChild(o2);
      });
      if (selectedState) {
        fromSelect.value = selectedState;
      }
    }
  }

  function runTest(rawInput) {
    if (!window.AutomataEngine) return;
    const resEl = document.getElementById('ws-test-result');
    if (!resEl) return;

    const trace = window.AutomataEngine.traceDFA(customMachine, rawInput);
    if (trace.error) {
      resEl.innerHTML = `<span class="err">⚠ ${trace.error}</span>`;
      return;
    }

    const badge = trace.accepted
      ? '<span class="status-badge acc">ACCEPTED</span>'
      : '<span class="status-badge rej">REJECTED</span>';

    resEl.innerHTML = `
      <div>Result: ${badge} | Final State: <b>${trace.finalState}</b></div>
      <div class="ws-trace-text">Path: ${trace.steps.map(s => s.state).join(' → ')}</div>
    `;

    // Highlight final state on canvas
    const container = document.getElementById('ws-canvas');
    if (container && window.FoldVisualizer) {
      window.FoldVisualizer.render(container, customMachine, {
        width: 650,
        height: 320,
        interactive: true,
        activeStates: [trace.finalState],
        selectedStates: selectedState ? [selectedState] : [],
        onStateClick: (s) => {
          selectedState = s;
          renderCanvas();
          updateUIControls();
        }
      });
    }
  }

  return {
    init,
    getMachine: () => customMachine,
    setMachine: (m) => {
      customMachine = JSON.parse(JSON.stringify(m));
      renderCanvas();
      updateUIControls();
    }
  };
});

/**
 * FOLD — Examiner Demonstration Mode
 * Enables immediate faculty inspection of any chamber, formal 5-tuples,
 * full transition tables, custom string traces, and JFLAP reference comparisons.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FoldExaminer = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  let currentChamber = null;
  let onSelectCallback = null;

  function init(chambers, onSelectChamber) {
    onSelectCallback = onSelectChamber;
    const select = document.getElementById('examiner-chamber-select');
    if (!select) return;

    select.innerHTML = '';
    chambers.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `Chamber ${c.id}: ${c.title} (${c.machine.kind})`;
      select.appendChild(opt);
    });

    select.addEventListener('change', () => {
      const id = parseInt(select.value, 10);
      loadChamber(chambers.find(c => c.id === id));
    });

    // Default to Chamber 1
    if (chambers.length > 0) {
      loadChamber(chambers[0]);
    }

    // Attach custom test button
    const testBtn = document.getElementById('examiner-test-btn');
    const inputField = document.getElementById('examiner-input');
    if (testBtn && inputField) {
      testBtn.addEventListener('click', () => {
        runExaminerString(inputField.value);
      });
      inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          runExaminerString(inputField.value);
        }
      });
    }

    // Jump to gameplay button
    const jumpBtn = document.getElementById('examiner-jump-btn');
    if (jumpBtn) {
      jumpBtn.addEventListener('click', () => {
        if (currentChamber && onSelectCallback) {
          onSelectCallback(currentChamber.id);
        }
      });
    }
  }

  function loadChamber(chamber) {
    if (!chamber) return;
    currentChamber = chamber;

    // Title & Topic
    const titleEl = document.getElementById('examiner-title');
    const topicEl = document.getElementById('examiner-topic');
    if (titleEl) titleEl.textContent = `Chamber ${chamber.id}: ${chamber.title}`;
    if (topicEl) topicEl.textContent = chamber.topic;

    // Formal 5-tuple
    const tupleEl = document.getElementById('examiner-tuple');
    if (tupleEl) {
      const m = chamber.machine;
      tupleEl.innerHTML = `
        <div class="tuple-item"><span class="k">Model:</span> <span class="v">${m.kind}</span></div>
        <div class="tuple-item"><span class="k">States Q:</span> <span class="v">{ ${m.states.join(', ')} }</span></div>
        <div class="tuple-item"><span class="k">Alphabet Σ:</span> <span class="v">{ ${m.alphabet.join(', ')} }</span></div>
        <div class="tuple-item"><span class="k">Initial q₀:</span> <span class="v">${m.start}</span></div>
        <div class="tuple-item"><span class="k">Accepting F:</span> <span class="v">{ ${m.accepting.join(', ')} }</span></div>
        <div class="tuple-item"><span class="k">Regex:</span> <span class="v"><code>${m.regex || 'N/A'}</code></span></div>
        <div class="tuple-item"><span class="k">JFLAP File:</span> <span class="v"><code>${m.name}.jff</code></span></div>
      `;
    }

    // Transition Table
    const tableEl = document.getElementById('examiner-table');
    if (tableEl) {
      const m = chamber.machine;
      let html = `<table class="examiner-transition-table"><thead><tr><th>State</th>`;
      m.alphabet.forEach(a => {
        html += `<th>Input '${a}'</th>`;
      });
      html += `</tr></thead><tbody>`;

      m.states.forEach(s => {
        const isStart = s === m.start;
        const isAccept = m.accepting.includes(s);
        const prefix = (isStart ? '→ ' : '') + s + (isAccept ? ' *' : '');
        html += `<tr><td class="state-cell ${isAccept ? 'acc' : ''}">${prefix}</td>`;

        m.alphabet.forEach(a => {
          const dest = m.transitions[s] ? m.transitions[s][a] : '∅';
          let destStr = '∅';
          if (Array.isArray(dest)) {
            destStr = dest.length > 0 ? `{ ${dest.join(', ')} }` : '∅';
          } else if (dest !== undefined) {
            destStr = dest;
          }
          html += `<td>${destStr}</td>`;
        });
        html += `</tr>`;
      });

      html += `</tbody></table>`;
      tableEl.innerHTML = html;
    }

    // Sample list pills
    const sampleListEl = document.getElementById('examiner-samples');
    if (sampleListEl && chamber.samples) {
      let html = '<div class="sample-group"><span class="label">Accepted:</span>';
      chamber.samples.accepted.forEach(w => {
        html += `<button class="sample-pill acc" data-input="${w}">${w === '' ? 'ε' : w}</button>`;
      });
      html += '</div><div class="sample-group"><span class="label">Rejected:</span>';
      chamber.samples.rejected.forEach(w => {
        html += `<button class="sample-pill rej" data-input="${w}">${w === '' ? 'ε' : w}</button>`;
      });
      html += '</div>';
      sampleListEl.innerHTML = html;

      sampleListEl.querySelectorAll('.sample-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          const inp = btn.getAttribute('data-input');
          const inputField = document.getElementById('examiner-input');
          if (inputField) inputField.value = inp;
          runExaminerString(inp);
        });
      });
    }

    // Render visualizer
    const canvas = document.getElementById('examiner-visualizer');
    if (canvas && window.FoldVisualizer) {
      window.FoldVisualizer.render(canvas, chamber.machine, {
        width: 600,
        height: 280,
        activeStates: [chamber.machine.start]
      });
    }

    // Clear previous output
    const out = document.getElementById('examiner-result');
    if (out) out.innerHTML = '<span class="prompt">Select a test string or enter custom symbols above to trace execution.</span>';
  }

  function runExaminerString(rawInput) {
    if (!currentChamber || !window.AutomataEngine) return;
    const m = currentChamber.machine;
    const isNFA = m.kind === 'NFA';
    const trace = isNFA ? window.AutomataEngine.traceNFA(m, rawInput) : window.AutomataEngine.traceDFA(m, rawInput);

    const out = document.getElementById('examiner-result');
    if (!out) return;

    if (trace.error) {
      out.innerHTML = `<div class="examiner-err">⚠ ${trace.error}</div>`;
      return;
    }

    let stepsHtml = '<div class="trace-steps">';
    trace.steps.forEach(st => {
      const stateLabel = isNFA ? `{ ${st.states.join(', ')} }` : st.state;
      const symLabel = st.symbolConsumed !== null ? `Read '${st.symbolConsumed}' → ` : 'Initial: ';
      stepsHtml += `<div class="step-chip"><b>Step ${st.step}:</b> ${symLabel} <span class="state">${stateLabel}</span></div>`;
    });
    stepsHtml += '</div>';

    const statusBadge = trace.accepted
      ? '<span class="status-badge acc">ACCEPTED (In Language L)</span>'
      : '<span class="status-badge rej">REJECTED (Not in L)</span>';

    out.innerHTML = `
      <div class="result-header">
        <span>Evaluated: <code>${rawInput === '' ? 'ε' : rawInput}</code></span>
        ${statusBadge}
      </div>
      ${stepsHtml}
    `;

    // Update diagram with final state
    const canvas = document.getElementById('examiner-visualizer');
    if (canvas && window.FoldVisualizer) {
      const finalStates = isNFA ? trace.finalStates : [trace.finalState];
      window.FoldVisualizer.render(canvas, m, {
        width: 600,
        height: 280,
        activeStates: finalStates
      });
    }
  }

  return {
    init,
    loadChamber
  };
});

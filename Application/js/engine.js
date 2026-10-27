/**
 * FOLD — Automata Engine
 * Pure mathematical library for Deterministic and Nondeterministic Finite Automata.
 * Free of DOM/UI dependencies. Usable in both Node.js and modern browsers.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AutomataEngine = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // --- 1. VALIDATION ---
  function validateAutomaton(machine) {
    if (!machine || typeof machine !== 'object') {
      return { valid: false, error: 'Machine definition must be an object.' };
    }
    const { alphabet, states, start, accepting, transitions, kind } = machine;

    if (!Array.isArray(alphabet) || alphabet.length === 0) {
      return { valid: false, error: 'Alphabet Σ must be a non-empty array of symbols.' };
    }
    for (const sym of alphabet) {
      if (typeof sym !== 'string' || sym.length === 0) {
        return { valid: false, error: `Invalid symbol in alphabet: ${sym}` };
      }
    }

    if (!Array.isArray(states) || states.length === 0) {
      return { valid: false, error: 'State set Q must be a non-empty array of state names.' };
    }
    const stateSet = new Set(states);
    if (stateSet.size !== states.length) {
      return { valid: false, error: 'State set Q contains duplicate state names.' };
    }

    if (!stateSet.has(start)) {
      return { valid: false, error: `Start state '${start}' is not in Q.` };
    }

    if (!Array.isArray(accepting)) {
      return { valid: false, error: 'Accepting states F must be an array.' };
    }
    for (const f of accepting) {
      if (!stateSet.has(f)) {
        return { valid: false, error: `Accepting state '${f}' is not in Q.` };
      }
    }

    if (!transitions || typeof transitions !== 'object') {
      return { valid: false, error: 'Transition function δ must be an object map.' };
    }

    const isNFA = kind === 'NFA';

    for (const s of states) {
      if (!transitions[s] || typeof transitions[s] !== 'object') {
        return { valid: false, error: `Missing transitions for state '${s}'.` };
      }
      for (const a of alphabet) {
        const dest = transitions[s][a];
        if (isNFA) {
          if (dest !== undefined && !Array.isArray(dest)) {
            return { valid: false, error: `NFA transition δ(${s}, ${a}) must be an array of states.` };
          }
          if (Array.isArray(dest)) {
            for (const d of dest) {
              if (!stateSet.has(d)) {
                return { valid: false, error: `Destination state '${d}' in δ(${s}, ${a}) is not in Q.` };
              }
            }
          }
        } else {
          // DFA
          if (dest === undefined || typeof dest !== 'string' || !stateSet.has(dest)) {
            return { valid: false, error: `DFA transition δ(${s}, ${a}) must be a valid state string in Q. Got: ${dest}` };
          }
        }
      }
    }

    return { valid: true };
  }

  // Helper: Normalize input string (handles epsilon aliases)
  function normalizeInput(input) {
    if (input === null || input === undefined) return '';
    const str = String(input).trim();
    if (str === 'ε' || str === 'λ' || str.toLowerCase() === 'epsilon') {
      return '';
    }
    return str;
  }

  // --- 2. RUN DFA ---
  function runDFA(dfa, rawInput) {
    const val = validateAutomaton(dfa);
    if (!val.valid) throw new Error(val.error);

    const input = normalizeInput(rawInput);
    for (const char of input) {
      if (!dfa.alphabet.includes(char)) {
        return { accepted: false, finalState: null, error: `Symbol '${char}' not in alphabet Σ.` };
      }
    }

    let current = dfa.start;
    for (const char of input) {
      current = dfa.transitions[current][char];
    }
    const accepted = dfa.accepting.includes(current);
    return { accepted, finalState: current, error: null };
  }

  // --- 3. TRACE DFA ---
  function traceDFA(dfa, rawInput) {
    const val = validateAutomaton(dfa);
    if (!val.valid) throw new Error(val.error);

    const input = normalizeInput(rawInput);
    for (const char of input) {
      if (!dfa.alphabet.includes(char)) {
        return { steps: [], accepted: false, error: `Symbol '${char}' not in alphabet Σ.` };
      }
    }

    const steps = [];
    let current = dfa.start;
    steps.push({
      step: 0,
      state: current,
      symbolConsumed: null,
      remaining: input,
      isAccepting: dfa.accepting.includes(current)
    });

    for (let i = 0; i < input.length; i++) {
      const sym = input[i];
      const next = dfa.transitions[current][sym];
      const remaining = input.slice(i + 1);
      steps.push({
        step: i + 1,
        state: next,
        symbolConsumed: sym,
        remaining,
        isAccepting: dfa.accepting.includes(next)
      });
      current = next;
    }

    return {
      steps,
      accepted: dfa.accepting.includes(current),
      finalState: current,
      error: null
    };
  }

  // --- 4. EPSILON CLOSURE ---
  function epsilonClosure(nfa, stateSet) {
    const closure = new Set(stateSet);
    const stack = Array.from(stateSet);

    while (stack.length > 0) {
      const state = stack.pop();
      const epsDests = (nfa.transitions[state] && (nfa.transitions[state]['ε'] || nfa.transitions[state]['eps'])) || [];
      for (const dest of epsDests) {
        if (!closure.has(dest)) {
          closure.add(dest);
          stack.push(dest);
        }
      }
    }
    return Array.from(closure).sort();
  }

  // --- 5. RUN NFA ---
  function runNFA(nfa, rawInput) {
    const val = validateAutomaton({ ...nfa, kind: 'NFA' });
    if (!val.valid) throw new Error(val.error);

    const input = normalizeInput(rawInput);
    for (const char of input) {
      if (!nfa.alphabet.includes(char)) {
        return { accepted: false, finalStates: [], error: `Symbol '${char}' not in alphabet Σ.` };
      }
    }

    let currentSet = epsilonClosure(nfa, [nfa.start]);

    for (const char of input) {
      const nextSet = new Set();
      for (const s of currentSet) {
        const dests = (nfa.transitions[s] && nfa.transitions[s][char]) || [];
        for (const d of dests) {
          nextSet.add(d);
        }
      }
      currentSet = epsilonClosure(nfa, Array.from(nextSet));
      if (currentSet.length === 0) break;
    }

    const accepted = currentSet.some(s => nfa.accepting.includes(s));
    return { accepted, finalStates: currentSet, error: null };
  }

  // --- 6. TRACE NFA ---
  function traceNFA(nfa, rawInput) {
    const val = validateAutomaton({ ...nfa, kind: 'NFA' });
    if (!val.valid) throw new Error(val.error);

    const input = normalizeInput(rawInput);
    for (const char of input) {
      if (!nfa.alphabet.includes(char)) {
        return { steps: [], accepted: false, error: `Symbol '${char}' not in alphabet Σ.` };
      }
    }

    const steps = [];
    let currentSet = epsilonClosure(nfa, [nfa.start]);

    steps.push({
      step: 0,
      states: [...currentSet],
      symbolConsumed: null,
      remaining: input,
      hasAccepting: currentSet.some(s => nfa.accepting.includes(s))
    });

    for (let i = 0; i < input.length; i++) {
      const sym = input[i];
      const nextSet = new Set();
      for (const s of currentSet) {
        const dests = (nfa.transitions[s] && nfa.transitions[s][sym]) || [];
        for (const d of dests) {
          nextSet.add(d);
        }
      }
      currentSet = epsilonClosure(nfa, Array.from(nextSet));
      const remaining = input.slice(i + 1);

      steps.push({
        step: i + 1,
        states: [...currentSet],
        symbolConsumed: sym,
        remaining,
        hasAccepting: currentSet.some(s => nfa.accepting.includes(s))
      });
    }

    const accepted = currentSet.some(s => nfa.accepting.includes(s));
    return {
      steps,
      accepted,
      finalStates: currentSet,
      error: null
    };
  }

  // --- 7. SUBSET CONSTRUCTION (NFA -> DFA) ---
  function subsetConstruction(nfa) {
    const val = validateAutomaton({ ...nfa, kind: 'NFA' });
    if (!val.valid) throw new Error(val.error);

    const startClosure = epsilonClosure(nfa, [nfa.start]);
    const startName = startClosure.length > 0 ? '{' + startClosure.join(',') + '}' : '∅';

    const dfaStates = [];
    const dfaTransitions = {};
    const dfaAccepting = [];
    const queue = [startClosure];
    const visited = new Map();
    visited.set(startName, startClosure);

    while (queue.length > 0) {
      const currentSubset = queue.shift();
      const currentName = currentSubset.length > 0 ? '{' + currentSubset.join(',') + '}' : '∅';
      dfaStates.push(currentName);
      dfaTransitions[currentName] = {};

      if (currentSubset.some(s => nfa.accepting.includes(s))) {
        dfaAccepting.push(currentName);
      }

      for (const sym of nfa.alphabet) {
        const nextSet = new Set();
        for (const s of currentSubset) {
          const dests = (nfa.transitions[s] && nfa.transitions[s][sym]) || [];
          for (const d of dests) {
            nextSet.add(d);
          }
        }
        const nextClosure = epsilonClosure(nfa, Array.from(nextSet));
        const nextName = nextClosure.length > 0 ? '{' + nextClosure.join(',') + '}' : '∅';

        dfaTransitions[currentName][sym] = nextName;

        if (!visited.has(nextName)) {
          visited.set(nextName, nextClosure);
          queue.push(nextClosure);
        }
      }
    }

    return {
      kind: 'DFA',
      alphabet: [...nfa.alphabet],
      states: dfaStates,
      start: startName,
      accepting: dfaAccepting,
      transitions: dfaTransitions
    };
  }

  // --- 8. COMPLETE DFA ---
  function completeDFA(dfa, sinkName = 'SINK') {
    let name = sinkName;
    while (dfa.states.includes(name)) {
      name += '_';
    }

    let needsSink = false;
    const newTransitions = JSON.parse(JSON.stringify(dfa.transitions));

    for (const s of dfa.states) {
      for (const sym of dfa.alphabet) {
        if (!newTransitions[s] || newTransitions[s][sym] === undefined) {
          needsSink = true;
          if (!newTransitions[s]) newTransitions[s] = {};
          newTransitions[s][sym] = name;
        }
      }
    }

    if (!needsSink) {
      return JSON.parse(JSON.stringify(dfa));
    }

    const newStates = [...dfa.states, name];
    newTransitions[name] = {};
    for (const sym of dfa.alphabet) {
      newTransitions[name][sym] = name;
    }

    return {
      kind: 'DFA',
      alphabet: [...dfa.alphabet],
      states: newStates,
      start: dfa.start,
      accepting: [...dfa.accepting],
      transitions: newTransitions
    };
  }

  // --- 9. COMPLEMENT DFA ---
  function complementDFA(dfa) {
    const totalDFA = completeDFA(dfa);
    const newAccepting = totalDFA.states.filter(s => !totalDFA.accepting.includes(s));
    return {
      kind: 'DFA',
      alphabet: [...totalDFA.alphabet],
      states: [...totalDFA.states],
      start: totalDFA.start,
      accepting: newAccepting,
      transitions: JSON.parse(JSON.stringify(totalDFA.transitions))
    };
  }

  // --- 10. PRODUCT AUTOMATON ---
  function productAutomaton(dfa1, dfa2, operation = 'intersection') {
    const d1 = completeDFA(dfa1);
    const d2 = completeDFA(dfa2);

    // Common alphabet check
    for (const sym of d1.alphabet) {
      if (!d2.alphabet.includes(sym)) {
        throw new Error(`Alphabets do not match. '${sym}' not in second DFA.`);
      }
    }

    const makePairName = (s1, s2) => `(${s1},${s2})`;
    const startPair = makePairName(d1.start, d2.start);

    const states = [];
    const transitions = {};
    const accepting = [];
    const queue = [[d1.start, d2.start]];
    const visited = new Set([startPair]);

    while (queue.length > 0) {
      const [s1, s2] = queue.shift();
      const pName = makePairName(s1, s2);
      states.push(pName);
      transitions[pName] = {};

      const acc1 = d1.accepting.includes(s1);
      const acc2 = d2.accepting.includes(s2);
      let isAcc = false;

      if (operation === 'intersection') {
        isAcc = acc1 && acc2;
      } else if (operation === 'union') {
        isAcc = acc1 || acc2;
      } else if (operation === 'difference') {
        isAcc = acc1 && !acc2;
      } else if (operation === 'xor') {
        isAcc = (acc1 && !acc2) || (!acc1 && acc2);
      }

      if (isAcc) {
        accepting.push(pName);
      }

      for (const sym of d1.alphabet) {
        const next1 = d1.transitions[s1][sym];
        const next2 = d2.transitions[s2][sym];
        const nextPair = makePairName(next1, next2);
        transitions[pName][sym] = nextPair;

        if (!visited.has(nextPair)) {
          visited.add(nextPair);
          queue.push([next1, next2]);
        }
      }
    }

    return {
      kind: 'DFA',
      alphabet: [...d1.alphabet],
      states,
      start: startPair,
      accepting,
      transitions
    };
  }

  // Helper: reachable states in DFA
  function getReachableStates(dfa) {
    const reachable = new Set([dfa.start]);
    const queue = [dfa.start];

    while (queue.length > 0) {
      const curr = queue.shift();
      for (const sym of dfa.alphabet) {
        const nxt = dfa.transitions[curr] && dfa.transitions[curr][sym];
        if (nxt && !reachable.has(nxt)) {
          reachable.add(nxt);
          queue.push(nxt);
        }
      }
    }
    return Array.from(reachable);
  }

  // --- 11. TABLE-FILLING ALGORITHM (Myhill-Nerode Minimization) ---
  function tableFillingAlgorithm(rawDfa) {
    const dfa = completeDFA(rawDfa);
    const reachable = getReachableStates(dfa).sort();
    const n = reachable.length;

    // Pairs matrix: map key "s1::s2" with s1 < s2
    const pairKey = (a, b) => (a < b ? `${a}::${b}` : `${b}::${a}`);
    const table = {};
    const pairList = [];

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const s1 = reachable[i];
        const s2 = reachable[j];
        const key = pairKey(s1, s2);
        const acc1 = dfa.accepting.includes(s1);
        const acc2 = dfa.accepting.includes(s2);
        const marked = acc1 !== acc2;
        table[key] = {
          s1,
          s2,
          marked,
          distinguishedBy: marked ? 'ε' : null,
          step: marked ? 0 : null
        };
        pairList.push(key);
      }
    }

    let changed = true;
    let currentStep = 1;

    while (changed) {
      changed = false;
      for (const key of pairList) {
        const cell = table[key];
        if (cell.marked) continue;

        for (const sym of dfa.alphabet) {
          const dest1 = dfa.transitions[cell.s1][sym];
          const dest2 = dfa.transitions[cell.s2][sym];
          if (dest1 === dest2) continue;

          const destKey = pairKey(dest1, dest2);
          if (table[destKey] && table[destKey].marked) {
            cell.marked = true;
            cell.distinguishedBy = sym + (table[destKey].distinguishedBy === 'ε' ? '' : table[destKey].distinguishedBy);
            cell.step = currentStep;
            changed = true;
            break;
          }
        }
      }
      currentStep++;
    }

    // Partition into equivalence classes (Union-Find)
    const parent = {};
    reachable.forEach(s => (parent[s] = s));
    function find(i) {
      if (parent[i] === i) return i;
      return (parent[i] = find(parent[i]));
    }
    function union(i, j) {
      const rootI = find(i);
      const rootJ = find(j);
      if (rootI !== rootJ) parent[rootI] = rootJ;
    }

    for (const key of pairList) {
      const cell = table[key];
      if (!cell.marked) {
        union(cell.s1, cell.s2);
      }
    }

    const classMap = {};
    for (const s of reachable) {
      const root = find(s);
      if (!classMap[root]) classMap[root] = [];
      classMap[root].push(s);
    }
    const equivalenceClasses = Object.values(classMap).map(arr => arr.sort());

    return {
      reachableStates: reachable,
      table,
      equivalenceClasses
    };
  }

  // --- 12. MINIMISE DFA ---
  function minimiseDFA(rawDfa) {
    const { reachableStates, equivalenceClasses } = tableFillingAlgorithm(rawDfa);
    const dfa = completeDFA(rawDfa);

    // Map each state to its group identifier
    const stateToGroup = {};
    const groupNames = [];
    let startGroup = '';

    for (const group of equivalenceClasses) {
      const name = group.join('_');
      groupNames.push(name);
      for (const s of group) {
        stateToGroup[s] = name;
        if (s === dfa.start) {
          startGroup = name;
        }
      }
    }

    const minStates = groupNames;
    const minAccepting = [];
    const minTransitions = {};

    for (const g of minStates) {
      minTransitions[g] = {};
    }

    for (const group of equivalenceClasses) {
      const gName = group.join('_');
      const repState = group[0];
      if (dfa.accepting.includes(repState)) {
        minAccepting.push(gName);
      }
      for (const sym of dfa.alphabet) {
        const dest = dfa.transitions[repState][sym];
        minTransitions[gName][sym] = stateToGroup[dest];
      }
    }

    return {
      kind: 'DFA',
      alphabet: [...dfa.alphabet],
      states: minStates,
      start: startGroup,
      accepting: minAccepting,
      transitions: minTransitions
    };
  }

  // --- 13. DISTINGUISH STATES (Find shortest string distinguishing 2 states) ---
  function distinguishStates(rawDfa, state1, state2) {
    const dfa = completeDFA(rawDfa);
    if (!dfa.states.includes(state1) || !dfa.states.includes(state2)) {
      throw new Error(`State '${state1}' or '${state2}' not in DFA.`);
    }
    if (state1 === state2) {
      return { equivalent: true, witness: null };
    }

    // BFS over state pairs
    const visited = new Set();
    const queue = [{ s1: state1, s2: state2, word: '' }];
    visited.add(`${state1}::${state2}`);
    visited.add(`${state2}::${state1}`);

    while (queue.length > 0) {
      const { s1, s2, word } = queue.shift();
      const acc1 = dfa.accepting.includes(s1);
      const acc2 = dfa.accepting.includes(s2);

      if (acc1 !== acc2) {
        return {
          equivalent: false,
          witness: word,
          result1: acc1,
          result2: acc2,
          explanation: `Word '${word || 'ε'}' leads state '${state1}' to ${acc1 ? 'accepting' : 'rejecting'} state '${s1}' but leads state '${state2}' to ${acc2 ? 'accepting' : 'rejecting'} state '${s2}'.`
        };
      }

      for (const sym of dfa.alphabet) {
        const nxt1 = dfa.transitions[s1][sym];
        const nxt2 = dfa.transitions[s2][sym];
        const key = `${nxt1}::${nxt2}`;
        if (!visited.has(key)) {
          visited.add(key);
          visited.add(`${nxt2}::${nxt1}`);
          queue.push({ s1: nxt1, s2: nxt2, word: word + sym });
        }
      }
    }

    return { equivalent: true, witness: null };
  }

  // --- 14. SHORTEST WITNESS (Between two automata) ---
  function shortestWitness(mach1, mach2) {
    const dfa1 = mach1.kind === 'NFA' ? subsetConstruction(mach1) : mach1;
    const dfa2 = mach2.kind === 'NFA' ? subsetConstruction(mach2) : mach2;

    const d1 = completeDFA(dfa1);
    const d2 = completeDFA(dfa2);

    // BFS over product space (d1.start, d2.start)
    const visited = new Set();
    const startKey = `${d1.start}::${d2.start}`;
    const queue = [{ s1: d1.start, s2: d2.start, word: '' }];
    visited.add(startKey);

    while (queue.length > 0) {
      const { s1, s2, word } = queue.shift();
      const acc1 = d1.accepting.includes(s1);
      const acc2 = d2.accepting.includes(s2);

      if (acc1 !== acc2) {
        return {
          found: true,
          witness: word,
          result1: acc1,
          result2: acc2,
          explanation: `The string '${word || 'ε'}' distinguishes the two machines: Machine 1 ${acc1 ? 'accepts' : 'rejects'} it (ends in '${s1}'), while Machine 2 ${acc2 ? 'accepts' : 'rejects'} it (ends in '${s2}').`
        };
      }

      for (const sym of d1.alphabet) {
        const nxt1 = d1.transitions[s1][sym];
        const nxt2 = d2.transitions[s2][sym];
        const key = `${nxt1}::${nxt2}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({ s1: nxt1, s2: nxt2, word: word + sym });
        }
      }
    }

    return {
      found: false,
      witness: null,
      explanation: 'Both machines recognize exactly the same language.'
    };
  }

  // --- 15. COMPARE LANGUAGES (Equivalence Check) ---
  function compareLanguages(mach1, mach2) {
    const witnessResult = shortestWitness(mach1, mach2);
    return {
      equivalent: !witnessResult.found,
      witness: witnessResult.witness,
      explanation: witnessResult.explanation
    };
  }

  // --- 16. EXPORT TO JFLAP (.jff XML) ---
  function exportToJFLAP(machine, options = {}) {
    const isNFA = machine.kind === 'NFA';
    const stateIds = {};
    machine.states.forEach((s, idx) => {
      stateIds[s] = idx;
    });

    const defaultCoords = {};
    const n = machine.states.length;
    const radius = 160;
    const centerX = 280;
    const centerY = 200;

    machine.states.forEach((s, idx) => {
      const angle = (2 * Math.PI * idx) / n;
      defaultCoords[s] = {
        x: Math.round(centerX + radius * Math.cos(angle)),
        y: Math.round(centerY + radius * Math.sin(angle))
      };
    });

    const coords = (options && options.coords) || defaultCoords;

    let xml = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n';
    xml += '<structure>\n';
    xml += '  <type>fa</type>\n';
    xml += '  <automaton>\n';

    // States
    for (const s of machine.states) {
      const id = stateIds[s];
      const pos = coords[s] || { x: 100 + id * 80, y: 150 };
      xml += `    <state id="${id}" name="${s}">\n`;
      xml += `      <x>${pos.x}</x>\n`;
      xml += `      <y>${pos.y}</y>\n`;
      if (s === machine.start) {
        xml += '      <initial />\n';
      }
      if (machine.accepting.includes(s)) {
        xml += '      <final />\n';
      }
      xml += '    </state>\n';
    }

    // Transitions
    for (const s of machine.states) {
      const srcId = stateIds[s];
      const trans = machine.transitions[s] || {};
      for (const sym of Object.keys(trans)) {
        const dest = trans[sym];
        const destList = Array.isArray(dest) ? dest : [dest];
        for (const d of destList) {
          if (d !== undefined && stateIds[d] !== undefined) {
            const destId = stateIds[d];
            const readSym = sym === 'ε' || sym === 'eps' ? '' : sym;
            xml += '    <transition>\n';
            xml += `      <from>${srcId}</from>\n`;
            xml += `      <to>${destId}</to>\n`;
            xml += `      <read>${readSym}</read>\n`;
            xml += '    </transition>\n';
          }
        }
      }
    }

    xml += '  </automaton>\n';
    xml += '</structure>\n';
    return xml;
  }

  return {
    validateAutomaton,
    normalizeInput,
    runDFA,
    traceDFA,
    epsilonClosure,
    runNFA,
    traceNFA,
    subsetConstruction,
    completeDFA,
    complementDFA,
    productAutomaton,
    tableFillingAlgorithm,
    minimiseDFA,
    distinguishStates,
    shortestWitness,
    compareLanguages,
    exportToJFLAP
  };
});

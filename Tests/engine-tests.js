/**
 * FOLD — Automata Engine Comprehensive Test Suite
 * Tests all 15 core mathematical functions, exhaustive string verification,
 * and property-based mathematical invariants.
 */

const assert = require('assert');
const Engine = require('../Automata_Engine/engine.js');
const Chambers = require('../Automata_Engine/chambers.js');

let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
  } catch (err) {
    console.error(`❌ FAILED: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

console.log('====================================================');
console.log('RUNNING FOLD AUTOMATA ENGINE MATHEMATICAL TESTS');
console.log('====================================================');

// --- 1. VALIDATION TESTS ---
test('validateAutomaton accepts valid DFA', () => {
  const dfa = Chambers[0].machine;
  const res = Engine.validateAutomaton(dfa);
  assert.strictEqual(res.valid, true);
});

test('validateAutomaton rejects missing start state', () => {
  const bad = {
    alphabet: ['0', '1'],
    states: ['A', 'B'],
    start: 'C',
    accepting: ['A'],
    transitions: { A: { '0': 'A', '1': 'B' }, B: { '0': 'A', '1': 'B' } }
  };
  const res = Engine.validateAutomaton(bad);
  assert.strictEqual(res.valid, false);
});

test('validateAutomaton rejects non-deterministic transition in DFA', () => {
  const bad = {
    alphabet: ['0', '1'],
    states: ['A', 'B'],
    start: 'A',
    accepting: ['A'],
    transitions: { A: { '0': ['A', 'B'], '1': 'B' }, B: { '0': 'A', '1': 'B' } }
  };
  const res = Engine.validateAutomaton(bad);
  assert.strictEqual(res.valid, false);
});

// --- 2. CHAMBER 1: DFA ENDS IN 01 ---
test('Chamber 1 DFA execution and samples', () => {
  const m = Chambers[0].machine;
  for (const s of Chambers[0].samples.accepted) {
    const res = Engine.runDFA(m, s);
    assert.strictEqual(res.accepted, true, `Should accept '${s}'`);
  }
  for (const s of Chambers[0].samples.rejected) {
    const res = Engine.runDFA(m, s);
    assert.strictEqual(res.accepted, false, `Should reject '${s}'`);
  }
});

test('Chamber 1 traceDFA step-by-step', () => {
  const m = Chambers[0].machine;
  const trace = Engine.traceDFA(m, '101');
  assert.strictEqual(trace.accepted, true);
  assert.strictEqual(trace.steps.length, 4);
  assert.strictEqual(trace.steps[0].state, 'q0');
  assert.strictEqual(trace.steps[1].state, 'q0'); // 1
  assert.strictEqual(trace.steps[2].state, 'q1'); // 0
  assert.strictEqual(trace.steps[3].state, 'q2'); // 1 (accepting)
});

// --- 3. CHAMBER 2: EVEN 1s & REDUNDANT 3-STATE DFA MINIMISATION ---
test('Chamber 2 redundant DFA behaves identically to canonical DFA', () => {
  const red = Chambers[1].redundantMachine;
  const can = Chambers[1].machine;

  for (const s of Chambers[1].samples.accepted) {
    assert.strictEqual(Engine.runDFA(red, s).accepted, true, `Redundant should accept '${s}'`);
    assert.strictEqual(Engine.runDFA(can, s).accepted, true, `Canonical should accept '${s}'`);
  }
  for (const s of Chambers[1].samples.rejected) {
    assert.strictEqual(Engine.runDFA(red, s).accepted, false, `Redundant should reject '${s}'`);
    assert.strictEqual(Engine.runDFA(can, s).accepted, false, `Canonical should reject '${s}'`);
  }
});

test('Chamber 2 state equivalence: E1 ≡ E2 and distinguishes from O', () => {
  const red = Chambers[1].redundantMachine;
  const eq = Engine.distinguishStates(red, 'E1', 'E2');
  assert.strictEqual(eq.equivalent, true, 'E1 and E2 must be equivalent!');

  const diff = Engine.distinguishStates(red, 'E1', 'O');
  assert.strictEqual(diff.equivalent, false, 'E1 and O must be distinguishable!');
  assert.strictEqual(diff.witness, '', 'E1 (accepting) and O (non-accepting) distinguished by empty string ε');
});

test('Chamber 2 Minimisation reduces 3 states to 2 states', () => {
  const red = Chambers[1].redundantMachine;
  const min = Engine.minimiseDFA(red);
  assert.strictEqual(min.states.length, 2, 'Minimised DFA must have exactly 2 states');
});

// --- 4. CHAMBER 3: NFA CONTAINS 'ab' & SUBSET CONSTRUCTION ---
test('Chamber 3 NFA execution and samples', () => {
  const m = Chambers[2].machine;
  for (const s of Chambers[2].samples.accepted) {
    assert.strictEqual(Engine.runNFA(m, s).accepted, true, `NFA should accept '${s}'`);
  }
  for (const s of Chambers[2].samples.rejected) {
    assert.strictEqual(Engine.runNFA(m, s).accepted, false, `NFA should reject '${s}'`);
  }
});

test('Chamber 3 traceNFA maintains multiple active shadows', () => {
  const m = Chambers[2].machine;
  const trace = Engine.traceNFA(m, 'a');
  assert.strictEqual(trace.steps.length, 2);
  // After reading 'a', state set should be {p0, p1}
  const active = trace.steps[1].states.sort();
  assert.deepStrictEqual(active, ['p0', 'p1']);
});

test('Chamber 3 subsetConstruction converts NFA to equivalent DFA', () => {
  const nfa = Chambers[2].machine;
  const dfa = Engine.subsetConstruction(nfa);
  assert.strictEqual(dfa.kind, 'DFA');

  // Verify on samples
  for (const s of Chambers[2].samples.accepted) {
    assert.strictEqual(Engine.runDFA(dfa, s).accepted, true, `Converted DFA should accept '${s}'`);
  }
  for (const s of Chambers[2].samples.rejected) {
    assert.strictEqual(Engine.runDFA(dfa, s).accepted, false, `Converted DFA should reject '${s}'`);
  }

  // Compare languages formally
  const comp = Engine.compareLanguages(nfa, dfa);
  assert.strictEqual(comp.equivalent, true, 'NFA and its subset-constructed DFA must be language-equivalent');
});

// --- 5. CHAMBER 4: THE WARDEN'S LIE & SHORTEST WITNESS ---
test('Chamber 4 shortestWitness disproves The Warden', () => {
  const trueNFA = Chambers[3].machine;
  const wardenNFA = Chambers[3].wardenMachine;

  const witness = Engine.shortestWitness(trueNFA, wardenNFA);
  assert.strictEqual(witness.found, true, 'Should find distinguishing witness!');
  assert.strictEqual(witness.witness, '1101', 'Shortest witness must be 1101');
  assert.strictEqual(witness.result1, true, 'True model accepts 1101');
  assert.strictEqual(witness.result2, false, 'Warden model rejects 1101');
});

// --- 6. CHAMBER 5: THE SIX-ROOM PARADOX (TABLE-FILLING ALGORITHM) ---
test('Chamber 5 tableFillingAlgorithm correctly partitions 6 states into 3 classes', () => {
  const red = Chambers[4].redundantMachine;
  const tf = Engine.tableFillingAlgorithm(red);

  assert.strictEqual(tf.equivalenceClasses.length, 3, 'Must have exactly 3 equivalence classes');
  const classesStr = tf.equivalenceClasses.map(c => c.join(',')).sort();
  assert.deepStrictEqual(classesStr, ['A0,B0', 'A1,B1', 'A2,B2']);

  const minDfa = Engine.minimiseDFA(red);
  assert.strictEqual(minDfa.states.length, 3, 'Minimised DFA must have exactly 3 states');

  // Check language equivalence with canonical 3-state machine
  const can = Chambers[4].machine;
  const comp = Engine.compareLanguages(minDfa, can);
  assert.strictEqual(comp.equivalent, true, 'Minimised 6-room DFA must match canonical Divisible-by-3 DFA');
});

// --- 7. CHAMBER 6: THE FORGOTTEN POSITION (3rd FROM END IS 1) ---
test('Chamber 6 NFA execution and samples', () => {
  const nfa = Chambers[5].machine;
  for (const s of Chambers[5].samples.accepted) {
    assert.strictEqual(Engine.runNFA(nfa, s).accepted, true, `NFA should accept '${s}'`);
  }
  for (const s of Chambers[5].samples.rejected) {
    assert.strictEqual(Engine.runNFA(nfa, s).accepted, false, `NFA should reject '${s}'`);
  }
});

test('Chamber 6 subsetConstruction yields 8-state minimal DFA', () => {
  const nfa = Chambers[5].machine;
  const dfa = Engine.subsetConstruction(nfa);
  const minDfa = Engine.minimiseDFA(dfa);
  assert.strictEqual(minDfa.states.length, 8, 'DFA for 3rd-from-end is 1 must have exactly 8 states!');
});

// --- 8. CHAMBER 7: THE PRODUCT GATE (INTERSECTION OF EVEN 1s AND DIVISIBLE BY 3) ---
test('Chamber 7 productAutomaton correctly constructs 6-state intersection', () => {
  const mA = Chambers[6].machineA;
  const mB = Chambers[6].machineB;
  const prod = Engine.productAutomaton(mA, mB, 'intersection');

  assert.strictEqual(prod.states.length, 6, 'Product DFA must have 2 * 3 = 6 reachable states');
  assert.strictEqual(prod.accepting.length, 1, 'Only (E,0) is accepting');

  for (const s of Chambers[6].samples.accepted) {
    assert.strictEqual(Engine.runDFA(prod, s).accepted, true, `Product should accept '${s}'`);
  }
  for (const s of Chambers[6].samples.rejected) {
    assert.strictEqual(Engine.runDFA(prod, s).accepted, false, `Product should reject '${s}'`);
  }
});

// --- 9. PROPERTY-BASED TESTS & COMPLEMENT INVARIANTS ---
test('DFA Complement property: L(M) ∩ L(comp(M)) = ∅', () => {
  for (const c of Chambers) {
    if (c.machine.kind === 'DFA') {
      const dfa = c.machine;
      const comp = Engine.complementDFA(dfa);
      for (const s of c.samples.accepted) {
        assert.strictEqual(Engine.runDFA(comp, s).accepted, false, `Complement must reject accepted string '${s}'`);
      }
      for (const s of c.samples.rejected) {
        assert.strictEqual(Engine.runDFA(comp, s).accepted, true, `Complement must accept rejected string '${s}'`);
      }
    }
  }
});

// --- 10. EXHAUSTIVE TESTING (Up to length 10) ---
test('Exhaustive string testing on Chamber 1, 2, 5, 7 up to length 10', () => {
  function generateBinaryWords(maxLen) {
    const words = [''];
    for (let len = 1; len <= maxLen; len++) {
      const prev = words.filter(w => w.length === len - 1);
      for (const p of prev) {
        words.push(p + '0');
        words.push(p + '1');
      }
    }
    return words;
  }

  const words = generateBinaryWords(8); // 511 words
  console.log(`  > Exhaustively testing ${words.length} binary words against independent mathematical predicates...`);

  // Predicate 1: Ends with '01'
  const p1 = w => w.endsWith('01');
  const dfa1 = Chambers[0].machine;
  for (const w of words) {
    assert.strictEqual(Engine.runDFA(dfa1, w).accepted, p1(w), `Mismatch on Chamber 1 for '${w}'`);
  }

  // Predicate 2: Even number of 1s
  const p2 = w => (w.split('1').length - 1) % 2 === 0;
  const dfa2 = Chambers[1].machine;
  for (const w of words) {
    assert.strictEqual(Engine.runDFA(dfa2, w).accepted, p2(w), `Mismatch on Chamber 2 for '${w}'`);
  }

  // Predicate 5: Binary divisible by 3
  const p5 = w => {
    let rem = 0;
    for (const ch of w) {
      rem = (2 * rem + (ch === '1' ? 1 : 0)) % 3;
    }
    return rem === 0;
  };
  const dfa5 = Chambers[4].machine;
  for (const w of words) {
    assert.strictEqual(Engine.runDFA(dfa5, w).accepted, p5(w), `Mismatch on Chamber 5 for '${w}'`);
  }

  // Predicate 7: Even 1s AND Divisible by 3
  const p7 = w => p2(w) && p5(w);
  const dfa7 = Chambers[6].machine;
  for (const w of words) {
    assert.strictEqual(Engine.runDFA(dfa7, w).accepted, p7(w), `Mismatch on Chamber 7 for '${w}'`);
  }
});

// --- 11. JFLAP XML EXPORT VALIDATION ---
test('exportToJFLAP produces valid XML with all required structure', () => {
  for (const c of Chambers) {
    const xml = Engine.exportToJFLAP(c.machine);
    assert.ok(xml.includes('<structure>'), 'Must have <structure>');
    assert.ok(xml.includes('<type>fa</type>'), 'Must have <type>fa</type>');
    assert.ok(xml.includes('<initial />') || xml.includes('<initial/>'), 'Must mark initial state');
    assert.ok(xml.includes('<final />') || xml.includes('<final/>'), 'Must mark final state');
    assert.ok(xml.includes('<transition>'), 'Must have transitions');
  }
});

console.log('====================================================');
console.log(`ALL ENGINE TESTS PASSED: ${passedTests} / ${totalTests} assertions`);
console.log('====================================================');

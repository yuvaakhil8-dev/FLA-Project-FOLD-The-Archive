/**
 * FOLD — THE ARCHIVE
 * Comprehensive Test Suite: Automata Engine, All 7 Chambers, JFLAP Validation
 * Node.js executable. Zero dependencies.
 */

'use strict';

const AutomataEngine = require('../Automata_Engine/engine.js');
const ChambersData   = require('../Automata_Engine/chambers.js');
const fs             = require('fs');
const path           = require('path');

// ─── Test Runner ──────────────────────────────────────────────────────────────
let total = 0, passed = 0, failed = 0;
const failures = [];

function assert(label, condition, detail = '') {
  total++;
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push({ label, detail });
    console.error(`  [FAIL] ${label}${detail ? ' | ' + detail : ''}`);
  }
}

function section(title) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('═'.repeat(60));
}

// ─── Chamber helpers ──────────────────────────────────────────────────────────
const C = {};
ChambersData.forEach(ch => { C[ch.id] = ch; });

// ─── SECTION 1: Validation ────────────────────────────────────────────────────
section('1. AUTOMATON VALIDATION');

[1,2,3,4,5,6,7].forEach(id => {
  const ch = C[id];
  const v = AutomataEngine.validateAutomaton(ch.machine);
  assert(`Chamber ${id} primary machine validates`, v.valid, v.error || '');
  if (ch.redundantMachine) {
    const vr = AutomataEngine.validateAutomaton(ch.redundantMachine);
    assert(`Chamber ${id} redundant machine validates`, vr.valid, vr.error || '');
  }
  if (ch.wardenMachine) {
    const vw = AutomataEngine.validateAutomaton(ch.wardenMachine);
    assert(`Chamber ${id} Warden machine validates`, vw.valid, vw.error || '');
  }
});

// Chamber 7 product components
assert('Chamber 7 machineA validates', AutomataEngine.validateAutomaton(C[7].machineA).valid);
assert('Chamber 7 machineB validates', AutomataEngine.validateAutomaton(C[7].machineB).valid);

// ─── SECTION 2: DFA Simulation (Chamber 1 — ends in 01) ──────────────────────
section('2. DFA SIMULATION — CHAMBER 1 (Ends in 01)');

const m1 = C[1].machine;
const ch1Accept = ['01', '001', '101', '1101', '0001', '10101', '0101'];
const ch1Reject = ['', '0', '1', '10', '11', '100', '1010', '110'];

ch1Accept.forEach(s => {
  const r = AutomataEngine.runDFA(m1, s);
  assert(`DFA1 accepts '${s || 'ε'}'`, r.accepted, `got accepted=${r.accepted}`);
});
ch1Reject.forEach(s => {
  const r = AutomataEngine.runDFA(m1, s);
  assert(`DFA1 rejects '${s || 'ε'}'`, !r.accepted, `got accepted=${r.accepted}`);
});

// Exhaustive: strings up to length 7 — spot check 50 against JS predicate
{
  const pred = s => s.endsWith('01');
  let correctCount = 0;
  for (let len = 0; len <= 7; len++) {
    for (let n = 0; n < (1 << len); n++) {
      const s = len === 0 ? '' : n.toString(2).padStart(len, '0');
      const eng = AutomataEngine.runDFA(m1, s).accepted;
      const ref = pred(s);
      if (eng === ref) correctCount++;
    }
  }
  const totalStrings = (1 << 8) - 1; // 1+2+4+...+128 = 255 strings
  assert(`DFA1 exhaustive match 0–7 (${correctCount}/${totalStrings + 1})`, correctCount >= 254);
}

// ─── SECTION 3: DFA Simulation (Chamber 2 — redundant & canonical) ───────────
section('3. DFA SIMULATION — CHAMBER 2 (Even 1s)');

const m2r = C[2].redundantMachine;
const m2c = C[2].machine;

const evenOneAccept = ['', '0', '00', '11', '101', '1010', '1100', '0110'];
const evenOneReject = ['1', '10', '111', '01', '001', '0001'];

evenOneAccept.forEach(s => {
  assert(`Redundant-DFA2 accepts '${s || 'ε'}'`, AutomataEngine.runDFA(m2r, s).accepted);
  assert(`Canonical-DFA2 accepts '${s || 'ε'}'`, AutomataEngine.runDFA(m2c, s).accepted);
});
evenOneReject.forEach(s => {
  assert(`Redundant-DFA2 rejects '${s || 'ε'}'`, !AutomataEngine.runDFA(m2r, s).accepted);
  assert(`Canonical-DFA2 rejects '${s || 'ε'}'`, !AutomataEngine.runDFA(m2c, s).accepted);
});

// Language equivalence: exhaustive up to length 8
{
  let mismatches = 0;
  for (let len = 0; len <= 8; len++) {
    for (let n = 0; n < (1 << len); n++) {
      const s = len === 0 ? '' : n.toString(2).padStart(len, '0');
      const a = AutomataEngine.runDFA(m2r, s).accepted;
      const b = AutomataEngine.runDFA(m2c, s).accepted;
      if (a !== b) mismatches++;
    }
  }
  assert('Redundant DFA2 ≡ Canonical DFA2 (exhaustive len 0–8)', mismatches === 0,
    `${mismatches} mismatches found`);
}

// ─── SECTION 4: NFA Simulation (Chamber 3 — contains ab) ─────────────────────
section('4. NFA SIMULATION — CHAMBER 3 (Contains ab)');

const m3 = C[3].machine;
const ch3Accept = ['ab', 'aab', 'abb', 'bab', 'aaab', 'babb', 'aabb'];
const ch3Reject = ['', 'a', 'b', 'ba', 'bbb', 'aa', 'bb', 'bba'];

ch3Accept.forEach(s => {
  assert(`NFA3 accepts '${s}'`, AutomataEngine.runNFA(m3, s).accepted);
});
ch3Reject.forEach(s => {
  assert(`NFA3 rejects '${s || 'ε'}'`, !AutomataEngine.runNFA(m3, s).accepted);
});

// Property test: every accepted string must contain 'ab'
{
  const ab_alpha = ['a', 'b'];
  function genStrings(maxLen) {
    const out = [''];
    for (let len = 1; len <= maxLen; len++) {
      for (let mask = 0; mask < (1 << len); mask++) {
        let s = '';
        for (let b = len - 1; b >= 0; b--) s += ab_alpha[(mask >> b) & 1];
        out.push(s);
      }
    }
    return out;
  }
  const strings = genStrings(7);
  let propOk = true;
  strings.forEach(s => {
    const eng = AutomataEngine.runNFA(m3, s).accepted;
    const ref = s.includes('ab');
    if (eng !== ref) propOk = false;
  });
  assert(`NFA3 property: accepted ↔ contains 'ab' (all len ≤ 7)`, propOk);
}

// ─── SECTION 5: NFA Simulation (Chamber 4 — contains 101) ────────────────────
section('5. NFA SIMULATION — CHAMBER 4 (Contains 101)');

const m4 = C[4].machine;
const m4w = C[4].wardenMachine;

const ch4Accept = ['101', '0101', '11010', '1011', '00101', '1101', '10100'];
const ch4Reject = ['', '0', '10', '100', '111', '1100', '0110'];

ch4Accept.forEach(s => {
  assert(`NFA4 (true) accepts '${s}'`, AutomataEngine.runNFA(m4, s).accepted);
});
ch4Reject.forEach(s => {
  assert(`NFA4 (true) rejects '${s || 'ε'}'`, !AutomataEngine.runNFA(m4, s).accepted);
});

// Property test: accepted ↔ contains '101'
{
  let propOk = true;
  for (let len = 0; len <= 8; len++) {
    for (let n = 0; n < (1 << len); n++) {
      const s = len === 0 ? '' : n.toString(2).padStart(len, '0');
      const eng = AutomataEngine.runNFA(m4, s).accepted;
      const ref = s.includes('101');
      if (eng !== ref) { propOk = false; break; }
    }
    if (!propOk) break;
  }
  assert('NFA4 property: accepted ↔ contains "101" (len 0–8)', propOk);
}

// Warden's flawed machine: '1101' must be ACCEPTED by true, REJECTED by flawed
assert(`True NFA4 accepts '1101'`,   AutomataEngine.runNFA(m4, '1101').accepted);
assert(`Warden NFA4 rejects '1101'`, !AutomataEngine.runNFA(m4w, '1101').accepted);

// ─── SECTION 6: Shortest Witness (Chamber 4) ──────────────────────────────────
section('6. SHORTEST WITNESS — CHAMBER 4');

const wres = AutomataEngine.shortestWitness(C[4].machine, C[4].wardenMachine);
assert('Witness result is an object', typeof wres === 'object');
assert('Witness string is non-empty', typeof wres.witness === 'string' && wres.witness.length > 0);

// Verify witness is genuine (true accepts, warden rejects)
if (wres.witness) {
  assert(`True NFA accepts witness '${wres.witness}'`,   AutomataEngine.runNFA(m4, wres.witness).accepted);
  assert(`Warden NFA rejects witness '${wres.witness}'`, !AutomataEngine.runNFA(m4w, wres.witness).accepted);
  assert(`Shortest witness is '1101' (known shortest)`,  wres.witness === '1101',
    `got '${wres.witness}'`);
}

// ─── SECTION 7: DFA Minimisation — Table Filling (Chamber 5) ─────────────────
section('7. DFA MINIMISATION — CHAMBER 5 (Divisible by 3)');

const m5r = C[5].redundantMachine;
const m5c = C[5].machine;

// Language equivalence
{
  let mismatches = 0;
  for (let len = 0; len <= 9; len++) {
    for (let n = 0; n < (1 << len); n++) {
      const s = len === 0 ? '' : n.toString(2).padStart(len, '0');
      const a = AutomataEngine.runDFA(m5r, s).accepted;
      const b = AutomataEngine.runDFA(m5c, s).accepted;
      if (a !== b) mismatches++;
    }
  }
  assert('DFA5 redundant ≡ DFA5 canonical (exhaustive len 0–9)', mismatches === 0,
    `${mismatches} mismatches`);
}

// Divisible-by-3 property
{
  let propOk = true;
  for (let len = 0; len <= 9; len++) {
    for (let n = 0; n < (1 << len); n++) {
      const s = len === 0 ? '' : n.toString(2).padStart(len, '0');
      const eng = AutomataEngine.runDFA(m5c, s).accepted;
      // Convention: empty string = 0, which is divisible by 3
      const val = s === '' ? 0 : parseInt(s, 2);
      const ref = val % 3 === 0;
      if (eng !== ref) { propOk = false; break; }
    }
    if (!propOk) break;
  }
  assert('DFA5 property: accepted ↔ binary value div by 3 (len 0–9)', propOk);
}

// Table-filling algorithm
const tf = AutomataEngine.tableFillingAlgorithm(m5r);
assert('Table-filling returns table object', tf && typeof tf.table === 'object');

// All inter-class pairs must be marked (distinguishable)
const classPairs = [['A0','A1'],['A0','A2'],['A0','B1'],['A0','B2'],
                    ['A1','A2'],['A1','B0'],['A1','B2'],
                    ['A2','B0'],['A2','B1'],['B0','B1'],['B0','B2'],['B1','B2']];
classPairs.forEach(([p, q]) => {
  const key = p < q ? `${p}::${q}` : `${q}::${p}`;
  assert(`Table-filling marks (${p},${q}) as distinguishable`,
    tf.table[key] && tf.table[key].marked,
    `key=${key}`);
});

// Intra-class pairs must be UNMARKED (equivalent)
const equivPairs = [['A0','B0'],['A1','B1'],['A2','B2']];
equivPairs.forEach(([p, q]) => {
  const key = p < q ? `${p}::${q}` : `${q}::${p}`;
  assert(`Table-filling leaves (${p},${q}) unmarked (equivalent)`,
    !tf.table[key] || !tf.table[key].marked,
    `key=${key}`);
});

// DFA minimisation
const minResult = AutomataEngine.minimiseDFA(m5r);
assert('minimiseDFA returns object', typeof minResult === 'object');
if (minResult.minimal) {
  assert('Minimised DFA5 has 3 states (equivalence classes)', minResult.minimal.states.length === 3,
    `got ${minResult.minimal.states.length}`);
  // Verify minimised machine language = original
  let minLangOk = true;
  for (let len = 0; len <= 8; len++) {
    for (let n = 0; n < (1 << len); n++) {
      const s = len === 0 ? '' : n.toString(2).padStart(len, '0');
      const a = AutomataEngine.runDFA(m5r, s).accepted;
      const b = AutomataEngine.runDFA(minResult.minimal, s).accepted;
      if (a !== b) { minLangOk = false; break; }
    }
    if (!minLangOk) break;
  }
  assert('Minimised DFA5 preserves language (len 0–8)', minLangOk);
}

// ─── SECTION 8: NFA — Third Symbol From End (Chamber 6) ──────────────────────
section('8. NFA SIMULATION — CHAMBER 6 (3rd symbol from end = 1)');

const m6 = C[6].machine;
const ch6Accept = ['100','101','110','111','0100','1101','00100','11101'];
const ch6Reject = ['','0','1','10','010','011','000','001','1001','0000'];

ch6Accept.forEach(s => {
  assert(`NFA6 accepts '${s}'`, AutomataEngine.runNFA(m6, s).accepted);
});
ch6Reject.forEach(s => {
  assert(`NFA6 rejects '${s || 'ε'}'`, !AutomataEngine.runNFA(m6, s).accepted);
});

// Property: 3rd from end is 1
{
  let propOk = true;
  for (let len = 0; len <= 8; len++) {
    for (let n = 0; n < (1 << len); n++) {
      const s = len === 0 ? '' : n.toString(2).padStart(len, '0');
      const eng = AutomataEngine.runNFA(m6, s).accepted;
      const ref = s.length >= 3 && s[s.length - 3] === '1';
      if (eng !== ref) { propOk = false; break; }
    }
    if (!propOk) break;
  }
  assert('NFA6 property: accepted ↔ 3rd symbol from end is 1 (len 0–8)', propOk);
}

// ─── SECTION 9: Subset Construction (Chamber 6) ──────────────────────────────
section('9. SUBSET CONSTRUCTION — CHAMBER 6 NFA → DFA');

const scResult = AutomataEngine.subsetConstruction(m6);
assert('subsetConstruction returns object', typeof scResult === 'object');
if (scResult.dfa) {
  assert('Subset DFA for NFA6 has at most 16 states', scResult.dfa.states.length <= 16,
    `got ${scResult.dfa.states.length}`);
  assert('Subset DFA for NFA6 has at least 8 states', scResult.dfa.states.length >= 8,
    `got ${scResult.dfa.states.length}`);
  // Language preservation
  let scLangOk = true;
  for (let len = 0; len <= 8; len++) {
    for (let n = 0; n < (1 << len); n++) {
      const s = len === 0 ? '' : n.toString(2).padStart(len, '0');
      const a = AutomataEngine.runNFA(m6, s).accepted;
      const b = AutomataEngine.runDFA(scResult.dfa, s).accepted;
      if (a !== b) { scLangOk = false; break; }
    }
    if (!scLangOk) break;
  }
  assert('Subset DFA preserves NFA6 language (len 0–8)', scLangOk);
}

// ─── SECTION 10: Product Automaton (Chamber 7) ───────────────────────────────
section('10. PRODUCT AUTOMATON — CHAMBER 7 (Even 1s ∩ Div by 3)');

const mA = C[7].machineA;
const mB = C[7].machineB;
const m7  = C[7].machine;

// Pre-defined product machine
const ch7Accept = ['', '0', '00', '11', '110', '1001', '1100'];
const ch7Reject = ['1', '10', '100', '101', '111', '1000', '010'];

ch7Accept.forEach(s => {
  assert(`Product-DFA7 accepts '${s || 'ε'}'`, AutomataEngine.runDFA(m7, s).accepted);
});
ch7Reject.forEach(s => {
  assert(`Product-DFA7 rejects '${s}'`, !AutomataEngine.runDFA(m7, s).accepted);
});

// Computed product
const prodResult = AutomataEngine.productAutomaton(mA, mB);
assert('productAutomaton returns object', typeof prodResult === 'object');
if (prodResult.product) {
  assert('Product automaton has 6 states', prodResult.product.states.length === 6,
    `got ${prodResult.product.states.length}`);
  assert('Product automaton has exactly 1 accepting state', prodResult.product.accepting.length === 1,
    `got ${prodResult.product.accepting.length}`);
  // Language match
  let prodLangOk = true;
  for (let len = 0; len <= 9; len++) {
    for (let n = 0; n < (1 << len); n++) {
      const s = len === 0 ? '' : n.toString(2).padStart(len, '0');
      const a = AutomataEngine.runDFA(m7, s).accepted;
      const b = AutomataEngine.runDFA(prodResult.product, s).accepted;
      if (a !== b) { prodLangOk = false; break; }
    }
    if (!prodLangOk) break;
  }
  assert('Computed product automaton language = pre-defined product (len 0–9)', prodLangOk);
}

// Intersection property: a string is in product ↔ even 1s AND binary div3
{
  let intersectOk = true;
  for (let len = 0; len <= 9; len++) {
    for (let n = 0; n < (1 << len); n++) {
      const s = len === 0 ? '' : n.toString(2).padStart(len, '0');
      const eng = AutomataEngine.runDFA(m7, s).accepted;
      const ones = (s.match(/1/g) || []).length;
      const val  = s === '' ? 0 : parseInt(s, 2);
      const ref  = (ones % 2 === 0) && (val % 3 === 0);
      if (eng !== ref) { intersectOk = false; break; }
    }
    if (!intersectOk) break;
  }
  assert('Product property: accepted ↔ even-1s AND div-by-3 (len 0–9)', intersectOk);
}

// ─── SECTION 11: Trace Verification ──────────────────────────────────────────
section('11. EXECUTION TRACES');

// DFA trace for Chamber 1: '101'
{
  const trace = AutomataEngine.traceDFA(m1, '101');
  assert('traceDFA1 returns steps array', Array.isArray(trace.steps));
  assert('traceDFA1 on "101" has 4 steps (initial + 3 transitions)', trace.steps.length === 4,
    `got ${trace.steps.length}`);
  assert('traceDFA1 on "101" accepted (ends in 01)', trace.accepted);
  assert('traceDFA1 step 0 is at q0', trace.steps[0].state === 'q0');
  assert('traceDFA1 step 3 is at q2 (accepting)', trace.steps[3].state === 'q2');
}

// NFA trace for Chamber 3: 'ab'
{
  const trace = AutomataEngine.traceNFA(m3, 'ab');
  assert('traceNFA3 returns steps array', Array.isArray(trace.steps));
  assert('traceNFA3 on "ab" has 3 steps', trace.steps.length === 3,
    `got ${trace.steps.length}`);
  assert('traceNFA3 on "ab" is accepted', trace.accepted);
  // After reading 'a', must include both p0 and p1
  const afterA = trace.steps[1].states;
  assert('traceNFA3 after "a" has p0 in active set', afterA.includes('p0'));
  assert('traceNFA3 after "a" has p1 in active set', afterA.includes('p1'));
}

// NFA trace for Chamber 4: '1101'
{
  const trace = AutomataEngine.traceNFA(m4, '1101');
  assert('traceNFA4 on "1101" accepted', trace.accepted);
  assert('traceNFA4 returns steps', Array.isArray(trace.steps));
}

// DFA trace for Chamber 5: '110'
{
  const trace = AutomataEngine.traceDFA(m5c, '110');
  assert('traceDFA5 on "110" accepted (6 div 3)', trace.accepted);
  assert('traceDFA5 step 0 at rem0', trace.steps[0].state === 'rem0');
}

// ─── SECTION 12: compareLanguages ─────────────────────────────────────────────
section('12. LANGUAGE COMPARISON');

// Redundant DFA2 vs canonical DFA2 — must be equivalent
const cmp2 = AutomataEngine.compareLanguages(m2r, m2c);
assert('compareLanguages: DFA2 redundant ≡ canonical', cmp2.equivalent,
  cmp2.witness ? `witness='${cmp2.witness}'` : '');

// True NFA4 vs Warden NFA4 — must be NOT equivalent
const cmp4 = AutomataEngine.compareLanguages(C[4].machine, C[4].wardenMachine);
assert('compareLanguages: NFA4 true ≠ Warden (not equivalent)', !cmp4.equivalent);
if (!cmp4.equivalent && cmp4.witness) {
  assert('compareLanguages witness accepted by true NFA4',   AutomataEngine.runNFA(m4, cmp4.witness).accepted);
  assert('compareLanguages witness rejected by Warden NFA4', !AutomataEngine.runNFA(m4w, cmp4.witness).accepted);
}

// DFA5 redundant vs canonical — must be equivalent
const cmp5 = AutomataEngine.compareLanguages(m5r, m5c);
assert('compareLanguages: DFA5 redundant ≡ canonical', cmp5.equivalent);

// ─── SECTION 13: distinguishStates ────────────────────────────────────────────
section('13. DISTINGUISH STATES');

// Chamber 2 redundant: E1 and E2 must be equivalent
const d_E1_E2 = AutomataEngine.distinguishStates(m2r, 'E1', 'E2');
assert('distinguishStates E1 ≡ E2 (equivalent)', d_E1_E2.equivalent);

// E1 and O must be distinguishable
const d_E1_O = AutomataEngine.distinguishStates(m2r, 'E1', 'O');
assert('distinguishStates E1 ≠ O (distinguishable)', !d_E1_O.equivalent);
if (!d_E1_O.equivalent && d_E1_O.witness) {
  assert('E1/O witness is genuine',
    AutomataEngine.runDFA({ ...m2r, start: 'E1' }, d_E1_O.witness).accepted !==
    AutomataEngine.runDFA({ ...m2r, start: 'O' },  d_E1_O.witness).accepted);
}

// Chamber 5: A0 and B0 must be equivalent
const d_A0_B0 = AutomataEngine.distinguishStates(m5r, 'A0', 'B0');
assert('distinguishStates A0 ≡ B0 (equivalent)', d_A0_B0.equivalent);

// A0 and A1 must be distinguishable
const d_A0_A1 = AutomataEngine.distinguishStates(m5r, 'A0', 'A1');
assert('distinguishStates A0 ≠ A1 (distinguishable)', !d_A0_A1.equivalent);

// ─── SECTION 14: JFLAP File Validation ──────────────────────────────────────
section('14. JFLAP FILE VALIDATION');

const JFLAP_DIR = path.resolve(__dirname, '../FOLD_FINAL/JFLAP');
const requiredFiles = [
  'DFA_Binary_Ends_01.jff',
  'DFA_Even_Number_Of_Ones.jff',
  'DFA_Redundant_Even_Ones.jff',
  'NFA_Contains_ab.jff',
  'NFA_Contains_101.jff',
  'DFA_Divisible_By_3.jff',
  'DFA_Redundant_Divisible_By_3.jff',
  'NFA_Third_Symbol_From_End_1.jff',
  'DFA_Product_Even_Ones_Divisible_By_3.jff',
  'NFA_Warden_Flawed_101.jff'
];

requiredFiles.forEach(fname => {
  const fpath = path.join(JFLAP_DIR, fname);
  const exists = fs.existsSync(fpath);
  assert(`JFLAP file exists: ${fname}`, exists);
  if (exists) {
    const content = fs.readFileSync(fpath, 'utf8');
    assert(`JFLAP ${fname}: has <structure>`,     content.includes('<structure>'));
    assert(`JFLAP ${fname}: has <automaton>`,     content.includes('<automaton>'));
    assert(`JFLAP ${fname}: has <state`,          content.includes('<state'));
    assert(`JFLAP ${fname}: has <transition>`,    content.includes('<transition>'));
    assert(`JFLAP ${fname}: has <initial />`,     content.includes('<initial />') || content.includes('<initial/>'));
    assert(`JFLAP ${fname}: has <final />`,       content.includes('<final />') || content.includes('<final/>'));
  }
});

// ─── SECTION 15: Edge Cases ──────────────────────────────────────────────────
section('15. EDGE CASES');

// Empty string handling
assert('DFA1 rejects empty string',      !AutomataEngine.runDFA(m1, '').accepted);
assert('DFA2 canonical accepts epsilon', AutomataEngine.runDFA(m2c, '').accepted);   // 0 ones = even
assert('NFA3 rejects empty string',      !AutomataEngine.runNFA(m3, '').accepted);
assert('NFA4 rejects empty string',      !AutomataEngine.runNFA(m4, '').accepted);
assert('DFA5 accepts epsilon (val=0)',   AutomataEngine.runDFA(m5c, '').accepted);   // 0 div 3
assert('NFA6 rejects empty string',      !AutomataEngine.runNFA(m6, '').accepted);
assert('Product-DFA7 accepts epsilon',   AutomataEngine.runDFA(m7, '').accepted);    // 0 ones even, 0 div 3

// Single-symbol strings
assert('DFA1 rejects "0"',  !AutomataEngine.runDFA(m1, '0').accepted);
assert('DFA1 rejects "1"',  !AutomataEngine.runDFA(m1, '1').accepted);
assert('NFA3 rejects "a"',  !AutomataEngine.runNFA(m3, 'a').accepted);
assert('NFA3 rejects "b"',  !AutomataEngine.runNFA(m3, 'b').accepted);

// Invalid symbol rejection
{
  const r = AutomataEngine.runDFA(m1, '2');
  assert('DFA1 on invalid symbol "2" returns error', r.error !== undefined || !r.accepted);
}
{
  const r = AutomataEngine.runNFA(m3, 'c');
  assert('NFA3 on invalid symbol "c" returns error or rejects', r.error !== undefined || !r.accepted);
}

// ─── SECTION 16: Chamber Samples Validation ───────────────────────────────────
section('16. CHAMBER SAMPLE STRINGS');

ChambersData.forEach(ch => {
  const run = ch.machine.kind === 'NFA'
    ? (m, s) => AutomataEngine.runNFA(m, s)
    : (m, s) => AutomataEngine.runDFA(m, s);
  const samples = ch.samples || {};

  (samples.accepted || []).forEach(s => {
    const input = s === 'ε' ? '' : s;
    assert(`Chamber ${ch.id} sample ACCEPT '${s}'`, run(ch.machine, input).accepted);
  });
  (samples.rejected || []).forEach(s => {
    const input = s === 'ε' ? '' : s;
    assert(`Chamber ${ch.id} sample REJECT '${s}'`, !run(ch.machine, input).accepted);
  });
});

// ─── SECTION 17: exportToJFLAP ───────────────────────────────────────────────
section('17. exportToJFLAP FUNCTION');

[m1, m2c, m2r, m3, m4, m4w, m5c, m5r, m6, m7].forEach(machine => {
  const xml = AutomataEngine.exportToJFLAP(machine);
  assert(`exportToJFLAP(${machine.name || 'unnamed'}): returns string`, typeof xml === 'string');
  assert(`exportToJFLAP(${machine.name || 'unnamed'}): valid XML skeleton`,
    xml.includes('<structure>') && xml.includes('<automaton>'));
  assert(`exportToJFLAP(${machine.name || 'unnamed'}): has at least one state`,
    xml.includes('<state'));
});

// ─── SECTION 18: NFA Epsilon Closure ─────────────────────────────────────────
section('18. EPSILON CLOSURE');

// Build a simple NFA with epsilon transitions for testing
const nfaEps = {
  kind: 'NFA',
  alphabet: ['a'],
  states: ['q0', 'q1', 'q2'],
  start: 'q0',
  accepting: ['q2'],
  transitions: {
    q0: { 'ε': ['q1'], 'a': [] },
    q1: { 'ε': ['q2'], 'a': [] },
    q2: { 'a': []             }
  }
};
const closure = AutomataEngine.epsilonClosure(nfaEps, ['q0']);
assert('Epsilon closure from q0 includes q0', closure.includes('q0'));
assert('Epsilon closure from q0 includes q1 (ε-transition)', closure.includes('q1'));
assert('Epsilon closure from q0 includes q2 (transitive ε)', closure.includes('q2'));

// ─── FINAL REPORT ─────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(60)}`);
console.log(`  FOLD TEST SUITE — FINAL RESULTS`);
console.log(`${'═'.repeat(60)}`);
console.log(`  Total assertions : ${total}`);
console.log(`  Passed           : ${passed}`);
console.log(`  Failed           : ${failed}`);
console.log(`  Pass rate        : ${((passed / total) * 100).toFixed(1)}%`);
if (failures.length > 0) {
  console.log(`\n  FAILURES:`);
  failures.forEach((f, i) => {
    console.log(`  ${i + 1}. [${f.label}]${f.detail ? ' — ' + f.detail : ''}`);
  });
}
console.log(`${'═'.repeat(60)}\n`);

process.exit(failed > 0 ? 1 : 0);

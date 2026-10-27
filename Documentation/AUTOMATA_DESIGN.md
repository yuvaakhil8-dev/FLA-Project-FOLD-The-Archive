# FOLD — THE ARCHIVE
## Technical Documentation: Automata Design & Algorithm Reference

---

## 1. Project Abstract

FOLD — THE ARCHIVE is an interactive psychological-horror escape-room game built on Formal Languages and Automata Theory. Players navigate seven memory chambers inside a fictional underground research facility. Each chamber presents a unique puzzle grounded in a specific automata-theory concept: DFA simulation, NFA branching, state equivalence, DFA minimisation, subset construction, and product construction.

All puzzles are solved by the actual mathematical engine — no puzzle outcomes are hardcoded. The automata engine is a pure JavaScript library with no external dependencies, usable in both Node.js and modern browsers.

---

## 2. Problem Statement

The project demonstrates the following FLA concepts through interactive gameplay:

1. Deterministic Finite Automata (DFA) and language recognition
2. Nondeterministic Finite Automata (NFA) with multiple active states
3. State equivalence and the Myhill-Nerode theorem
4. DFA minimisation via the table-filling algorithm
5. NFA-to-DFA conversion via subset (powerset) construction
6. Distinguishing strings (witnesses) and language inequality
7. Product automata and language intersection

---

## 3. Objectives

- Implement a complete, mathematically correct automata simulation engine
- Design seven playable chambers, each demonstrating one FLA concept
- Create JFLAP-compatible `.jff` files for all automata
- Provide an examiner mode for academic demonstration
- Achieve 100% test coverage across all engine functions and all seven chambers

---

## 4. System Architecture

```
┌─────────────────────────────────────────────┐
│              Application Layer              │
│  (index.html, app.js, screens, UI modules)  │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│           Game Modules                      │
│  visualization.js  │  audio.js              │
│  examiner.js       │  workshop.js           │
│  storage.js        │                        │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│         Automata Engine (engine.js)         │
│  Pure mathematical functions. No DOM deps.  │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│         Chamber Data (chambers.js)          │
│  7 formal machine definitions + story data  │
└─────────────────────────────────────────────┘
```

---

## 5. Formal Definitions — All Seven Chambers

### Chamber 1 — DFA: Binary Strings Ending in 01

**Formal 5-tuple:** M = (Q, Σ, δ, q₀, F)

- Q = {q0, q1, q2}
- Σ = {0, 1}
- q₀ = q0
- F = {q2}
- δ:

| State | 0  | 1  |
|-------|----|----|
| q0    | q1 | q0 |
| q1    | q1 | q2 |
| q2    | q1 | q0 |

**Language:** L = { w ∈ {0,1}* | w ends with 01 } = (0+1)*01

**Accepted:** 01, 101, 1101, 001  
**Rejected:** ε, 0, 1, 10, 11, 100

---

### Chamber 2 — DFA: Even Number of 1s (Redundant 3-state → Canonical 2-state)

**Redundant machine (presented to player):**
- Q = {E1, E2, O}, Σ = {0,1}, q₀ = E1, F = {E1, E2}

| State | 0  | 1  |
|-------|----|----|
| E1    | E2 | O  |
| E2    | E1 | O  |
| O     | O  | E1 |

**Canonical minimal machine (post-fold):**
- Q = {E, O}, Σ = {0,1}, q₀ = E, F = {E}

| State | 0 | 1 |
|-------|---|---|
| E     | E | O |
| O     | O | E |

**Equivalence:** E1 ≡ E2 — for every string w, δ*(E1, w) ∈ F ↔ δ*(E2, w) ∈ F.  
Verified: exhaustive comparison over all strings of length 0–8.

**Language:** L = { w ∈ {0,1}* | |w|₁ is even } = (0* 1 0* 1)* 0*

**Accepted:** ε, 0, 11, 101, 1100  
**Rejected:** 1, 10, 111, 01, 001

---

### Chamber 3 — NFA: Strings Containing Substring ab

**Formal 5-tuple:** M = (Q, Σ, δ, p0, F)

- Q = {p0, p1, p2}
- Σ = {a, b}
- q₀ = p0
- F = {p2}
- δ (NFA — sets of states):

| State | a       | b    |
|-------|---------|------|
| p0    | {p0,p1} | {p0} |
| p1    | ∅       | {p2} |
| p2    | {p2}    | {p2} |

**Language:** L = (a+b)*ab(a+b)*

**NFA execution on "ab":**
- Initial: {p0}
- Read 'a': {p0, p1}
- Read 'b': {p0, p2}  ← p2 ∈ F → ACCEPTED

**Accepted:** ab, aab, bab, abb  
**Rejected:** ε, a, b, ba, bbb

---

### Chamber 4 — NFA: Strings Containing Substring 101

**True NFA (Chamber machine):**
- Q = {s0, s1, s2, s3}, Σ = {0,1}, q₀ = s0, F = {s3}

| State | 0    | 1       |
|-------|------|---------|
| s0    | {s0} | {s0,s1} |
| s1    | {s2} | ∅       |
| s2    | ∅    | {s3}    |
| s3    | {s3} | {s3}    |

**Warden's Flawed NFA** (flaw: s0 on 1 → {s1} only, missing self-loop to s0):

| State | 0    | 1    |
|-------|------|------|
| s0    | {s0} | {s1} |
| s1    | {s2} | ∅    |
| s2    | ∅    | {s3} |
| s3    | {s3} | {s3} |

**Shortest Witness:** 1101

- True NFA on '1101': s0 → {s0,s1} → {s0,s2} → {s0,s3} → {s0,s3} — ACCEPTED
- Warden NFA on '1101': s0 → {s1} → ∅ → ∅ → ∅ — REJECTED

The witness is computed via BFS on the product of the two determinised machines.

---

### Chamber 5 — DFA: Binary Numbers Divisible by 3

**Minimal DFA (3 states):**
- Q = {rem0, rem1, rem2}, Σ = {0,1}, q₀ = rem0, F = {rem0}
- Transition formula: δ(remR, b) = rem((2R + b) mod 3)

| State | 0    | 1    |
|-------|------|------|
| rem0  | rem0 | rem1 |
| rem1  | rem2 | rem0 |
| rem2  | rem1 | rem2 |

**Redundant 6-state DFA:** States {A0, B0, A1, B1, A2, B2} — two copies of each remainder class.

| State | 0  | 1  |
|-------|----|----|
| A0    | B0 | A1 |
| B0    | A0 | B1 |
| A1    | A2 | B0 |
| B1    | B2 | A0 |
| A2    | B1 | A2 |
| B2    | A1 | B2 |

**Equivalence classes** (table-filling result):
- {A0, B0} → merged to rem0
- {A1, B1} → merged to rem1
- {A2, B2} → merged to rem2

**Convention:** Empty string = 0 (binary), accepted (0 mod 3 = 0).

**Accepted:** ε (=0), 0, 00, 11 (=3), 110 (=6), 1001 (=9)  
**Rejected:** 1 (=1), 10 (=2), 100 (=4), 101 (=5), 111 (=7)

---

### Chamber 6 — NFA: 3rd Symbol from End is 1

**4-state NFA:**
- Q = {r0, r1, r2, r3}, Σ = {0,1}, q₀ = r0, F = {r3}

| State | 0    | 1       |
|-------|------|---------|
| r0    | {r0} | {r0,r1} |
| r1    | {r2} | {r2}    |
| r2    | {r3} | {r3}    |
| r3    | ∅    | ∅       |

**Subset Construction:** 8 reachable DFA states (representing the last 3 bits seen):

| DFA State | 0           | 1           | Accepting? |
|-----------|-------------|-------------|------------|
| {r0}      | {r0}        | {r0,r1}     | No         |
| {r0,r1}   | {r0,r2}     | {r0,r1,r2}  | No         |
| {r0,r2}   | {r0,r3}     | {r0,r1,r3}  | Yes        |
| {r0,r3}   | {r0}        | {r0,r1}     | No         |
| {r0,r1,r2}| {r0,r2,r3}  | {r0,r1,r2,r3}| Yes       |
| {r0,r1,r3}| {r0,r2}     | {r0,r1,r2}  | No         |
| {r0,r2,r3}| {r0,r3}     | {r0,r1,r3}  | Yes        |
| {r0,r1,r2,r3}|{r0,r2,r3}|{r0,r1,r2,r3}| Yes       |

All 8 states are reachable and distinguishable — the NFA-to-DFA conversion is minimal at 8 states.

**Accepted:** 100, 101, 110, 111, 0100, 1101  
**Rejected:** ε, 0, 1, 10, 010, 011, 000, 1001

---

### Chamber 7 — Product Automaton: Even 1s ∩ Divisible by 3

**Component A:** Even 1s DFA — Q = {E, O}, F = {E}  
**Component B:** Div-by-3 DFA — Q = {0, 1, 2}, F = {0}  
**Product DFA:** Q = {(E,0),(E,1),(E,2),(O,0),(O,1),(O,2)}, F = {(E,0)}

| State | 0     | 1     |
|-------|-------|-------|
| (E,0) | (E,0) | (O,1) |
| (E,1) | (E,2) | (O,0) |
| (E,2) | (E,1) | (O,2) |
| (O,0) | (O,0) | (E,1) |
| (O,1) | (O,2) | (E,0) |
| (O,2) | (O,1) | (E,2) |

**Language:** L = { w ∈ {0,1}* | |w|₁ is even AND val(w) ≡ 0 (mod 3) }

**Accepted:** ε(=0), 0(=0), 00(=0), 11(=3), 110(=6), 1001(=9), 1100(=12)  
**Rejected:** 1(=1,odd1), 10(=2,odd1), 100(=4,odd1), 101(=5,2ones,5%3≠0)

---

## 6. Algorithm Explanations

### 6.1 DFA Simulation — runDFA
**Time complexity:** O(|w|) — one state lookup per input symbol.

Process: Start at q₀. For each symbol c in w, look up δ(currentState, c). If the symbol is not in the alphabet, return error. After reading all symbols, accept iff current state ∈ F.

### 6.2 NFA Simulation — runNFA
**Time complexity:** O(|w| × |Q|²) — subset tracking.

Maintain a set of active states (initially {q₀}). For each symbol, compute the union of δ(s, c) for all active states s. After all symbols, accept iff active-states ∩ F ≠ ∅.

### 6.3 Epsilon Closure
**Time complexity:** O(|Q| + |δ|) — BFS/DFS over ε-edges.

Starting from a set S, follow all ε-transitions transitively. Returns the full set reachable via ε alone.

### 6.4 Subset Construction (NFA → DFA)
**Time complexity:** O(2^|Q| × |Σ|) worst case.

Each DFA state = a subset of NFA states. Starting from ε-closure({q₀}), BFS over all reachable subsets. A subset is accepting if it contains any NFA accepting state.

### 6.5 Table-Filling Algorithm (DFA Minimisation)
**Time complexity:** O(|Q|² × |Σ|).

Step 0: Mark all pairs (p, q) where exactly one ∈ F.  
Propagation: Mark (p, q) if any (δ(p,c), δ(q,c)) is already marked.  
Repeat until stable. Unmarked pairs are equivalent. Merge by equivalence class.

### 6.6 Shortest Witness — BFS on Product Automaton
**Time complexity:** O((|Q_A| × |Q_B|) × |Σ|) BFS.

Construct the product of the two determinised machines. Accept-only states are (p, q) where p ∈ F_A XOR q ∈ F_B. BFS from the initial pair to find the shortest string reaching such a state.

### 6.7 Product Automaton
**Time complexity:** O(|Q_A| × |Q_B| × |Σ|).

States = Q_A × Q_B. δ((p,q), c) = (δ_A(p,c), δ_B(q,c)). F = F_A × F_B (intersection) or (F_A × Q_B) ∪ (Q_A × F_B) (union).

---

## 7. JFLAP Implementation Details

All `.jff` files use the standard JFLAP XML format:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<structure><type>fa</type><automaton>
  <state id="0" name="q0"><x>120</x><y>180</y><initial /></state>
  <state id="1" name="q1"><x>300</x><y>90</y></state>
  <state id="2" name="q2"><x>480</x><y>180</y><final /></state>
  <transition><from>0</from><to>1</to><read>0</read></transition>
  ...
</automaton></structure>
```

For NFAs, transitions with empty target (`read` still present) represent ∅ destinations. For NFA, multiple transitions with the same `from`/`read` pair and different `to` values represent nondeterminism.

**Structural validation performed by:** `Tests/fold-comprehensive-tests.js`, Section 14.

**GUI verification note:** JFLAP GUI requires Java 8+. If Java is unavailable, mathematical correctness is confirmed by the exhaustive test suite which verifies each machine's language against an independent predicate function for all strings of length 0–9.

---

## 8. Testing Methodology

The test suite (`Tests/fold-comprehensive-tests.js`) uses 375 assertions across 18 sections:

1. Automaton validation
2. DFA simulation — Chamber 1
3. DFA simulation — Chamber 2 (redundant and canonical)
4. NFA simulation — Chamber 3
5. NFA simulation — Chamber 4
6. Shortest witness — Chamber 4
7. DFA minimisation — Chamber 5
8. NFA simulation — Chamber 6
9. Subset construction — Chamber 6
10. Product automaton — Chamber 7
11. Execution traces
12. Language comparison
13. State distinguishability
14. JFLAP file structural validation
15. Edge cases (empty string, single symbol, invalid symbol)
16. All chamber sample strings (accept/reject verification)
17. JFLAP export function
18. Epsilon closure

**Exhaustive tests:** All strings up to length 7–9 are tested against independent mathematical predicates for chambers 1–7.

**Property tests:**
- Minimisation preserves language (Chamber 5)
- Subset construction preserves NFA language (Chamber 6)
- Product automaton = intersection of component languages (Chamber 7)
- Witness string causes genuine acceptance/rejection asymmetry (Chamber 4)
- No equivalent state pairs remain after correct minimisation (Chamber 5)

---

## 9. Limitations and Known Constraints

- **JFLAP GUI verification**: Not performed — Java runtime not available in the development environment. Mathematical correctness verified by exhaustive Node.js tests.
- **Screenshots**: Browser screenshots are not generated automatically. Run `Application/index.html` in Chrome/Firefox to view the application.
- **Subset construction NFA with ε**: The engine supports ε-transitions in epsilonClosure, but the game chambers do not use ε-transitions (by design, for clarity).
- **Workshop export**: The Workshop exports valid JFLAP XML but targets DFA only; NFA export with multiple transitions per symbol is structurally identical since JFLAP infers NFA type from transition count.

---

## 10. References

1. Sipser, M. (2012). *Introduction to the Theory of Computation* (3rd ed.). Cengage Learning.
2. Hopcroft, J., Motwani, R., & Ullman, J. (2006). *Introduction to Automata Theory, Languages, and Computation* (3rd ed.). Addison-Wesley.
3. JFLAP documentation: http://www.jflap.org/
4. Myhill-Nerode theorem: Nerode, A. (1958). Linear automaton transformations. *Proceedings of the AMS*, 9(4), 541–544.
5. Table-filling algorithm: Hopcroft (1971). An n log n algorithm for minimizing states in a finite automaton. *Theory of Machines and Computations*.

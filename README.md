# FOLD — THE ARCHIVE
### *Every room is a question. Find the rooms that are really the same.*

**Formal Languages and Automata Theory — University Mini-Project**  
Game Implementation: 10 marks | JFLAP Implementation: 10 marks

---

## Quick Start

```
1. Open  Application/index.html  in any modern browser.
2. Click  START NEW EXPLORATION  on the title screen.
3. Complete the seven chambers in order.
```

No build step. No dependencies. No server required.

---

## Project Structure

```
FOLD_FINAL/
├── Application/          ← Playable game (open index.html)
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── engine.js         ← Automata engine (DFA/NFA/algorithms)
│       ├── chambers.js       ← All 7 chamber definitions
│       ├── storage.js        ← LocalStorage persistence
│       ├── audio.js          ← Web Audio API synthesizer
│       ├── visualization.js  ← SVG automata diagram renderer
│       ├── workshop.js       ← Automata Construction Workshop
│       ├── examiner.js       ← Faculty Examiner Mode
│       └── app.js            ← Main game controller
├── Automata_Engine/      ← Standalone JS engine + chamber data
├── JFLAP/                ← 10 validated .jff files
├── Documentation/        ← README, design docs
├── Tests/                ← Comprehensive test suite
└── Reports/              ← Test results
```

---

## Running the Tests

```powershell
# From project root:
node Tests/fold-comprehensive-tests.js   # 375 assertions, 100% pass rate
node Tests/engine-tests.js               # 19 engine unit tests
```

Expected output:
```
Total assertions : 375
Passed           : 375
Failed           : 0
Pass rate        : 100.0%
```

---

## The Seven Chambers

| # | Code   | Title                  | Machine Type       | Core Concept                          |
|---|--------|------------------------|--------------------|---------------------------------------|
| 1 | ARC-01 | The First Memory       | DFA (3 states)     | Binary strings ending in `01`         |
| 2 | ARC-02 | The First Fold         | DFA (3→2 states)   | Even 1s, fold equivalent states       |
| 3 | ARC-03 | The Echo Chamber       | NFA (3 states)     | Strings containing `ab`, branching    |
| 4 | ARC-04 | The Warden's Lie       | NFA (4 states)     | Shortest distinguishing witness       |
| 5 | ARC-05 | The Six-Room Paradox   | DFA (6→3 states)   | Divisible by 3, table-filling         |
| 6 | ARC-06 | The Forgotten Position | NFA (4→8 DFA)      | 3rd symbol from end is 1              |
| 7 | ARC-07 | The Product Gate       | DFA (6 product)    | Even 1s ∩ Divisible by 3             |

---

## JFLAP Files

All `.jff` files are in `JFLAP/`. Open with **JFLAP 7.1** (requires Java 8+).

| File | States | Type | Language |
|------|--------|------|----------|
| `DFA_Binary_Ends_01.jff` | 3 | DFA | Binary strings ending in `01` |
| `DFA_Even_Number_Of_Ones.jff` | 2 | DFA | Strings with even number of 1s |
| `DFA_Even_Number_Of_Ones_Redundant.jff` | 3 | DFA | Same language, 3-state redundant form |
| `NFA_Contains_ab.jff` | 3 | NFA | Strings containing substring `ab` |
| `NFA_Contains_101.jff` | 4 | NFA | Strings containing substring `101` |
| `NFA_Warden_Flawed_101.jff` | 4 | NFA | Flawed version (missing s0→s0 on 1) |
| `DFA_Divisible_By_3.jff` | 3 | DFA | Binary numbers divisible by 3 |
| `DFA_Redundant_Divisible_By_3.jff` | 6 | DFA | Same language, 6-state redundant |
| `NFA_Third_Symbol_From_End_1.jff` | 4 | NFA | 3rd symbol from end is `1` |
| `DFA_Product_Even_Ones_Divisible_By_3.jff` | 6 | DFA | Intersection of even-1s and div-by-3 |

### JFLAP GUI Verification
JFLAP GUI verification requires a Java runtime. If Java/JFLAP is unavailable:
- Structural validation is confirmed by `Tests/fold-comprehensive-tests.js` Section 14.
- All 10 files contain valid XML with `<structure>`, `<automaton>`, `<state>`, `<transition>`, `<initial />`, and `<final />` tags.
- Language correctness is verified against independent mathematical predicates by the exhaustive test suite.

---

## Game Features

- **DFA/NFA simulation** with step-by-step debugger
- **Folding System**: click two states, propose a fold, mathematically verified
- **Witness System**: BFS product search for shortest distinguishing string
- **Table-Filling Algorithm**: visual Myhill-Nerode distinguishability matrix
- **Product Gate**: synchronized product automaton execution
- **Examiner Mode**: instant chamber access for faculty demonstration
- **Automata Workshop**: build, test and export custom machines to JFLAP
- **Hint System**: 3 progressive classified clues per chamber
- **Intercom Narrative**: story transmitted through MARA and THE WARDEN
- **Web Audio Synthesizer**: procedural state-specific sound feedback
- **LocalStorage persistence**: progress saved automatically
- **CRT scanline filter** and **reduce-motion** accessibility options

---

## Academic Notes

### Empty String Convention
The empty string `ε` represents the number 0 in binary. It is accepted by:
- Chamber 2 (0 ones = even)
- Chamber 5 (0 ÷ 3 = 0, divisible)
- Chamber 7 (0 ones even AND 0 ÷ 3 = 0)

This convention is consistent across the engine, game, tests and JFLAP files.

### Chamber 5 — Redundant DFA Design
The 6-state redundant DFA uses transitions `δ(r, b) = (2r + b) mod 3` applied to each of the two copies of each remainder class (A-copy and B-copy). Language equivalence with the canonical 3-state machine is verified exhaustively for all strings of length 0–9 (1,023 strings).

### Chamber 6 — Subset Construction State Count
The 4-state NFA for "3rd symbol from end is 1" produces exactly **8 reachable states** under subset construction (representing the sliding window of the last 3 binary digits). All 8 are distinguishable; no further minimisation is possible.

### Chamber 7 — Product Automaton
The product automaton is algorithmically computed via `productAutomaton(machineA, machineB)`. A state `(p, q)` is accepting iff `p ∈ F_A` AND `q ∈ F_B`. Verified against the intersection property for all strings of length 0–9.

---

*FOLD — The Archive. Developed as a university Formal Languages and Automata Theory mini-project.*

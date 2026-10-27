# FOLD — THE ARCHIVE
## University Presentation Outline (12–15 Slides)

---

### Slide 1 — Title
**FOLD: THE ARCHIVE**
*Every room is a question. Find the rooms that are really the same.*
Formal Languages and Automata Theory — University Mini-Project

---

### Slide 2 — Project Concept
- Psychological-horror escape room built on automata theory
- Seven chambers = seven FLA concepts
- Puzzles solved by actual mathematical computation
- No hardcoded answers: all outcomes determined by the engine

---

### Slide 3 — Story and Setting
- Player trapped inside THE ARCHIVE: an underground memory facility
- THE WARDEN compresses human memories by merging rooms
- MARA communicates via intercom, guiding the player
- Player's mission: identify incorrect merges, expose flawed machines, escape

---

### Slide 4 — System Architecture
[Diagram: Application → Game Modules → Automata Engine → Chamber Data]
- Pure JavaScript, no external libraries
- Engine runs identically in Node.js (tests) and browser (game)
- 15 engine functions, fully unit-tested

---

### Slide 5 — Chamber 1: DFA Simulation (Ends in 01)
- Q = {q0, q1, q2}, Σ = {0,1}, F = {q2}
- Transition table + state diagram
- Demo: run "101" through the step-by-step debugger
- Teaches: DFA, states, transitions, accepting condition

---

### Slide 6 — Chamber 2: The Folding System (Even 1s)
- 3-state redundant DFA presented to player
- Player clicks E1 and E2 on the radar diagram
- Engine runs distinguishStates() — confirms equivalence
- Result: machine folds to canonical 2-state DFA
- Teaches: Myhill-Nerode, state equivalence, minimisation

---

### Slide 7 — Chamber 3: NFA Branching (Contains ab)
- NFA with 3 states over {a, b}
- Multiple active states shown simultaneously (Echo system)
- Run "aab": active sets {p0} → {p0,p1} → {p0} → ... 
- Teaches: NFA semantics, parallel execution, acceptance

---

### Slide 8 — Chamber 4: Shortest Witness (Contains 101)
- True NFA vs Warden's flawed NFA (missing s0→s0 on 1)
- Engine runs BFS on product automaton
- Finds shortest witness "1101" algorithmically
- Verifies: true NFA accepts, Warden rejects
- Teaches: language inequality, witness strings, product automaton

---

### Slide 9 — Chamber 5: Table-Filling Algorithm (Div by 3)
- 6-state redundant DFA → 3-state minimal DFA
- Visual lower-triangular matrix rendered in-game
- Step 0: mark (A0,A1), (A0,A2) etc (different acceptance)
- Result: {A0,B0}, {A1,B1}, {A2,B2} are equivalent pairs
- Teaches: table-filling algorithm, Myhill-Nerode, minimisation

---

### Slide 10 — Chamber 6: Subset Construction (3rd from End)
- 4-state NFA → 8-state minimal DFA via powerset construction
- Each DFA state = subset of NFA states = sliding window of last 3 bits
- Demonstrates exponential state blowup (2^4 = 16, 8 reachable)
- Teaches: subset construction, NFA-to-DFA conversion

---

### Slide 11 — Chamber 7: Product Automaton (Intersection)
- Component A: Even 1s DFA (2 states)
- Component B: Divisible by 3 DFA (3 states)
- Product: 2 × 3 = 6 states, F = {(E,0)} only
- 2D grid visualization in-game
- Teaches: product construction, language intersection

---

### Slide 12 — JFLAP Implementation
- 10 validated .jff files
- Standard JFLAP XML format
- Covers all 7 chambers (including redundant machines)
- Structurally validated by test suite (375 assertions)
- Mathematical correctness verified exhaustively

---

### Slide 13 — Testing and Results
- 375 assertions across 18 test categories
- 100% pass rate
- Exhaustive language checks (all strings len 0–9)
- Property tests: minimisation, subset construction, product, witness
- Engine unit tests: 19 assertions, 19/19 passed

---

### Slide 14 — Game Features Demo
[Screenshots or live demo]
- Atmospheric UI: dark archival horror aesthetic
- Intercom system (MARA / WARDEN narrative)
- Prisoners' Traces (contextual lore hints)
- Examiner Mode: formal 5-tuples, custom traces, transition tables
- Automata Workshop: build custom DFAs, export to JFLAP

---

### Slide 15 — Conclusion
- Fully playable 7-chamber escape room
- 10 verified JFLAP models
- 375 test assertions, 100% passing
- All puzzles computed mathematically — no hardcoded answers
- Academic coverage: DFA, NFA, equivalence, minimisation, subset construction, product automaton

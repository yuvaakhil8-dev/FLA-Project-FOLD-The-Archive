# FOLD — The Archive

**FOLD — The Archive** is an interactive escape-room game developed as a final-year mini-project for the Formal Languages and Automata Theory course at Amrita Vishwa Vidyapeetham, Bengaluru.

The game is set in an abandoned research facility where the automated security locks are governed by finite automata. The player must solve seven chambers, each representing a different regular language, to progress and eventually escape the facility.

## Introduction and Background

This project was developed as part of the Formal Languages and Automata Theory course. The aim was to create an interactive tool that helps students understand how deterministic and nondeterministic finite automata work, by placing the abstract concepts inside a concrete, story-driven experience. Instead of static transition tables, the game shows live state changes, acceptance decisions, and interactive hints.

## Why This Project?

Many students find it difficult to visualise how a transition table induces a language, or how an NFA's set of active states works compared to a DFA's single state. Reading about epsilon transitions or state minimisation from a textbook does not always make the concepts click. This project places those concepts inside a playable environment where the student sees the actual execution, can step through inputs symbol by symbol, and receives guided hints when stuck. The goal is to connect the formal theory to an observable, repeatable experience.

## Problem Statement

Students often confuse the informal description of a regular language with its automaton representation. They may also struggle with:
- Tracking active configurations in an NFA
- Understanding when a string has been fully consumed
- Recognising equivalent states in a redundant DFA
- Constructing the subset DFA from an NFA
- Comprehending the product automaton of two simpler DFAs

The project addresses these difficulties by making the abstractions concrete and interactive.

## Problem Statement (Short)

The project helps students bridge the gap between formal definitions and observable automata behaviour.

## Project Objectives

The main objectives are:
- Demonstrate both deterministic and nondeterministic transition semantics
- Give immediate, reproducible feedback on input strings
- Explain the final-state acceptance condition clearly
- Sequence four to seven regular-language challenges in a logical order
- Preserve progress across refreshes using browser localStorage
- Require no build step, no external dependencies, and no server

## How the Game Works

The game is a single-page web application. The player starts at a title screen and can choose to:
- Start a new game (resets all progress)
- View the facility corridor (see which chambers are unlocked or completed)
- Enter Examiner Mode (jump to any chamber directly)
- Enter the Workshop Mode (build custom machines)

When a chamber is loaded, the player enters a binary string (over alphabet {0,1}) or an NFA alphabet string (over {a,b}) into a keypad. The application:
- Validates the input alphabet
- Computes the automaton's execution trace
- Highlights active states and transition edges in real time
- Shows whether the string is accepted or rejected
- Records the run for scoring and persistence

The player has 180 seconds per run. Wrong accepted-alphabet guesses cost 50 points; each revealed hint costs 100 points. A successful run scores `max(0, 700 + 2 × seconds remaining − 50 × wrong attempts this run − 100 × hints this run)`. The best per-chamber score is saved, and the total score is the sum of best chamber scores.

After clearing a chamber, the player receives three multiple-choice theory questions. Quiz results are stored separately from chamber scores and contribute to achievements.

## The Seven Chambers

The game contains seven chambers, played in order. Each chamber focuses on a specific automata concept:

| Chamber | Code | Title | Machine Type | Core Concept |
|---|---|---|---|---|
| 1 | ARC-01 | The First Memory | DFA (3 states) | Binary strings ending in `01` |
| 2 | ARC-02 | The First Fold | DFA (3→2 states) | Even number of 1s; state folding |
| 3 | ARC-03 | The Echo Chamber | NFA (3 states) | Strings containing substring `ab` |
| 4 | ARC-04 | The Warden's Lie | NFA (4 states) | Shortest distinguishing witness |
| 5 | ARC-05 | The Six-Room Paradox | DFA (6→3 states) | Divisible by 3; table-filling minimisation |
| 6 | ARC-06 | The Forgotten Position | NFA (4→8 DFA) | 3rd symbol from end is `1` |
| 7 | ARC-07 | The Product Gate | DFA (6 product) | Even 1s ∩ Divisible by 3 |

### Chamber 1: The First Memory
DFA that accepts binary strings ending in `01`. The student enters a string, sees the state trace, and learns that acceptance depends on the final two symbols.

### Chamber 2: The First Fold
DFA for binary strings with an even number of 1s (the empty string ε counts as 0 ones and is accepted). The chamber also demonstrates state folding: a 3-state redundant DFA can be folded into the minimal 2-state version.

### Chamber 3: The Echo Chamber
NFA for strings over {a,b} that contain the substring `ab`. The NFA maintains a set of active states; the student sees multiple states light up when branching occurs.

### Chamber 4: The Warden's Lie
NFA with a flawed transition (the Warden dropped the self-loop on state s0 for input 1). The student must find the shortest witness string `1101` that exposes the flaw. This string is also injectable into the cipher input.

### Chamber 5: The Six-Room Paradox
DFA with 6 redundant states for "binary numbers divisible by 3". The student runs the table-filling algorithm, identifies 3 indistinguishable pairs, and folds the machine into the canonical 3-state minimal DFA.

### Chamber 6: The Forgotten Position
NFA with 4 states for "the 3rd symbol from the end is 1". The student observes the subset construction, which produces exactly 8 reachable DFA states (representing the sliding window of the last 3 binary digits). All 8 are distinguishable; no further minimisation is possible.

### Chamber 7: The Product Gate
Product automaton of a DFA for even number of 1s (2 states) and a DFA for divisibility by 3 (3 states). The 6 product states are shown as a grid; a state `(p,q)` is accepting iff `p` is accepting in the first automaton AND `q` is accepting in the second. The intersection language is verified for all strings of length 0–9.

## FLA Concepts Demonstrated

- **DFA (Deterministic Finite Automaton)**: `M = (Q, Σ, δ, q₀, F)` where `δ: Q × Σ → Q` is a total function. One state per step; the string is accepted if the final state is in F.
- **NFA (Nondeterministic Finite Automaton)**: `M = (Q, Σ, δ, q₀, F)` where `δ: Q × Σ → P(Q)`. The student sees a set of active states; the string is accepted if at least one active state is in F at the end.
- **Transition function**: `δ` maps a state and input symbol to the next state(s). The game visualises this per symbol.
- **String acceptance and rejection**: Acceptance is declared when the final configuration's state(s) intersect the accepting set. Rejection is shown when they do not.
- **State minimisation**: Chamber 5 uses the table-filling (Myhill-Nerode) algorithm to find indistinguishable pairs and merge states.
- **Equivalent and distinguishable states**: The `distinguishStates()` function verifies whether two states behave identically under all continuations; if not, a distinguishing string exists.
- **Subset construction**: Chamber 6 converts the 4-state NFA into an 8-state DFA. Each DFA state represents the set of NFA states reachable after reading a prefix.
- **Product automaton**: Chamber 7 synchronises two DFAs. The product state `(p,q)` moves together; acceptance requires both components to accept.

## Technologies Used

- **HTML5**: Page structure and seven game screens (title, corridor, chamber, workshop, examiner, completion)
- **CSS3**: Industrial abandoned-facility theme, dark colour scheme, CRT scanlines, ambient glows, responsive design (adapts from 320px mobile to 1600px+ desktop)
- **Vanilla JavaScript (ES6+)**: Modular IIFE patterns, event-driven architecture, no frameworks or build tools
- **Web Audio API**: State-specific sound effects (pulse, acceptance klaxon, witness chime, key clicks, intercom narration)
- **localStorage**: Browser-local persistence of chamber progress, best scores, settings (sound, reduce-motion, CRT scanlines). Survives refreshes.
- **Inline SVG**: Renderer for automata state diagrams, transition edges, node highlights, and step-mode framing

## Project Folder Structure

```
FOLD-The-Archive/
- Application/                ← Playable game (index.html + JS/CSS)
- Automata_Engine/           ← Standalone JS engine + chamber data
- JFLAP/                     ← 10 validated .jff automaton files
- css/                       ← Visual design stylesheet
- js/                        ← Root-level JS (levels, game, quiz)
- tests/                     ← Node.js test suite (394 assertions)
- documentation/             ← Design docs and audit reports
- Presentation/              ← Presentation outline
- Reports/                   ← Test results and audit files
- Screenshots/               ← Browser-captured application screenshots
- README.md                  ← Project overview
- .gitignore                ← Git exclusions
- LICENSE                   ← Project license (if selected)
```

## How to Download and Run the Application

1. **Without a server** ( simplest ):
   - Extract the project folder to any directory
   - Open `Application/index.html` in any modern web browser (Chrome, Firefox, Edge, Safari)
   - No installation, no Python, no Node.js required

2. **With a local HTTP server** (recommended for full features):
   - Extract the project folder
   - Open a terminal or command prompt
   - Navigate to the `Application/` directory
   - Run: `python -m http.server 8080`
   - Open a browser and go to `http://localhost:8080`
   - Press `Ctrl+C` to stop the server when finished
   - The server method ensures localStorage persistence works correctly

3. **From the GitHub repository**:
   - Clone the repository
   - Follow the "Without a server" or "With a server" steps above

## How to Use the JFLAP Files

The project includes 10 JFLAP finite-automaton model files (`.jff`) in the `JFLAP/` directory. These files are the standard JFLAP XML format and can be opened in JFLAP 7.1 (requires Java 8+).

**What you can do with the .jff files:**
- Open each file in JFLAP to see the state diagram and transition table
- Run example strings from the language the automaton recognises
- Use JFLAP's minimisation and conversion tools (NFA ↔ DFA, subset construction)
- Compare the JFLAP display with the in-game automata visualisation

**Important**: JFLAP GUI verification has not been performed as part of this project. While the XML structure of all 10 files is valid and language correctness is confirmed by the internal test suite (394/394 assertions pass), opening these files in the external JFLAP application is an examiner-side step that lies outside the project's scope.

The 10 .jff files correspond to the seven chambers plus three additional redundant/variant automata:

| File | Chambers | Description |
|---|---|---|
| `DFA_Binary_Ends_01.jff` | Chamber 1 | 3-state DFA for binary strings ending in `01` |
| `DFA_Even_Number_Of_Ones.jff` | Chamber 2 | 2-state DFA for even 1s (incl. ε) |
| `DFA_Even_Number_Of_Ones_Redundant.jff` | — | 3-state redundant version of Chamber 2 |
| `NFA_Contains_ab.jff` | Chamber 3 | 3-state NFA for strings containing `ab` |
| `NFA_Contains_101.jff` | — | 4-state NFA for strings containing `101` |
| `NFA_Warden_Flawed_101.jff` | Chamber 4 | 4-state flawed NFA (missing s0→s0 on 1) |
| `DFA_Divisible_By_3.jff` | Chamber 5 | 3-state DFA for binary numbers divisible by 3 |
| `DFA_Redundant_Divisible_By_3.jff` | — | 6-state redundant version of Chamber 5 |
| `NFA_Third_Symbol_From_End_1.jff` | Chamber 6 | 4-state NFA for "3rd symbol from end is 1" |
| `DFA_Product_Even_Ones_Divisible_By_3.jff` | Chamber 7 | 6-state product automaton |

## Testing Information and Actual Results

The project includes two test suites, both run via Node.js:

1. **`fold-comprehensive-tests.js`** — 375 assertions covering:
   - Automaton validation and structural checks
   - DFA simulation (Chambers 1, 2, 5, 7)
   - NFA simulation (Chambers 3, 4, 6)
   - Shortest witness generation (Chamber 4)
   - DFA minimisation (Chamber 5)
   - Subset construction NFA → DFA (Chamber 6)
   - Product automaton (Chamber 7)
   - Language comparison and state distinction
   - JFLAP file validation
   - Edge cases and sample strings
   - Epsilon closure

   **Result**: 375/375 assertions passed (100%)

2. **`engine-tests.js`** — 19 assertions covering:
   - Exhaustive testing of 511 binary words (length 0–9) against independent mathematical predicates
   - Timer/timeout behaviour with a deterministic fake clock
   - Retry mechanics and scoring persistence
   - Invalid input handling
   - Progression across chambers
   - Saved progress survival across browser refreshes
   - Quiz results independence from automaton scores
   - Conditional achievement unlocking

   **Result**: 19/19 assertions passed (100%)

**Overall**: 394/394 assertions passed (100%)

No failures were recorded in either test suite. The application also passed manual gameplay verification across all seven chambers, including accepted/rejected strings, hint systems, transition traces, NFA branching, progression, and responsive layout.

## Screenshots

Genuine screenshots from the running application are included in the `Screenshots/` directory. They depict the title screen, corridor/dashboard, chamber gameplay (DFA and NFA traces), state-transition highlights, the hints system, the completion screen, and the responsive layout at different widths. These were captured from the actual browser application and are not generated or faked.

## Limitations and Future Improvements

**Current limitations:**
- JFLAP GUI verification is not performed; language correctness is confirmed by the test suite only
- No difficulty presets (easy/normal/hard) are implemented
- No adaptive difficulty adjustment is present
- The game is designed for mouse/pointer interaction; touch optimisation is not included
- Screenshot evidence requires capture from the actual running application

**Possible future enhancements:**
- Easy / normal / hard mode selections
- Author-defined automata editor
- Epsilon-transition visualiser
- DFA/NFA comparison and conversion exercises
- Classroom analytics or progress export
- Internationalisation (language localisation)
- A secure server-backed competition mode

## Conclusion

FOLD — The Archive is a student-developed educational project that connects the formal theory of finite automata with an interactive, playable experience. It covers DFA and NFA simulation, state folding, subset construction, product automata, and shortest distinguishing witnesses, all within a horror-themed escape-room framework. The project requires no build step, no external dependencies, and runs entirely in the browser. The deliverables include the game, 10 JFLAP model files, a test suite with 394 passing assertions, design documentation, and runtime screenshots. The project has been verified to its stated specifications and is ready for academic submission.

**Institution**: Amrita Vishwa Vidyapeetham, Bengaluru  
**Course**: Formal Languages and Automata Theory — Mini Project  
**Developer**: Student project (names not disclosed)  
**Date**: October 2026

---
*This README was written to accurately describe the implemented features. No features are claimed that are not present in the code. All test results are actual execution results.*
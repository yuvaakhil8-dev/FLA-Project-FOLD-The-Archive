# Automata design specifications

Notation: a DFA is a 5-tuple `M = (Q, Σ, δ, q₀, F)` with `δ: Q × Σ → Q`. An NFA is a 5-tuple with `δ: Q × Σ → 𝒫(Q)`; `𝒫(Q)` denotes the power set of `Q`, including the empty set. Every NFA table entry is a set. `∅` means no next state is possible for that state/symbol pair. For an NFA, the simulator computes the union of all destinations of its active states for each input symbol. It accepts iff the final set intersects `F`.

In each transition table, `→` marks the start state and `*` marks an accepting state. The live diagram and simulator are generated from the same transition data.

## Level 1 — DFA: binary strings ending in 01

- `Q = {q0, q1, q2}`
- `Σ = {0, 1}`
- `q₀ = q0`
- `F = {q2}`
- Language: `L(M) = { w ∈ {0,1}* | w ends with 01 }`

| State | Input 0 | Input 1 |
|---|---|---|
| → q0 | q1 | q0 |
| q1 | q1 | q2 |
| q2 * | q1 | q0 |

The three states record the longest suffix of the input read so far that is also a prefix of `01`: no useful suffix, suffix `0`, or suffix `01`.

Equivalent regular expression: `(0|1)*01`. The repeated binary prefix can have any length; the final two symbols are fixed.

## Level 2 — DFA: even parity except the forbidden exact word 101

- `Q = {I, E, O, P1, P10, X101}`
- `Σ = {0, 1}`
- `q₀ = I`
- `F = {I, E}`
- Language: `L(M) = { w ∈ {0,1}* | w has an even number of 1s } \ {101}`

| State | Input 0 | Input 1 |
|---|---|---|
| → I * | E | P1 |
| E * | E | O |
| O | O | E |
| P1 | P10 | E |
| P10 | O | X101 |
| X101 | E | O |

The empty string `ε` is accepted at `I`. `P1` and `P10` record the prefixes `1` and `10`; `X101` is non-accepting and can only be reached after consuming the exact complete input `101`. Any additional symbol exits that exception state and restores ordinary parity tracking in `E` or `O`. Thus `101` is rejected, but `0101` and `1010` are accepted.

Equivalent regular expression: `ε | (0|11|1010|1000*1|10110*1)(0|10*1)*`. The empty alternative is ε; the remaining blocks generate even-parity strings while excluding only the exact word `101`.

## Level 3 — NFA: strings containing substring ab

- `Q = {p0, p1, p2}`
- `Σ = {a, b}`
- `q₀ = p0`
- `F = {p2}`
- Language: `L(M) = { w ∈ {a,b}* | w contains ab as a substring }`

| State | Input a | Input b |
|---|---|---|
| → p0 | {p0, p1} | {p0} |
| p1 | ∅ | {p2} |
| p2 * | {p2} | {p2} |

In `p0`, reading `a` preserves the scanning path and also guesses that a match begins. The `p1` path must read `b` to reach the accepting `p2`. `p2` consumes every suffix.

Equivalent regular expression: `(a|b)*ab(a|b)*`. The required `ab` may occur anywhere, with any prefix and suffix over `{a,b}`.

## Level 4 — NFA: binary strings containing substring 101

- `Q = {s0, s1, s2, s3}`
- `Σ = {0, 1}`
- `q₀ = s0`
- `F = {s3}`
- Language: `L(M) = { w ∈ {0,1}* | w contains 101 as a substring }`

| State | Input 0 | Input 1 |
|---|---|---|
| → s0 | {s0} | {s0, s1} |
| s1 | {s2} | ∅ |
| s2 | ∅ | {s3} |
| s3 * | {s3} | {s3} |

The scanning path remains in `s0`. On each `1`, the machine also begins a candidate match in `s1`; the guessed path then needs `0` followed by `1` to reach `s3`. The accept state consumes either symbol for the rest of the input.

Equivalent regular expression: `(0|1)*101(0|1)*`. Any binary prefix and suffix may surround an occurrence of `101`.

## Step-by-step simulation

In the game, optional step mode initializes the configuration at `q₀` and consumes exactly one input symbol each time **Next** is selected. **Previous** moves the display cursor through configurations already computed; **Reset Simulation** resets the same input to its initial configuration. The automata engine stores each state set and transition edge, which drives the state diagram and transition-table highlight. Acceptance is submitted only after the complete input has been consumed.

For an NFA, each step computes the union of the destinations from every currently active state. Acceptance is existential: the complete input is accepted if the final active set intersects `F`; it does not require every path to accept.

## Regular-language theory refresher

- **Alphabet (Σ):** finite set of permitted input symbols.
- **State (Q):** finite-memory summary of the part of the input read so far.
- **Initial state (q₀):** configuration before any symbol is consumed; it determines the result for `ε`.
- **Accepting states (F):** DFA accepts if its final state belongs to `F`; NFA accepts if at least one complete path ends in `F`.
- **Transition function (δ):** maps a DFA state and symbol to one state, or an NFA state and symbol to a set of possible states.
- **DFA versus NFA:** a DFA has exactly one active state and one next state per symbol; an NFA can maintain a set of active states and accepts when that set intersects `F` after the whole input.

Each cleared chamber also presents a three-question quiz on its transition rules, language and machine semantics. Quiz results are saved separately from game scores and do not alter automaton behavior.

## JFLAP implementation checklist

1. Create one finite automaton for each tuple above. Draw the stated states and mark `q₀` as the initial state and each state in `F` as final.
2. Add each state/input transition in the corresponding table. For an NFA entry with multiple destinations, draw one same-symbol transition to each destination. For `∅`, draw no edge.
3. In JFLAP's input simulation, verify examples from [`test-cases.md`](test-cases.md), including the empty string at Level 2.
4. Save each `.jff` file and capture the automaton diagram and a representative accepted/rejected simulation for assessment evidence.

# Test cases

| Level | Input | Expected | Reason |
|---|---|---|---|
| 1 | `01` | Accept | Ends in 01 |
| 1 | `101` | Accept | Ends in 01 |
| 1 | `001` | Accept | Ends in 01 |
| 1 | `1101` | Accept | Ends in 01 |
| 1 | `0001` | Accept | Ends in 01 |
| 1 | `ε` | Reject | No ending 01 |
| 1 | `0` | Reject | Does not end in 01 |
| 1 | `1` | Reject | Does not end in 01 |
| 1 | `10` | Reject | Does not end in 01 |
| 1 | `111` | Reject | Does not end in 01 |
| 2 | `ε` | Accept | Zero 1s is even |
| 2 | `0` | Accept | Zero 1s is even |
| 2 | `11` | Accept | Two 1s |
| 2 | `1010` | Accept | Two 1s |
| 2 | `1100` | Accept | Two 1s |
| 2 | `1` | Reject | One 1 (odd) |
| 2 | `10` | Reject | One 1 (odd) |
| 2 | `111` | Reject | Three 1s (odd) |
| 2 | `01` | Reject | One 1 (odd) [Original prompt erratum resolved: '01' intended in place of '101'] |
| 2 | `001` | Reject | One 1 (odd) |
| 2 | `101` | Accept | Two 1s (even); accepted by canonical 2-state DFA E -> O -> O -> E |
| 3 | `ab` | Accept | Contains ab |
| 3 | `aab` | Accept | Contains ab |
| 3 | `abb` | Accept | Contains ab |
| 3 | `bab` | Accept | Contains ab |
| 3 | `aaab` | Accept | Contains ab |
| 3 | `ε` | Reject | Does not contain ab |
| 3 | `a` | Reject | Does not contain ab |
| 3 | `ba` | Reject | Does not contain ab |
| 3 | `bbb` | Reject | Does not contain ab |
| 4 | `101` | Accept | Contains 101 |
| 4 | `0101` | Accept | Contains 101 |
| 4 | `11010` | Accept | Contains 101 |
| 4 | `1011` | Accept | Contains 101 |
| 4 | `00101` | Accept | Contains 101 |
| 4 | `ε` | Reject | Does not contain 101 |
| 4 | `0` | Reject | Does not contain 101 |
| 4 | `10` | Reject | Does not contain 101 |
| 4 | `100` | Reject | Does not contain 101 |
| 4 | `111` | Reject | Does not contain 101 |

Additional checks:

- Invalid symbol: `012` in Level 1 returns a validation error; it is not run as a machine transition or counted as a valid attempt.
- Empty-string aliases: blank input, `ε`, `λ`, and `epsilon` all represent the empty string.
- NFA branching: Level 3 input `a` leaves `{p0, p1}` active simultaneously.
- NFA branching: Level 4 input `1` leaves `{s0, s1}` active simultaneously.
- Missing NFA paths: once no state is active, the empty set remains empty through the rest of the input.
- Input guard: more than 128 symbols produces a visible validation error.
- Progression: completing Level 1 unlocks Level 2, then Level 3, then Level 4.
- Retry: a retry starts a new 180-second challenge timer while retaining the saved performance record.
- Step simulation: each Next action consumes at most one symbol; Previous navigates computed trace frames; Reset Simulation returns to the initial configuration; result/scoring is applied only after the entire input has been consumed.
- Quiz: all three answers are required; explanations appear after submission; best quiz score persists separately and does not change machine acceptance or chamber score.
- Regular expressions are checked over all input words through length eight against independent language predicates.
- Scoring: a correct first-attempt, no-hint solution has `700 + 2 × seconds remaining` points. Each wrong attempt reduces that run's score by 50 and each revealed hint reduces it by 100; the final score cannot fall below zero.

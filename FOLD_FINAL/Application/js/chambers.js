/**
 * FOLD — Chambers Data & Story Specifications
 * Contains the formal definitions, story logs, intercom transmissions,
 * and test fixtures for all seven chambers of The Archive.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ChambersData = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CHAMBERS = [
    {
      id: 1,
      code: 'ARC-01',
      title: 'The First Memory',
      topic: 'DFA and Language Recognition',
      objective: 'Verify that the lock mechanism recognizes sequences ending in 01.',
      story: {
        intro: "You wake on a cold grated floor under flickering red emergency lights. An intercom crackles to life.",
        mara: "Can you hear me? Don't panic. You're inside The Archive—Sub-level 01. The Warden is compressing human memories into state machines. To open this bulkhead, you must feed the terminal a sequence that navigates to the accepting chamber.",
        warden: "Subject detected in Chamber 01. Compression status: Optimal. Deletion of redundant consciousness: Scheduled.",
        log: "ARCHIVE RECORD #0114: 'The machine remembers only what is necessary. A state is not a place; it is a summary of past inputs.'"
      },
      traces: [
        "PRISONER #402: 'I tried entering 10. The machine bounced back to q0. It only unlocks when the last two pulses are strictly 0 then 1.'",
        "RESEARCH LOG: 'State q0 is the ground state. State q1 remembers a recent 0. State q2 marks the target suffix 01.'",
        "MAINTENANCE NOTICE: 'Alphabet is binary {0, 1}. Blank input stays at q0 and is rejected.'"
      ],
      hints: [
        "The machine has 3 states: q0 (ground), q1 (saw 0), and q2 (saw 01).",
        "Only state q2 is accepting. Look at how transitions route: to reach q2, the last transition must be on '1' from q1.",
        "To reach q1, you must provide '0'. Therefore, any string ending with '01' (such as 01, 101, 1101) will open the lock."
      ],
      machine: {
        kind: 'DFA',
        name: 'DFA_Binary_Ends_01',
        title: 'Binary strings ending in 01',
        alphabet: ['0', '1'],
        states: ['q0', 'q1', 'q2'],
        start: 'q0',
        accepting: ['q2'],
        transitions: {
          q0: { '0': 'q1', '1': 'q0' },
          q1: { '0': 'q1', '1': 'q2' },
          q2: { '0': 'q1', '1': 'q0' }
        },
        regex: '(0|1)*01',
        layout: {
          q0: { x: 120, y: 180 },
          q1: { x: 300, y: 90 },
          q2: { x: 480, y: 180 }
        }
      },
      samples: {
        accepted: ['01', '001', '101', '1101', '0001'],
        rejected: ['ε', '0', '1', '10', '11', '100']
      }
    },

    {
      id: 2,
      code: 'ARC-02',
      title: 'The First Fold',
      topic: 'Even Number of Ones & State Equivalence',
      objective: 'Identify the redundant state created by The Warden and fold the machine into its minimal form.',
      story: {
        intro: "Heavy hydraulic doors hiss open into a cold containment lab. Three rooms hum with alternating frequencies.",
        mara: "Look at the terminal. The Warden duplicated one of the memory chambers. Two of these rooms behave identically for every possible future pulse. If you fold them together, the circuit stabilizes.",
        warden: "Redundancy is an anomaly. The Warden maintains three chambers. Merge attempts will be logged as insubordination.",
        log: "ARCHIVE RECORD #0289: 'Two states p and q are equivalent (p ≡ q) if for every string w, δ*(p, w) and δ*(q, w) are either both accepting or both non-accepting.'"
      },
      traces: [
        "PRISONER #409: 'Rooms E1 and E2 both accept. When I send a 0, they just swap between each other. When I send a 1, both drop into room O.'",
        "ENGINEERING NOTE: 'Because E1 and E2 have identical behavior on 1 and stay within {E1, E2} on 0, no sequence of bits can ever distinguish them.'",
        "FOLD INSTRUCTION: 'Select E1 and E2 on the console. Propose a Fold. The system will mathematically verify equivalence.'"
      ],
      hints: [
        "Inspect states E1 and E2: both are accepting states.",
        "From E1 on 0 -> E2; from E2 on 0 -> E1. From both E1 and E2 on 1 -> O. Their future behaviors are identical!",
        "Select E1 and E2 to execute the fold. They merge into the canonical even-parity state E."
      ],
      // The redundant 3-state machine presented to the player
      redundantMachine: {
        kind: 'DFA',
        name: 'DFA_Redundant_Even_Ones',
        title: 'Redundant Even-Parity DFA (3 States)',
        alphabet: ['0', '1'],
        states: ['E1', 'E2', 'O'],
        start: 'E1',
        accepting: ['E1', 'E2'],
        transitions: {
          E1: { '0': 'E2', '1': 'O' },
          E2: { '0': 'E1', '1': 'O' },
          O:  { '0': 'O',  '1': 'E1' }
        },
        layout: {
          E1: { x: 160, y: 120 },
          E2: { x: 160, y: 260 },
          O:  { x: 420, y: 190 }
        }
      },
      // Target canonical 2-state DFA
      machine: {
        kind: 'DFA',
        name: 'DFA_Even_Number_Of_Ones',
        title: 'Canonical Even-Parity DFA (2 States)',
        alphabet: ['0', '1'],
        states: ['E', 'O'],
        start: 'E',
        accepting: ['E'],
        transitions: {
          E: { '0': 'E', '1': 'O' },
          O: { '0': 'O', '1': 'E' }
        },
        regex: '(0|10*1)*',
        layout: {
          E: { x: 180, y: 190 },
          O: { x: 420, y: 190 }
        }
      },
      foldChallenge: {
        equivalentPairs: [['E1', 'E2']],
        targetState: 'E'
      },
      samples: {
        accepted: ['ε', '0', '00', '11', '101', '1010', '1100'],
        rejected: ['1', '10', '111', '01', '001']
      }
    },

    {
      id: 3,
      code: 'ARC-03',
      title: 'The Echo Chamber',
      topic: 'NFA, Branching Shadows & Subset Construction',
      objective: 'Follow the branching shadows of the NFA and understand how active state sets form a DFA.',
      story: {
        intro: "You step into an acoustically dead corridor. Whispers bounce from the walls in multiple directions at once.",
        mara: "Here, reality branches. This is a Nondeterministic Finite Automaton. When you send symbol 'a', your presence splits into multiple echoes. As long as at least one echo reaches an accepting room when your input ends, the exit opens.",
        warden: "Nondeterminism is an illusion of human indecision. The Archive processes all branches concurrently.",
        log: "ARCHIVE RECORD #0342: 'In an NFA, a configuration is not a single point, but a subset of states S ⊆ Q. An input is accepted iff S ∩ F ≠ ∅.'"
      },
      traces: [
        "PRISONER #512: 'When I fed symbol a into p0, two doors opened simultaneously: p0 and p1. I was in both places at once.'",
        "THEORY SCRAP: 'State p0 acts as a scanner. When an 'a' arrives, it guesses that this 'a' might be the start of 'ab'.'",
        "OBSERVATION: 'If the next symbol is 'b', the shadow in p1 transitions to p2 (accepting).'"
      ],
      hints: [
        "The alphabet is {a, b}. The language requires containing the substring 'ab'.",
        "Watch the active state set: upon 'a', state p0 branches to both {p0, p1}.",
        "If followed by 'b', branch p1 moves to p2, which is an absorbing accepting state. Try 'ab' or 'aab'."
      ],
      machine: {
        kind: 'NFA',
        name: 'NFA_Contains_ab',
        title: 'Strings containing substring ab',
        alphabet: ['a', 'b'],
        states: ['p0', 'p1', 'p2'],
        start: 'p0',
        accepting: ['p2'],
        transitions: {
          p0: { 'a': ['p0', 'p1'], 'b': ['p0'] },
          p1: { 'a': [],           'b': ['p2'] },
          p2: { 'a': ['p2'],       'b': ['p2'] }
        },
        regex: '(a|b)*ab(a|b)*',
        layout: {
          p0: { x: 120, y: 180 },
          p1: { x: 300, y: 100 },
          p2: { x: 480, y: 180 }
        }
      },
      samples: {
        accepted: ['ab', 'aab', 'abb', 'bab', 'aaab'],
        rejected: ['ε', 'a', 'b', 'ba', 'bbb']
      }
    },

    {
      id: 4,
      code: 'ARC-04',
      title: "The Warden's Lie",
      topic: 'Distinguishing Strings & Shortest Witness',
      objective: "Disprove The Warden's claim of machine equivalence by generating the shortest witness string.",
      story: {
        intro: "A surveillance monitor flashes. The Warden's synthetic face fills the CRT screen.",
        warden: "Chamber 04 security has been optimized. My modified automaton recognizes all strings containing substring 101. It is mathematically identical to your reference model. Do not attempt to bypass.",
        mara: "The Warden is lying! It dropped a transition to prevent detection of repetitive patterns. We need a witness—a string accepted by the true language but rejected by The Warden's flawed machine.",
        log: "ARCHIVE RECORD #0419: 'To break an AI's false claim of equivalence, construct the product automaton and search for a path to an asymmetric acceptance state.'"
      },
      traces: [
        "PRISONER #610: 'The Warden claims its machine handles 101. But try '1101' or '0101'. Watch where its machine gets stuck.'",
        "RESEARCH LOG: 'The Warden removed the self-loop on 1 at s0 in its machine. Any string with consecutive 1s before 01 will fail in its version.'",
        "WITNESS DIRECTIVE: 'Execute the BFS witness search. Present the string to The Warden to override lockdown.'"
      ],
      hints: [
        "True machine recognizes strings containing '101' anywhere. The Warden's flawed version only transitions s0 -1-> s1 without keeping s0 active.",
        "Consider strings where '1' appears before '101', such as '1101'. In The Warden's machine, the first '1' moves to s1, and the second '1' dies (no transition).",
        "Input '1101' into the Witness Console. The discrepancy will shatter The Warden's lock."
      ],
      // The true NFA
      machine: {
        kind: 'NFA',
        name: 'NFA_Contains_101',
        title: 'Binary strings containing 101 (True Model)',
        alphabet: ['0', '1'],
        states: ['s0', 's1', 's2', 's3'],
        start: 's0',
        accepting: ['s3'],
        transitions: {
          s0: { '0': ['s0'], '1': ['s0', 's1'] },
          s1: { '0': ['s2'], '1': [] },
          s2: { '0': [],     '1': ['s3'] },
          s3: { '0': ['s3'], '1': ['s3'] }
        },
        regex: '(0|1)*101(0|1)*',
        layout: {
          s0: { x: 100, y: 180 },
          s1: { x: 250, y: 100 },
          s2: { x: 400, y: 180 },
          s3: { x: 550, y: 100 }
        }
      },
      // The Warden's flawed machine (dropped self loop on 1 at s0)
      wardenMachine: {
        kind: 'NFA',
        name: 'NFA_Warden_Flawed_101',
        title: "The Warden's Flawed Model (Missing s0 -1-> s0)",
        alphabet: ['0', '1'],
        states: ['s0', 's1', 's2', 's3'],
        start: 's0',
        accepting: ['s3'],
        transitions: {
          s0: { '0': ['s0'], '1': ['s1'] }, // Flaw: missing 's0'
          s1: { '0': ['s2'], '1': [] },
          s2: { '0': [],     '1': ['s3'] },
          s3: { '0': ['s3'], '1': ['s3'] }
        },
        layout: {
          s0: { x: 100, y: 180 },
          s1: { x: 250, y: 100 },
          s2: { x: 400, y: 180 },
          s3: { x: 550, y: 100 }
        }
      },
      witnessChallenge: {
        shortestWitness: '1101',
        trueResult: true,
        wardenResult: false
      },
      samples: {
        accepted: ['101', '0101', '11010', '1011', '00101'],
        rejected: ['ε', '0', '10', '100', '111']
      }
    },

    {
      id: 5,
      code: 'ARC-05',
      title: 'The Six-Room Paradox',
      topic: 'DFA Minimisation & The Table-Filling Algorithm',
      objective: 'Run the Myhill-Nerode table-filling algorithm to merge a 6-room maze into a 3-state minimal DFA.',
      story: {
        intro: "A vast circular laboratory contains six identical hexagonal containment pods labeled A0, B0, A1, B1, A2, B2.",
        mara: "The Warden fragmented a simple 3-state remainder counter into six rooms to confuse intruders. We must fill the state-distinguishability table. Mark pairs that differ in acceptance, propagate differences, and fold the remaining pairs.",
        warden: "Each room stores a unique human soul fragment. Merging them will destroy the distinction.",
        log: "ARCHIVE RECORD #0550: 'Two states are distinguishable if there exists some word w that accepts from one and rejects from the other. The table-filling algorithm is guaranteed to find all distinguishable pairs.'"
      },
      traces: [
        "RESEARCH JOURNAL: 'The language is binary numbers divisible by 3. Canonical states represent remainders {0, 1, 2}.'",
        "TABLE-FILLING LOG: 'Step 0 marks pairs where one state is accepting (A0, B0) and the other is non-accepting.'",
        "FOLD PROOF: 'A0 ≡ B0 (rem 0), A1 ≡ B1 (rem 1), and A2 ≡ B2 (rem 2). Merging them yields exactly 3 states.'"
      ],
      hints: [
        "In the table-filling matrix, state pairs with different acceptance are marked with 'ε' at Step 0.",
        "Check transitions: On input 0, A0 -> B0 and B0 -> A0. On input 1, A0 -> A1 and B0 -> B1. Thus A0 and B0 are indistinguishable!",
        "Complete the table filling to confirm 3 equivalence classes: {A0, B0}, {A1, B1}, and {A2, B2}."
      ],
      // Redundant 6-state DFA
      redundantMachine: {
        kind: 'DFA',
        name: 'DFA_Redundant_Divisible_By_3',
        title: 'Redundant 6-State Divisible by 3 DFA',
        alphabet: ['0', '1'],
        states: ['A0', 'B0', 'A1', 'B1', 'A2', 'B2'],
        start: 'A0',
        accepting: ['A0', 'B0'],
        transitions: {
          A0: { '0': 'B0', '1': 'A1' },
          B0: { '0': 'A0', '1': 'B1' },
          A1: { '0': 'A2', '1': 'B0' },
          B1: { '0': 'B2', '1': 'A0' },
          A2: { '0': 'B1', '1': 'A2' },
          B2: { '0': 'A1', '1': 'B2' }
        },
        layout: {
          A0: { x: 140, y: 120 },
          B0: { x: 140, y: 260 },
          A1: { x: 340, y: 120 },
          B1: { x: 340, y: 260 },
          A2: { x: 540, y: 120 },
          B2: { x: 540, y: 260 }
        }
      },
      // Minimal 3-state DFA
      machine: {
        kind: 'DFA',
        name: 'DFA_Divisible_By_3',
        title: 'Minimal Binary Divisible by 3 DFA (3 States)',
        alphabet: ['0', '1'],
        states: ['rem0', 'rem1', 'rem2'],
        start: 'rem0',
        accepting: ['rem0'],
        transitions: {
          rem0: { '0': 'rem0', '1': 'rem1' },
          rem1: { '0': 'rem2', '1': 'rem0' },
          rem2: { '0': 'rem1', '1': 'rem2' }
        },
        regex: '(0|1(01*0)*1)*',
        layout: {
          rem0: { x: 160, y: 180 },
          rem1: { x: 340, y: 100 },
          rem2: { x: 520, y: 180 }
        }
      },
      tableFillingChallenge: {
        equivalentPairs: [['A0', 'B0'], ['A1', 'B1'], ['A2', 'B2']]
      },
      samples: {
        accepted: ['ε', '0', '00', '11', '110', '1001', '1100'],
        rejected: ['1', '10', '100', '101', '111', '1000']
      }
    },

    {
      id: 6,
      code: 'ARC-06',
      title: 'The Forgotten Position',
      topic: 'Compact NFA & Powerset Expansion (8-State Minimal DFA)',
      objective: 'Observe how a 4-state NFA for "3rd symbol from end is 1" expands to an 8-state minimal DFA.',
      story: {
        intro: "You descend into the deep memory vaults. Holographic projections display binary shifts.",
        mara: "This chamber recognizes strings where the 3rd symbol from the right is '1'. Notice how compact the 4-state NFA is: it simply guesses when it hits the 3rd-from-last symbol, then steps twice more. But to make this machine deterministic, a DFA must memorize the last 3 bits seen—requiring exactly 8 states!",
        warden: "Nondeterministic guessing cannot be executed in hardware without branching or powerset expansion. You will witness the combinatorial cost.",
        log: "ARCHIVE RECORD #0667: 'An n-state NFA can require up to 2^n states in its minimal DFA equivalent. Here, 4 NFA states expand to an irreducible 8-state DFA.'"
      },
      traces: [
        "ARCHIVAL LESSON: 'The NFA states are r0 (scan), r1 (guess: 3rd from end), r2 (2nd from end), r3 (last symbol, accept).'",
        "SUBSET CONSTRUCTION: 'Every reachable subset reflects the sliding window of the last 3 binary digits.'",
        "MINIMALITY: 'Because all 8 3-bit combinations {000, 001, ..., 111} have different acceptance continuation conditions, none can be merged.'"
      ],
      hints: [
        "The language requires the 3rd symbol from the end to be 1. Strings of length < 3 are always rejected.",
        "Valid examples of length 3: 100, 101, 110, 111. All start with 1, which is the 3rd symbol from the end.",
        "Examine the converted DFA: each state represents the last 3 binary bits seen. All 8 states are strictly minimal."
      ],
      // 4-state NFA
      machine: {
        kind: 'NFA',
        name: 'NFA_Third_Symbol_From_End_1',
        title: 'Binary strings whose 3rd symbol from end is 1',
        alphabet: ['0', '1'],
        states: ['r0', 'r1', 'r2', 'r3'],
        start: 'r0',
        accepting: ['r3'],
        transitions: {
          r0: { '0': ['r0'], '1': ['r0', 'r1'] },
          r1: { '0': ['r2'], '1': ['r2'] },
          r2: { '0': ['r3'], '1': ['r3'] },
          r3: { '0': [],     '1': [] }
        },
        regex: '(0|1)*1(0|1)(0|1)',
        layout: {
          r0: { x: 100, y: 180 },
          r1: { x: 260, y: 100 },
          r2: { x: 420, y: 100 },
          r3: { x: 560, y: 180 }
        }
      },
      samples: {
        accepted: ['100', '101', '110', '111', '0100', '1101', '00100', '11101'],
        rejected: ['ε', '0', '1', '10', '010', '011', '000', '1001']
      }
    },

    {
      id: 7,
      code: 'ARC-07',
      title: 'The Product Gate',
      topic: 'Product Automata & Language Intersection',
      objective: 'Synchronize two distinct automata (Even 1s ∩ Divisible by 3) on a 2D product state grid to open the final archive exit.',
      story: {
        intro: "You stand before the massive blast doors of the Core Extraction Gate. Two massive lock wheels are locked in tandem.",
        mara: "This is it—the final gate! The locking mechanism is a Product Automaton. It runs two machines simultaneously: Machine A checks for an even number of 1s, while Machine B checks if the binary value is divisible by 3. The exit unlocks if and only if BOTH conditions are satisfied at the end of the input!",
        warden: "You cannot escape The Archive. The intersection of humanity and logic is empty.",
        log: "ARCHIVE RECORD #0799: 'Product construction M = M_A × M_B computes the intersection L(M_A) ∩ L(M_B). Each state is an ordered pair (s_A, s_B).'"
      },
      traces: [
        "PRISONER #999: 'Look at the 2D grid: 2 states for parity (E, O) times 3 states for divisibility (0, 1, 2) = 6 product states.'",
        "MATHEMATICAL NOTE: 'Transition function: δ((s_A, s_B), b) = (δ_A(s_A, b), δ_B(s_B, b)). Both advance in lockstep.'",
        "ACCEPTANCE RULE: 'Only the pair (E, 0) is accepting: even count of 1s AND remainder 0 modulo 3.'"
      ],
      hints: [
        "A string must satisfy BOTH properties: even number of 1s AND binary number divisible by 3.",
        "Consider '11': Two 1s (even) and binary value 3 (divisible by 3). Accepted!",
        "Consider '101': Two 1s (even), BUT binary value is 5 (5 mod 3 = 2 != 0). Rejected!",
        "Try '1100': Two 1s (even) and binary value 12 (12 mod 3 = 0). Accepted!"
      ],
      // Machine A: Even number of 1s
      machineA: {
        kind: 'DFA',
        name: 'DFA_Even_1s',
        alphabet: ['0', '1'],
        states: ['E', 'O'],
        start: 'E',
        accepting: ['E'],
        transitions: {
          E: { '0': 'E', '1': 'O' },
          O: { '0': 'O', '1': 'E' }
        }
      },
      // Machine B: Divisible by 3
      machineB: {
        kind: 'DFA',
        name: 'DFA_Div_3',
        alphabet: ['0', '1'],
        states: ['0', '1', '2'],
        start: '0',
        accepting: ['0'],
        transitions: {
          '0': { '0': '0', '1': '1' },
          '1': { '0': '2', '1': '0' },
          '2': { '0': '1', '1': '2' }
        }
      },
      // Product DFA
      machine: {
        kind: 'DFA',
        name: 'DFA_Product_Even_Ones_Divisible_By_3',
        title: 'Product Automaton (Even 1s ∩ Divisible by 3)',
        alphabet: ['0', '1'],
        states: ['(E,0)', '(E,1)', '(E,2)', '(O,0)', '(O,1)', '(O,2)'],
        start: '(E,0)',
        accepting: ['(E,0)'],
        transitions: {
          '(E,0)': { '0': '(E,0)', '1': '(O,1)' },
          '(E,1)': { '0': '(E,2)', '1': '(O,0)' },
          '(E,2)': { '0': '(E,1)', '1': '(O,2)' },
          '(O,0)': { '0': '(O,0)', '1': '(E,1)' },
          '(O,1)': { '0': '(O,2)', '1': '(E,0)' },
          '(O,2)': { '0': '(O,1)', '1': '(E,2)' }
        },
        layout: {
          '(E,0)': { x: 160, y: 120 },
          '(E,1)': { x: 340, y: 120 },
          '(E,2)': { x: 520, y: 120 },
          '(O,0)': { x: 160, y: 260 },
          '(O,1)': { x: 340, y: 260 },
          '(O,2)': { x: 520, y: 260 }
        }
      },
      samples: {
        accepted: ['ε', '0', '00', '11', '110', '1001', '1100'],
        rejected: ['1', '10', '100', '101', '111', '1000', '010']
      }
    }
  ];

  return CHAMBERS;
});

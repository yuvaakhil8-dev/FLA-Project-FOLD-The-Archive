(function (root) {
  "use strict";
  let levels = root.LEVELS;
  let engine = root.AutomataEngine;
  const nodeRun = typeof module !== "undefined" && module.exports;

  if (nodeRun) {
    const fs = require("node:fs");
    const path = require("node:path");
    const vm = require("node:vm");
    const context = vm.createContext({ console });
    context.window = context;
    const sourcePath = filename => {
      const appPath = path.join(__dirname, "..", "js", filename);
      return fs.existsSync(appPath) ? appPath : path.join(__dirname, "..", "Application", "js", filename);
    };
    for (const file of ["js/levels.js", "js/automata.js"]) {
      const filename = file.split("/").pop();
      vm.runInContext(fs.readFileSync(sourcePath(filename), "utf8"), context, { filename });
    }
    levels = context.LEVELS;
    engine = context.AutomataEngine;
  }

  const failures = [];
  let total = 0;
  let passed = 0;
  function check(name, actual, expected) {
    total += 1;
    if (actual === expected) {
      passed += 1;
    } else {
      failures.push({ test: name, expected, actual });
    }
  }

  const cases = [
    [1, "01", true], [1, "101", true], [1, "001", true], [1, "1101", true], [1, "10", false], [1, "111", false], [1, "", false],
    [2, "", true], [2, "ε", true], [2, "0", true], [2, "11", true], [2, "1010", true], [2, "1100", true], [2, "1", false], [2, "10", false], [2, "111", false], [2, "01", false], [2, "001", false], [2, "1011", false],
    [2, "0101", true], [2, "00101", true], [2, "101", true],
    [3, "ab", true], [3, "aab", true], [3, "abb", true], [3, "bab", true], [3, "ba", false], [3, "bbb", false], [3, "", false],
    [4, "101", true], [4, "0101", true], [4, "11010", true], [4, "1011", true], [4, "100", false], [4, "111", false], [4, "", false]
  ];

  for (const [id, input, expected] of cases) {
    const result = engine.run(levels[id - 1], input);
    check(`Level ${id}: ${JSON.stringify(input)}`, result.valid && result.accepted, expected);
  }
  for (const level of levels) {
    check(`Level ${level.id} includes five official accepted cases`, level.samples.accepted.length, 5);
    check(`Level ${level.id} includes five official rejected cases`, level.samples.rejected.length, 5);
    for (const input of level.samples.accepted) check(`Level ${level.id} accepted example ${input}`, engine.run(level, input).accepted, true);
    for (const input of level.samples.rejected) check(`Level ${level.id} rejected example ${input}`, engine.run(level, input).accepted, false);
    const empty = engine.run(level, "");
    check(`Level ${level.id} empty-string validity`, empty.valid, true);
    check(`Level ${level.id} empty-string result`, empty.accepted, level.id === 2);
  }
  for (const [id, input] of [[1, "012"], [3, "aabx"], [2, "x"], [4, "1".repeat(129)]]) {
    check(`Level ${id} rejects invalid input ${JSON.stringify(input)}`, engine.run(levels[id - 1], input).valid, false);
  }
  check("Non-string input is reported as invalid", engine.run(levels[0], null).valid, false);
  check("Level 3 keeps both NFA branches after reading a", engine.run(levels[2], "a").trace[1].states.join(","), "p0,p1");
  check("Level 4 keeps both NFA branches after reading 1", engine.run(levels[3], "1").trace[1].states.join(","), "s0,s1");
  check("Level 3 retains its accepting path after extra symbols", engine.run(levels[2], "ababa").finalStates.includes("p2"), true);
  check("A dead NFA branch is pruned while a scanning path remains", engine.run(levels[3], "10").trace[2].states.join(","), "s0,s2");
  for (const [id, word] of [[1, "1101"], [2, "1010"], [3, "aab"], [4, "11010"]]) {
    const level = levels[id - 1];
    const session = engine.createSession(level, word);
    const fullRun = engine.run(level, word);
    check(`Level ${id} step session starts at q0`, session.states[0], level.start);
    check(`Level ${id} cannot finalize unconsumed input`, engine.finishSession(level, session).valid, false);
    while (!session.done) {
      const step = engine.advance(session, level);
      check(`Level ${id} advances one symbol`, step.index, session.index);
      check(`Level ${id} step state matches full trace`, step.states.join(","), fullRun.trace[step.index].states.join(","));
    }
    check(`Level ${id} step session final result matches`, engine.finishSession(level, session).accepted, fullRun.accepted);
  }
  const deadNfa = {
    type: "NFA",
    states: ["a", "b"],
    alphabet: ["x", "y"],
    start: "a",
    accept: ["b"],
    transitions: { a: { x: [], y: ["b"] }, b: { x: [], y: ["b"] } }
  };
  check("An NFA with no active paths stays empty", engine.run(deadNfa, "xx").trace.at(-1).states.length, 0);

  const predicates = [
    word => word.endsWith("01"),
    word => [...word].filter(symbol => symbol === "1").length % 2 === 0,
    word => word.includes("ab"),
    word => word.includes("101")
  ];
  const regexPredicates = levels.map(level => new RegExp(`^(?:${level.regularExpression})$`));
  for (let id = 1; id <= levels.length; id += 1) {
    const alphabet = levels[id - 1].alphabet;
    for (let length = 0; length <= 8; length += 1) {
      const count = alphabet.length ** length;
      for (let value = 0; value < count; value += 1) {
        let number = value;
        let word = "";
        for (let position = 0; position < length; position += 1) {
          word = alphabet[number % alphabet.length] + word;
          number = Math.floor(number / alphabet.length);
        }
        check(`Level ${id} exhaustive string ${JSON.stringify(word)}`, engine.run(levels[id - 1], word).accepted, predicates[id - 1](word));
        check(`Level ${id} regular expression ${JSON.stringify(word)}`, regexPredicates[id - 1].test(word), predicates[id - 1](word));
      }
    }
  }

  const incompleteDfa = { ...levels[0], transitions: { ...levels[0].transitions, q0: { "0": "q1" } } };
  check("Malformed DFA transition table is rejected", engine.run(incompleteDfa, "0").valid, false);

  const summary = { total, passed, failed: failures.length };
  console.log("Automata test summary:", summary);
  if (failures.length) {
    console.error("Automata test failures:", failures.slice(0, 20));
    if (nodeRun) process.exitCode = 1;
  }
  if (nodeRun) module.exports = summary;
  return summary;
})(typeof window !== "undefined" ? window : globalThis);

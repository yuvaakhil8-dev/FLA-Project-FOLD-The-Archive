"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

let now = 1_000_000;
let nextIntervalId = 1;
const intervals = new Map();
const savedValues = new Map();
const fakeLocalStorage = {
  getItem(key) { return savedValues.get(key) ?? null; },
  setItem(key, value) { savedValues.set(key, String(value)); }
};

class FakeDate extends Date {
  static now() { return now; }
}

const context = vm.createContext({
  console,
  Date: FakeDate,
  localStorage: fakeLocalStorage,
  setInterval(callback) {
    const id = nextIntervalId++;
    intervals.set(id, callback);
    return id;
  },
  clearInterval(id) { intervals.delete(id); }
});
context.window = context;
context.dispatchEvent = () => true;
context.CustomEvent = class CustomEvent {};

function load(file) {
  const rootFile = path.join(__dirname, "..", file);
  const applicationFile = path.join(__dirname, "..", "Application", file);
  vm.runInContext(fs.readFileSync(fs.existsSync(rootFile) ? rootFile : applicationFile, "utf8"), context, { filename: file });
}
function advance(seconds) {
  now += seconds * 1000;
  for (const callback of [...intervals.values()]) callback();
}
function accept(level, input) {
  const result = context.GameEngine.submit(input);
  assert.equal(result.valid, true);
  assert.equal(result.accepted, true, `Level ${level.id} must accept ${JSON.stringify(input)}`);
  return result;
}

load("js/levels.js");
load("js/automata.js");
load("js/storage.js");
load("js/game.js");
load("js/quiz.js");

const tickValues = [];
let timeoutCount = 0;
context.GameEngine.setCallbacks({
  onTick: remaining => tickValues.push(remaining),
  onTimeout: () => { timeoutCount += 1; }
});
assert.equal(context.LEVELS.length, 4, "all four challenge specifications load");
assert.deepEqual(Array.from(context.LEVELS.map(level => level.type)), ["DFA", "DFA", "NFA", "NFA"]);
assert.equal(context.GameEngine.formatTime(180), "03:00");

context.GameEngine.start(context.LEVELS[0]);
assert.equal(context.GameEngine.getRemaining(), 180);
const invalid = context.GameEngine.submit("012");
assert.equal(invalid.valid, false, "invalid alphabet input is reported");
assert.equal(context.GameStorage.get().totalAttempts, 0, "invalid alphabet input is not a game attempt");
assert.equal(context.GameEngine.useHint(), true);
advance(10);
assert.equal(context.GameEngine.getRemaining(), 170);
const rejected = context.GameEngine.submit("10");
assert.equal(rejected.valid, true);
assert.equal(rejected.accepted, false);
assert.equal(context.GameStorage.get().levels[1].wrongAttempts, 1);
advance(20);
const firstClear = accept(context.LEVELS[0], "101");
assert.equal(firstClear.seconds, 30);
assert.equal(firstClear.remaining, 150);
assert.equal(firstClear.runHints, 1);
assert.equal(firstClear.score, 850, "score deducts both a wrong attempt and a revealed hint");
assert.equal(context.GameStorage.get().unlocked, 2, "clearing Level 1 unlocks Level 2");
assert.ok(context.GameStorage.get().achievements.includes("first-escape"), "first clear earns First Escape");

context.GameEngine.start(context.LEVELS[0]);
advance(20);
const bestReplay = accept(context.LEVELS[0], "01");
assert.equal(bestReplay.score, 1020);
assert.equal(context.GameStorage.get().levels[1].bestScore, 1020, "a better replay replaces the prior best score");
assert.equal(context.GameStorage.get().totalScore, 1020, "total score uses the best score for the cleared room");

context.GameEngine.start(context.LEVELS[1]);
advance(180);
assert.equal(context.GameEngine.getRemaining(), 0);
assert.equal(timeoutCount, 1, "countdown expiry notifies the game UI");
assert.equal(context.GameEngine.submit("").valid, false, "an expired challenge cannot accept a late string");
context.GameEngine.retry();
assert.equal(context.GameEngine.getRemaining(), 180, "retry starts a fresh three-minute countdown");
advance(5);
now += 180_000;
const lateSubmission = context.GameEngine.submit("11");
assert.equal(lateSubmission.valid, false, "a late submission is blocked even before a timer callback");
assert.equal(timeoutCount, 2, "late submission correctly triggers the timeout callback");
assert.equal(context.GameEngine.getRemaining(), 0);
context.GameEngine.retry();
const emptyStringClear = accept(context.LEVELS[1], "");
assert.equal(emptyStringClear.activeStates.join(","), "E", "Level 2 accepts ε in its accepting start state E");
assert.equal(context.GameStorage.get().unlocked, 3, "clearing Level 2 unlocks Level 3");

context.GameEngine.start(context.LEVELS[2]);
assert.equal(context.GameEngine.useHint(), true);
assert.equal(context.GameEngine.useHint(), true);
assert.equal(context.GameEngine.useHint(), true);
assert.equal(context.GameEngine.useHint(), false, "three hints are the maximum per challenge run");
assert.equal(context.GameStorage.get().hintsUsed, 4);
const rejectedNfa = context.GameEngine.submit("ba");
assert.equal(rejectedNfa.accepted, false);
assert.equal(rejectedNfa.finalStates.includes("p2"), false);
advance(5);
const substringClear = accept(context.LEVELS[2], "ab");
assert.equal(substringClear.finalStates.includes("p2"), true);
assert.equal(substringClear.runHints, 3);
assert.equal(substringClear.runWrongAttempts, 1);
assert.equal(substringClear.score, 700, "all three hint penalties, one wrong attempt and five seconds are calculated");
assert.equal(context.GameStorage.get().unlocked, 4, "clearing Level 3 unlocks Level 4");
assert.equal(context.GameStorage.get().levels[3].hintsUsed, 3);

context.GameEngine.start(context.LEVELS[3]);
const nfaClear = accept(context.LEVELS[3], "101");
assert.deepEqual(Array.from(nfaClear.trace[1].states), ["s0", "s1"], "NFA trace preserves multiple simultaneously active states");
assert.deepEqual(Array.from(nfaClear.trace[2].states), ["s0", "s2"]);
assert.equal(context.GameStorage.get().unlocked, 4, "clearing the final room caps progression at Level 4");
assert.deepEqual(Array.from(context.GameStorage.get().cleared), [1, 2, 3, 4]);
assert.ok(context.GameStorage.get().achievements.includes("dfa-master"));
assert.ok(context.GameStorage.get().achievements.includes("nfa-master"));
assert.ok(context.GameStorage.get().achievements.includes("all-cleared"));
assert.equal(context.GameStorage.get().achievements.includes("perfect-run"), false, "wrong attempts and hints prevent Perfect Run");
assert.equal(context.GameStorage.get().achievements.includes("no-hint-needed"), false, "revealed hints prevent No Hint Needed");

const levelOneQuiz = context.LEVELS[0].quiz;
const quizResult = context.QuizEngine.check(context.LEVELS[0], levelOneQuiz.map(question => question.answer));
assert.equal(quizResult.valid, true);
assert.equal(quizResult.correct, 3);
assert.equal(context.LEVELS[1].quiz[0].answer, 0, "quiz explains empty string acceptance in start state E");
assert.equal(context.LEVELS[1].quiz[1].answer, 1, "quiz explains input 0 preserves parity");
assert.equal(context.LEVELS[1].quiz[2].answer, 1, "quiz explains 1010 has even parity and terminates in E");
assert.equal(context.AutomataEngine.run(context.LEVELS[1], "1010").accepted, true, "1010 is accepted by the 2-state DFA");
assert.equal(context.AutomataEngine.run(context.LEVELS[1], "1").accepted, false, "1 is rejected by the 2-state DFA (odd count)");
const levelTwoQuizResult = context.QuizEngine.check(context.LEVELS[1], context.LEVELS[1].quiz.map(question => question.answer));
assert.equal(levelTwoQuizResult.correct, 3, "the parity quiz answers match the automaton");
assert.equal(context.QuizEngine.check(context.LEVELS[0], [0]).valid, false, "quiz cannot be submitted with missing responses");
assert.equal(context.QuizEngine.check(context.LEVELS[0], [0, null, 2]).valid, false, "every quiz question requires a selected answer");
assert.equal(context.QuizEngine.check(context.LEVELS[0], [0, 99, 2]).valid, false, "quiz answer index must name an available choice");
context.GameStorage.recordQuiz(1, quizResult.correct, quizResult.total);
assert.deepEqual(
  [context.GameStorage.get().levels[1].quizAttempts, context.GameStorage.get().levels[1].quizBest],
  [1, 3],
  "quiz result persists without affecting automaton score"
);

let progress = context.GameStorage.get();
assert.equal(progress.totalAttempts, 7);
assert.equal(progress.correctAttempts, 5);
assert.equal(progress.levels[1].attempts, 3);
assert.equal(progress.levels[3].wrongAttempts, 1);
assert.equal(progress.levels[3].correctAttempts, 1);
assert.equal(progress.hintsUsed, 4);
assert.equal(progress.levels[3].hintsUsed, 3);
assert.equal(progress.totalScore, 1020 + emptyStringClear.score + substringClear.score + nfaClear.score);
assert.equal(progress.bestScore, progress.totalScore);
assert.equal(progress.totalSeconds, 415, "time across completed and retried challenges is accumulated once");
const expectedAccuracy = Math.round(progress.correctAttempts / progress.totalAttempts * 100);
assert.equal(expectedAccuracy, 71);
assert.equal(progress.levels[1].timeSeconds + progress.levels[2].timeSeconds + progress.levels[3].timeSeconds + progress.levels[4].timeSeconds, progress.totalSeconds);
assert.ok(tickValues.includes(180) && tickValues.includes(0), "timer reports initial time and expiration");

const restored = vm.createContext({ console, localStorage: fakeLocalStorage });
restored.window = restored;
restored.dispatchEvent = () => true;
restored.CustomEvent = class CustomEvent {};
const rootStorage = path.join(__dirname, "..", "js/storage.js");
const applicationStorage = path.join(__dirname, "..", "Application", "js", "storage.js");
vm.runInContext(fs.readFileSync(fs.existsSync(rootStorage) ? rootStorage : applicationStorage, "utf8"), restored, { filename: "js/storage.js (refresh)" });
const afterRefresh = restored.GameStorage.get();
assert.equal(afterRefresh.unlocked, 4, "all unlocked rooms survive reload");
assert.equal(afterRefresh.totalScore, progress.totalScore, "aggregate score survives reload");
assert.equal(afterRefresh.bestScore, progress.bestScore, "best performance survives reload");
assert.equal(afterRefresh.totalAttempts, 7);
assert.equal(afterRefresh.totalSeconds, 415);
assert.equal(afterRefresh.levels[1].quizBest, 3, "quiz performance survives reload");
assert.ok(afterRefresh.achievements.includes("all-cleared"), "earned achievements survive reload");
assert.deepEqual(Array.from(afterRefresh.cleared), [1, 2, 3, 4]);

restored.GameStorage.complete(1, 100);
assert.equal(restored.GameStorage.get().levels[1].bestScore, 1020, "a lower-scoring replay cannot overwrite a room best");
assert.equal(restored.GameStorage.get().totalScore, progress.totalScore, "lower replay does not change aggregate best score");
assert.equal(restored.GameStorage.reset(), true, "reset succeeds when browser storage is available");
const reset = restored.GameStorage.get();
assert.equal(reset.unlocked, 1);
assert.deepEqual(Array.from(reset.cleared), []);
assert.equal(reset.totalScore, 0);
assert.equal(reset.totalAttempts, 0);

console.log("Game tests passed: four level loads, countdown/deadline, retries, hints, penalties, scoring, progression, NFA states, quizzes, achievements, persistence and reset.");
context.GameEngine.stop();

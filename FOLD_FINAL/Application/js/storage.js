/**
 * FOLD — Storage Manager
 * Handles local persistence for chamber unlocks, folds, settings,
 * and custom machines in the Machine Construction Workshop.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FoldStorage = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STORAGE_KEY = 'FOLD_ARCHIVE_DATA_V1';

  const DEFAULT_STATE = {
    currentChamberId: 1,
    unlockedChambers: [1],
    completedChambers: [],
    chamberProgress: {
      1: { solved: false, attempts: 0, hintsRevealed: 0, lastInput: '' },
      2: { solved: false, folded: false, attempts: 0, hintsRevealed: 0 },
      3: { solved: false, attempts: 0, hintsRevealed: 0 },
      4: { solved: false, witnessFound: false, attempts: 0, hintsRevealed: 0 },
      5: { solved: false, tableCompleted: false, attempts: 0, hintsRevealed: 0 },
      6: { solved: false, attempts: 0, hintsRevealed: 0 },
      7: { solved: false, gateUnlocked: false, attempts: 0, hintsRevealed: 0 }
    },
    settings: {
      soundEnabled: true,
      reduceMotion: false,
      crtScanlines: true,
      volume: 0.5
    },
    workshop: {
      savedMachines: []
    }
  };

  let memoryStore = null;

  function isLocalStorageAvailable() {
    try {
      const test = '__fold_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  function load() {
    if (memoryStore) return JSON.parse(JSON.stringify(memoryStore));

    if (isLocalStorageAvailable()) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return Object.assign({}, DEFAULT_STATE, parsed, {
            settings: Object.assign({}, DEFAULT_STATE.settings, parsed.settings || {}),
            chamberProgress: Object.assign({}, DEFAULT_STATE.chamberProgress, parsed.chamberProgress || {})
          });
        }
      } catch (err) {
        console.warn('Storage read error, using default state:', err);
      }
    }

    memoryStore = JSON.parse(JSON.stringify(DEFAULT_STATE));
    return JSON.parse(JSON.stringify(memoryStore));
  }

  function save(state) {
    if (isLocalStorageAvailable()) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (err) {
        console.warn('Storage write error, fallback to memory:', err);
      }
    }
    memoryStore = JSON.parse(JSON.stringify(state));
  }

  function updateChamber(chamberId, data) {
    const state = load();
    if (!state.chamberProgress[chamberId]) {
      state.chamberProgress[chamberId] = {};
    }
    Object.assign(state.chamberProgress[chamberId], data);
    save(state);
    return state;
  }

  function unlockChamber(chamberId) {
    const state = load();
    if (!state.unlockedChambers.includes(chamberId)) {
      state.unlockedChambers.push(chamberId);
      state.unlockedChambers.sort((a, b) => a - b);
    }
    state.currentChamberId = chamberId;
    save(state);
    return state;
  }

  function markChamberComplete(chamberId) {
    const state = load();
    if (!state.completedChambers.includes(chamberId)) {
      state.completedChambers.push(chamberId);
      state.completedChambers.sort((a, b) => a - b);
    }
    if (state.chamberProgress[chamberId]) {
      state.chamberProgress[chamberId].solved = true;
    }
    // Auto unlock next chamber if exists
    if (chamberId < 7 && !state.unlockedChambers.includes(chamberId + 1)) {
      state.unlockedChambers.push(chamberId + 1);
      state.unlockedChambers.sort((a, b) => a - b);
    }
    save(state);
    return state;
  }

  function updateSettings(newSettings) {
    const state = load();
    state.settings = Object.assign({}, state.settings, newSettings);
    save(state);
    return state;
  }

  function resetAll() {
    if (isLocalStorageAvailable()) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
    }
    memoryStore = JSON.parse(JSON.stringify(DEFAULT_STATE));
    return memoryStore;
  }

  return {
    load,
    save,
    updateChamber,
    unlockChamber,
    markChamberComplete,
    updateSettings,
    resetAll
  };
});

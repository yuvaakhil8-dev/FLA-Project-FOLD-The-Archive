/**
 * FOLD — Atmospheric Audio Engine
 * Pure procedural sound design using Web Audio API. Zero external audio assets.
 * Connects state changes, branching echoes, folding, and witness discovery
 * to acoustic feedback. Fully optional with global mute toggle.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FoldAudio = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  let ctx = null;
  let enabled = true;
  let masterGain = null;

  function initContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        ctx = new AudioCtx();
        masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.4, ctx.currentTime);
        masterGain.connect(ctx.destination);
      }
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  function setEnabled(flag) {
    enabled = Boolean(flag);
    if (!enabled && ctx && ctx.state === 'running') {
      // Do not close context, just silence
    }
  }

  function isEnabled() {
    return enabled;
  }

  // Helper: Play a synthesized tone envelope
  function playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.3) {
    if (!enabled) return;
    initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  // Keystroke / Cipher Keypad Click
  function playKeyClick() {
    if (!enabled) return;
    playTone(750 + Math.random() * 80, 'triangle', 0.04, 0.2);
  }

  // State Transition Pulse: Frequency derived from state name hash
  function playStatePulse(stateName, isAccepting = false) {
    if (!enabled) return;
    let hash = 0;
    const str = String(stateName);
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const baseFreq = 220 + (Math.abs(hash) % 400);

    if (isAccepting) {
      // Harmonic bright chime for accepting state
      playTone(baseFreq, 'sine', 0.2, 0.25);
      setTimeout(() => playTone(baseFreq * 1.5, 'sine', 0.25, 0.2), 40);
    } else {
      // Subdued industrial blip
      playTone(baseFreq, 'triangle', 0.08, 0.18);
    }
  }

  // NFA Branching Echo (Multiple shadows active)
  function playEchoBranch(activeCount = 2) {
    if (!enabled) return;
    initContext();
    if (!ctx) return;

    try {
      const freqs = [330, 440, 550, 660, 880];
      for (let i = 0; i < Math.min(activeCount, 4); i++) {
        setTimeout(() => {
          playTone(freqs[i % freqs.length], 'sine', 0.18, 0.15);
        }, i * 40);
      }
    } catch (e) {}
  }

  // Acceptance Clearance: Triumphant resolution chord
  function playAcceptClearance() {
    if (!enabled) return;
    const chord = [440, 554.37, 659.25, 880]; // A major
    chord.forEach((freq, idx) => {
      setTimeout(() => {
        playTone(freq, 'sine', 0.4, 0.25);
      }, idx * 70);
    });
  }

  // Rejection Warning: Low dissonant tritone buzzer
  function playRejectKlaxon() {
    if (!enabled) return;
    playTone(130.81, 'sawtooth', 0.25, 0.25); // C3
    playTone(185.0, 'sawtooth', 0.25, 0.25);  // F#3 tritone
  }

  // Folding System: Sub-bass resonance sweep into crystalline lock
  function playFoldSuccess() {
    if (!enabled) return;
    initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(587.33, ctx.currentTime + 0.35); // D5

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);

      setTimeout(() => {
        playTone(880, 'sine', 0.3, 0.3); // High harmonic ping
      }, 350);
    } catch (e) {}
  }

  // The Witness Sonar Ping: Disproving The Warden
  function playWitnessFound() {
    if (!enabled) return;
    playTone(987.77, 'sine', 0.5, 0.35); // B5
    setTimeout(() => playTone(1318.51, 'sine', 0.6, 0.3), 120); // E6
  }

  // Intercom radio crackle
  function playIntercomChirp() {
    if (!enabled) return;
    playTone(1200, 'square', 0.03, 0.1);
    setTimeout(() => playTone(950, 'square', 0.04, 0.1), 40);
  }

  return {
    initContext,
    setEnabled,
    isEnabled,
    playKeyClick,
    playStatePulse,
    playEchoBranch,
    playAcceptClearance,
    playRejectKlaxon,
    playFoldSuccess,
    playWitnessFound,
    playIntercomChirp
  };
});

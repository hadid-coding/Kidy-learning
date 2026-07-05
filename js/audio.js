/* Kidy — audio engine.
   All effects are synthesized with the Web Audio API: soft water drops,
   bird chirps, a low wooden knock. No music, no jingles, no audio files —
   quiet, natural, non-exciting feedback by design. */
const AudioFX = (() => {
  let ctx = null;
  let enabled = true;

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freqFrom, freqTo, start, dur, peak, type = 'sine') {
    const c = ac();
    if (!c || !enabled) return;
    const t0 = c.currentTime + start;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqFrom, t0);
    if (freqTo !== freqFrom) osc.frequency.exponentialRampToValueAtTime(freqTo, t0 + dur * 0.7);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  return {
    setEnabled(v) { enabled = v; },
    unlock() { ac(); },

    /* soft wooden tap — neutral touch feedback */
    tap() { tone(520, 380, 0, 0.09, 0.12, 'triangle'); },

    /* water drop "plip" — correct answer */
    drop() {
      tone(420, 980, 0, 0.16, 0.3);
      tone(840, 1400, 0.02, 0.1, 0.08);
    },

    /* low soft knock — gentle "not this one", never harsh */
    knock() { tone(170, 120, 0, 0.22, 0.14); },

    /* a few quiet bird chirps — level complete */
    birds() {
      tone(2300, 2900, 0.0, 0.11, 0.1);
      tone(2600, 2100, 0.16, 0.1, 0.09);
      tone(2200, 3100, 0.34, 0.13, 0.1);
      tone(2800, 2400, 0.52, 0.09, 0.07);
    },

    /* single soft garden chime — star earned */
    chime() {
      tone(880, 880, 0, 1.1, 0.12);
      tone(1320, 1320, 0.05, 0.9, 0.06);
    },
  };
})();

/* Spoken instructions via the browser's speech synthesis, in the chosen
   language only. Slow rate, warm pitch. Degrades silently if the device
   has no matching voice (text prompts remain visible). */
const Voice = (() => {
  let enabled = true;
  let voices = [];

  function loadVoices() {
    try { voices = speechSynthesis.getVoices(); } catch (e) { voices = []; }
  }
  if ('speechSynthesis' in window) {
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }

  function pick(lang) {
    const p = lang.split('-')[0];
    return voices.find(v => v.lang === lang)
        || voices.find(v => v.lang && v.lang.toLowerCase().startsWith(p))
        || null;
  }

  return {
    setEnabled(v) { enabled = v; if (!v) try { speechSynthesis.cancel(); } catch (e) {} },
    speak(text, lang) {
      if (!enabled || !text || !('speechSynthesis' in window)) return;
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang;
        u.rate = 0.85;
        u.pitch = 1.05;
        const v = pick(lang);
        if (v) u.voice = v;
        speechSynthesis.speak(u);
      } catch (e) { /* no voice available — visual prompts still work */ }
    },
  };
})();

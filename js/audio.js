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

  function noise(start, dur, filterType, freq, peak) {
    const c = ac();
    if (!c || !enabled) return;
    const t0 = c.currentTime + start;
    const len = Math.ceil(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = filterType;
    f.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(c.destination);
    src.start(t0);
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

    /* gentle frying sizzle — cooking game */
    sizzle() {
      noise(0, 2.2, 'highpass', 2500, 0.06);
      noise(0.3, 1.6, 'bandpass', 5000, 0.04);
    },

    /* soft munching bite — the avatar enjoying its meal */
    crunch() {
      noise(0, 0.1, 'lowpass', 900, 0.12);
      noise(0.05, 0.08, 'lowpass', 600, 0.08);
    },

    /* tiny soap bubble pops — washing game */
    bubble() { tone(900, 1500, 0, 0.07, 0.07); },

    /* real-world vehicle sounds — louder than the ambient effects so they
       carry on small phone/tablet speakers */
    siren(kind) {
      if (kind === 'wail') {
        for (let i = 0; i < 2; i++) {
          tone(620, 1150, i * 1.0, 0.55, 0.18);
          tone(1150, 620, i * 1.0 + 0.5, 0.55, 0.18);
        }
      } else if (kind === 'fast') {
        for (let i = 0; i < 4; i++) {
          tone(850, 850, i * 0.36, 0.17, 0.18);
          tone(640, 640, i * 0.36 + 0.18, 0.17, 0.18);
        }
      } else { // slow two-tone (fire truck)
        for (let i = 0; i < 2; i++) {
          tone(470, 470, i * 0.9, 0.42, 0.2);
          tone(590, 590, i * 0.9 + 0.45, 0.42, 0.2);
        }
      }
    },
    horn(low) {
      const f = low ? 180 : 330;
      tone(f, f, 0, 0.45, 0.22, 'triangle');
      tone(f * 1.5, f * 1.5, 0, 0.45, 0.12, 'triangle');
      tone(f, f, 0.6, 0.3, 0.2, 'triangle');
      tone(f * 1.5, f * 1.5, 0.6, 0.3, 0.11, 'triangle');
    },
    engine() {
      noise(0, 1.8, 'lowpass', 140, 0.25);
      for (let i = 0; i < 9; i++) tone(62, 55, i * 0.2, 0.14, 0.18, 'triangle');
    },
    whistle() {
      tone(830, 830, 0, 0.5, 0.16);
      tone(1040, 1040, 0, 0.5, 0.11);
      tone(830, 830, 0.65, 0.7, 0.16);
      tone(1040, 1040, 0.65, 0.7, 0.11);
    },
    clicks() {
      for (let i = 0; i < 5; i++) tone(420 + i * 90, 380 + i * 90, i * 0.16, 0.07, 0.16, 'triangle');
    },
  };
})();

/* Parent voice recordings, stored locally in IndexedDB (never uploaded).
   Keys are "<lang>:<slot>" so each language keeps its own recordings. */
const Rec = (() => {
  function db() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('kidy-voice', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('clips');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  function tx(mode, fn) {
    return db().then(d => new Promise((res, rej) => {
      const t = d.transaction('clips', mode);
      const req = fn(t.objectStore('clips'));
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    })).catch(() => undefined);
  }
  return {
    save: (key, blob) => tx('readwrite', s => s.put(blob, key)),
    load: (key) => tx('readonly', s => s.get(key)),
    del: (key) => tx('readwrite', s => s.delete(key)),
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

  const api = {
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
    /* Plays the parent's own recording for this slot when one exists,
       otherwise falls back to speech synthesis. onEnd (optional) runs when
       the clip/utterance finishes, so callers can chain a spoken word. */
    speakSlot(slot, text, lang, onEnd) {
      if (!enabled) { if (onEnd) onEnd(); return; }
      Rec.load(lang.split('-')[0] + ':' + slot).then(blob => {
        if (blob) {
          try {
            const a = new Audio(URL.createObjectURL(blob));
            if (onEnd) a.onended = onEnd;
            a.play();
            return;
          } catch (e) { /* fall through to TTS */ }
        }
        if (!text || !('speechSynthesis' in window)) { if (onEnd) onEnd(); return; }
        try {
          speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text);
          u.lang = lang;
          u.rate = 0.85;
          u.pitch = 1.05;
          const v = pick(lang);
          if (v) u.voice = v;
          if (onEnd) u.onend = onEnd;
          speechSynthesis.speak(u);
        } catch (e) { if (onEnd) onEnd(); }
      });
    },
  };
  return api;
})();

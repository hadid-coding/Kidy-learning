/* Kidy — app shell: language choice, home, level select, game runner,
   celebration, parent corner (behind a hold-gate) and break reminder. */
(function () {
  const $app = document.getElementById('app');

  const store = {
    get(k, d) {
      try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }
      catch (e) { return d; }
    },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };

  const state = {
    lang: null,
    settings: Object.assign(
      { name: '', voice: true, sfx: true, breakMin: 20, avatar: Object.assign({}, AVATAR_DEFAULT) },
      store.get('kidy-settings-v1', {})
    ),
    // progress is kept per language so each language is a separate journey
    progress: store.get('kidy-progress-v1', {}),
    activeSeconds: 0,
    breakShown: false,
  };
  AudioFX.setEnabled(state.settings.sfx);
  Voice.setEnabled(state.settings.voice);

  function saveSettings() { store.set('kidy-settings-v1', state.settings); }
  function saveProgress() { store.set('kidy-progress-v1', state.progress); }

  function stars(gameId) {
    const p = ((state.progress[state.lang] || {})[gameId] || {});
    return p.stars || [false, false, false];
  }
  function earnStar(gameId, level) {
    const langP = state.progress[state.lang] = state.progress[state.lang] || {};
    const gp = langP[gameId] = langP[gameId] || { stars: [false, false, false] };
    gp.stars[level - 1] = true;
    saveProgress();
  }
  function unlockedLevel(gameId) {
    const s = stars(gameId);
    if (s[0] && s[1]) return 3;
    if (s[0]) return 2;
    return 1;
  }

  const L = () => I18N[state.lang];
  const speak = (text) => Voice.speak(text, L().tts);
  const praiseWord = () => pick1(L().praise);
  // plays the parent's recording when one exists, else speech synthesis
  const speakSlot = (slot, text, onEnd) => Voice.speakSlot(slot, text, L().tts, onEnd);

  /* ---------- screens ---------- */

  function screenLanguage() {
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'fr';
    $app.innerHTML = `
      <div class="screen lang-screen">
        <div class="logo">🌱</div>
        <h1 class="app-name">Kidy</h1>
        <div class="lang-buttons">
          <button class="btn-lang" data-lang="ar" dir="rtl">العربية</button>
          <button class="btn-lang" data-lang="fr">Français</button>
          <button class="btn-lang" data-lang="en">English</button>
        </div>
      </div>`;
    $app.querySelectorAll('.btn-lang').forEach(b =>
      b.addEventListener('click', () => {
        AudioFX.unlock();
        AudioFX.tap();
        state.lang = b.dataset.lang;
        document.documentElement.dir = L().dir;
        document.documentElement.lang = state.lang;
        screenHome();
      }));
  }

  function screenHome() {
    try { speechSynthesis.cancel(); } catch (e) {}
    $app.innerHTML = `
      <div class="screen home-screen">
        <div class="top-bar">
          <span class="top-title"><span class="home-avatar">${avatarSVG(state.settings.avatar)}</span> Kidy</span>
          <button class="btn-parents" id="btn-parents">⚙ ${L().ui.parents}</button>
        </div>
        <h2 class="screen-title">${L().ui.chooseGame}</h2>
        <div class="game-grid">
          ${GAMES.map(g => {
            const s = stars(g.id).filter(Boolean).length;
            return `
            <button class="game-card" data-game="${g.id}" style="background:${g.hue}">
              <span class="game-icon">${g.icon}</span>
              <span class="game-name">${L().games[g.id]}</span>
              <span class="game-stars">${'★'.repeat(s)}<span class="off">${'★'.repeat(3 - s)}</span></span>
            </button>`;
          }).join('')}
        </div>
      </div>`;
    $app.querySelectorAll('.game-card').forEach(c =>
      c.addEventListener('click', () => {
        AudioFX.tap();
        const g = GAMES.find(x => x.id === c.dataset.game);
        speak(L().games[g.id]);
        screenLevels(g);
      }));
    document.getElementById('btn-parents').addEventListener('click', parentGate);
  }

  function screenLevels(game) {
    const unlocked = unlockedLevel(game.id);
    const s = stars(game.id);
    $app.innerHTML = `
      <div class="screen levels-screen">
        <div class="top-bar">
          <button class="btn-home" id="btn-home">🏠</button>
          <span class="top-title">${game.icon} ${L().games[game.id]}</span>
          <span></span>
        </div>
        <div class="level-buttons">
          ${[1, 2, 3].map(n => `
            <button class="btn-level ${n > unlocked ? 'locked' : ''}" data-level="${n}"
              ${n > unlocked ? 'disabled' : ''}>
              <span class="level-num">${n > unlocked ? '🔒' : n}</span>
              <span class="level-label">${fmt(L().ui.level, n)}</span>
              <span class="level-star">${s[n - 1] ? '★' : ''}</span>
            </button>`).join('')}
        </div>
      </div>`;
    document.getElementById('btn-home').addEventListener('click', () => { AudioFX.tap(); screenHome(); });
    $app.querySelectorAll('.btn-level:not(.locked)').forEach(b =>
      b.addEventListener('click', () => {
        AudioFX.tap();
        screenGame(game, +b.dataset.level);
      }));
  }

  function screenGame(game, level) {
    $app.innerHTML = `
      <div class="screen game-screen">
        <div class="top-bar">
          <button class="btn-home" id="btn-back">🏠</button>
          <span class="top-title">${game.icon} ${L().games[game.id]} · ${fmt(L().ui.level, level)}</span>
          <span></span>
        </div>
        <div class="game-area" id="game-area"></div>
      </div>`;
    document.getElementById('btn-back').addEventListener('click', () => {
      AudioFX.tap();
      try { speechSynthesis.cancel(); } catch (e) {}
      screenLevels(game);
    });

    const ctx = {
      area: document.getElementById('game-area'),
      level,
      lang: state.lang,
      L: L(),
      speak,
      sfx: AudioFX,
      praiseWord,
      praise(then) { speakSlot('praise', praiseWord(), then); },
      encourage() { speakSlot('tryAgain', L().ui.tryAgain); },
      avatarCfg: state.settings.avatar,
      saveAvatar(cfg) {
        state.settings.avatar = Object.assign({}, state.settings.avatar, cfg);
        saveSettings();
      },
      complete() { earnStar(game.id, level); celebrate(game, level); },
    };
    game.start(ctx, level);
  }

  function celebrate(game, level) {
    AudioFX.birds();
    setTimeout(() => AudioFX.chime(), 700);
    const name = state.settings.name.trim();
    const overlay = document.createElement('div');
    overlay.className = 'overlay celebrate';
    overlay.innerHTML = `
      <div class="celebrate-box">
        <div class="celebrate-star">★</div>
        <div class="celebrate-avatar">${avatarSVG(state.settings.avatar)}</div>
        <div class="celebrate-text">${L().ui.levelDone}</div>
        <button class="btn-big" id="btn-next">${L().ui.next}</button>
      </div>`;
    $app.appendChild(overlay);
    setTimeout(() => speakSlot('bravo', `${praiseWord()}${name ? ', ' + name : ''}!`), 500);
    overlay.querySelector('#btn-next').addEventListener('click', () => {
      AudioFX.tap();
      overlay.remove();
      screenLevels(game);
    });
  }

  /* ---------- parent gate + settings ---------- */

  function holdButton(btn, onDone, ms = 3000) {
    let timer = null;
    const start = (e) => {
      e.preventDefault();
      btn.classList.add('holding');
      timer = setTimeout(() => { btn.classList.remove('holding'); onDone(); }, ms);
    };
    const cancel = () => {
      btn.classList.remove('holding');
      if (timer) { clearTimeout(timer); timer = null; }
    };
    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', cancel);
    btn.addEventListener('pointerleave', cancel);
    btn.addEventListener('pointercancel', cancel);
  }

  function parentGate() {
    const overlay = document.createElement('div');
    overlay.className = 'overlay gate';
    overlay.innerHTML = `
      <div class="panel">
        <h2>${L().ui.parentsTitle}</h2>
        <button class="btn-big btn-hold" id="gate-hold">
          <span class="hold-fill"></span><span class="hold-label">${L().ui.holdBtn}</span>
        </button>
        <button class="btn-text" id="gate-close">${L().ui.close}</button>
      </div>`;
    $app.appendChild(overlay);
    overlay.querySelector('#gate-close').addEventListener('click', () => overlay.remove());
    holdButton(overlay.querySelector('#gate-hold'), () => {
      overlay.remove();
      screenParents();
    });
  }

  function screenParents() {
    const overlay = document.createElement('div');
    overlay.className = 'overlay gate';
    const u = L().ui;
    overlay.innerHTML = `
      <div class="panel panel-settings">
        <h2>${u.parentsTitle}</h2>
        <label class="field">
          <span>${u.childName}</span>
          <input type="text" id="set-name" maxlength="20"
            placeholder="${u.namePlaceholder}" value="${state.settings.name}">
        </label>
        <label class="field row">
          <span>${u.voice}</span>
          <input type="checkbox" id="set-voice" ${state.settings.voice ? 'checked' : ''}>
        </label>
        <label class="field row">
          <span>${u.sfx}</span>
          <input type="checkbox" id="set-sfx" ${state.settings.sfx ? 'checked' : ''}>
        </label>
        <label class="field row">
          <span>${u.breakAfter}</span>
          <select id="set-break">
            ${[15, 20, 30].map(m =>
              `<option value="${m}" ${state.settings.breakMin === m ? 'selected' : ''}>${m} ${u.minutes}</option>`).join('')}
            <option value="0" ${state.settings.breakMin === 0 ? 'selected' : ''}>${u.never}</option>
          </select>
        </label>
        <div class="field">
          <span>${u.avatarTitle}</span>
          <button class="btn-avatar-edit" id="set-avatar">
            ${avatarSVG(state.settings.avatar)}<span>${u.avatarBtn}</span>
          </button>
        </div>
        <div class="rec-section">
          <h3>🎙️ ${u.recTitle}</h3>
          <p class="rec-hint">${u.recHint}</p>
          <div id="rec-rows"></div>
        </div>
        <div class="method">
          <h3>${u.methodTitle}</h3>
          <p>${u.methodText}</p>
        </div>
        <div class="panel-actions">
          <button class="btn-text" id="set-lang">${u.changeLang}</button>
          <button class="btn-text danger" id="set-reset">${u.resetProgress}</button>
        </div>
        <button class="btn-big" id="set-close">${u.close}</button>
      </div>`;
    $app.appendChild(overlay);

    const q = (id) => overlay.querySelector(id);
    q('#set-avatar').addEventListener('click', () => { overlay.remove(); screenAvatarEditor(); });
    buildRecorder(q('#rec-rows'));
    q('#set-close').addEventListener('click', () => {
      state.settings.name = q('#set-name').value;
      state.settings.voice = q('#set-voice').checked;
      state.settings.sfx = q('#set-sfx').checked;
      state.settings.breakMin = +q('#set-break').value;
      Voice.setEnabled(state.settings.voice);
      AudioFX.setEnabled(state.settings.sfx);
      saveSettings();
      overlay.remove();
      screenHome();
    });
    q('#set-lang').addEventListener('click', () => { overlay.remove(); screenLanguage(); });
    q('#set-reset').addEventListener('click', () => {
      state.progress = {};
      saveProgress();
      q('#set-reset').textContent = L().ui.resetDone;
      q('#set-reset').disabled = true;
    });
  }

  /* ---------- avatar editor (parents corner) ---------- */

  function screenAvatarEditor() {
    const u = L().ui;
    const cfg = Object.assign({}, AVATAR_DEFAULT, state.settings.avatar);
    const overlay = document.createElement('div');
    overlay.className = 'overlay gate';
    $app.appendChild(overlay);

    function render() {
      overlay.innerHTML = `
        <div class="panel avatar-editor">
          <h2>${u.avatarTitle}</h2>
          <div class="mirror small">${avatarSVG(cfg)}</div>
          <div class="field"><span>${u.skin}</span>
            <div class="option-row" data-k="skin">
              ${AVATAR_SKINS.map((c, i) => `<button class="opt dot-opt ${cfg.skin === i ? 'sel' : ''}"
                data-v="${i}" style="background:${c}"></button>`).join('')}
            </div>
          </div>
          <div class="field"><span>${u.hair}</span>
            <div class="option-row" data-k="hair">
              ${AVATAR_HAIR_STYLES.map((s, i) => `<button class="opt av-opt ${cfg.hair === i ? 'sel' : ''}" data-v="${i}">
                ${avatarSVG(Object.assign({}, cfg, { hair: i, head: 'none' }))}</button>`).join('')}
            </div>
          </div>
          <div class="field"><span>${u.colorLbl}</span>
            <div class="option-row" data-k="hairColor">
              ${AVATAR_HAIR_COLORS.map((c, i) => `<button class="opt dot-opt ${cfg.hairColor === i ? 'sel' : ''}"
                data-v="${i}" style="background:${c}"></button>`).join('')}
            </div>
          </div>
          <button class="btn-big" id="av-save">${u.close}</button>
        </div>`;
      overlay.querySelectorAll('.option-row').forEach(row =>
        row.addEventListener('click', (e) => {
          const b = e.target.closest('.opt');
          if (!b) return;
          cfg[row.dataset.k] = +b.dataset.v;
          AudioFX.tap();
          render();
        }));
      overlay.querySelector('#av-save').addEventListener('click', () => {
        state.settings.avatar = cfg;
        saveSettings();
        overlay.remove();
        screenHome();
      });
    }
    render();
  }

  /* ---------- parent voice recorder ---------- */

  function buildRecorder(container) {
    const u = L().ui;
    const slots = ['praise', 'tryAgain', 'bravo', 'break'];
    const key = (slot) => state.lang + ':' + slot;
    let active = null; // { recorder, stream, timer }

    function stopActive() {
      if (!active) return;
      clearTimeout(active.timer);
      try { active.recorder.stop(); } catch (e) {}
      active = null;
    }

    function row(slot, has) {
      return `
        <div class="rec-row" data-slot="${slot}">
          <span class="rec-label">${u.recSlots[slot]}</span>
          <span class="rec-btns">
            <button class="rec-btn rec-do" title="rec">🎙️</button>
            <button class="rec-btn rec-play" ${has ? '' : 'hidden'}>▶️</button>
            <button class="rec-btn rec-del" ${has ? '' : 'hidden'}>🗑️</button>
          </span>
        </div>`;
    }

    Promise.all(slots.map(s => Rec.load(key(s)))).then(blobs => {
      container.innerHTML = slots.map((s, i) => row(s, !!blobs[i])).join('');
      container.addEventListener('click', (e) => {
        const rowEl = e.target.closest('.rec-row');
        if (!rowEl) return;
        const slot = rowEl.dataset.slot;
        const doBtn = rowEl.querySelector('.rec-do');

        if (e.target.closest('.rec-play')) {
          Rec.load(key(slot)).then(b => { if (b) new Audio(URL.createObjectURL(b)).play(); });
          return;
        }
        if (e.target.closest('.rec-del')) {
          Rec.del(key(slot)).then(() => {
            rowEl.querySelector('.rec-play').hidden = true;
            rowEl.querySelector('.rec-del').hidden = true;
          });
          return;
        }
        if (e.target.closest('.rec-do')) {
          if (active) { stopActive(); return; }
          navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            const recorder = new MediaRecorder(stream);
            const chunks = [];
            recorder.ondataavailable = (ev) => chunks.push(ev.data);
            recorder.onstop = () => {
              stream.getTracks().forEach(t => t.stop());
              doBtn.textContent = '🎙️';
              doBtn.classList.remove('recording');
              const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
              Rec.save(key(slot), blob).then(() => {
                rowEl.querySelector('.rec-play').hidden = false;
                rowEl.querySelector('.rec-del').hidden = false;
              });
            };
            recorder.start();
            doBtn.textContent = '⏹️';
            doBtn.classList.add('recording');
            active = { recorder, stream, timer: setTimeout(stopActive, 6000) };
          }).catch(() => { doBtn.textContent = '🚫'; doBtn.title = u.micError; });
        }
      });
    });
  }

  /* ---------- break reminder (healthy screen-time habit) ---------- */

  setInterval(() => {
    if (document.visibilityState !== 'visible' || !state.lang || state.breakShown) return;
    if (!state.settings.breakMin) return;
    state.activeSeconds += 10;
    if (state.activeSeconds >= state.settings.breakMin * 60) showBreak();
  }, 10000);

  function showBreak() {
    state.breakShown = true;
    try { speechSynthesis.cancel(); } catch (e) {}
    const u = L().ui;
    const overlay = document.createElement('div');
    overlay.className = 'overlay break';
    overlay.innerHTML = `
      <div class="panel break-panel">
        <div class="break-tree">🌳</div>
        <h2>${u.breakTitle}</h2>
        <p>${u.breakMsg}</p>
        <button class="btn-big btn-hold" id="break-hold">
          <span class="hold-fill"></span><span class="hold-label">${u.continueHold}</span>
        </button>
      </div>`;
    $app.appendChild(overlay);
    AudioFX.birds();
    speakSlot('break', `${u.breakTitle} ${u.breakMsg}`);
    holdButton(overlay.querySelector('#break-hold'), () => {
      overlay.remove();
      state.activeSeconds = 0;
      state.breakShown = false;
    });
  }

  /* keep the audio context unlocked: iOS/Android suspend it aggressively,
     so resume it inside every user gesture */
  document.addEventListener('pointerdown', () => AudioFX.unlock(), { capture: true, passive: true });

  /* ---------- offline install (PWA) ---------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }

  /* ---------- start ---------- */
  screenLanguage();
})();

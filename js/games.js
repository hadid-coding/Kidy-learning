/* Kidy — the eight foundational games.
   Pedagogy: every game has 3 levels following the same learning ladder —
   Level 1: MATCH (target is shown), Level 2: NAME (target is only spoken),
   Level 3: APPLY (transfer to real objects / harder variants).
   One task on screen, no timers, no failure state: a wrong tap gives a
   soft knock and the child simply tries again. */

/* ---------- small utilities ---------- */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pickN(arr, n) { return shuffle(arr).slice(0, n); }
function pick1(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function fmt(tpl, x) { return tpl.replace('{x}', x).replace('{n}', x); }

/* ---------- visual assets (inline SVG shapes, emoji everywhere else) ---------- */
const COLOR_HEX = {
  red: '#E23D3D', blue: '#3D7BE2', yellow: '#F5D027', green: '#4CAF50',
  orange: '#F28C28', purple: '#9B59B6', pink: '#F48FB1', brown: '#8D6E63',
  black: '#3A3A3A', white: '#FFFFFF',
};
const SHAPE_FILL = {
  circle: '#E2926B', square: '#7FA7C9', triangle: '#8FBA8F', star: '#F2D27E',
  heart: '#E58A9E', rectangle: '#A48BC0', oval: '#6FBFB4', diamond: '#D9A066',
};
const SHAPE_PATH = {
  circle: '<circle cx="50" cy="50" r="38"/>',
  square: '<rect x="14" y="14" width="72" height="72" rx="8"/>',
  triangle: '<path d="M50 12 L90 84 L10 84 Z"/>',
  star: '<path d="M50 8 L61 38 L93 38 L67 57 L77 88 L50 69 L23 88 L33 57 L7 38 L39 38 Z"/>',
  heart: '<path d="M50 86 C20 62 8 44 14 28 C19 15 36 12 50 26 C64 12 81 15 86 28 C92 44 80 62 50 86 Z"/>',
  rectangle: '<rect x="6" y="26" width="88" height="48" rx="8"/>',
  oval: '<ellipse cx="50" cy="50" rx="42" ry="30"/>',
  diamond: '<path d="M50 8 L88 50 L50 92 L12 50 Z"/>',
};
function shapeSVG(id, fill, outline) {
  const style = outline
    ? `fill="#F3EBDB" stroke="#C9BCA4" stroke-width="3" stroke-dasharray="7 6"`
    : `fill="${fill || SHAPE_FILL[id]}"`;
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><g ${style}>${SHAPE_PATH[id]}</g></svg>`;
}
const ANIMAL_EMOJI = {
  cat: '🐱', dog: '🐶', cow: '🐮', horse: '🐴', chicken: '🐔', sheep: '🐑',
  duck: '🦆', rabbit: '🐰', lion: '🦁', elephant: '🐘', monkey: '🐵',
  giraffe: '🦒', fish: '🐟', bird: '🐦', turtle: '🐢', bee: '🐝',
};
const OBJECT_EMOJI = {
  strawberry: '🍓', banana: '🍌', frog: '🐸',
  butterfly: '🦋', orange: '🍊', eggplant: '🍆',
};
const OBJECT_COLOR = {
  strawberry: 'red', banana: 'yellow', frog: 'green',
  butterfly: 'blue', orange: 'orange', eggplant: 'purple',
};
const COUNT_EMOJI = ['🍎', '⭐', '🌸', '🦋', '🐠', '🍓'];
const MEMORY_FACES = ['🍎', '🌼', '🐤', '🍓', '🌙', '⭐', '🐟', '🦋', '🍄', '🐞'];
const PATTERN_POOL = ['🍎', '🍌', '🌸', '🍃', '⭐', '🐟', '🎈', '🦋'];
const SIZE_ITEMS = ['🐻', '🐘', '🦒', '🌳', '🎈', '🌻', '🐟', '🍎'];

/* ---------- shared round engine for tap-the-answer games ---------- */
function runTapRounds(ctx, cfg) {
  const rounds = cfg.rounds || 5;
  let round = 0;
  let last = null; // avoid repeating the same target twice in a row

  function renderRound() {
    let r = cfg.makeRound(ctx.level, last);
    for (let tries = 0; tries < 6 && r.key === last; tries++) r = cfg.makeRound(ctx.level, last);
    last = r.key;

    const dots = Array.from({ length: rounds }, (_, i) =>
      `<span class="dot${i < round ? ' done' : ''}${i === round ? ' now' : ''}"></span>`).join('');

    ctx.area.innerHTML = `
      <div class="prompt-bar">
        <button class="speak-btn" aria-label="repeat">🔊</button>
        ${r.promptVisual ? `<div class="prompt-visual">${r.promptVisual}</div>` : ''}
        <div class="prompt-text">${r.promptText}</div>
      </div>
      ${r.field ? `<div class="round-field">${r.field}</div>` : ''}
      <div class="choices ${r.gridCls || ''}">
        ${r.choices.map((c, i) =>
          `<button class="choice ${c.cls || ''}" data-i="${i}">${c.html}</button>`).join('')}
      </div>
      <div class="progress-dots">${dots}</div>`;

    const speakText = r.speakText || r.promptText;
    ctx.area.querySelector('.speak-btn').addEventListener('click', () => ctx.speak(speakText));
    setTimeout(() => ctx.speak(speakText), 450);

    const grid = ctx.area.querySelector('.choices');
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('.choice');
      if (!btn || grid.classList.contains('lock')) return;
      const c = r.choices[+btn.dataset.i];
      if (c.correct) {
        grid.classList.add('lock');
        btn.classList.add('win');
        grid.querySelectorAll('.choice').forEach(b => { if (b !== btn) b.classList.add('fade'); });
        ctx.sfx.drop();
        const extra = r.onCorrectSpeak ? r.onCorrectSpeak + ' — ' : '';
        ctx.speak(extra + ctx.praiseWord());
        round++;
        setTimeout(() => { round < rounds ? renderRound() : ctx.complete(); }, 1400);
      } else {
        ctx.sfx.knock();
        btn.classList.add('shake');
        ctx.speak(ctx.L.ui.tryAgain);
        setTimeout(() => btn.classList.remove('shake'), 600);
      }
    });
  }
  renderRound();
}

/* ---------- 1. Colors ---------- */
function gameColors(ctx) {
  const W = ctx.L.words.colors;
  const P = ctx.L.prompts;
  runTapRounds(ctx, {
    makeRound(level) {
      if (level < 3) {
        const pool = level === 1
          ? ['red', 'blue', 'yellow', 'green']
          : Object.keys(W);
        const n = level === 1 ? 3 : 4;
        const opts = pickN(pool, n);
        const target = pick1(opts);
        return {
          key: target,
          promptText: fmt(P.tap, W[target][1]),
          promptVisual: level === 1
            ? `<span class="mini-swatch" style="background:${COLOR_HEX[target]}"></span>` : null,
          choices: shuffle(opts.map(c => ({
            html: `<span class="swatch ${c === 'white' ? 'swatch-white' : ''}" style="background:${COLOR_HEX[c]}"></span>`,
            correct: c === target,
          }))),
          gridCls: 'grid-colors',
        };
      }
      // Level 3 — apply: what color is this object?
      const obj = pick1(Object.keys(OBJECT_COLOR));
      const answer = OBJECT_COLOR[obj];
      const others = pickN(Object.keys(W).filter(c => c !== answer), 2);
      return {
        key: obj,
        promptText: fmt(P.colorOf, ctx.L.words.objects[obj]),
        promptVisual: `<span class="prompt-emoji">${OBJECT_EMOJI[obj]}</span>`,
        choices: shuffle([answer, ...others].map(c => ({
          html: `<span class="swatch ${c === 'white' ? 'swatch-white' : ''}" style="background:${COLOR_HEX[c]}"></span>`,
          correct: c === answer,
        }))),
        gridCls: 'grid-colors',
      };
    },
  });
}

/* ---------- 2. Shapes ---------- */
function gameShapes(ctx) {
  const W = ctx.L.words.shapes;
  const P = ctx.L.prompts;
  runTapRounds(ctx, {
    makeRound(level) {
      const pool = level === 1 ? ['circle', 'square', 'triangle']
        : level === 2 ? ['circle', 'square', 'triangle', 'star', 'heart', 'rectangle']
        : Object.keys(W);
      const n = level === 1 ? 3 : level === 2 ? 4 : 6;
      const opts = pickN(pool, n);
      const target = pick1(opts);
      return {
        key: target,
        promptText: fmt(P.tap, W[target][1]),
        promptVisual: level === 1 ? `<span class="mini-shape">${shapeSVG(target)}</span>` : null,
        choices: shuffle(opts.map(s => ({
          html: `<span class="shape-box">${shapeSVG(s)}</span>`,
          correct: s === target,
        }))),
        gridCls: n > 4 ? 'grid-3col' : '',
      };
    },
  });
}

/* ---------- 3. Numbers / counting ---------- */
function gameCounting(ctx) {
  const P = ctx.L.prompts;
  const NUM = ctx.L.words.numbers;
  runTapRounds(ctx, {
    makeRound(level) {
      const max = level === 1 ? 3 : level === 2 ? 5 : 10;
      const min = level === 3 ? 3 : 1;
      const n = min + Math.floor(Math.random() * (max - min + 1));
      const emoji = pick1(COUNT_EMOJI);
      const nChoices = level === 1 ? 3 : 4;
      const opts = new Set([n]);
      while (opts.size < Math.min(nChoices, max)) opts.add(1 + Math.floor(Math.random() * max));
      return {
        key: emoji + n,
        promptText: P.howMany,
        field: `<div class="count-field${n > 5 ? ' small' : ''}">${
          Array.from({ length: n }, () => `<span>${emoji}</span>`).join('')}</div>`,
        choices: shuffle([...opts].map(v => ({
          html: `<span class="num">${v}</span>`,
          correct: v === n,
        }))),
        onCorrectSpeak: NUM[n],
        gridCls: 'grid-nums',
      };
    },
  });
}

/* ---------- 4. Animals ---------- */
const ANIMAL_QA = [
  { q: 'water', a: 'fish', excl: ['duck', 'turtle'] },
  { q: 'fly', a: 'bird', excl: ['bee', 'duck', 'chicken'] },
  { q: 'meow', a: 'cat', excl: [] },
  { q: 'woof', a: 'dog', excl: [] },
  { q: 'neck', a: 'giraffe', excl: [] },
  { q: 'banana', a: 'monkey', excl: [] },
  { q: 'carrot', a: 'rabbit', excl: [] },
  { q: 'milk', a: 'cow', excl: ['sheep'] },
  { q: 'trunk', a: 'elephant', excl: [] },
  { q: 'slow', a: 'turtle', excl: [] },
];
function gameAnimals(ctx) {
  const W = ctx.L.words.animals;
  const P = ctx.L.prompts;
  runTapRounds(ctx, {
    makeRound(level) {
      if (level < 3) {
        const pool = level === 1
          ? ['cat', 'dog', 'cow', 'horse', 'chicken', 'sheep', 'duck', 'rabbit']
          : Object.keys(W);
        const opts = pickN(pool, level === 1 ? 3 : 4);
        const target = pick1(opts);
        return {
          key: target,
          promptText: fmt(P.tap, W[target][1]),
          promptVisual: level === 1 ? `<span class="prompt-emoji">${ANIMAL_EMOJI[target]}</span>` : null,
          choices: shuffle(opts.map(a => ({
            html: `<span class="big-emoji">${ANIMAL_EMOJI[a]}</span>`,
            correct: a === target,
          }))),
        };
      }
      // Level 3 — little riddles (apply knowledge about animals)
      const qa = pick1(ANIMAL_QA);
      const distractors = pickN(
        Object.keys(W).filter(a => a !== qa.a && !qa.excl.includes(a)), 2);
      return {
        key: qa.q,
        promptText: P.animalQ[qa.q],
        choices: shuffle([qa.a, ...distractors].map(a => ({
          html: `<span class="big-emoji">${ANIMAL_EMOJI[a]}</span>`,
          correct: a === qa.a,
        }))),
        onCorrectSpeak: W[qa.a][1],
      };
    },
  });
}

/* ---------- 5. Big and small (size discrimination & seriation) ---------- */
function gameSizes(ctx) {
  const P = ctx.L.prompts;
  runTapRounds(ctx, {
    makeRound(level) {
      const emoji = pick1(SIZE_ITEMS);
      const scales = level === 1 ? [1, 1.9] : [1, 1.5, 2.1];
      const kinds = level === 1 ? ['biggest', 'smallest']
        : level === 2 ? ['biggest', 'smallest']
        : ['biggest', 'smallest', 'middle', 'middle'];
      const kind = pick1(kinds);
      const targetScale = kind === 'biggest' ? Math.max(...scales)
        : kind === 'smallest' ? Math.min(...scales)
        : scales.slice().sort((a, b) => a - b)[1];
      return {
        key: emoji + kind,
        promptText: P[kind],
        choices: shuffle(scales.map(s => ({
          html: `<span class="size-item" style="font-size:${(s * 2.4).toFixed(2)}rem">${emoji}</span>`,
          correct: s === targetScale,
        }))),
        gridCls: 'grid-sizes',
      };
    },
  });
}

/* ---------- 6. Memory (pairs) ---------- */
function gameMemory(ctx) {
  const pairs = ctx.level + 1; // 2 / 3 / 4 pairs
  const faces = pickN(MEMORY_FACES, pairs);
  const deck = shuffle(faces.concat(faces));
  let first = null, lock = false, found = 0;

  ctx.area.innerHTML = `
    <div class="prompt-bar">
      <button class="speak-btn" aria-label="repeat">🔊</button>
      <div class="prompt-text">${ctx.L.prompts.pairs}</div>
    </div>
    <div class="memory-grid cols-${pairs}">
      ${deck.map((f, i) => `
        <button class="mcard" data-i="${i}" data-f="${f}">
          <span class="mcard-inner">
            <span class="mface back">🍃</span>
            <span class="mface front">${f}</span>
          </span>
        </button>`).join('')}
    </div>`;

  ctx.area.querySelector('.speak-btn').addEventListener('click', () => ctx.speak(ctx.L.prompts.pairs));
  setTimeout(() => ctx.speak(ctx.L.prompts.pairs), 450);

  ctx.area.querySelector('.memory-grid').addEventListener('click', (e) => {
    const card = e.target.closest('.mcard');
    if (!card || lock || card.classList.contains('flipped')) return;
    card.classList.add('flipped');
    ctx.sfx.tap();
    if (!first) { first = card; return; }
    const a = first; first = null;
    if (a.dataset.f === card.dataset.f) {
      a.classList.add('matched'); card.classList.add('matched');
      ctx.sfx.drop();
      ctx.speak(ctx.praiseWord());
      found++;
      if (found === pairs) setTimeout(() => ctx.complete(), 900);
    } else {
      lock = true;
      setTimeout(() => {
        a.classList.remove('flipped');
        card.classList.remove('flipped');
        lock = false;
      }, 1100);
    }
  });
}

/* ---------- 7. Puzzle (drag shapes into their outlines) ---------- */
function gamePuzzle(ctx) {
  const boards = 3;
  const nShapes = ctx.level + 1; // 2 / 3 / 4 pieces per board
  let board = 0;

  function renderBoard() {
    const shapes = pickN(Object.keys(SHAPE_PATH), nShapes);
    let placed = 0;

    ctx.area.innerHTML = `
      <div class="prompt-bar">
        <button class="speak-btn" aria-label="repeat">🔊</button>
        <div class="prompt-text">${ctx.L.prompts.puzzle}</div>
      </div>
      <div class="puzzle-slots">
        ${shuffle(shapes).map(s =>
          `<div class="slot" data-shape="${s}">${shapeSVG(s, null, true)}</div>`).join('')}
      </div>
      <div class="puzzle-pieces">
        ${shapes.map(s =>
          `<div class="piece" data-shape="${s}">${shapeSVG(s)}</div>`).join('')}
      </div>
      <div class="progress-dots">${Array.from({ length: boards }, (_, i) =>
        `<span class="dot${i < board ? ' done' : ''}${i === board ? ' now' : ''}"></span>`).join('')}
      </div>`;

    ctx.area.querySelector('.speak-btn').addEventListener('click', () => ctx.speak(ctx.L.prompts.puzzle));
    setTimeout(() => ctx.speak(ctx.L.prompts.puzzle), 450);

    ctx.area.querySelectorAll('.piece').forEach(piece => {
      let sx = 0, sy = 0, dragging = false;
      piece.addEventListener('pointerdown', (e) => {
        if (piece.classList.contains('placed')) return;
        dragging = true;
        sx = e.clientX; sy = e.clientY;
        piece.setPointerCapture(e.pointerId);
        piece.classList.add('dragging');
        ctx.sfx.tap();
      });
      piece.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        piece.style.transform = `translate(${e.clientX - sx}px, ${e.clientY - sy}px) scale(1.12)`;
      });
      piece.addEventListener('pointerup', (e) => {
        if (!dragging) return;
        dragging = false;
        piece.classList.remove('dragging');
        const pr = piece.getBoundingClientRect();
        const cx = pr.left + pr.width / 2, cy = pr.top + pr.height / 2;
        let hit = null;
        ctx.area.querySelectorAll('.slot:not(.filled)').forEach(slot => {
          const r = slot.getBoundingClientRect();
          // generous snap zone for small fingers
          if (cx > r.left - 24 && cx < r.right + 24 && cy > r.top - 24 && cy < r.bottom + 24) hit = slot;
        });
        if (hit && hit.dataset.shape === piece.dataset.shape) {
          hit.classList.add('filled');
          hit.innerHTML = shapeSVG(piece.dataset.shape);
          piece.classList.add('placed');
          piece.style.transform = '';
          ctx.sfx.drop();
          ctx.speak(ctx.praiseWord());
          placed++;
          if (placed === nShapes) {
            board++;
            setTimeout(() => { board < boards ? renderBoard() : ctx.complete(); }, 1300);
          }
        } else {
          if (hit) { ctx.sfx.knock(); ctx.speak(ctx.L.ui.tryAgain); }
          piece.classList.add('returning');
          piece.style.transform = '';
          setTimeout(() => piece.classList.remove('returning'), 450);
        }
      });
      piece.addEventListener('pointercancel', () => {
        dragging = false;
        piece.classList.remove('dragging');
        piece.style.transform = '';
      });
    });
  }
  renderBoard();
}

/* ---------- 8. Patterns (pre-math logic: what comes next?) ---------- */
function gamePatterns(ctx) {
  const P = ctx.L.prompts;
  runTapRounds(ctx, {
    makeRound(level) {
      const items = pickN(PATTERN_POOL, 3);
      const unit = level === 1 ? [items[0], items[1]]
        : level === 2 ? pick1([[items[0], items[0], items[1]], [items[0], items[1], items[1]]])
        : [items[0], items[1], items[2]];
      const shownLen = level === 1 ? 4 : 5;
      const seq = Array.from({ length: shownLen }, (_, i) => unit[i % unit.length]);
      const answer = unit[shownLen % unit.length];
      const choiceSet = level === 1 ? [items[0], items[1]] : items;
      return {
        key: seq.join(''),
        promptText: P.whatNext,
        field: `<div class="pattern-row">${
          seq.map(s => `<span class="pat">${s}</span>`).join('')
        }<span class="pat unknown">?</span></div>`,
        choices: shuffle(choiceSet.map(c => ({
          html: `<span class="big-emoji">${c}</span>`,
          correct: c === answer,
        }))),
      };
    },
  });
}

/* ---------- registry ---------- */
const GAMES = [
  { id: 'colors', icon: '🎨', hue: '#F6D0CB', start: gameColors },
  { id: 'shapes', icon: '🔷', hue: '#CBDcF2', start: gameShapes },
  { id: 'counting', icon: '🔢', hue: '#F4E6BC', start: gameCounting },
  { id: 'animals', icon: '🐘', hue: '#CDE7C8', start: gameAnimals },
  { id: 'sizes', icon: '🐻', hue: '#F3DCC4', start: gameSizes },
  { id: 'memory', icon: '🍃', hue: '#D8EBDB', start: gameMemory },
  { id: 'puzzle', icon: '🧩', hue: '#E5D6EF', start: gamePuzzle },
  { id: 'patterns', icon: '🦋', hue: '#F9E1EB', start: gamePatterns },
];

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
        if (r.onCorrectFx) r.onCorrectFx();
        if (r.onCorrectSpeak) ctx.speak(r.onCorrectSpeak + ' — ' + ctx.praiseWord());
        else ctx.praise();
        round++;
        const wait = r.winDelay || 1400;
        setTimeout(() => { round < rounds ? renderRound() : ctx.complete(); }, wait);
      } else {
        ctx.sfx.knock();
        btn.classList.add('shake');
        ctx.encourage();
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
      ctx.praise();
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
          ctx.praise();
          placed++;
          if (placed === nShapes) {
            board++;
            setTimeout(() => { board < boards ? renderBoard() : ctx.complete(); }, 1300);
          }
        } else {
          if (hit) { ctx.sfx.knock(); ctx.encourage(); }
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

/* ---------- 9. Letters (alphabet of the chosen language) ---------- */
function gameLetters(ctx) {
  const W = ctx.L.words;
  const P = ctx.L.prompts;
  const AB = W.alphabet;
  const nameOf = (ch) => {
    if (!W.letterNames) return ch;
    const i = AB.indexOf(ch);
    return i >= 0 ? W.letterNames[i] : ch;
  };
  runTapRounds(ctx, {
    makeRound(level) {
      if (level < 3) {
        const pool = level === 1 ? AB.slice(0, 10) : AB;
        const opts = pickN(pool, level === 1 ? 3 : 4);
        const target = pick1(opts);
        return {
          key: target,
          promptText: level === 1 ? P.sameLetter : fmt(P.tapLetter, target),
          speakText: level === 1
            ? `${P.sameLetter} : ${nameOf(target)}`
            : fmt(P.tapLetter, nameOf(target)),
          promptVisual: level === 1 ? `<span class="prompt-letter">${target}</span>` : null,
          choices: shuffle(opts.map(l => ({
            html: `<span class="letter">${l}</span>`,
            correct: l === target,
          }))),
        };
      }
      // Level 3 — first-letter awareness: which letter starts this word?
      const [letter, emoji, word] = pick1(W.letterWords);
      const others = pickN(AB.filter(l => l !== letter), 2);
      return {
        key: word,
        promptText: fmt(P.letterFor, word),
        promptVisual: `<span class="prompt-emoji">${emoji}</span>`,
        choices: shuffle([letter, ...others].map(l => ({
          html: `<span class="letter">${l}</span>`,
          correct: l === letter,
        }))),
        onCorrectSpeak: `${nameOf(letter)}… ${word}`,
      };
    },
  });
}

/* ---------- 10. Drawing & coloring ---------- */
const COLORING_PICTURES = {
  fish: {
    vb: '0 0 220 160',
    svg: `
      <ellipse class="region" cx="95" cy="80" rx="55" ry="35"/>
      <path class="region" d="M148 80 L192 52 L192 108 Z"/>
      <path class="region" d="M75 47 Q95 18 115 47 Z"/>
      <circle class="region" cx="185" cy="28" r="9"/>
      <circle class="region" cx="202" cy="50" r="6"/>
      <circle cx="68" cy="72" r="5" fill="#4E4439" stroke="none"/>`,
  },
  flower: {
    vb: '0 0 220 160',
    svg: `
      <g data-group="petals">
        <circle class="region" cx="136" cy="55" r="16"/>
        <circle class="region" cx="123" cy="32" r="16"/>
        <circle class="region" cx="97" cy="32" r="16"/>
        <circle class="region" cx="84" cy="55" r="16"/>
        <circle class="region" cx="97" cy="78" r="16"/>
        <circle class="region" cx="123" cy="78" r="16"/>
      </g>
      <circle class="region" cx="110" cy="55" r="14"/>
      <rect class="region" x="106" y="70" width="8" height="66" rx="4"/>
      <ellipse class="region" cx="88" cy="112" rx="15" ry="7" transform="rotate(-25 88 112)"/>
      <ellipse class="region" cx="132" cy="122" rx="15" ry="7" transform="rotate(25 132 122)"/>`,
  },
  house: {
    vb: '0 0 220 160',
    svg: `
      <rect class="region" x="58" y="75" width="90" height="60"/>
      <path class="region" d="M48 75 L103 36 L158 75 Z"/>
      <rect class="region" x="92" y="103" width="22" height="32" rx="3"/>
      <rect class="region" x="68" y="86" width="18" height="18" rx="2"/>
      <rect class="region" x="120" y="86" width="18" height="18" rx="2"/>
      <circle class="region" cx="190" cy="28" r="14"/>`,
  },
  butterfly: {
    vb: '0 0 220 160',
    svg: `
      <ellipse class="region" cx="80" cy="60" rx="27" ry="23"/>
      <ellipse class="region" cx="140" cy="60" rx="27" ry="23"/>
      <ellipse class="region" cx="84" cy="112" rx="21" ry="17"/>
      <ellipse class="region" cx="136" cy="112" rx="21" ry="17"/>
      <circle class="region" cx="80" cy="60" r="8"/>
      <circle class="region" cx="140" cy="60" r="8"/>
      <circle class="region" cx="84" cy="112" r="6"/>
      <circle class="region" cx="136" cy="112" r="6"/>
      <ellipse class="region" cx="110" cy="85" rx="9" ry="33"/>
      <path d="M104 50 Q96 30 88 24 M116 50 Q124 30 132 24" fill="none" stroke="#4E4439" stroke-width="3" stroke-linecap="round"/>`,
  },
};
const DRAW_PALETTE = ['red', 'blue', 'yellow', 'green', 'orange', 'purple', 'pink', 'brown'];

function paletteHTML(selected) {
  return `<div class="palette">${DRAW_PALETTE.map(c =>
    `<button class="pal-dot ${c === selected ? 'sel' : ''}" data-c="${c}"
       style="background:${COLOR_HEX[c]}"></button>`).join('')}</div>`;
}

function gameDrawing(ctx) {
  const P = ctx.L.prompts;
  let color = 'red';

  if (ctx.level < 3) {
    const pic = COLORING_PICTURES[pick1(ctx.level === 1 ? ['fish', 'flower'] : ['house', 'butterfly'])];
    ctx.area.innerHTML = `
      <div class="prompt-bar">
        <button class="speak-btn" aria-label="repeat">🔊</button>
        <div class="prompt-text">${P.colorIt}</div>
      </div>
      <div class="coloring-wrap">
        <svg viewBox="${pic.vb}">${pic.svg}</svg>
      </div>
      ${paletteHTML(color)}`;
    ctx.area.querySelector('.speak-btn').addEventListener('click', () => ctx.speak(P.colorIt));
    setTimeout(() => ctx.speak(P.colorIt), 450);

    ctx.area.querySelector('.palette').addEventListener('click', (e) => {
      const d = e.target.closest('.pal-dot');
      if (!d) return;
      color = d.dataset.c;
      ctx.area.querySelectorAll('.pal-dot').forEach(x => x.classList.toggle('sel', x === d));
      ctx.sfx.tap();
      ctx.speak(ctx.L.words.colors[color][0]); // color vocabulary while playing
    });
    ctx.area.querySelector('.coloring-wrap svg').addEventListener('click', (e) => {
      const region = e.target.closest('.region');
      if (!region) return;
      const group = region.closest('[data-group]');
      const targets = group ? group.querySelectorAll('.region') : [region];
      targets.forEach(t => { t.setAttribute('fill', COLOR_HEX[color]); t.dataset.done = '1'; });
      ctx.sfx.drop();
      const all = [...ctx.area.querySelectorAll('.region')].every(r => r.dataset.done);
      if (all) setTimeout(() => ctx.complete(), 1000);
    });
    return;
  }

  // Level 3 — free drawing on a canvas
  ctx.area.innerHTML = `
    <div class="prompt-bar">
      <button class="speak-btn" aria-label="repeat">🔊</button>
      <div class="prompt-text">${P.freeDraw}</div>
    </div>
    <div class="canvas-wrap"><canvas class="draw-canvas"></canvas></div>
    <div class="draw-tools">
      ${paletteHTML(color)}
      <button class="tool-btn" data-tool="erase">🧽</button>
      <button class="tool-btn" data-tool="clear">🗑️</button>
      <button class="btn-big btn-done">${ctx.L.ui.done}</button>
    </div>`;
  ctx.area.querySelector('.speak-btn').addEventListener('click', () => ctx.speak(P.freeDraw));
  setTimeout(() => ctx.speak(P.freeDraw), 450);

  const canvas = ctx.area.querySelector('.draw-canvas');
  const wrap = ctx.area.querySelector('.canvas-wrap');
  const dpr = window.devicePixelRatio || 1;
  const w = wrap.clientWidth, h = wrap.clientHeight;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const g = canvas.getContext('2d');
  g.scale(dpr, dpr);
  g.lineCap = g.lineJoin = 'round';
  let erasing = false, drawing = false, drew = false;

  canvas.addEventListener('pointerdown', (e) => {
    drawing = true; drew = true;
    canvas.setPointerCapture(e.pointerId);
    const r = canvas.getBoundingClientRect();
    g.beginPath();
    g.moveTo(e.clientX - r.left, e.clientY - r.top);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    const r = canvas.getBoundingClientRect();
    g.strokeStyle = erasing ? '#FFFFFF' : COLOR_HEX[color];
    g.lineWidth = erasing ? 34 : 14;
    g.lineTo(e.clientX - r.left, e.clientY - r.top);
    g.stroke();
  });
  ['pointerup', 'pointercancel'].forEach(ev => canvas.addEventListener(ev, () => { drawing = false; }));

  ctx.area.querySelector('.palette').addEventListener('click', (e) => {
    const d = e.target.closest('.pal-dot');
    if (!d) return;
    color = d.dataset.c; erasing = false;
    ctx.area.querySelectorAll('.pal-dot').forEach(x => x.classList.toggle('sel', x === d));
    ctx.sfx.tap();
    ctx.speak(ctx.L.words.colors[color][0]);
  });
  ctx.area.querySelectorAll('.tool-btn').forEach(b => b.addEventListener('click', () => {
    ctx.sfx.tap();
    if (b.dataset.tool === 'clear') g.clearRect(0, 0, w, h);
    else erasing = true;
  }));
  ctx.area.querySelector('.btn-done').addEventListener('click', () => {
    if (drew) ctx.complete();
  });
}

/* ---------- 11. Cooking (follow the recipe, cook, serve) ---------- */
const INGREDIENT_EMOJI = {
  bread: '🍞', tomato: '🍅', cheese: '🧀', lettuce: '🥬', meat: '🥩',
  egg: '🥚', cucumber: '🥒', carrot: '🥕', mushroom: '🍄', olive: '🫒',
  pepper: '🫑', dough: '🫓',
};
const RECIPES = [
  { dish: 'sandwich', result: '🥪', steps: ['bread', 'cheese', 'tomato'], extra: ['mushroom', 'egg'] },
  { dish: 'burger', result: '🍔', steps: ['bread', 'meat', 'cheese', 'lettuce', 'tomato'], extra: ['olive', 'cucumber'] },
  { dish: 'pizza', result: '🍕', steps: ['dough', 'tomato', 'cheese', 'mushroom', 'olive', 'pepper'], extra: ['egg', 'carrot'] },
];

function gameCooking(ctx) {
  const P = ctx.L.prompts;
  const W = ctx.L.words.ingredients;
  const R = RECIPES[ctx.level - 1];
  let idx = 0;

  function strip() {
    return R.steps.map((s, i) =>
      `<span class="step ${i < idx ? 'ok' : ''} ${i === idx ? 'next' : ''}">${INGREDIENT_EMOJI[s]}</span>`).join('');
  }

  ctx.area.innerHTML = `
    <div class="prompt-bar">
      <button class="speak-btn" aria-label="repeat">🔊</button>
      <div class="prompt-text">${P.recipeFollow}</div>
    </div>
    <div class="recipe-strip">${strip()}</div>
    <div class="cook-stage">
      <div class="stack"><span class="plate">🍽️</span></div>
    </div>
    <div class="tray">
      ${shuffle(R.steps.concat(R.extra)).map(s =>
        `<button class="choice tray-item" data-id="${s}">
           <span class="big-emoji">${INGREDIENT_EMOJI[s]}</span>
         </button>`).join('')}
    </div>`;
  ctx.area.querySelector('.speak-btn').addEventListener('click', () => ctx.speak(P.recipeFollow));
  setTimeout(() => ctx.speak(P.recipeFollow), 450);

  const stack = ctx.area.querySelector('.stack');
  const tray = ctx.area.querySelector('.tray');

  tray.addEventListener('click', (e) => {
    const item = e.target.closest('.tray-item');
    if (!item || item.disabled) return;
    if (item.dataset.id === R.steps[idx]) {
      item.disabled = true;
      item.classList.add('fade');
      const layer = document.createElement('span');
      layer.className = 'layer';
      layer.textContent = INGREDIENT_EMOJI[item.dataset.id];
      stack.appendChild(layer);
      ctx.sfx.drop();
      ctx.speak(W[item.dataset.id]);
      idx++;
      ctx.area.querySelector('.recipe-strip').innerHTML = strip();
      if (idx === R.steps.length) setTimeout(showCook, 900);
    } else {
      ctx.sfx.knock();
      item.classList.add('shake');
      ctx.encourage();
      setTimeout(() => item.classList.remove('shake'), 600);
    }
  });

  function showCook() {
    tray.innerHTML = `<button class="choice cook-btn"><span class="big-emoji">🍳</span></button>`;
    ctx.speak(P.cookIt);
    tray.querySelector('.cook-btn').addEventListener('click', function () {
      this.disabled = true;
      ctx.sfx.sizzle();
      stack.classList.add('cooking');
      const steam = document.createElement('span');
      steam.className = 'steam';
      steam.textContent = '💨';
      stack.appendChild(steam);
      setTimeout(serve, 2600);
    }, { once: true });
  }

  function serve() {
    ctx.area.querySelector('.cook-stage').innerHTML = `
      <div class="serve-scene">
        <span class="dish-result">${R.result}</span>
        <span class="serve-avatar">${avatarSVG(ctx.avatarCfg)}</span>
      </div>`;
    ctx.area.querySelector('.tray').innerHTML = '';
    ctx.area.querySelector('.recipe-strip').innerHTML = '';
    ctx.sfx.birds();
    ctx.speak(`${P.ready}`);
    setTimeout(() => ctx.complete(), 2600);
  }
}

/* ---------- 12. Vehicles (name → function → mission + motion & sound) ---------- */
const VEHICLE_EMOJI = {
  fire: '🚒', police: '🚓', ambulance: '🚑', bus: '🚌',
  tractor: '🚜', crane: '🏗️', truck: '🚛', train: '🚂',
};
const VEHICLE_SOUND = {
  fire: () => AudioFX.siren('hilo'),
  police: () => AudioFX.siren('wail'),
  ambulance: () => AudioFX.siren('fast'),
  bus: () => AudioFX.horn(false),
  tractor: () => AudioFX.engine(),
  crane: () => AudioFX.clicks(),
  truck: () => AudioFX.horn(true),
  train: () => AudioFX.whistle(),
};
const VEHICLE_MISSIONS = [
  { key: 'fire', scene: '🔥', a: 'fire' },
  { key: 'sick', scene: '🤕', a: 'ambulance' },
  { key: 'school', scene: '🏫', a: 'bus' },
  { key: 'field', scene: '🌾', a: 'tractor' },
  { key: 'heavy', scene: '🧱', a: 'crane' },
];

function gameVehicles(ctx) {
  const W = ctx.L.words.vehicles;
  const P = ctx.L.prompts;
  const IDS = Object.keys(VEHICLE_EMOJI);

  if (ctx.level < 3) {
    runTapRounds(ctx, {
      makeRound(level) {
        if (level === 1) {
          const opts = pickN(IDS, 3);
          const target = pick1(opts);
          return {
            key: target,
            promptText: fmt(P.tap, W[target][1]),
            promptVisual: `<span class="prompt-emoji">${VEHICLE_EMOJI[target]}</span>`,
            choices: shuffle(opts.map(v => ({
              html: `<span class="big-emoji">${VEHICLE_EMOJI[v]}</span>`,
              correct: v === target,
            }))),
            onCorrectFx: () => setTimeout(() => VEHICLE_SOUND[target](), 350),
            winDelay: 2400,
          };
        }
        const target = pick1(IDS);
        const opts = shuffle([target, ...pickN(IDS.filter(v => v !== target), 2)]);
        return {
          key: target,
          promptText: P.vehicleQ[target],
          choices: opts.map(v => ({
            html: `<span class="big-emoji">${VEHICLE_EMOJI[v]}</span>`,
            correct: v === target,
          })),
          onCorrectFx: () => setTimeout(() => VEHICLE_SOUND[target](), 350),
          onCorrectSpeak: W[target][1],
          winDelay: 2400,
        };
      },
    });
    return;
  }

  // Level 3 — missions: pick the right vehicle, watch it drive off with its sound
  const missions = shuffle(VEHICLE_MISSIONS);
  let m = 0;

  function renderMission() {
    const mission = missions[m];
    const opts = shuffle([mission.a, ...pickN(IDS.filter(v => v !== mission.a), 2)]);
    const dots = missions.map((_, i) =>
      `<span class="dot${i < m ? ' done' : ''}${i === m ? ' now' : ''}"></span>`).join('');
    ctx.area.innerHTML = `
      <div class="prompt-bar">
        <button class="speak-btn" aria-label="repeat">🔊</button>
        <div class="prompt-visual"><span class="prompt-emoji">${mission.scene}</span></div>
        <div class="prompt-text">${P.missions[mission.key]}</div>
      </div>
      <div class="road"></div>
      <div class="choices">
        ${opts.map((v, i) => `<button class="choice" data-i="${i}">
           <span class="big-emoji">${VEHICLE_EMOJI[v]}</span></button>`).join('')}
      </div>
      <div class="progress-dots">${dots}</div>`;
    ctx.area.querySelector('.speak-btn').addEventListener('click', () => ctx.speak(P.missions[mission.key]));
    setTimeout(() => ctx.speak(P.missions[mission.key]), 450);

    const grid = ctx.area.querySelector('.choices');
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('.choice');
      if (!btn || grid.classList.contains('lock')) return;
      const v = opts[+btn.dataset.i];
      if (v === mission.a) {
        grid.classList.add('lock');
        btn.classList.add('win');
        ctx.sfx.drop();
        const road = ctx.area.querySelector('.road');
        road.innerHTML = `<span class="veh">${VEHICLE_EMOJI[v]}</span>`;
        VEHICLE_SOUND[v]();
        ctx.praise();
        m++;
        setTimeout(() => { m < missions.length ? renderMission() : ctx.complete(); }, 3100);
      } else {
        ctx.sfx.knock();
        btn.classList.add('shake');
        ctx.encourage();
        setTimeout(() => btn.classList.remove('shake'), 600);
      }
    });
  }
  renderMission();
}

/* ---------- 13. Dress up (wardrobe, mirror — pretend play) ---------- */
const CLOTHES_POOL = ['☂️', '🧥', '👒', '👟', '🧤', '🧣', '👗', '👑', '🕶️', '🧢'];
const WEATHER_QA = [
  { key: 'rain', a: '☂️' }, { key: 'cold', a: '🧥' }, { key: 'sun', a: '👒' },
  { key: 'feet', a: '👟' }, { key: 'hands', a: '🧤' }, { key: 'neck', a: '🧣' },
];
const OUTFIT_QA = [
  { key: 'ball', a: '👗👑', pool: ['🧥🥾', '👕👟'] },
  { key: 'hero', a: '🦸', pool: ['👗👑', '🧥☂️'] },
  { key: 'sport', a: '👕👟', pool: ['👗👑', '🧥🧣'] },
  { key: 'rain', a: '🧥☂️', pool: ['👒🕶️', '👕👟'] },
];

function gameDressup(ctx) {
  const P = ctx.L.prompts;

  if (ctx.level === 1) {
    // mirror mode: free dress-up of the child's own avatar
    const cfg = Object.assign({}, ctx.avatarCfg);
    function render() {
      ctx.area.innerHTML = `
        <div class="prompt-bar">
          <button class="speak-btn" aria-label="repeat">🔊</button>
          <div class="prompt-text">${P.mirror}</div>
        </div>
        <div class="mirror">${avatarSVG(cfg, 'mirror-avatar')}</div>
        <div class="wardrobe">
          <div class="option-row" data-k="outfit">
            ${AVATAR_OUTFITS.map(o => `<button class="opt ${cfg.outfit === o ? 'sel' : ''}" data-v="${o}">
              ${o === 'shirt' ? '👕' : o === 'dress' ? '👗' : '🦸'}</button>`).join('')}
          </div>
          <div class="option-row" data-k="head">
            ${AVATAR_HEADWEAR.map(hw => `<button class="opt ${cfg.head === hw ? 'sel' : ''}" data-v="${hw}">
              ${hw === 'none' ? '∅' : hw === 'crown' ? '👑' : hw === 'hat' ? '👒' : '🎭'}</button>`).join('')}
          </div>
          <div class="option-row" data-k="outfitColor">
            ${AVATAR_OUTFIT_COLORS.map((cc, i) => `<button class="opt dot-opt ${cfg.outfitColor === i ? 'sel' : ''}"
              data-v="${i}" style="background:${cc}"></button>`).join('')}
          </div>
          <button class="btn-big btn-done">${ctx.L.ui.done}</button>
        </div>`;
      ctx.area.querySelector('.speak-btn').addEventListener('click', () => ctx.speak(P.mirror));
      ctx.area.querySelectorAll('.option-row').forEach(row =>
        row.addEventListener('click', (e) => {
          const b = e.target.closest('.opt');
          if (!b) return;
          const k = row.dataset.k;
          cfg[k] = k === 'outfitColor' ? +b.dataset.v : b.dataset.v;
          ctx.sfx.tap();
          render();
        }));
      ctx.area.querySelector('.btn-done').addEventListener('click', () => {
        ctx.saveAvatar(cfg); // the outfit stays on their avatar everywhere
        ctx.complete();
      });
    }
    render();
    setTimeout(() => ctx.speak(P.mirror), 450);
    return;
  }

  // levels 2 & 3: dress for the weather / for the occasion
  runTapRounds(ctx, {
    makeRound(level) {
      if (level === 2) {
        const qa = pick1(WEATHER_QA);
        const others = pickN(CLOTHES_POOL.filter(c => c !== qa.a), 2);
        return {
          key: qa.key,
          promptText: P.weatherQ[qa.key],
          choices: shuffle([qa.a, ...others].map(c => ({
            html: `<span class="big-emoji">${c}</span>`,
            correct: c === qa.a,
          }))),
        };
      }
      const qa = pick1(OUTFIT_QA);
      return {
        key: qa.key,
        promptText: P.outfitQ[qa.key],
        choices: shuffle([qa.a, ...qa.pool].map(c => ({
          html: `<span class="outfit-combo">${c}</span>`,
          correct: c === qa.a,
        }))),
      };
    },
  });
}

/* ---------- registry ---------- */
const GAMES = [
  { id: 'colors', icon: '🎨', hue: '#F6D0CB', start: gameColors },
  { id: 'shapes', icon: '🔷', hue: '#CBDCF2', start: gameShapes },
  { id: 'counting', icon: '🔢', hue: '#F4E6BC', start: gameCounting },
  { id: 'letters', icon: '🔤', hue: '#F5E0C8', start: gameLetters },
  { id: 'animals', icon: '🐘', hue: '#CDE7C8', start: gameAnimals },
  { id: 'vehicles', icon: '🚒', hue: '#CFE3EE', start: gameVehicles },
  { id: 'sizes', icon: '🐻', hue: '#F3DCC4', start: gameSizes },
  { id: 'memory', icon: '🍃', hue: '#D8EBDB', start: gameMemory },
  { id: 'puzzle', icon: '🧩', hue: '#E5D6EF', start: gamePuzzle },
  { id: 'patterns', icon: '🦋', hue: '#F9E1EB', start: gamePatterns },
  { id: 'cooking', icon: '🍳', hue: '#F4E0B9', start: gameCooking },
  { id: 'drawing', icon: '🖍️', hue: '#F9D8D0', start: gameDrawing },
  { id: 'dressup', icon: '👗', hue: '#EFD7E8', start: gameDressup },
];

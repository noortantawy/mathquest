/* MathQuest 7: UI, progress and screens. Everything is saved in the browser (localStorage). */
(function (MQ) {
  'use strict';

  const { num, MINUS } = MQ.fmt;
  const app = document.getElementById('app');
  const headerEl = document.getElementById('status');
  const KEY = 'mathquest7.v1';

  /* ---------- Progress ---------- */
  const RANKS = [
    [0, 'Rookie'], [100, 'Number Ninja'], [300, 'Equation Explorer'], [600, 'Algebra Adventurer'], [1000, 'Math Wizard'],
  ];
  const fresh = () => ({ name: '', xp: 0, streak: 0, last: '', levels: {}, unlockAll: false });
  let S = load();

  function load() {
    try { return Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { return fresh(); }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* private mode: progress just won't persist */ }
  }
  const dayKey = (d) => d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  function touchStreak() {
    const today = dayKey(new Date());
    if (S.last === today) return;
    const y = new Date();
    y.setDate(y.getDate() - 1);
    S.streak = S.last === dayKey(y) ? S.streak + 1 : 1;
    S.last = today;
  }
  function rank() {
    let i = 0;
    RANKS.forEach((r, idx) => { if (S.xp >= r[0]) i = idx; });
    const next = RANKS[i + 1];
    return { title: RANKS[i][1], from: RANKS[i][0], next: next ? next[0] : null };
  }
  const stars = (id) => (S.levels[id] ? S.levels[id].stars : 0);
  function isUnlocked(world, i) {
    return S.unlockAll || i === 0 || stars(world.levels[i - 1].id) > 0;
  }
  function allLevels() {
    const out = [];
    MQ.WORLDS.forEach((w) => w.levels.forEach((l, i) => out.push({ w, l, i })));
    return out;
  }
  function nextToPlay() {
    return allLevels().find(({ w, l, i }) => isUnlocked(w, i) && !stars(l.id)) || null;
  }
  function levelAfter(id) {
    const all = allLevels();
    const idx = all.findIndex((x) => x.l.id === id);
    return all[idx + 1] || null;
  }
  function recordLevel(id, earned, bonusXp) {
    const prev = S.levels[id];
    const first = !prev || !prev.stars;
    if (!prev || earned > prev.stars) S.levels[id] = { stars: earned };
    S.xp += bonusXp + (first && earned ? 20 : 0);
    touchStreak();
    save();
    return first && earned ? 20 : 0;
  }

  /* ---------- Small helpers ---------- */
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const starRow = (n, total = 3) =>
    '<span class="stars" aria-label="' + n + ' of ' + total + ' stars">' +
    Array.from({ length: total }, (_, i) => `<span class="${i < n ? 'on' : ''}">★</span>`).join('') + '</span>';
  const PRAISE = ['Nice!', 'Correct!', 'Great job!', 'Spot on!', 'You got it!', 'Brilliant!', 'Yes!'];
  const pick = MQ.fmt.pick;

  function confetti() {
    const wrap = document.createElement('div');
    wrap.className = 'confetti';
    wrap.setAttribute('aria-hidden', 'true');
    const colours = ['#6c5ce7', '#00a884', '#e17055', '#0984e3', '#fdcb6e', '#e84393'];
    for (let i = 0; i < 40; i++) {
      const p = document.createElement('i');
      p.style.left = Math.random() * 100 + '%';
      p.style.background = colours[i % colours.length];
      p.style.animationDelay = Math.random() * 0.4 + 's';
      p.style.animationDuration = 1.6 + Math.random() * 1.2 + 's';
      wrap.appendChild(p);
    }
    document.body.appendChild(wrap);
    setTimeout(() => wrap.remove(), 3200);
  }

  /* ---------- Router ---------- */
  let view = { name: 'home' };
  function go(name, params) {
    view = Object.assign({ name }, params);
    render();
    window.scrollTo(0, 0);
  }
  function render() {
    renderStatus();
    ({ home, intro, quiz, balance, result })[view.name]();
  }

  function renderStatus() {
    const r = rank();
    const pct = r.next ? Math.min(100, ((S.xp - r.from) / (r.next - r.from)) * 100) : 100;
    headerEl.innerHTML =
      `<span class="chip-status" title="Your rank">${esc(r.title)}</span>` +
      `<span class="chip-status" title="Experience points">✨ ${S.xp} XP</span>` +
      (S.streak > 1 ? `<span class="chip-status" title="Days in a row">🔥 ${S.streak}</span>` : '') +
      `<span class="xpbar" title="${r.next ? r.next - S.xp + ' XP to next rank' : 'Top rank!'}"><span style="width:${pct}%"></span></span>`;
  }

  /* ---------- Home / map ---------- */
  function home() {
    const total = allLevels().length;
    const done = allLevels().filter(({ l }) => stars(l.id)).length;
    const next = nextToPlay();
    let h = '';
    if (!S.name) {
      h += `<section class="card hello">
        <h1>Welcome to MathQuest 7 👋</h1>
        <p>Short, friendly practice to help you catch up in maths. Learn a tip, try a few questions, and earn stars. What should we call you?</p>
        <form data-form="name" class="inline"><input id="name" type="text" maxlength="20" placeholder="Your name" autocomplete="given-name" required>
        <button class="primary" type="submit">Let’s go</button></form>
      </section>`;
    } else {
      h += `<section class="card hello">
        <h1>Hi ${esc(S.name)}! 👋</h1>
        <p>${done === 0 ? 'Pick a world below, or start with the recommended level.' : `You’ve completed <b>${done}</b> of ${total} levels. Keep going!`}</p>
        ${next ? `<button class="primary" data-act="open" data-w="${next.w.id}" data-l="${next.l.id}">${done === 0 ? 'Start' : 'Continue'}: ${esc(next.l.name)}</button>` : '<p><b>🎉 You’ve finished everything!</b> Replay any level to earn more stars.</p>'}
      </section>`;
    }
    MQ.WORLDS.forEach((w) => {
      const wStars = w.levels.reduce((s, l) => s + stars(l.id), 0);
      h += `<section class="world${w.featured ? ' featured' : ''}" style="--wc:${w.color};--wt:${w.dark ? '#2d3436' : '#fff'}">
        <header><span class="emoji" aria-hidden="true">${w.emoji}</span><div><h2>${esc(w.name)}</h2><p>${esc(w.blurb)}</p></div>
        <span class="wstars">★ ${wStars}/${w.levels.length * 3}</span></header>
        <div class="levels">`;
      w.levels.forEach((l, i) => {
        const open = isUnlocked(w, i);
        const n = stars(l.id);
        h += `<button class="level${n ? ' done' : ''}" data-act="open" data-w="${w.id}" data-l="${l.id}" ${open ? '' : 'disabled'}>
          <span class="lname">${l.type === 'balance' ? '⚖️ ' : ''}${esc(l.name)}</span>
          ${open ? starRow(n) : '<span class="lock" aria-label="Locked">🔒 Finish the one before</span>'}
        </button>`;
      });
      h += '</div></section>';
    });
    h += `<footer class="foot"><button class="link" data-act="unlock">${S.unlockAll ? 'Lock levels again' : 'Unlock all levels (for parents/teachers)'}</button>
      <button class="link" data-act="reset">Reset progress</button></footer>`;
    app.innerHTML = h;
  }

  /* ---------- Level intro ---------- */
  function intro() {
    const { w, l } = findLevel(view.l);
    app.innerHTML = `<section class="card intro" style="--wc:${w.color}">
      <button class="link" data-act="home">← Back to map</button>
      <p class="eyebrow">${w.emoji} ${esc(w.name)}</p>
      <h1>${esc(l.name)}</h1>
      <div class="tip"><h3>💡 Quick tip</h3><p>${l.tip}</p></div>
      <p class="meta">${l.type === 'balance' ? `${MQ.PUZZLES_PER_LEVEL} balance puzzles. Fewer moves means more stars.` : `${MQ.QUIZ_LENGTH} questions. Get ${MQ.PASS_MARK} right to pass. Get them all right for 3 stars.`}</p>
      <button class="primary big" data-act="start">Start</button>
    </section>`;
  }
  function findLevel(id) {
    const f = allLevels().find((x) => x.l.id === id);
    return { w: f.w, l: f.l };
  }

  /* ---------- Quiz ---------- */
  let Q = null;
  function startQuiz(w, l) {
    const items = [];
    const seen = new Set();
    let guard = 0;
    while (items.length < MQ.QUIZ_LENGTH && guard++ < 200) {
      const g = l.gens[items.length % l.gens.length];
      const q = MQ.gen[g]();
      if (seen.has(q.q)) continue;
      seen.add(q.q);
      items.push(q);
    }
    Q = { w, l, items, i: 0, correct: 0, xp: 0, answered: false, hinted: false };
    go('quiz');
  }

  function quiz() {
    const q = Q.items[Q.i];
    const pct = (Q.i / Q.items.length) * 100;
    let input;
    if (q.kind === 'choice') {
      input = `<div class="choices">${q.options.map((o, i) => `<button class="choice" data-act="choose" data-i="${i}">${esc(o)}</button>`).join('')}</div>`;
    } else {
      input = `<div class="answer-row"><input id="ans" type="text" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type your answer" aria-label="Your answer">
        ${q.unit ? `<span class="unit">${esc(q.unit)}</span>` : ''}</div>`;
    }
    app.innerHTML = `<section class="card quiz" style="--wc:${Q.w.color}">
      <div class="topbar"><button class="link" data-act="quit">✕ Quit</button>
        <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${Q.items.length}" aria-valuenow="${Q.i}"><span style="width:${pct}%"></span></div>
        <span class="count">${Q.i + 1}/${Q.items.length}</span></div>
      <h2 class="question">${q.q}</h2>
      ${q.note ? `<p class="note">${esc(q.note)}</p>` : ''}
      ${input}
      <div id="feedback" class="feedback" aria-live="polite"></div>
      <div class="actions">
        <button class="ghost" id="hintBtn" data-act="hint">💡 Hint</button>
        ${q.kind === 'choice' ? '' : '<button class="primary" id="primary" data-act="check">Check</button>'}
      </div></section>`;
    Q.answered = false;
    Q.hinted = false;
    const a = document.getElementById('ans');
    if (a) a.focus();
  }

  function submit(value) {
    if (Q.answered) return;
    const q = Q.items[Q.i];
    if (q.kind !== 'choice' && !String(value).trim()) {
      document.getElementById('feedback').innerHTML = '<p class="hintmsg">Type an answer first.</p>';
      return;
    }
    Q.answered = true;
    const ok = MQ.check(q, value);
    const fb = document.getElementById('feedback');
    if (ok) {
      Q.correct++;
      const gain = Q.hinted ? 5 : 10;
      Q.xp += gain;
      fb.innerHTML = `<div class="fb good"><b>✅ ${pick(PRAISE)}</b> +${gain} XP<p>${q.explain}</p></div>`;
    } else {
      fb.innerHTML = `<div class="fb bad"><b>Not quite.</b> The answer is <b>${q.kind === 'choice' ? esc(MQ.answerText(q)) : MQ.answerText(q)}</b>.<p>${q.explain}</p></div>`;
    }
    const inp = document.getElementById('ans');
    if (inp) inp.disabled = true;
    document.querySelectorAll('.choice').forEach((b) => {
      b.disabled = true;
      if (+b.dataset.i === q.a) b.classList.add('right');
      else if (b.dataset.i === String(value)) b.classList.add('wrong');
    });
    document.getElementById('hintBtn').disabled = true;
    const last = Q.i === Q.items.length - 1;
    const actions = document.querySelector('.actions');
    const old = document.getElementById('primary');
    if (old) old.remove();
    const nextBtn = document.createElement('button');
    nextBtn.className = 'primary';
    nextBtn.id = 'primary';
    nextBtn.dataset.act = 'next';
    nextBtn.textContent = last ? 'See results' : 'Next →';
    actions.appendChild(nextBtn);
    nextBtn.focus();
  }

  function nextQuestion() {
    if (Q.i < Q.items.length - 1) {
      Q.i++;
      quiz();
      return;
    }
    const n = Q.correct;
    const earned = n >= MQ.QUIZ_LENGTH ? 3 : n === MQ.QUIZ_LENGTH - 1 ? 2 : n >= MQ.PASS_MARK ? 1 : 0;
    const bonus = earned ? recordLevel(Q.l.id, earned, Q.xp) : (S.xp += Q.xp, touchStreak(), save(), 0);
    go('result', {
      w: Q.w, l: Q.l, earned, bonus, gained: Q.xp,
      detail: `You got <b>${n}</b> out of ${Q.items.length} right.`,
      retry: () => startQuiz(Q.w, Q.l),
    });
  }

  /* ---------- Balance scale game ---------- */
  let B = null;
  function startBalance(w, l) {
    B = { w, l, idx: 0, results: [], cur: null };
    newPuzzle();
    go('balance');
  }
  function newPuzzle() {
    const p = MQ.Balance.make(B.l.kind);
    B.cur = { start: p.state, state: p.state, x: p.x, par: p.par, moves: 0, history: [], log: [], hinted: false, op: 'sub', k: 1, done: false, msg: '' };
    const h = MQ.Balance.hint(p.state);
    B.cur.op = h ? h.op : 'sub';
    B.cur.k = 1;
  }

  function chips(value, kindClass) {
    const abs = Math.abs(value);
    if (abs === 0) return '';
    if (abs > 14) return `<span class="chip unit wide${value < 0 ? ' neg' : ''} ${kindClass || ''}">${num(value)}</span>`;
    return `<span class="chip unit${value < 0 ? ' neg' : ''}">${value < 0 ? MINUS + '1' : '1'}</span>`.repeat(abs);
  }
  function leftPan(s) {
    let h = '';
    if (s.d === 1 && s.n <= 8) h += '<span class="chip xchip">x</span>'.repeat(s.n);
    else h += `<span class="chip xchip wide">${MQ.Balance.coefPlain(s)}</span>`;
    return h + chips(s.b);
  }

  function balance() {
    const c = B.cur;
    const s = c.state;
    const done = c.done;
    const ops = [['add', '+ Add'], ['sub', MINUS + ' Subtract'], ['mul', '× Multiply'], ['div', '÷ Divide']];
    app.innerHTML = `<section class="card balance" style="--wc:${B.w.color}">
      <div class="topbar"><button class="link" data-act="quit">✕ Quit</button>
        <div class="bar"><span style="width:${(B.idx / MQ.PUZZLES_PER_LEVEL) * 100}%"></span></div>
        <span class="count">${B.idx + 1}/${MQ.PUZZLES_PER_LEVEL}</span></div>
      <p class="meta">Get <b>x</b> alone. Par: ${c.par} move${c.par === 1 ? '' : 's'} · Moves so far: <b>${c.moves}</b></p>
      <div class="scale ${done ? 'happy' : ''}" id="scale">
        <div class="beam"></div>
        <div class="pans">
          <div class="pan"><div class="stuff">${leftPan(s)}</div><div class="plate"></div></div>
          <div class="fulcrum" aria-hidden="true"></div>
          <div class="pan"><div class="stuff">${chips(s.c)}</div><div class="plate"></div></div>
        </div>
      </div>
      <p class="equation" aria-live="polite">${MQ.Balance.eqHTML(s)}</p>
      ${done ? `<div class="fb good"><b>🎉 Solved! x = ${num(c.x)}</b><p>Check it: put ${num(c.x)} back into the starting equation <span class="inl">${MQ.Balance.eqHTML(c.start)}</span> and both sides match.</p></div>
        <div class="actions"><button class="primary" data-act="nextPuzzle">${B.idx === MQ.PUZZLES_PER_LEVEL - 1 ? 'See results' : 'Next puzzle →'}</button></div>`
      : `<div class="ops">
          <div class="seg" role="radiogroup" aria-label="Operation">${ops.map(([k, t]) => `<button role="radio" aria-checked="${c.op === k}" class="${c.op === k ? 'on' : ''}" data-act="op" data-op="${k}">${t}</button>`).join('')}</div>
          <div class="stepper"><button data-act="kdec" aria-label="Smaller number">−</button>
            <input id="kval" type="number" min="1" max="99" value="${c.k}" aria-label="Number">
            <button data-act="kinc" aria-label="Bigger number">+</button></div>
          <button class="primary big" id="applyBtn" data-act="apply">${MQ.Balance.label(c.op, c.k)}</button>
        </div>
        <p class="msg" id="msg" aria-live="polite">${esc(c.msg || '')}</p>
        <div class="actions"><button class="ghost" data-act="undo" ${c.history.length ? '' : 'disabled'}>↶ Undo</button>
          <button class="ghost" data-act="reset-puzzle">Start over</button>
          <button class="ghost" data-act="bhint">💡 Hint</button></div>`}
      ${c.log.length ? `<ol class="log">${c.log.map((t) => `<li>${t}</li>`).join('')}</ol>` : ''}
    </section>`;
  }

  function syncApplyLabel() {
    const c = B.cur;
    const btn = document.getElementById('applyBtn');
    if (btn) btn.textContent = MQ.Balance.label(c.op, c.k);
    document.querySelectorAll('.seg button').forEach((b) => {
      const on = b.dataset.op === c.op;
      b.classList.toggle('on', on);
      b.setAttribute('aria-checked', String(on));
    });
    const kv = document.getElementById('kval');
    if (kv && +kv.value !== c.k) kv.value = c.k;
  }

  function applyMove() {
    const c = B.cur;
    const kv = document.getElementById('kval');
    if (kv) c.k = parseInt(kv.value, 10);
    const r = MQ.Balance.apply(c.state, c.op, c.k);
    if (!r.ok) {
      c.msg = r.msg;
      const m = document.getElementById('msg');
      if (m) m.textContent = r.msg;
      const sc = document.getElementById('scale');
      sc.classList.remove('shake');
      void sc.offsetWidth;
      sc.classList.add('shake');
      return;
    }
    c.history.push({ state: c.state, log: c.log.slice() });
    c.state = r.state;
    c.moves++;
    c.msg = '';
    c.log.push(`${r.label}: <span class="inl">${MQ.Balance.eqHTML(r.state)}</span>`);
    if (MQ.Balance.solved(r.state)) {
      c.done = true;
      confetti();
    }
    balance();
    const sc = document.getElementById('scale');
    if (sc) sc.classList.add('wobble');
  }

  function finishPuzzle() {
    const c = B.cur;
    let st = c.moves <= c.par ? 3 : c.moves <= c.par + 1 ? 2 : 1;
    if (c.hinted) st = Math.min(st, 2);
    B.results.push(st);
    S.xp += st * 10;
    touchStreak();
    save();
    if (B.idx < MQ.PUZZLES_PER_LEVEL - 1) {
      B.idx++;
      newPuzzle();
      balance();
      window.scrollTo(0, 0);
      return;
    }
    const avg = B.results.reduce((a, b) => a + b, 0) / B.results.length;
    const earned = Math.max(1, Math.round(avg));
    const bonus = recordLevel(B.l.id, earned, 0);
    go('result', {
      w: B.w, l: B.l, earned, bonus, gained: B.results.reduce((a, b) => a + b * 10, 0),
      detail: `Puzzle scores: ${B.results.map((r) => '★'.repeat(r)).join(' · ')}. Fewer moves earns more stars.`,
      retry: () => startBalance(B.w, B.l),
    });
  }

  /* ---------- Results ---------- */
  function result() {
    const v = view;
    const passed = v.earned > 0;
    const nxt = levelAfter(v.l.id);
    app.innerHTML = `<section class="card result" style="--wc:${v.w.color}">
      <h1>${passed ? (v.earned === 3 ? 'Perfect! 🌟' : 'Level complete! 🎉') : 'Nearly there!'}</h1>
      <div class="bigstars">${starRow(v.earned)}</div>
      <p>${v.detail}</p>
      <p class="xp">+${v.gained + v.bonus} XP${v.bonus ? ' (including a ' + v.bonus + ' XP first-time bonus)' : ''}</p>
      ${passed ? '' : `<p>You need ${MQ.PASS_MARK} right to pass. Read the tip again and have another go. You can do it!</p>`}
      <div class="actions">
        <button class="ghost" data-act="retry">${passed ? 'Play again for more stars' : 'Try again'}</button>
        ${passed && nxt && (isUnlocked(nxt.w, nxt.i)) ? `<button class="primary" data-act="open" data-w="${nxt.w.id}" data-l="${nxt.l.id}">Next: ${esc(nxt.l.name)}</button>` : ''}
        <button class="ghost" data-act="home">Back to map</button>
      </div></section>`;
    if (passed) confetti();
  }

  /* ---------- Events ---------- */
  app.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act]');
    if (!t || t.disabled) return;
    const act = t.dataset.act;
    switch (act) {
      case 'home': case 'quit': Q = null; B = null; go('home'); break;
      case 'open': go('intro', { w: t.dataset.w, l: t.dataset.l }); break;
      case 'start': {
        const { w, l } = findLevel(view.l);
        if (l.type === 'balance') startBalance(w, l); else startQuiz(w, l);
        break;
      }
      case 'check': submit(document.getElementById('ans').value); break;
      case 'choose': submit(t.dataset.i); break;
      case 'next': nextQuestion(); break;
      case 'hint': {
        Q.hinted = true;
        document.getElementById('feedback').innerHTML = `<p class="hintmsg">💡 ${Q.items[Q.i].hint}</p>`;
        break;
      }
      case 'retry': view.retry(); break;
      case 'op': B.cur.op = t.dataset.op; B.cur.msg = ''; syncApplyLabel(); break;
      case 'kinc': B.cur.k = Math.min(99, (parseInt(document.getElementById('kval').value, 10) || 0) + 1); syncApplyLabel(); break;
      case 'kdec': B.cur.k = Math.max(1, (parseInt(document.getElementById('kval').value, 10) || 2) - 1); syncApplyLabel(); break;
      case 'apply': applyMove(); break;
      case 'undo': {
        const h = B.cur.history.pop();
        if (h) { B.cur.state = h.state; B.cur.log = h.log; B.cur.msg = ''; balance(); }
        break;
      }
      case 'reset-puzzle': {
        const c = B.cur;
        c.state = c.start; c.history = []; c.log = []; c.moves = 0; c.msg = '';
        balance();
        break;
      }
      case 'bhint': {
        const h = MQ.Balance.hint(B.cur.state);
        if (!h) break;
        B.cur.hinted = true;
        B.cur.op = h.op;
        B.cur.k = h.k;
        B.cur.msg = `💡 Try this: ${MQ.Balance.label(h.op, h.k).toLowerCase()}.`;
        balance();
        break;
      }
      case 'nextPuzzle': finishPuzzle(); break;
      case 'unlock': S.unlockAll = !S.unlockAll; save(); home(); break;
      case 'reset':
        if (window.confirm('Reset all stars and XP on this device?')) { S = fresh(); save(); render(); }
        break;
      default:
    }
  });

  app.addEventListener('input', (e) => {
    if (e.target.id === 'kval' && B && B.cur) {
      const v = parseInt(e.target.value, 10);
      if (v >= 1 && v <= 99) { B.cur.k = v; syncApplyLabel(); }
    }
  });

  app.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    if (e.target.id === 'ans') {
      e.preventDefault();
      submit(e.target.value);
    } else if (e.target.id === 'kval') {
      e.preventDefault();
      applyMove();
    }
  });

  app.addEventListener('submit', (e) => {
    if (e.target.dataset.form === 'name') {
      e.preventDefault();
      S.name = document.getElementById('name').value.trim();
      save();
      home();
    }
  });

  document.getElementById('brand').addEventListener('click', (e) => { e.preventDefault(); Q = null; B = null; go('home'); });

  render();
})(window.MQ);

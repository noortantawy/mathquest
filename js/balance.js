/* Balance-scale equation game logic.
   An equation is (n/d)x + b = c. Whatever the player does, it is done to BOTH sides. */
(function (MQ) {
  'use strict';

  const { num, R, pick, MINUS } = MQ.fmt;
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const LIMIT = 5000;

  function make(kind) {
    for (;;) {
      let n = 1, d = 1, b = 0, x;
      switch (kind) {
        case 1: b = R(1, 12); x = R(1, 15); break;                       // x + b = c
        case 2: b = -R(1, 12); x = R(4, 20); break;                      // x - b = c
        case 3: n = R(2, 9); x = R(2, 12); break;                        // nx = c
        case 4: d = R(2, 6); x = d * R(2, 9); break;                     // x/d = c
        case 5: n = R(2, 5); b = R(1, 9); x = R(1, 9); break;            // nx + b = c
        case 6: n = R(2, 5); b = -R(1, 9); x = R(2, 9); break;           // nx - b = c
        case 7: d = R(2, 5); b = R(1, 8) * pick([1, -1]); x = d * R(1, 8); break;
        default: n = pick([1, 1, 2, 3, 4]); b = R(2, 12) * pick([1, -1]); x = -R(1, 9); break; // negative answers
      }
      const c = (n * x) / d + b;
      if (!Number.isInteger(c) || (kind <= 7 && c <= 0)) continue;
      const state = { n, d, b, c };
      const p = par(state);
      if (p < 1 || p > 6) continue;
      return { state, x, par: p };
    }
  }

  function solved(s) {
    return s.n === 1 && s.d === 1 && s.b === 0;
  }

  function apply(s, op, k) {
    if (!Number.isInteger(k) || k < 1 || k > 99) return { ok: false, msg: 'Pick a whole number from 1 to 99.' };
    let t;
    if (op === 'add') t = { n: s.n, d: s.d, b: s.b + k, c: s.c + k };
    else if (op === 'sub') t = { n: s.n, d: s.d, b: s.b - k, c: s.c - k };
    else if (op === 'mul') {
      if (k < 2) return { ok: false, msg: 'Multiplying by 1 changes nothing. Try a bigger number.' };
      const g = gcd(s.n * k, s.d);
      t = { n: (s.n * k) / g, d: s.d / g, b: s.b * k, c: s.c * k };
    } else if (op === 'div') {
      if (k < 2) return { ok: false, msg: 'Dividing by 1 changes nothing. Try a bigger number.' };
      if (s.d !== 1 || s.n % k || s.b % k || s.c % k) {
        return { ok: false, msg: `Everything has to divide evenly by ${k}. Try getting rid of the plain number first.` };
      }
      t = { n: s.n / k, d: 1, b: s.b / k, c: s.c / k };
    } else return { ok: false, msg: 'Pick an operation first.' };
    if (Math.abs(t.c) > LIMIT || Math.abs(t.b) > LIMIT) return { ok: false, msg: 'Those numbers are getting huge. Try a different move.' };
    return { ok: true, state: t, label: label(op, k) };
  }

  function label(op, k) {
    return {
      add: `Add ${k} to both sides`,
      sub: `Subtract ${k} from both sides`,
      mul: `Multiply both sides by ${k}`,
      div: `Divide both sides by ${k}`,
    }[op];
  }

  // The next sensible move from here, or null if already solved.
  function hint(s) {
    if (s.b !== 0) return s.b > 0 ? { op: 'sub', k: s.b } : { op: 'add', k: -s.b };
    if (s.d !== 1) return { op: 'mul', k: s.d };
    if (s.n !== 1) return { op: 'div', k: s.n };
    return null;
  }

  // Number of moves the hint strategy needs (used as the "par" score).
  function par(s) {
    let moves = 0;
    let cur = s;
    while (!solved(cur) && moves < 10) {
      const h = hint(cur);
      if (!h) break;
      const r = apply(cur, h.op, h.k);
      if (!r.ok) return 99;
      cur = r.state;
      moves++;
    }
    return moves;
  }

  const coefPlain = (s) => (s.d === 1 ? (s.n === 1 ? 'x' : s.n + 'x') : s.n === 1 ? `x/${s.d}` : `${s.n}x/${s.d}`);

  function coefHTML(s) {
    if (s.d === 1) return s.n === 1 ? 'x' : s.n + 'x';
    const top = s.n === 1 ? 'x' : s.n + 'x';
    return `<span class="frac"><span class="top">${top}</span><span class="bot">${s.d}</span></span>`;
  }

  function eqHTML(s) {
    let left = coefHTML(s);
    if (s.b > 0) left += ` + ${s.b}`;
    else if (s.b < 0) left += ` ${MINUS} ${Math.abs(s.b)}`;
    return `${left} = ${num(s.c)}`;
  }

  MQ.Balance = { make, apply, hint, par, solved, eqHTML, coefPlain, label };
})((window.MQ = window.MQ || {}));

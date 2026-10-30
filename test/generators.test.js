// Run with: node test/generators.test.js
// Checks that every generator produces sane questions and that the balance game can always be solved.
global.window = global;
require('../js/generators.js');
require('../js/balance.js');
require('../js/curriculum.js');

const MQ = global.MQ;
let failures = 0;
const fail = (msg) => { failures++; console.error('FAIL:', msg); };

const bad = /NaN|undefined|Infinity|null/;
for (const [name, gen] of Object.entries(MQ.gen)) {
  for (let i = 0; i < 1500; i++) {
    const q = gen();
    const text = [q.q, q.explain, q.hint, q.ansText].join(' ');
    if (bad.test(text)) fail(`${name}: bad text ${text}`);
    if (!q.explain || !q.hint) fail(`${name}: missing explain/hint`);
    if (q.kind === 'num') {
      if (!Number.isFinite(q.a)) fail(`${name}: non-finite answer`);
      if (!MQ.check(q, String(q.a))) fail(`${name}: own answer rejected: ${q.q} -> ${q.a}`);
      if (MQ.check(q, String(q.a + 1))) fail(`${name}: wrong answer accepted: ${q.q}`);
    } else if (q.kind === 'expr') {
      if (!MQ.check(q, MQ.answerText(q).replace(/−/g, '-'))) fail(`${name}: own expr rejected: ${q.q} -> ${MQ.answerText(q)}`);
    } else if (q.kind === 'choice') {
      if (!MQ.check(q, q.a) || MQ.check(q, 1 - q.a)) fail(`${name}: choice check broken`);
    }
  }
}

// Every level must reference generators that exist.
for (const w of MQ.WORLDS) for (const l of w.levels) {
  if (l.gens) l.gens.forEach((g) => { if (!MQ.gen[g]) fail(`level ${l.id}: unknown generator ${g}`); });
}

// Balance puzzles: the hint strategy must always solve within par and the numbers must stay whole.
for (let kind = 1; kind <= 8; kind++) {
  for (let i = 0; i < 500; i++) {
    const p = MQ.Balance.make(kind);
    let s = p.state, moves = 0;
    while (!MQ.Balance.solved(s)) {
      const h = MQ.Balance.hint(s);
      const r = MQ.Balance.apply(s, h.op, h.k);
      if (!r.ok) { fail(`balance ${kind}: hint move rejected (${r.msg})`); break; }
      s = r.state; moves++;
    }
    if (moves !== p.par) fail(`balance ${kind}: par ${p.par} but took ${moves}`);
    if (s.c !== p.x) fail(`balance ${kind}: solved to ${s.c}, expected ${p.x}`);
  }
}

// Parsing checks
const P = MQ.parseNumber;
const eq = (a, b, m) => { if (Math.abs(a - b) > 1e-9 || Number.isNaN(a)) fail(`${m}: got ${a}, want ${b}`); };
eq(P('3/4'), 0.75, 'fraction'); eq(P('1 1/2'), 1.5, 'mixed'); eq(P('−5'), -5, 'unicode minus');
eq(P('$4.50'), 4.5, 'money'); eq(P('12 cm²'), 12, 'unit'); eq(P('45%'), 45, 'percent'); eq(P('-1 1/2'), -1.5, 'neg mixed');
if (!Number.isNaN(P('abc'))) fail('abc should not parse');
const L = MQ.parseLinear('3 + 2x');
if (!L || L.a !== 2 || L.b !== 3) fail('parseLinear 3 + 2x');
const L2 = MQ.parseLinear('-x - 4');
if (!L2 || L2.a !== -1 || L2.b !== -4) fail('parseLinear -x - 4');
if (MQ.parseLinear('2x+')) fail('parseLinear should reject trailing +');

console.log(failures ? `${failures} failure(s)` : 'All checks passed');
process.exit(failures ? 1 : 0);

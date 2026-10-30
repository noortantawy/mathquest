/* Question generators and answer checking.
   Every generator returns { kind, q, a, explain, hint, ... } for one fresh question.
   kind: 'num' (a number), 'expr' (a linear expression in x) or 'choice' (pick an option). */
(function (MQ) {
  'use strict';

  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const lcm = (a, b) => (a / gcd(a, b)) * b;
  const MINUS = '−';
  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const num = (n) => (n < 0 ? MINUS : '') + String(+Math.abs(n).toFixed(4));
  const par = (n) => (n < 0 ? '(' + num(n) + ')' : num(n));
  const money = (n) => '$' + n.toFixed(2);
  const fr = (top, bot) =>
    `<span class="frac"><span class="top">${top}</span><span class="bot">${bot}</span></span>`;

  function fracText(n, d) {
    const g = gcd(n, d);
    n /= g;
    d /= g;
    if (d === 1) return String(n);
    if (n > d) return `${n}/${d} (or ${Math.floor(n / d)} ${n % d}/${d})`;
    return `${n}/${d}`;
  }

  // Builds "3x + 5" / "x − 2" from [[coefficient, 'x' | ''], ...]; zero terms are skipped.
  function expr(terms) {
    const live = terms.filter(([c]) => c !== 0);
    if (!live.length) return '0';
    return live
      .map(([c, v], i) => {
        const abs = Math.abs(c);
        const body = v && abs === 1 ? v : abs + v;
        if (i === 0) return (c < 0 ? MINUS : '') + body;
        return `${c < 0 ? MINUS : '+'} ${body}`;
      })
      .join(' ');
  }
  const linStr = (a, b) => expr([[a, 'x'], [b, '']]);
  const eqStr = (a, b, c) => `${linStr(a, b)} = ${num(c)}`;

  const NOTE_FRAC = 'Answer as a fraction like 3/4. Mixed numbers like 1 1/2 work too.';

  const G = {};

  /* ---------- Integers ---------- */
  G.intAddSub = () => {
    const a = R(-15, 15) || 6;
    const b = R(-15, 15) || -3;
    const sub = Math.random() < 0.5;
    const ans = sub ? a - b : a + b;
    return {
      kind: 'num',
      q: `${num(a)} ${sub ? MINUS : '+'} ${par(b)} = ?`,
      a: ans,
      explain: sub
        ? `Subtracting ${par(b)} is the same as adding its opposite, ${num(-b)}. So ${num(a)} + ${par(-b)} = <b>${num(ans)}</b>.`
        : `Picture a number line: start at ${num(a)} and move ${Math.abs(b)} steps ${b < 0 ? 'left' : 'right'}. You land on <b>${num(ans)}</b>.`,
      hint: 'Use a number line. Subtracting a negative number is the same as adding a positive one.',
    };
  };

  G.intMulDiv = () => {
    const x = R(2, 9) * pick([1, -1]);
    const y = R(2, 9) * pick([1, -1]);
    const mul = Math.random() < 0.5;
    const ans = mul ? x * y : y;
    const same = (x < 0) === (y < 0);
    return {
      kind: 'num',
      q: mul ? `${num(x)} × ${par(y)} = ?` : `${num(x * y)} ÷ ${par(x)} = ?`,
      a: ans,
      explain: `${same ? 'Same signs give a positive answer' : 'Different signs give a negative answer'}. ${Math.abs(mul ? x : x * y)} ${mul ? '×' : '÷'} ${Math.abs(mul ? y : x)} = ${Math.abs(ans)}, so the answer is <b>${num(ans)}</b>.`,
      hint: 'Same signs: positive. Different signs: negative. Then multiply or divide as normal.',
    };
  };

  G.intOrder = () => {
    const a = R(2, 12), b = R(2, 9), c = R(2, 9);
    const t = R(0, 4);
    if (t === 0) {
      return { kind: 'num', q: `${a} + ${b} × ${c} = ?`, a: a + b * c,
        explain: `Multiplication comes first: ${b} × ${c} = ${b * c}. Then add ${a} to get <b>${a + b * c}</b>.`,
        hint: 'Remember BODMAS / PEMDAS: multiply before you add.' };
    }
    if (t === 1) {
      return { kind: 'num', q: `(${a} + ${b}) × ${c} = ?`, a: (a + b) * c,
        explain: `Brackets first: ${a} + ${b} = ${a + b}. Then ${a + b} × ${c} = <b>${(a + b) * c}</b>.`,
        hint: 'Do whatever is inside the brackets first.' };
    }
    if (t === 2) {
      return { kind: 'num', q: `${a} × ${b} ${MINUS} ${c} = ?`, a: a * b - c,
        explain: `Multiply first: ${a} × ${b} = ${a * b}. Then subtract ${c} to get <b>${num(a * b - c)}</b>.`,
        hint: 'Multiply before you subtract.' };
    }
    if (t === 3) {
      return { kind: 'num', q: `${a * b} ÷ ${b} + ${c} = ?`, a: a + c,
        explain: `Divide first: ${a * b} ÷ ${b} = ${a}. Then add ${c} to get <b>${a + c}</b>.`,
        hint: 'Divide before you add.' };
    }
    return { kind: 'num', q: `${a * 3} ${MINUS} ${b} × ${c} = ?`, a: a * 3 - b * c,
      explain: `Multiply first: ${b} × ${c} = ${b * c}. Then ${a * 3} ${MINUS} ${b * c} = <b>${num(a * 3 - b * c)}</b>.`,
      hint: 'Multiply before you subtract, even though the subtraction comes first when reading.' };
  };

  G.intWord = () => {
    const t = R(0, 2);
    if (t === 0) {
      const start = R(-10, 4), rise = R(3, 12);
      return { kind: 'num', unit: '°C',
        q: `At 6 am it was ${num(start)}°C. By noon it had risen by ${rise}°C. What is the temperature at noon?`,
        a: start + rise,
        explain: `${num(start)} + ${rise} = <b>${num(start + rise)}°C</b>.`,
        hint: 'Rising means adding. Use a number line.' };
    }
    if (t === 1) {
      const depth = R(5, 20), up = R(2, 4) * 2, down = R(3, 9);
      return { kind: 'num', unit: 'm',
        q: `A diver is at ${num(-depth)} m. She swims up ${up} m, then down ${down} m. Where is she now?`,
        a: -depth + up - down,
        explain: `${num(-depth)} + ${up} ${MINUS} ${down} = <b>${num(-depth + up - down)} m</b>.`,
        hint: 'Going up adds. Going down subtracts.' };
    }
    const owe = R(10, 40), pay = R(5, 60);
    return { kind: 'num',
      q: `Sam's account is at ${MINUS}$${owe} (he owes money). He deposits $${owe + pay}. What is his balance now? (Answer as a number of dollars.)`,
      a: pay,
      explain: `${num(-owe)} + ${owe + pay} = <b>${pay}</b> dollars.`,
      hint: 'Add the deposit to the negative balance.' };
  };

  /* ---------- Fractions and decimals ---------- */
  G.fracAddSub = () => {
    const dens = [2, 3, 4, 5, 6, 8, 10];
    const d1 = pick(dens);
    const d2 = Math.random() < 0.35 ? d1 : pick(dens);
    const n1 = R(1, d1 - 1), n2 = R(1, d2 - 1);
    const sub = Math.random() < 0.5;
    if (sub && n1 * d2 < n2 * d1) return G.fracAddSub(); // keep subtraction answers positive
    const l = lcm(d1, d2);
    const t1 = n1 * (l / d1), t2 = n2 * (l / d2);
    const top = sub ? t1 - t2 : t1 + t2;
    return {
      kind: 'num', note: NOTE_FRAC,
      q: `${fr(n1, d1)} ${sub ? MINUS : '+'} ${fr(n2, d2)} = ?`,
      a: top / l,
      ansText: fracText(top, l),
      explain: `Use a common denominator of ${l}: ${t1}/${l} ${sub ? MINUS : '+'} ${t2}/${l} = ${top}/${l}, which simplifies to <b>${fracText(top, l)}</b>.`,
      hint: 'Make the denominators the same first, then add or subtract only the tops.',
    };
  };

  G.fracMulDiv = () => {
    const n1 = R(1, 5), d1 = R(2, 7), n2 = R(1, 5), d2 = R(2, 7);
    const div = Math.random() < 0.4;
    const top = div ? n1 * d2 : n1 * n2;
    const bot = div ? d1 * n2 : d1 * d2;
    return {
      kind: 'num', note: NOTE_FRAC,
      q: `${fr(n1, d1)} ${div ? '÷' : '×'} ${fr(n2, d2)} = ?`,
      a: top / bot,
      ansText: fracText(top, bot),
      explain: div
        ? `Keep, flip, multiply: ${n1}/${d1} × ${d2}/${n2} = ${top}/${bot} = <b>${fracText(top, bot)}</b>.`
        : `Multiply the tops and the bottoms: ${n1}×${n2} over ${d1}×${d2} = ${top}/${bot} = <b>${fracText(top, bot)}</b>.`,
      hint: div ? 'Dividing by a fraction means multiplying by its flip (reciprocal).'
                : 'Multiply the tops together and the bottoms together, then simplify.',
    };
  };

  G.decAddSub = () => {
    let A = R(105, 4999), B = R(105, 3999);
    const sub = Math.random() < 0.5;
    if (sub && A < B) [A, B] = [B, A];
    const ans = (sub ? A - B : A + B) / 100;
    return {
      kind: 'num',
      q: `${A / 100} ${sub ? MINUS : '+'} ${B / 100} = ?`,
      a: ans,
      explain: `Line up the decimal points and ${sub ? 'subtract' : 'add'} column by column: <b>${ans}</b>.`,
      hint: 'Line up the decimal points. Add zeros at the end if it helps.',
    };
  };

  G.decMul = () => {
    const A = R(12, 59), B = R(3, 9);
    const oneDp = Math.random() < 0.5;
    const ans = oneDp ? (A * B) / 10 : (A * B) / 100;
    return {
      kind: 'num',
      q: oneDp ? `${A / 10} × ${B} = ?` : `${A / 10} × ${B / 10} = ?`,
      a: ans,
      explain: `Ignore the decimal points: ${A} × ${B} = ${A * B}. Then put them back (${oneDp ? 1 : 2} decimal place${oneDp ? '' : 's'} in total): <b>${ans}</b>.`,
      hint: 'Multiply as if there were no decimal points, then count the decimal places.',
    };
  };

  G.fracToDec = () => {
    const [n, d] = pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 8], [3, 8], [5, 8], [7, 8], [7, 10], [1, 20], [3, 20], [1, 25], [3, 25]]);
    return {
      kind: 'num',
      q: `Write ${fr(n, d)} as a decimal.`,
      a: n / d,
      explain: `A fraction is a division: ${n} ÷ ${d} = <b>${n / d}</b>.`,
      hint: 'The top divided by the bottom.',
    };
  };

  /* ---------- Ratios, rates and percents ---------- */
  G.unitRate = () => {
    const t = R(0, 2);
    if (t === 0) {
      const rate = R(30, 90), h = R(2, 6);
      return { kind: 'num', unit: 'km/h', q: `A bus travels ${rate * h} km in ${h} hours. How many km does it travel in 1 hour?`,
        a: rate, explain: `${rate * h} ÷ ${h} = <b>${rate} km per hour</b>.`, hint: 'Divide the total distance by the number of hours.' };
    }
    if (t === 1) {
      const units = R(3, 8), price = pick([0.5, 0.75, 1.25, 1.5, 2, 2.5, 3.25, 4.5]);
      return { kind: 'num', ansText: money(price), q: `${units} notebooks cost ${money(units * price)}. How much does 1 notebook cost?`,
        a: price, explain: `${money(units * price)} ÷ ${units} = <b>${money(price)}</b>.`, hint: 'Divide the total cost by the number of notebooks.' };
    }
    const per = R(3, 12), m = R(3, 9);
    return { kind: 'num', unit: 'L/min', q: `A tap fills ${per * m} litres in ${m} minutes. How many litres per minute is that?`,
      a: per, explain: `${per * m} ÷ ${m} = <b>${per} litres per minute</b>.`, hint: 'Divide litres by minutes.' };
  };

  G.proportion = () => {
    if (Math.random() < 0.5) {
      const u = pick([0.5, 0.75, 1.25, 1.5, 2, 2.5, 3]);
      const k1 = R(2, 6), k2 = R(k1 + 1, k1 + 8);
      const [pl] = pick([['pens'], ['apples'], ['stickers'], ['pencils']]);
      return { kind: 'num', ansText: money(k2 * u), q: `${k1} ${pl} cost ${money(k1 * u)}. At the same price, how much do ${k2} ${pl} cost?`,
        a: k2 * u,
        explain: `One costs ${money(k1 * u)} ÷ ${k1} = ${money(u)}. So ${k2} cost ${k2} × ${money(u)} = <b>${money(k2 * u)}</b>.`,
        hint: 'Find the cost of ONE first (the unit rate), then multiply.' };
    }
    const r1 = R(2, 5);
    let r2 = R(2, 5);
    if (r2 === r1) r2 += 1;
    const m = R(2, 6);
    return { kind: 'num', unit: 'cups',
      q: `A recipe uses ${r1} cups of flour for every ${r2} cups of sugar. How many cups of flour are needed for ${r2 * m} cups of sugar?`,
      a: r1 * m,
      explain: `${r2 * m} is ${m} times ${r2}, so multiply the flour by ${m} too: ${r1} × ${m} = <b>${r1 * m}</b> cups.`,
      hint: 'How many times bigger is the new amount of sugar? Scale the flour the same way.' };
  };

  G.percentOf = () => {
    const p = pick([5, 10, 15, 20, 25, 30, 40, 50, 60, 75]);
    const n = pick([20, 40, 60, 80, 100, 120, 160, 200, 240]);
    const ans = (n * p) / 100;
    return { kind: 'num', q: `What is ${p}% of ${n}?`, a: ans,
      explain: `${p}% means ${p} out of 100. ${n} × ${p} ÷ 100 = <b>${ans}</b>.`,
      hint: p === 50 ? '50% is half.' : p === 25 ? '25% is a quarter.' : 'Try finding 10% first (divide by 10), then build up.' };
  };

  G.discount = () => {
    const price = pick([20, 40, 60, 80, 100, 120, 160, 200]);
    const p = pick([10, 20, 25, 30, 40, 50]);
    if (Math.random() < 0.6) {
      const ans = (price * (100 - p)) / 100;
      return { kind: 'num', ansText: money(ans), q: `A jacket costs $${price}. It is on sale for ${p}% off. What is the sale price?`, a: ans,
        explain: `Discount = ${p}% of ${price} = ${(price * p) / 100}. Sale price = ${price} ${MINUS} ${(price * p) / 100} = <b>${money(ans)}</b>.`,
        hint: 'Work out the discount first, then subtract it from the price.' };
    }
    const ans = (price * (100 + p)) / 100;
    return { kind: 'num', ansText: money(ans), q: `A meal costs $${price} before a ${p}% tip is added. What is the total including the tip?`, a: ans,
      explain: `Tip = ${p}% of ${price} = ${(price * p) / 100}. Total = ${price} + ${(price * p) / 100} = <b>${money(ans)}</b>.`,
      hint: 'Work out the tip first, then add it to the price.' };
  };

  G.percentChange = () => {
    const old = pick([20, 40, 60, 80, 100, 120]);
    const p = pick([5, 10, 15, 20, 25, 50]);
    const inc = Math.random() < 0.5;
    const nw = (old * (100 + (inc ? p : -p))) / 100;
    return { kind: 'num', unit: '%',
      q: `A price changes from $${old} to $${nw}. What is the percent ${inc ? 'increase' : 'decrease'}?`,
      a: p,
      explain: `Change = ${Math.abs(nw - old)}. Compare it with the ORIGINAL price: ${Math.abs(nw - old)} ÷ ${old} = ${Math.abs(nw - old) / old} = <b>${p}%</b>.`,
      hint: 'Percent change = change ÷ original × 100.' };
  };

  /* ---------- Expressions ---------- */
  G.evalExpr = () => {
    const a = R(2, 9), b = R(1, 12);
    const x = R(-4, 8) || 3;
    const minus = Math.random() < 0.5;
    const ans = a * x + (minus ? -b : b);
    return { kind: 'num', q: `Evaluate ${linStr(a, minus ? -b : b)} when x = ${num(x)}.`, a: ans,
      explain: `Replace x with ${par(x)}: ${a} × ${par(x)} ${minus ? MINUS : '+'} ${b} = ${num(a * x)} ${minus ? MINUS : '+'} ${b} = <b>${num(ans)}</b>.`,
      hint: `Swap x for ${par(x)}. Multiply first, then add or subtract.` };
  };

  const signedCoef = () => R(1, 9) * (Math.random() < 0.35 ? -1 : 1);
  G.combineLike = () => {
    for (;;) {
      const x1 = R(1, 9), x2 = signedCoef(), k1 = signedCoef(), k2 = signedCoef();
      const a = x1 + x2, b = k1 + k2;
      if (!a || !b) continue;
      const terms = shuffle([[x1, 'x'], [x2, 'x'], [k1, ''], [k2, '']]);
      if (terms[0][0] < 0) continue; // keep the first term positive so it reads naturally
      return { kind: 'expr', note: 'Type it like 5x - 3', q: `Simplify: ${expr(terms)}`, a: { a, b },
        ansText: linStr(a, b),
        explain: `Add the x terms: ${num(x1)}x + ${par(x2)}x = ${num(a)}x. Add the plain numbers: ${num(k1)} + ${par(k2)} = ${num(b)}. Answer: <b>${linStr(a, b)}</b>.`,
        hint: 'Group the x terms together and the plain numbers together.' };
    }
  };

  G.distribute = () => {
    const k = R(2, 9), m = R(1, 9);
    const minus = Math.random() < 0.5;
    if (Math.random() < 0.6) {
      const mm = minus ? -m : m;
      return { kind: 'expr', note: 'Type it like 5x - 3', q: `Expand: ${k}(x ${minus ? MINUS : '+'} ${m})`, a: { a: k, b: k * mm },
        ansText: linStr(k, k * mm),
        explain: `Multiply EVERYTHING inside the bracket by ${k}: ${k}×x = ${k}x and ${k}×${par(mm)} = ${num(k * mm)}. Answer: <b>${linStr(k, k * mm)}</b>.`,
        hint: `The ${k} must multiply both terms inside the bracket.` };
    }
    const a = R(2, 5);
    const mm = minus ? -m : m;
    return { kind: 'expr', note: 'Type it like 5x - 3', q: `Expand: ${k}(${a}x ${minus ? MINUS : '+'} ${m})`, a: { a: k * a, b: k * mm },
      ansText: linStr(k * a, k * mm),
      explain: `${k}×${a}x = ${k * a}x and ${k}×${par(mm)} = ${num(k * mm)}. Answer: <b>${linStr(k * a, k * mm)}</b>.`,
      hint: `Multiply both terms inside by ${k}.` };
  };

  /* ---------- Equations ---------- */
  G.oneStep = () => {
    const t = R(0, 3);
    if (t === 0) {
      const b = R(1, 12), x = R(2, 15);
      return { kind: 'num', q: `Solve for x: ${eqStr(1, b, x + b)}`, a: x,
        explain: `Subtract ${b} from both sides: x = ${x + b} ${MINUS} ${b} = <b>${x}</b>.`, hint: 'Do the opposite of +' + b + ' to both sides.' };
    }
    if (t === 1) {
      const b = R(1, 12), x = R(2, 15);
      return { kind: 'num', q: `Solve for x: ${eqStr(1, -b, x - b)}`, a: x,
        explain: `Add ${b} to both sides: x = ${num(x - b)} + ${b} = <b>${x}</b>.`, hint: 'Do the opposite of ' + MINUS + b + ' to both sides.' };
    }
    if (t === 2) {
      const a = R(2, 9), x = R(2, 12);
      return { kind: 'num', q: `Solve for x: ${a}x = ${a * x}`, a: x,
        explain: `Divide both sides by ${a}: x = ${a * x} ÷ ${a} = <b>${x}</b>.`, hint: `${a}x means ${a} times x. Do the opposite.` };
    }
    const a = R(2, 9), m = R(2, 9);
    return { kind: 'num', q: `Solve for x: ${fr('x', a)} = ${m}`, a: a * m,
      explain: `x is divided by ${a}, so multiply both sides by ${a}: x = ${m} × ${a} = <b>${a * m}</b>.`, hint: 'The opposite of dividing is multiplying.' };
  };

  G.twoStep = () => {
    if (Math.random() < 0.8) {
      const a = R(2, 9), x = R(-8, 12) || 5, b = R(1, 15) * pick([1, -1]);
      const c = a * x + b;
      return { kind: 'num', q: `Solve for x: ${eqStr(a, b, c)}`, a: x,
        explain: `First ${b > 0 ? 'subtract ' + b : 'add ' + Math.abs(b)} on both sides: ${a}x = ${num(c - b)}. Then divide by ${a}: x = <b>${num(x)}</b>.`,
        hint: 'Undo the plain number first (add or subtract), then undo the multiplying.' };
    }
    const d = R(2, 6), x = d * (R(-5, 8) || 3), b = R(1, 9) * pick([1, -1]);
    const c = x / d + b;
    return { kind: 'num', q: `Solve for x: ${fr('x', d)} ${b < 0 ? MINUS : '+'} ${Math.abs(b)} = ${num(c)}`, a: x,
      explain: `First ${b > 0 ? 'subtract ' + b : 'add ' + Math.abs(b)}: x/${d} = ${num(x / d)}. Then multiply by ${d}: x = <b>${num(x)}</b>.`,
      hint: 'Undo the plain number first, then undo the dividing.' };
  };

  G.parens = () => {
    const a = R(2, 7), x = R(-5, 10) || 4, b = R(1, 9) * pick([1, -1]);
    const c = a * (x + b);
    return { kind: 'num', q: `Solve for x: ${a}(x ${b < 0 ? MINUS : '+'} ${Math.abs(b)}) = ${num(c)}`, a: x,
      explain: `Divide both sides by ${a}: x ${b < 0 ? MINUS : '+'} ${Math.abs(b)} = ${num(c / a)}. Then ${b < 0 ? 'add' : 'subtract'} ${Math.abs(b)}: x = <b>${num(x)}</b>.`,
      hint: `Divide both sides by ${a} first. That avoids expanding the bracket.` };
  };

  G.wordEq = () => {
    const t = R(0, 2);
    if (t === 0) {
      const f = R(2, 6), r = R(2, 5), k = R(3, 12);
      return { kind: 'num', unit: 'km',
        q: `A taxi charges $${f} to start plus $${r} for every km. Ana's ride cost $${f + r * k}. How many km did she travel?`, a: k,
        explain: `Equation: ${r}k + ${f} = ${f + r * k}. Subtract ${f}: ${r}k = ${r * k}. Divide by ${r}: k = <b>${k}</b>.`,
        hint: `Write an equation: ${r} × (km) + ${f} = total.` };
    }
    if (t === 1) {
      const b = R(10, 60), a = R(5, 20), k = R(3, 12);
      return { kind: 'num', unit: 'weeks',
        q: `Mia has $${b} saved. She adds $${a} every week. After how many weeks will she have $${b + a * k}?`, a: k,
        explain: `Equation: ${a}w + ${b} = ${b + a * k}. Subtract ${b}: ${a}w = ${a * k}. Divide by ${a}: w = <b>${k}</b>.`,
        hint: `Write an equation: ${a} × (weeks) + ${b} = goal.` };
    }
    const a = R(2, 9), x = R(2, 12), b = R(1, 12);
    return { kind: 'num',
      q: `I think of a number, multiply it by ${a}, then subtract ${b}. I get ${a * x - b}. What is my number?`, a: x,
      explain: `Equation: ${a}n ${MINUS} ${b} = ${a * x - b}. Add ${b}: ${a}n = ${a * x}. Divide by ${a}: n = <b>${x}</b>.`,
      hint: 'Undo the steps in reverse order: add back, then divide.' };
  };

  G.checkSolution = () => {
    const a = R(2, 6), x = R(1, 9), b = R(1, 9) * pick([1, -1]);
    const c = a * x + b;
    const truth = Math.random() < 0.5;
    const cand = truth ? x : x + pick([-2, -1, 1, 2]);
    const lhs = a * cand + b;
    return { kind: 'choice', options: ['Yes', 'No'], a: truth ? 0 : 1,
      q: `Is x = ${cand} a solution of ${eqStr(a, b, c)}?`,
      explain: `Substitute x = ${cand}: ${a} × ${cand} ${b < 0 ? MINUS : '+'} ${Math.abs(b)} = ${num(lhs)}. ${lhs === c ? `That equals ${c}, so <b>yes</b>.` : `That is not ${c}, so <b>no</b>.`}`,
      hint: 'Put the value in for x and see if both sides match.' };
  };

  /* ---------- Shapes and data ---------- */
  G.area = () => {
    const t = R(0, 2);
    if (t === 0) {
      const l = R(4, 15), w = R(3, 12);
      return { kind: 'num', unit: 'cm²', q: `A rectangle is ${l} cm long and ${w} cm wide. What is its area?`, a: l * w,
        explain: `Area = length × width = ${l} × ${w} = <b>${l * w} cm²</b>.`, hint: 'Area of a rectangle = length × width.' };
    }
    if (t === 1) {
      let b = R(3, 14), h = R(2, 12);
      if ((b * h) % 2) b += 1;
      return { kind: 'num', unit: 'cm²', q: `A triangle has a base of ${b} cm and a height of ${h} cm. What is its area?`, a: (b * h) / 2,
        explain: `Area = ½ × base × height = ½ × ${b} × ${h} = <b>${(b * h) / 2} cm²</b>.`, hint: 'A triangle is half of a rectangle: ½ × base × height.' };
    }
    const b = R(4, 14), h = R(3, 10);
    return { kind: 'num', unit: 'cm²', q: `A parallelogram has a base of ${b} cm and a height of ${h} cm. What is its area?`, a: b * h,
      explain: `Area = base × height = ${b} × ${h} = <b>${b * h} cm²</b>.`, hint: 'Use the straight-up height, not the slanted side.' };
  };

  G.circle = () => {
    const r = R(2, 10);
    if (Math.random() < 0.5) {
      const a = 2 * 3.14 * r;
      return { kind: 'num', unit: 'cm', tol: 0.01, q: `A circle has a radius of ${r} cm. Find its circumference. (Use π ≈ 3.14)`, a,
        ansText: (+a.toFixed(2)) + ' cm', explain: `C = 2 × π × r = 2 × 3.14 × ${r} = <b>${+a.toFixed(2)} cm</b>.`, hint: 'Circumference = 2 × π × radius.' };
    }
    const a = 3.14 * r * r;
    return { kind: 'num', unit: 'cm²', tol: 0.01, q: `A circle has a radius of ${r} cm. Find its area. (Use π ≈ 3.14)`, a,
      ansText: (+a.toFixed(2)) + ' cm²', explain: `A = π × r² = 3.14 × ${r} × ${r} = <b>${+a.toFixed(2)} cm²</b>.`, hint: 'Area = π × radius × radius. Square the radius first.' };
  };

  G.angle = () => {
    const t = R(0, 2);
    if (t === 0) {
      const a = R(30, 80), b = R(30, 80);
      return { kind: 'num', unit: '°', q: `Two angles of a triangle are ${a}° and ${b}°. What is the third angle?`, a: 180 - a - b,
        explain: `Angles in a triangle add to 180°. 180 ${MINUS} ${a} ${MINUS} ${b} = <b>${180 - a - b}°</b>.`, hint: 'The three angles of a triangle add up to 180°.' };
    }
    if (t === 1) {
      const a = R(20, 160);
      return { kind: 'num', unit: '°', q: `Two angles sit together on a straight line. One is ${a}°. What is the other?`, a: 180 - a,
        explain: `Angles on a straight line add to 180°. 180 ${MINUS} ${a} = <b>${180 - a}°</b>.`, hint: 'Angles on a straight line add up to 180°.' };
    }
    const a = R(15, 75);
    return { kind: 'num', unit: '°', q: `Two angles make a right angle. One is ${a}°. What is the other?`, a: 90 - a,
      explain: `A right angle is 90°. 90 ${MINUS} ${a} = <b>${90 - a}°</b>.`, hint: 'A right angle is 90°.' };
  };

  G.mean = () => {
    for (;;) {
      const m = R(5, 15), vals = [];
      for (let i = 0; i < 4; i++) vals.push(R(Math.max(1, m - 5), m + 7));
      const last = 5 * m - vals.reduce((s, v) => s + v, 0);
      if (last < 1 || last > 25) continue;
      vals.push(last);
      shuffle(vals);
      return { kind: 'num', q: `Find the mean of these numbers: ${vals.join(', ')}`, a: m,
        explain: `Add them up: ${vals.join(' + ')} = ${5 * m}. Divide by 5: <b>${m}</b>.`, hint: 'Mean = sum of the numbers ÷ how many numbers there are.' };
    }
  };

  G.medianRange = () => {
    const set = new Set();
    const n = pick([5, 7]);
    while (set.size < n) set.add(R(1, 30));
    const vals = shuffle([...set]);
    const sorted = [...vals].sort((a, b) => a - b);
    if (Math.random() < 0.6) {
      return { kind: 'num', q: `Find the median of: ${vals.join(', ')}`, a: sorted[(n - 1) / 2],
        explain: `Put them in order: ${sorted.join(', ')}. The middle one is <b>${sorted[(n - 1) / 2]}</b>.`, hint: 'Put the numbers in order first, then find the middle one.' };
    }
    return { kind: 'num', q: `Find the range of: ${vals.join(', ')}`, a: sorted[n - 1] - sorted[0],
      explain: `Biggest ${MINUS} smallest = ${sorted[n - 1]} ${MINUS} ${sorted[0]} = <b>${sorted[n - 1] - sorted[0]}</b>.`, hint: 'Range = biggest number − smallest number.' };
  };

  G.probability = () => {
    for (;;) {
      const r = R(1, 6), b = R(1, 6), g = R(1, 6), total = r + b + g;
      if (![4, 5, 8, 10, 20].includes(total) && total !== 6 && total !== 12 && total !== 15) continue;
      const colour = pick([['red', r], ['blue', b], ['green', g]]);
      const exact = (colour[1] / total) * 1000;
      if (Math.abs(exact - Math.round(exact)) > 1e-9) continue; // keep it a clean decimal
      return { kind: 'num', note: 'Give a fraction like 1/4 or a decimal like 0.25.',
        q: `A bag has ${r} red, ${b} blue and ${g} green marbles. One is picked at random. What is the probability it is ${colour[0]}?`,
        a: colour[1] / total, ansText: fracText(colour[1], total),
        explain: `${colour[1]} of the ${total} marbles are ${colour[0]}, so the probability is ${colour[1]}/${total} = <b>${fracText(colour[1], total)}</b>.`,
        hint: 'Probability = favourable outcomes ÷ total outcomes.' };
    }
  };

  /* ---------- Answer parsing and checking ---------- */
  function parseNumber(raw) {
    let s = String(raw).trim().replace(/[−–—]/g, '-');
    s = s.replace(/[$€£%°]/g, '').trim();
    if (/^-?\d+,\d{1,2}$/.test(s)) s = s.replace(',', '.');
    else s = s.replace(/(\d),(?=\d{3}\b)/g, '$1');
    s = s.replace(/\s*[a-zA-Z²³]+(\/[a-zA-Z]+)?\s*$/, '').trim();
    s = s.replace(/^\+/, '');
    let m = s.match(/^(-?)(\d+)\s+(\d+)\/(\d+)$/);
    if (m) return +m[4] ? (m[1] ? -1 : 1) * (+m[2] + +m[3] / +m[4]) : NaN;
    m = s.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
    if (m) return +m[2] ? +m[1] / +m[2] : NaN;
    if (/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return parseFloat(s);
    return NaN;
  }

  // Reads things like "5x - 3", "-x+2", "3 + 2x" into {a, b}; returns null if it can't.
  function parseLinear(raw) {
    let s = String(raw).toLowerCase().replace(/[−–—]/g, '-').replace(/[\s*·]/g, '');
    if (!s) return null;
    if (!/^[+-]/.test(s)) s = '+' + s;
    const terms = s.match(/[+-][^+-]+/g);
    if (!terms || terms.join('') !== s) return null;
    let a = 0, b = 0;
    for (const t of terms) {
      const sign = t[0] === '-' ? -1 : 1;
      const body = t.slice(1);
      if (body.endsWith('x')) {
        const c = body.slice(0, -1);
        const v = c === '' ? 1 : parseFloat(c);
        if (Number.isNaN(v) || !/^\d*\.?\d*$/.test(c)) return null;
        a += sign * v;
      } else {
        if (!/^\d*\.?\d+$/.test(body)) return null;
        b += sign * parseFloat(body);
      }
    }
    return { a, b };
  }

  function check(q, input) {
    if (q.kind === 'choice') return Number(input) === q.a;
    if (q.kind === 'expr') {
      const p = parseLinear(input);
      return !!p && Math.abs(p.a - q.a.a) < 1e-9 && Math.abs(p.b - q.a.b) < 1e-9;
    }
    const v = parseNumber(input);
    return !Number.isNaN(v) && Math.abs(v - q.a) <= (q.tol || 1e-6);
  }

  function answerText(q) {
    if (q.kind === 'choice') return q.options[q.a];
    if (q.ansText) return q.ansText;
    return num(q.a) + (q.unit ? ' ' + q.unit : '');
  }

  MQ.gen = G;
  MQ.parseNumber = parseNumber;
  MQ.parseLinear = parseLinear;
  MQ.check = check;
  MQ.answerText = answerText;
  MQ.fmt = { num, par, fr, MINUS, linStr, expr, pick, R };
})((window.MQ = window.MQ || {}));

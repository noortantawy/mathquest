/* The map: worlds and their levels. Quiz levels draw questions from the named generators;
   balance levels are puzzles for the scale game (see balance.js). */
(function (MQ) {
  'use strict';

  const balanceTip =
    'Think of the equation as a balance scale. <b>Whatever you do to one side, you must do to the other</b> so it stays balanced. Your goal is to get <b>x</b> alone on one side.';

  MQ.WORLDS = [
    {
      id: 'integers', name: 'Number Cave', emoji: '🧊', color: '#6c5ce7',
      blurb: 'Negative numbers and order of operations',
      levels: [
        { id: 'int-addsub', name: 'Add & subtract integers', gens: ['intAddSub'],
          tip: 'Use a number line. Adding moves right (or left if the number is negative). <b>Subtracting a negative is the same as adding a positive</b>: 5 − (−3) = 5 + 3 = 8.' },
        { id: 'int-muldiv', name: 'Multiply & divide integers', gens: ['intMulDiv'],
          tip: '<b>Same signs → positive</b> (−3 × −4 = 12). <b>Different signs → negative</b> (−3 × 4 = −12). Division follows the same rule.' },
        { id: 'int-order', name: 'Order of operations', gens: ['intOrder', 'intWord'],
          tip: 'Do <b>Brackets</b> first, then <b>× and ÷</b> (left to right), then <b>+ and −</b>. So 2 + 3 × 4 = 2 + 12 = 14, not 20.' },
      ],
    },
    {
      id: 'fractions', name: 'Fraction Forest', emoji: '🌲', color: '#00a884',
      blurb: 'Fractions and decimals',
      levels: [
        { id: 'frac-addsub', name: 'Add & subtract fractions', gens: ['fracAddSub'],
          tip: 'Fractions need the <b>same denominator</b> (bottom number) before you add or subtract. 1/2 + 1/3 = 3/6 + 2/6 = 5/6. Simplify at the end.' },
        { id: 'frac-muldiv', name: 'Multiply & divide fractions', gens: ['fracMulDiv'],
          tip: 'To multiply: <b>tops × tops, bottoms × bottoms</b>. To divide: <b>keep, flip, multiply</b>. 2/3 ÷ 4/5 = 2/3 × 5/4 = 10/12 = 5/6.' },
        { id: 'decimals', name: 'Decimals', gens: ['decAddSub', 'decMul', 'fracToDec'],
          tip: 'Line up decimal points to add or subtract. To multiply, ignore the points, then count the decimal places. A fraction is a division: 3/4 = 3 ÷ 4 = 0.75.' },
      ],
    },
    {
      id: 'ratios', name: 'Ratio Ridge', emoji: '⛰️', color: '#e17055',
      blurb: 'Rates, proportions and percentages',
      levels: [
        { id: 'unit-rate', name: 'Unit rates', gens: ['unitRate'],
          tip: 'A <b>unit rate</b> is "per one". Divide the total by the number of units: 120 km in 3 hours is 120 ÷ 3 = 40 km per hour.' },
        { id: 'proportion', name: 'Proportions', gens: ['proportion'],
          tip: 'Find what <b>one</b> costs (or how much <b>one</b> needs), then multiply up. Or find how many times bigger the new amount is and scale everything by that.' },
        { id: 'percent', name: 'Percentages', gens: ['percentOf', 'discount', 'percentChange'],
          tip: '10% = divide by 10. 50% = half. 25% = a quarter. Build other percentages from those. <b>Percent change = change ÷ original × 100.</b>' },
      ],
    },
    {
      id: 'expressions', name: 'Expression Bay', emoji: '🌊', color: '#0984e3',
      blurb: 'Letters standing in for numbers',
      levels: [
        { id: 'evaluate', name: 'Evaluate expressions', gens: ['evalExpr'],
          tip: '<b>3x</b> means 3 × x. To evaluate, swap x for the number. When x = 4, 3x + 2 = 3 × 4 + 2 = 14. Use brackets for negatives.' },
        { id: 'combine', name: 'Combine like terms', gens: ['combineLike'],
          tip: 'You can only combine <b>like terms</b>: x’s with x’s, plain numbers with plain numbers. 2x + 3 + 4x − 1 = <b>6x + 2</b>.' },
        { id: 'distribute', name: 'The distributive property', gens: ['distribute', 'combineLike'],
          tip: 'A number outside a bracket multiplies <b>everything</b> inside: 3(x + 4) = 3x + 12. Be careful with minus signs: 2(x − 5) = 2x − 10.' },
      ],
    },
    {
      id: 'equations', name: 'Equation Peak', emoji: '⚖️', color: '#6c5ce7', featured: true,
      blurb: 'Solve equations on the balance scale',
      levels: [
        { id: 'bal-1', type: 'balance', kind: 1, name: 'Scale: x + number', tip: balanceTip + ' To undo <b>+ 3</b>, subtract 3 from both sides.' },
        { id: 'bal-2', type: 'balance', kind: 2, name: 'Scale: x − number', tip: balanceTip + ' To undo <b>− 3</b>, add 3 to both sides.' },
        { id: 'bal-3', type: 'balance', kind: 3, name: 'Scale: multiples of x', tip: 'When you see <b>3x</b> it means 3 lots of x. <b>Divide</b> both sides by 3 to find one x.' },
        { id: 'bal-4', type: 'balance', kind: 4, name: 'Scale: x divided', tip: 'When x is <b>divided</b> by something, undo it by <b>multiplying</b> both sides.' },
        { id: 'bal-5', type: 'balance', kind: 5, name: 'Scale: two steps (+)', tip: 'Two steps: first remove the plain number (add or subtract), <b>then</b> deal with the number stuck to x.' },
        { id: 'bal-6', type: 'balance', kind: 6, name: 'Scale: two steps (−)', tip: 'Same idea with a minus. To undo <b>− 4</b>, add 4 to both sides first.' },
        { id: 'bal-7', type: 'balance', kind: 7, name: 'Scale: fraction of x', tip: 'First remove the plain number, then multiply both sides to cancel the division.' },
        { id: 'bal-8', type: 'balance', kind: 8, name: 'Scale: negative answers', tip: 'Sometimes x turns out <b>negative</b>. That’s fine, the same moves still work. Watch your signs.' },
        { id: 'eq-one', name: 'Solve one-step equations', gens: ['oneStep'],
          tip: 'Use the <b>opposite operation</b> on both sides: undo + with −, − with +, × with ÷, ÷ with ×.' },
        { id: 'eq-two', name: 'Solve two-step equations', gens: ['twoStep'],
          tip: 'Undo the <b>plain number</b> first (add or subtract), then undo what’s stuck to x (divide or multiply). Check by putting your answer back in.' },
        { id: 'eq-paren', name: 'Equations with brackets', gens: ['parens', 'twoStep'],
          tip: 'For 3(x + 2) = 15, <b>divide both sides by 3</b> first: x + 2 = 5, so x = 3. It’s quicker than expanding.' },
        { id: 'eq-word', name: 'Word problems', gens: ['wordEq', 'checkSolution'],
          tip: 'Turn the story into an equation. "$3 to start plus $2 per km" is <b>2k + 3</b>. Then solve it like any two-step equation.' },
      ],
    },
    {
      id: 'shapes', name: 'Shape Shore', emoji: '📐', color: '#fdcb6e', dark: true,
      blurb: 'Geometry, averages and chance',
      levels: [
        { id: 'area', name: 'Area', gens: ['area'],
          tip: 'Rectangle: <b>l × w</b>. Parallelogram: <b>base × height</b>. Triangle: <b>½ × base × height</b>. Area is measured in square units (cm²).' },
        { id: 'circles-angles', name: 'Circles & angles', gens: ['circle', 'angle'],
          tip: 'Circumference = <b>2πr</b>. Area = <b>πr²</b>. Angles in a triangle add to <b>180°</b>, and angles on a straight line add to <b>180°</b> too.' },
        { id: 'data', name: 'Averages & probability', gens: ['mean', 'medianRange', 'probability'],
          tip: '<b>Mean</b>: add up, divide by how many. <b>Median</b>: the middle value once in order. <b>Range</b>: biggest − smallest. <b>Probability</b> = wanted outcomes ÷ all outcomes.' },
      ],
    },
  ];

  MQ.QUIZ_LENGTH = 6;
  MQ.PASS_MARK = 4; // out of QUIZ_LENGTH
  MQ.PUZZLES_PER_LEVEL = 3;
})((window.MQ = window.MQ || {}));

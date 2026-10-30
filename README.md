# MathQuest 7

A free, static website that helps a grade 7 student catch up in maths. No build step, no backend, no accounts. Progress is saved in the browser.

## What's inside

Six worlds, 27 levels. Each level has a short tip, then 6 questions (or 3 balance puzzles). Questions are generated fresh every time, with a worked explanation after each answer.

| World | Topics |
|---|---|
| Number Cave | Integers, order of operations |
| Fraction Forest | Fractions, decimals |
| Ratio Ridge | Unit rates, proportions, percentages |
| Expression Bay | Evaluating, combining like terms, distributing |
| Equation Peak | **Balance-scale game**, one- and two-step equations, brackets, word problems |
| Shape Shore | Area, circles, angles, mean/median/range, probability |

## Run it locally

Open `index.html` in a browser, or serve the folder:

```
python -m http.server 5173
```

## Deploy free on Vercel

Option A, command line:

```
npm i -g vercel
vercel
```

Accept the defaults (no framework, no build command, output directory `.`). Use `vercel --prod` for the final URL.

Option B, GitHub: push this folder to a repo, then on vercel.com choose **Add New > Project**, import it and click Deploy.

## Tests

```
node test/generators.test.js
```

Checks that every question generator gives valid, self-consistent questions and that every balance puzzle is solvable.

## Changing the content

- `js/curriculum.js`: worlds, levels and tips
- `js/generators.js`: question generators (add one, then list its name in a level's `gens`)
- `js/balance.js`: balance-scale puzzle rules

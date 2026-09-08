#!/usr/bin/env node
// Generate docs/manual-testing.md from the golden keystroke table.
//
// The table (packages/core/src/golden.json) is asserted by the test suite on
// every commit, so every expected value in the document is one the engine has
// been proven to produce. Displays are rendered the way the UI shows them
// (thousands separators applied), and keys are rendered with the glyphs on the
// keypad. A short hand-written preamble covers the checks only a human in the
// real host can do.
//
//   node scripts/manual-testing.mjs          # write docs/manual-testing.md
//   node scripts/manual-testing.mjs --check  # exit 1 if the file is stale
//
// Requires packages/core to be built (pnpm build) for the grouping helpers.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const require = createRequire(import.meta.url);
const core = require(resolve(root, 'packages/core/dist/index.js'));
const golden = JSON.parse(
  readFileSync(
    resolve(root, 'packages/core/src/golden.json'),
    'utf8',
  ),
);
const outPath = resolve(root, 'docs/manual-testing.md');

// --- key rendering ---------------------------------------------------------

const GLYPH = {
  '+': '+',
  '-': '−',
  x: '×',
  '/': '÷',
  '=': '=',
  '%': '%',
  sqrt: '√',
  'x^2': 'x²',
  '1/x': '1/x',
  '+/-': '±',
  back: '⌫',
  C: 'AC',
  CE: 'CE',
};

// Merge runs of digit / point tokens into one number so "1 2 3 . 4 5" reads
// as "123.45", then map the rest to keypad glyphs.
const renderKeys = keys => {
  const tokens = keys.split(' ').filter(Boolean);
  const out = [];
  let number = '';
  const flush = () => {
    if (number) out.push(number);
    number = '';
  };
  for (const t of tokens) {
    if (/^[0-9]$/.test(t) || t === '.') {
      number += t;
      continue;
    }
    flush();
    if (t.startsWith('paste:')) out.push(`paste "${t.slice(6)}"`);
    else out.push(GLYPH[t] ?? t);
  }
  flush();
  // Collapse long runs of the same key ("x² x² x² ..." -> "x² (53 times)").
  const collapsed = [];
  for (let i = 0; i < out.length;) {
    let j = i;
    while (j < out.length && out[j] === out[i]) j++;
    const n = j - i;
    collapsed.push(
      n >= 4 ? `${out[i]} (${n} times)` : out.slice(i, j).join(' '),
    );
    i = j;
  }
  return collapsed.length ? collapsed.join(' ') : '(nothing)';
};

const show = text =>
  text === '' ? '(blank)' : core.groupDigits(text);
const showExpression = text =>
  text === '' ? '(blank)' : core.groupExpression(text);

const cell = s => s.replace(/\|/g, '\\|');

// --- document ----------------------------------------------------------------

const title = s => s.charAt(0).toUpperCase() + s.slice(1);

const preamble = `# Manual testing

This is the hand-run checklist for the calculator. It has two parts:

1. **Host checks**, written by hand. These need a person in the real host
   application (the page or panel the calculator is embedded in, the demo
   page, a tablet), because they are about focus, clipboard, layout and
   theme, which no unit test can see.
2. **Engine checks**, generated from \`packages/core/src/golden.json\`. Every
   row is asserted by the test suite on each commit, so the expected values
   here are exactly what the engine produces. Do not edit that part by hand:
   run \`pnpm docs:manual\` after changing the table.

Conventions used below:

- Keys are shown as they appear on the keypad. Digits and the point are run
  together, so \`123.45\` means press 1, 2, 3, ., 4, 5.
- \`AC\` is the clear key when its label reads AC (keyboard: Escape). \`CE\` is
  the same key when its label reads C (keyboard: Delete).
- \`paste "text"\` means put that text on the clipboard, focus the calculator,
  press Ctrl+V (Cmd+V on Mac).
- Displays include thousands separators, as the UI shows them.
- Start every row from a cleared calculator (press AC until it reads 0).

## Host checks

Do these in the real host application, in every browser its users have, and
once on a tablet if it supports one.

### Focus and keyboard

| Do | Expect |
| --- | --- |
| Click the calculator, type \`7 + 8\` Enter | Shows \`15\`. Nothing else on the page reacted to those keys. |
| Click into a text field on the page, type \`7 + 8\` | The calculator did not change. |
| Tab from a page field toward the calculator | Focus reaches the calculator once; Tab leaves it again; nothing is trapped. |
| With the calculator focused, press Escape | Calculator clears. No panel or dialog on the page closed. |
| With the calculator focused, press Backspace | Deletes a digit. The browser did not navigate back. |
| With the calculator focused, press Delete | Acts as CE (clears the current entry only). |
| Type an unmapped key such as \`a\`, F5, an arrow key | Ignored by the calculator. |

### Clipboard

| Do | Expect |
| --- | --- |
| Copy a number from page text, focus the calculator, Ctrl+V | It appears, with thousands separators. |
| Paste \`1,234.50\` from page text, then \`× 2 =\` | \`2,469\` |
| Paste a word | \`Invalid input\`; pressing \`7\` recovers. |
| Ctrl+V with focus in a page text field | Text goes to the field, not the calculator. |
| Right-click the calculator | No Paste item in the browser menu (by browser design; Ctrl+V only). |
| Select the display text, Ctrl+C, paste into a page field | Note what arrives (the grouped text, e.g. \`1,234.5\`). |

### Layout and theme

| Do | Expect |
| --- | --- |
| Type \`123456789012345\` | Fits on one line; font shrinks; no clipping. |
| \`9 x²\` five times, then a sixth | \`3.43368382029251e+30\` then \`1.17901845777386e+61\`, both fully visible. |
| Resize the host panel to its narrowest | Display refits; no clipping; keys still tappable. |
| Resize back to widest | Font returns to normal size. |
| \`1234567 × 1234567 =\` | Top line may end in an ellipsis; the main line is whole. |
| Switch the host between light and dark theme | Key labels legible; operators and \`=\` distinguishable; colours come from the host. |

## Engine checks

Generated from the golden table. ${golden.groups.reduce((n, g) => n + g.rows.length, 0)} rows in ${golden.groups.length} groups.
`;

let body = '';
for (const group of golden.groups) {
  body += `\n### ${title(group.title)}\n\n| Keys | Display | Expression line |\n| --- | --- | --- |\n`;
  for (const r of group.rows) {
    body += `| \`${cell(renderKeys(r.keys))}\` | \`${cell(show(r.display))}\` | \`${cell(showExpression(r.expression))}\` |\n`;
  }
}

const doc = preamble + body;

if (process.argv.includes('--check')) {
  const current = existsSync(outPath)
    ? readFileSync(outPath, 'utf8')
    : '';
  if (current !== doc) {
    console.error(
      'docs/manual-testing.md is out of date. Run: pnpm docs:manual',
    );
    process.exit(1);
  }
  console.log('docs/manual-testing.md is up to date');
} else {
  writeFileSync(outPath, doc);
  console.log(`wrote ${outPath}`);
}

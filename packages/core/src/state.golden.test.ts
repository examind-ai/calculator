// Golden keystroke table: what a student sees for a given key sequence.
//
// Each row is [keys, main line, expression line]. The rows pin the
// calculator's *semantics* - percent, repeated =, CE vs C, negate, backspace,
// operator swap, error recovery - in one scannable place, following the
// iPhone / Windows Standard conventions the state machine emulates. Add a row
// whenever a bug report shows a sequence that surprised someone.

import {
  CalculatorAction,
  calculatorReducer,
  getDisplay,
  getExpression,
  initialState,
} from './state';

const toAction = (token: string): CalculatorAction => {
  if (/^[0-9]$/.test(token)) return { type: 'digit', value: token };
  if (token.startsWith('paste:'))
    return { type: 'paste', text: token.slice('paste:'.length) };
  switch (token) {
    case '.':
      return { type: 'decimal' };
    case '+':
    case '-':
    case 'x':
    case '/':
      return { type: 'binary', operator: token };
    case 'sqrt':
      return { type: 'unary', operator: 'sqrt' };
    case 'x^2':
      return { type: 'unary', operator: 'square' };
    case '1/x':
      return { type: 'unary', operator: 'reciprocal' };
    case '%':
      return { type: 'percent' };
    case '+/-':
      return { type: 'negate' };
    case 'back':
      return { type: 'backspace' };
    case '=':
      return { type: 'equals' };
    case 'C':
      return { type: 'clear' };
    case 'CE':
      return { type: 'clearEntry' };
    default:
      throw new Error(`Unknown token: ${token}`);
  }
};

const press = (keys: string) =>
  keys
    .split(' ')
    .filter(Boolean)
    .reduce(
      (state, token) => calculatorReducer(state, toAction(token)),
      initialState,
    );

import golden from './golden.json';

// The table lives in golden.json so that docs/manual-testing.md can be
// generated from the same rows (see scripts/manual-testing.mjs). Each row is
// { keys, display, expression }: the raw engine strings, before the hook adds
// thousands separators.
for (const group of golden.groups) {
  describe(`golden: ${group.title}`, () => {
    it.each(group.rows.map(r => [r.keys, r.display, r.expression]))(
      '%j -> %j / %j',
      (keys, display, expression) => {
        const state = press(keys);
        expect(getDisplay(state)).toBe(display);
        expect(getExpression(state)).toBe(expression);
      },
    );
  });
}

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

type Row = [keys: string, display: string, expression: string];

const table: Record<string, Row[]> = {
  'entry and editing': [
    ['', '0', '0'],
    ['0 0 7', '7', '7'],
    ['1 . 5 . 5', '1.55', '1.55'],
    ['. 5', '0.5', '0.5'],
    ['1 2 3 back', '12', '12'],
    ['1 back', '0', '0'],
    ['1 back back', '0', '0'],
    ['5 +/- back', '0', '0'],
    [
      '1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7',
      '123456789012345',
      '123456789012345',
    ],
  ],
  'arithmetic and precedence': [
    ['7 + 8 =', '15', '7 + 8 ='],
    ['7 + 8', '8', '7 + 8'],
    ['7 +', '7', '7 +'],
    ['2 + 3 x 4 =', '14', '2 + 3 × 4 ='],
    ['2 x 3 + 4 =', '10', '2 × 3 + 4 ='],
    ['1 0 - 2 - 3 =', '5', '10 − 2 − 3 ='],
    ['1 0 / 2 / 5 =', '1', '10 ÷ 2 ÷ 5 ='],
    ['1 2 - 2 x 3 =', '6', '12 − 2 × 3 ='],
    ['0 . 1 + 0 . 2 =', '0.3', '0.1 + 0.2 ='],
    ['1 / 3 =', '0.333333333333333', '1 ÷ 3 ='],
    ['2 / 3 =', '0.666666666666667', '2 ÷ 3 ='],
    ['1 / 3 = x 3 =', '1', '0.333333333333333 × 3 ='],
    ['1 / 3 = x 3 = - 1 =', '0', '1 − 1 ='],
    ['2 sqrt x^2 - 2 =', '0', '2 − 2 ='],
    ['1 / 7 x 7 - 1 =', '0', '1 ÷ 7 × 7 − 1 ='],
    [
      '9 9 9 9 9 9 9 9 x 9 9 9 9 9 9 9 9 =',
      '9.9999998e+15',
      '99999999 × 99999999 =',
    ],
    [
      '1 2 3 4 5 6 7 x 1 2 3 4 5 6 7 =',
      '1524155677489',
      '1234567 × 1234567 =',
    ],
    ['5 x 0 . 0 0 0 0 0 1 =', '0.000005', '5 × 0.000001 ='],
    ['5 x 0 . 0 0 0 0 0 0 1 =', '5e-7', '5 × 1e-7 ='],
    ['5 . +', '5', '5 +'],
    ['5 . + 2 =', '7', '5 + 2 ='],
    ['1 / 8 0 0 0 0 0 0 0 =', '1.25e-8', '1 ÷ 80000000 ='],
    ['5 . =', '5', '5 ='],
    ['0 . =', '0', '0 ='],
    ['5 +/- =', '-5', '-5 ='],
    ['- 5 =', '-5', '0 − 5 ='],
  ],
  'operator swap and bare equals': [
    ['2 + x 3 =', '6', '2 × 3 ='],
    ['2 + - 3 =', '-1', '2 − 3 ='],
    ['9 =', '9', '9 ='],
    ['9 = =', '9', '9 ='],
    ['5 + =', '10', '5 + 5 ='],
    ['5 x =', '25', '5 × 5 ='],
  ],
  'repeated equals': [
    ['9 x 6 =', '54', '9 × 6 ='],
    ['9 x 6 = =', '324', '54 × 6 ='],
    ['9 x 6 = = =', '1944', '324 × 6 ='],
    ['7 + 8 = =', '23', '15 + 8 ='],
    ['1 0 - 3 = =', '4', '7 − 3 ='],
    ['1 0 0 / 1 0 = =', '1', '10 ÷ 10 ='],
    ['9 x 6 = sqrt =', '7.34846922834953', '7.34846922834953 ='],
    ['7 + 8 = +/- =', '-15', '-15 ='],
  ],
  'continuing from a result': [
    ['7 + 8 = x 2 =', '30', '15 × 2 ='],
    ['7 + 8 = 2 x 3 =', '6', '2 × 3 ='],
    ['7 + 8 = . 5 =', '0.5', '0.5 ='],
    ['7 + 8 = sqrt', '3.87298334620742', '3.87298334620742'],
    ['7 + 8 = x^2', '225', '225'],
  ],
  percent: [
    ['5 0 %', '0.5', '0.5'],
    ['2 0 0 + 1 0 %', '20', '200 + 20'],
    ['2 0 0 + 1 0 % =', '220', '200 + 20 ='],
    ['2 0 0 - 1 0 % =', '180', '200 − 20 ='],
    ['2 0 0 x 1 0 % =', '4000', '200 × 20 ='],
    ['2 0 0 / 1 0 % =', '10', '200 ÷ 20 ='],
    ['7 + 8 = %', '0.15', '0.15'],
    ['5 0 % %', '0.005', '0.005'],
  ],
  'unary operators': [
    ['9 sqrt', '3', '3'],
    ['2 sqrt', '1.4142135623731', '1.4142135623731'],
    ['5 x^2', '25', '25'],
    ['4 1/x', '0.25', '0.25'],
    ['3 1/x 1/x', '3', '3'],
    ['5 + 9 sqrt =', '8', '5 + 3 ='],
    ['5 + 9 sqrt + 2 =', '10', '5 + 3 + 2 ='],
    ['2 sqrt x^2', '2', '2'],
    ['1 . 5 x^2', '2.25', '2.25'],
    ['0 . 1 x^2', '0.01', '0.01'],
  ],
  negate: [
    ['5 +/-', '-5', '-5'],
    ['5 +/- +/-', '5', '5'],
    ['0 +/-', '0', '0'],
    ['5 + +/-', '5', '5 +'],
    ['5 + +/- 3 =', '8', '5 + 3 ='],
    ['5 + 3 +/- =', '2', '5 + -3 ='],
    ['9 x 6 = +/-', '-54', '-54'],
    ['9 x 6 = +/- x 2 =', '-108', '-54 × 2 ='],
    ['0 . 5 +/- back back 3', '-3', '-3'],
  ],
  'clear entry vs clear all': [
    ['5 x 7 CE', '0', '5 ×'],
    ['5 x 7 CE 8 =', '40', '5 × 8 ='],
    ['5 x 7 C', '0', '0'],
    ['7 + 8 = CE', '0', '0'],
    ['7 + 8 = CE 2 =', '2', '2 ='],
    ['7 + 8 = C 2 =', '2', '2 ='],
    ['5 CE 3', '3', '3'],
  ],
  paste: [
    ['paste:1,234.5', '1234.5', '1234.5'],
    ['paste:1,234.5 + 1 =', '1235.5', '1234.5 + 1 ='],
    ['5 + paste:3 =', '8', '5 + 3 ='],
    ['7 + 8 = paste:2 x 3 =', '6', '2 \u00d7 3 ='],
    [
      'paste:3.14159265358979323846',
      '3.14159265358979',
      '3.14159265358979',
    ],
    ['paste:1e-7', '1e-7', '1e-7'],
    ['paste:$2,000 x 1 . 5 =', '3000', '2000 \u00d7 1.5 ='],
    ['paste:-3 x^2', '9', '9'],
    ['paste:12 3', '3', '3'],
    ['paste:abc', 'Invalid input', '0'],
    ['5 paste:abc', 'Invalid input', '0'],
    ['5 + paste:abc', 'Invalid input', '5 +'],
    ['5 + paste:abc 3 =', '8', '5 + 3 ='],
    ['5 + paste:abc x', 'Invalid input', '5 +'],
    ['7 paste:abc x 3 =', '3', '3 ='],
    ['paste:abc 7', '7', '7'],
    ['paste:abc paste:5', '5', '5'],
    ['paste:abc C', '0', '0'],
    ['7 + 8 = paste:abc', 'Invalid input', '0'],
    ['5 / 0 = paste:3', 'Error', ''],
  ],
  'errors and recovery': [
    ['5 / 0 =', 'Error', ''],
    ['5 / 0 = 7', 'Error', ''],
    ['5 / 0 = +', 'Error', ''],
    ['5 / 0 = C', '0', '0'],
    ['5 / 0 = C 7', '7', '7'],
    ['5 / 0 = CE', '0', '0'],
    ['0 1/x', 'Error', ''],
    ['4 +/- sqrt', 'Error', ''],
    ['4 +/- sqrt C 4 sqrt', '2', '2'],
    ['5 + 0 1/x', 'Error', ''],
  ],
};

for (const [group, rows] of Object.entries(table)) {
  describe(`golden: ${group}`, () => {
    it.each(rows)('%j -> %j / %j', (keys, display, expression) => {
      const state = press(keys);
      expect(getDisplay(state)).toBe(display);
      expect(getExpression(state)).toBe(expression);
    });
  });
}

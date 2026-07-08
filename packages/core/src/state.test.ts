import {
  CalculatorAction,
  calculatorReducer,
  getClearMode,
  getDisplay,
  getExpression,
  initialState,
} from './state';

// Tiny DSL: map a token to an action so tests read like key presses.
const toAction = (token: string): CalculatorAction => {
  if (/^[0-9]$/.test(token)) return { type: 'digit', value: token };
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

const run = (...tokens: string[]) =>
  tokens.reduce(
    (state, token) => calculatorReducer(state, toAction(token)),
    initialState,
  );

const display = (...tokens: string[]) => getDisplay(run(...tokens));
const expression = (...tokens: string[]) =>
  getExpression(run(...tokens));
const clearMode = (...tokens: string[]) =>
  getClearMode(run(...tokens));

// Squaring 9 eight times stays finite (~1.8e244); a ninth overflows to
// Infinity, which the state machine must surface as an error.
const bigViaSquares = ['9', ...Array(8).fill('x^2')];

describe('digit / decimal accumulation', () => {
  it('accumulates digits', () => {
    expect(display('1', '2', '3')).toBe('123');
  });

  it('collapses a leading zero', () => {
    expect(display('0', '5')).toBe('5');
  });

  it('accumulates a decimal and ignores a second point', () => {
    expect(display('1', '.', '5', '.')).toBe('1.5');
  });
});

describe('arithmetic with precedence', () => {
  it('7 + 8 = 15', () => {
    expect(display('7', '+', '8', '=')).toBe('15');
  });

  it('2 + 3 x 4 = 14', () => {
    expect(display('2', '+', '3', 'x', '4', '=')).toBe('14');
  });

  it('12 - 2 x 3 = 6', () => {
    expect(display('1', '2', '-', '2', 'x', '3', '=')).toBe('6');
  });

  it('trims float noise: 0.1 + 0.2 = 0.3', () => {
    expect(display('0', '.', '1', '+', '0', '.', '2', '=')).toBe(
      '0.3',
    );
  });
});

describe('operator swap', () => {
  it('2 + x 3 = 6 (last operator wins)', () => {
    expect(display('2', '+', 'x', '3', '=')).toBe('6');
  });
});

describe('unary and percent', () => {
  it('sqrt 9 = 3', () => {
    expect(display('9', 'sqrt')).toBe('3');
  });

  it('5 x^2 = 25', () => {
    expect(display('5', 'x^2')).toBe('25');
  });

  it('4 1/x = 0.25', () => {
    expect(display('4', '1/x')).toBe('0.25');
  });

  it('50 % = 0.5', () => {
    expect(display('5', '0', '%')).toBe('0.5');
  });

  it('200 + 10 % = 220 (contextual percent)', () => {
    expect(display('2', '0', '0', '+', '1', '0', '%', '=')).toBe(
      '220',
    );
  });

  it('commits a unary result after a pending op: 5 + 9 sqrt + 2 = 10 (the #1324 bug)', () => {
    expect(display('5', '+', '9', 'sqrt', '+', '2', '=')).toBe('10');
  });
});

describe('negate and backspace', () => {
  it('+/- on 5 = -5', () => {
    expect(display('5', '+/-')).toBe('-5');
  });

  it('backspace on 78 = 7', () => {
    expect(display('7', '8', 'back')).toBe('7');
  });
});

describe('clear semantics', () => {
  it('C (label while typing) clears only the current entry, keeping the pending op: 5 x 7, C, 8, = -> 40', () => {
    expect(display('5', 'x', '7', 'CE', '8', '=')).toBe('40');
  });

  it('AC (label when idle) clears everything: 5 x 7, AC -> 0', () => {
    expect(display('5', 'x', '7', 'C')).toBe('0');
  });

  it('negating a result starts a clean context: 9 x 6 = +/- C 2 = -> 2', () => {
    expect(display('9', 'x', '6', '=', '+/-', 'CE', '2', '=')).toBe(
      '2',
    );
  });
});

describe('errors', () => {
  it('5 / 0 = -> Error, then C -> 0', () => {
    expect(display('5', '/', '0', '=')).toBe('Error');
    expect(display('5', '/', '0', '=', 'C')).toBe('0');
  });

  it('ignores input while in an error state until cleared', () => {
    expect(display('5', '/', '0', '=', '9')).toBe('Error');
  });
});

describe('two-line expression', () => {
  it('after 9 - the expression reads "9 −" and the main line reads 9', () => {
    expect(expression('9', '-')).toBe('9 −');
    expect(display('9', '-')).toBe('9');
  });

  it('while typing the second operand: 7 + 8 -> "7 + 8"', () => {
    expect(expression('7', '+', '8')).toBe('7 + 8');
  });

  it('after equals: 7 + 8 = -> "7 + 8 ="', () => {
    expect(expression('7', '+', '8', '=')).toBe('7 + 8 =');
  });

  it('shows precedence expression: 2 + 3 x 4 -> "2 + 3 × 4"', () => {
    expect(expression('2', '+', '3', 'x', '4')).toBe('2 + 3 × 4');
  });

  it('after equals with precedence: 2 + 3 x 4 = -> "2 + 3 × 4 ="', () => {
    expect(expression('2', '+', '3', 'x', '4', '=')).toBe(
      '2 + 3 × 4 =',
    );
  });
});

describe('expression renders proper operator glyphs', () => {
  it('maps x -> ×', () => {
    expect(expression('7', 'x')).toBe('7 ×');
  });

  it('maps / -> ÷', () => {
    expect(expression('8', '/')).toBe('8 ÷');
  });

  it('maps - -> −', () => {
    expect(expression('9', '-')).toBe('9 −');
  });

  it('leaves + as +', () => {
    expect(expression('6', '+')).toBe('6 +');
  });
});

describe('repeated = repeats the last operation (iPhone-style)', () => {
  it('9 x 6 = -> 54, = -> 324, = -> 1944', () => {
    expect(display('9', 'x', '6', '=')).toBe('54');
    expect(display('9', 'x', '6', '=', '=')).toBe('324');
    expect(display('9', 'x', '6', '=', '=', '=')).toBe('1944');
  });

  it('re-renders the expression cleanly, not "9 x 6 54 54 ="', () => {
    expect(expression('9', 'x', '6', '=', '=')).toBe('54 × 6 =');
  });

  it('repeats addition: 7 + 8 = -> 15, = -> 23', () => {
    expect(display('7', '+', '8', '=', '=')).toBe('23');
  });

  it('does nothing when no operation is pending: 9 = = -> 9', () => {
    expect(display('9', '=', '=')).toBe('9');
  });
});

describe('non-finite results surface as Error', () => {
  it('equals: an overflowing product -> Error', () => {
    expect(
      display(...bigViaSquares, 'x', ...bigViaSquares, '='),
    ).toBe('Error');
  });

  it('percent: an overflowing percentage -> Error', () => {
    expect(
      display(...bigViaSquares, 'x', ...bigViaSquares, '%'),
    ).toBe('Error');
  });

  it('unary: squaring past the float ceiling -> Error', () => {
    expect(display('9', ...Array(9).fill('x^2'))).toBe('Error');
  });
});

describe('contextual clear key label (AC vs C)', () => {
  it('is AC when idle', () => {
    expect(getClearMode(initialState)).toBe('AC');
  });

  it('is C while typing an entry', () => {
    expect(clearMode('5')).toBe('C');
  });

  it('stays C after an operator (the typed operand is still dirty)', () => {
    expect(clearMode('9', 'x')).toBe('C');
  });

  it('is C while typing the second operand', () => {
    expect(clearMode('5', 'x', '7')).toBe('C');
  });

  it('is AC right after =', () => {
    expect(clearMode('5', 'x', '7', '=')).toBe('AC');
  });

  it('stays AC when an operator follows a result: 9 x 6 = then + ', () => {
    expect(clearMode('9', 'x', '6', '=', '+')).toBe('AC');
  });

  it('flips back to C once a value is entered after that result: 9 x 6 = + 2', () => {
    expect(clearMode('9', 'x', '6', '=', '+', '2')).toBe('C');
  });

  it('is C after a unary result: 9 sqrt', () => {
    expect(clearMode('9', 'sqrt')).toBe('C');
  });

  it('is C after a percent result: 50 %', () => {
    expect(clearMode('5', '0', '%')).toBe('C');
  });

  it('percent creates an entry to clear, even on a result: 5 + 3 = % -> C', () => {
    expect(clearMode('5', '+', '3', '=', '%')).toBe('C');
  });

  it('unary creates an entry to clear, even on a result: 5 = sqrt -> C', () => {
    expect(clearMode('5', '=', 'sqrt')).toBe('C');
  });

  it('is C after negating a result: 9 x 6 = +/-', () => {
    expect(clearMode('9', 'x', '6', '=', '+/-')).toBe('C');
  });

  it('flips to AC after C clears the current entry: 5, C', () => {
    expect(clearMode('5', 'CE')).toBe('AC');
  });

  it('flips to AC when backspace empties the entry to 0', () => {
    expect(clearMode('5', 'back')).toBe('AC');
  });

  it('stays C when backspace leaves a non-zero entry: 58 -> 5', () => {
    expect(clearMode('5', '8', 'back')).toBe('C');
  });

  it('is AC in an error state', () => {
    expect(clearMode('5', '/', '0', '=')).toBe('AC');
  });
});

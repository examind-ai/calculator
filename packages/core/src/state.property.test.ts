// Fuzz the state machine with random keystroke sequences and check the
// invariants that must hold after every single step, whatever the student
// pressed. These are the promises the skins and the exam room rely on: the
// reducer never throws, the display is always a number or "Error", the
// committed expression is always well-formed, and the error state is sticky.

import fc from 'fast-check';

import { DISPLAY_DIGITS, basicEvaluator } from './evaluator';
import type { BinaryOperator } from './evaluator';
import {
  CalculatorAction,
  CalculatorState,
  calculatorReducer,
  getClearMode,
  getDisplay,
  getExpression,
  initialState,
} from './state';
import { WORKING_PRECISION, parseValue } from './value';

// --- Generators ---

const actionArb: fc.Arbitrary<CalculatorAction> = fc.oneof(
  {
    weight: 10,
    arbitrary: fc
      .integer({ min: 0, max: 9 })
      .map(n => ({ type: 'digit' as const, value: String(n) })),
  },
  { weight: 3, arbitrary: fc.constant({ type: 'decimal' as const }) },
  {
    weight: 6,
    arbitrary: fc
      .constantFrom<BinaryOperator>('+', '-', 'x', '/')
      .map(operator => ({ type: 'binary' as const, operator })),
  },
  {
    weight: 2,
    arbitrary: fc
      .constantFrom(
        'reciprocal' as const,
        'square' as const,
        'sqrt' as const,
      )
      .map(operator => ({ type: 'unary' as const, operator })),
  },
  { weight: 1, arbitrary: fc.constant({ type: 'percent' as const }) },
  { weight: 2, arbitrary: fc.constant({ type: 'negate' as const }) },
  {
    weight: 2,
    arbitrary: fc.constant({ type: 'backspace' as const }),
  },
  { weight: 4, arbitrary: fc.constant({ type: 'equals' as const }) },
  {
    weight: 2,
    arbitrary: fc
      .oneof(
        fc.constantFrom(
          '1,234.5',
          ' 42 ',
          '-3',
          '\u22127.5',
          '$1,000',
          '1e-7',
          '3.14159265358979323846',
          'abc',
          '1.2.3',
          '',
        ),
        fc.string({ maxLength: 12 }),
      )
      .map(text => ({ type: 'paste' as const, text })),
  },
  { weight: 1, arbitrary: fc.constant({ type: 'clear' as const }) },
  {
    weight: 1,
    arbitrary: fc.constant({ type: 'clearEntry' as const }),
  },
);

const sequenceArb = fc.array(actionArb, {
  minLength: 1,
  maxLength: 40,
});

// Typed text while entering: optional minus, digits, at most one point.
const TYPED = /^-?\d+(\.\d*)?$/;
// A formatted result: plain or exponential, no trailing zeros.
const FORMATTED = /^-?(0|[1-9]\d*)(\.\d*[1-9])?(e[+-]\d+)?$/;

const significantDigits = (text: string): number =>
  text.split('e')[0].replace(/[-.]/g, '').replace(/^0+/, '').length;

// --- Invariants, checked after every step ---

const checkInvariants = (
  state: CalculatorState,
  action: CalculatorAction,
  previous: CalculatorState,
) => {
  // Selectors never throw and always produce strings.
  const display = getDisplay(state);
  const expression = getExpression(state);
  expect(typeof display).toBe('string');
  expect(typeof expression).toBe('string');
  expect(['C', 'AC']).toContain(getClearMode(state));

  if (state.error) {
    expect(display).toBe('Error');
    expect(expression).toBe('');
    expect(getClearMode(state)).toBe('AC');
    return;
  }

  // The display is always a well-formed number the engine itself accepts.
  expect(display).toMatch(state.overwrite ? FORMATTED : TYPED);
  expect(() => parseValue(display)).not.toThrow();
  // "-0" is a legitimate typed state (backspacing "-0.5" to "-0", then "3"
  // gives "-3"); a *result* is never negative zero.
  if (state.overwrite) expect(display).not.toBe('-0');
  expect(display).not.toMatch(/NaN|Infinity/);
  expect(significantDigits(display)).toBeLessThanOrEqual(
    DISPLAY_DIGITS,
  );

  // A carried result is a canonical Value at working precision and its
  // display is that value rounded.
  if (state.value !== null) {
    expect(parseValue(state.value)).toBe(state.value);
    expect(significantDigits(state.value)).toBeLessThanOrEqual(
      WORKING_PRECISION,
    );
    expect(basicEvaluator.format(state.value)).toBe(state.entry);
  }

  // Every committed operand is a canonical Value.
  for (const operand of state.operands)
    expect(parseValue(operand)).toBe(operand);

  // Shape of the committed expression.
  if (state.justEquals) {
    // After =: either a bare value ("9 =") or a fully evaluated expression.
    expect(
      (state.operands.length === 0 && state.operators.length === 0) ||
        state.operands.length === state.operators.length + 1,
    ).toBe(true);
    expect(state.overwrite).toBe(true);
    expect(state.awaitingOperand).toBe(false);
  } else {
    // While entering: every committed operand is followed by an operator.
    expect(state.operands.length).toBe(state.operators.length);
    expect(state.repeatOperator).toBeNull();
    expect(state.repeatOperand).toBeNull();
  }

  // Awaiting an operand implies an operator is pending.
  if (state.awaitingOperand)
    expect(state.operators.length).toBeGreaterThan(0);

  // Error is sticky: only C / CE leave it.
  if (
    previous.error &&
    action.type !== 'clear' &&
    action.type !== 'clearEntry'
  )
    expect(state).toBe(previous);
};

const run = (actions: CalculatorAction[]) => {
  let state = initialState;
  for (const action of actions) {
    const previous = state;
    state = calculatorReducer(state, action);
    checkInvariants(state, action, previous);
  }
  return state;
};

const RUNS = { numRuns: 1000 };

describe('state machine invariants under random keystrokes', () => {
  it('hold after every step of any sequence', () => {
    fc.assert(
      fc.property(sequenceArb, actions => {
        run(actions);
      }),
      RUNS,
    );
  });

  it('C always returns to the initial state', () => {
    fc.assert(
      fc.property(sequenceArb, actions => {
        expect(run([...actions, { type: 'clear' }])).toEqual(
          initialState,
        );
      }),
      RUNS,
    );
  });

  it('the reducer is pure: the same sequence gives the same state', () => {
    fc.assert(
      fc.property(sequenceArb, actions => {
        expect(run(actions)).toEqual(run(actions));
      }),
      RUNS,
    );
  });

  it('the reducer never mutates its input state', () => {
    fc.assert(
      fc.property(sequenceArb, actions => {
        let state = initialState;
        for (const action of actions) {
          const previous = state;
          const snapshot = JSON.stringify(previous);
          state = calculatorReducer(previous, action);
          expect(JSON.stringify(previous)).toBe(snapshot);
        }
      }),
      RUNS,
    );
  });
});

// --- Precision carried through the keyboard, not just the evaluator ---

const pressNumber = (text: string): CalculatorAction[] => {
  const negative = text.startsWith('-');
  const digits = negative ? text.slice(1) : text;
  const keys: CalculatorAction[] = [];
  for (const ch of digits)
    keys.push(
      ch === '.' ? { type: 'decimal' } : { type: 'digit', value: ch },
    );
  if (negative) keys.push({ type: 'negate' });
  return keys;
};

const operandArb = fc
  .tuple(
    fc.boolean(),
    fc.integer({ min: 1, max: 8 }),
    fc.integer({ min: 0, max: 7 }),
  )
  .chain(([negative, wholeLen, fracLen]) =>
    fc
      .tuple(
        fc.array(fc.integer({ min: 0, max: 9 }), {
          minLength: wholeLen,
          maxLength: wholeLen,
        }),
        fc.array(fc.integer({ min: 0, max: 9 }), {
          minLength: fracLen,
          maxLength: fracLen,
        }),
      )
      .map(([w, f]) => {
        const whole = w.join('').replace(/^0+(?=\d)/, '');
        const text = f.length ? `${whole}.${f.join('')}` : whole;
        return negative && /[1-9]/.test(text) ? `-${text}` : text;
      }),
  );

const nonZeroArb = operandArb.filter(text => /[1-9]/.test(text));

const displayAfter = (keys: CalculatorAction[]) =>
  getDisplay(keys.reduce(calculatorReducer, initialState));

const shown = (text: string) =>
  basicEvaluator.format(parseValue(text));

describe('precision carries across = for any typed operands', () => {
  it('a / b = x b = shows a', () => {
    fc.assert(
      fc.property(operandArb, nonZeroArb, (a, b) => {
        const keys = [
          ...pressNumber(a),
          { type: 'binary', operator: '/' } as const,
          ...pressNumber(b),
          { type: 'equals' } as const,
          { type: 'binary', operator: 'x' } as const,
          ...pressNumber(b),
          { type: 'equals' } as const,
        ];
        expect(displayAfter(keys)).toBe(shown(a));
      }),
      RUNS,
    );
  });

  it('a x b = / b = shows a', () => {
    fc.assert(
      fc.property(operandArb, nonZeroArb, (a, b) => {
        const keys = [
          ...pressNumber(a),
          { type: 'binary', operator: 'x' } as const,
          ...pressNumber(b),
          { type: 'equals' } as const,
          { type: 'binary', operator: '/' } as const,
          ...pressNumber(b),
          { type: 'equals' } as const,
        ];
        expect(displayAfter(keys)).toBe(shown(a));
      }),
      RUNS,
    );
  });

  it('a + b = - b = shows a', () => {
    fc.assert(
      fc.property(operandArb, operandArb, (a, b) => {
        const keys = [
          ...pressNumber(a),
          { type: 'binary', operator: '+' } as const,
          ...pressNumber(b),
          { type: 'equals' } as const,
          { type: 'binary', operator: '-' } as const,
          ...pressNumber(b),
          { type: 'equals' } as const,
        ];
        expect(displayAfter(keys)).toBe(shown(a));
      }),
      RUNS,
    );
  });

  it('a sqrt x^2 shows a for non-negative a', () => {
    fc.assert(
      fc.property(
        operandArb.filter(text => !text.startsWith('-')),
        a => {
          const keys = [
            ...pressNumber(a),
            { type: 'unary', operator: 'sqrt' } as const,
            { type: 'unary', operator: 'square' } as const,
          ];
          expect(displayAfter(keys)).toBe(shown(a));
        },
      ),
      RUNS,
    );
  });
});

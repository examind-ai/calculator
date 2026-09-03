// Evaluation seam for the calculator.
//
// The state machine (state.ts) and the selectors speak only to the `Evaluator`
// interface, so a later mode (financial / scientific) can drop in its own
// implementation without touching a skin or the reducer. Every number crossing
// this seam is a `Value` - an exact canonical decimal string - never a JS
// `number`, so no layer outside value.ts can reintroduce binary floating point.
//
// Operands and operators arrive as parallel sequences so precedence (and,
// later, parentheses / multi-argument functions) stays expressible rather than
// being baked into a single running total.

import {
  Decimal,
  D,
  Value,
  fromDecimal,
  parseValue,
  toDecimal,
} from './value';

export type BinaryOperator = '+' | '-' | 'x' | '/';

export type UnaryOperator = 'reciprocal' | 'square' | 'sqrt';

// Every method throws `Error('Error')` for a mathematically invalid request
// (divide by zero, sqrt of a negative, non-numeric text, overflow). The state
// machine catches that and enters its error state.
export interface Evaluator {
  // Canonicalise user-typed text ("0.", "-0.5", "007") into a Value.
  parse: (text: string) => Value;
  // Evaluate a flat sequence: operands[0] op[0] operands[1] op[1] ...
  // `operators.length` must be `operands.length - 1`.
  evaluate: (operands: Value[], operators: BinaryOperator[]) => Value;
  applyUnary: (operator: UnaryOperator, value: Value) => Value;
  // Contextual percent: with a pending left operand `base`, `value` reads as a
  // percentage of it (200 + 10 % -> 20); with no base, as value / 100.
  percent: (value: Value, base: Value | null) => Value;
  // Render a Value for the display: bounded significant digits, exponential
  // notation outside the readable magnitude range.
  format: (value: Value) => string;
}

// --- Display formatting ---

// Significant digits shown to the user. Results are computed at
// WORKING_PRECISION and only rounded here, for the view. 15 matches the typed
// entry cap, so a value you can type you can also see back unchanged, and it
// lets exact integer results up to 15 digits display in full.
export const DISPLAY_DIGITS = 15;

// Below 10^-6 in magnitude the fixed form is a wall of zeros; at or above
// 10^DISPLAY_DIGITS it would need more digits than we show. Both switch to
// exponential notation (1e-7, 9.9999998e+15).
const EXPONENT_FLOOR = -6;

const format = (value: Value): string => {
  const rounded =
    toDecimal(value).toSignificantDigits(DISPLAY_DIGITS);
  if (rounded.isZero()) return '0';
  const exponent = rounded.e;
  if (exponent >= DISPLAY_DIGITS || exponent < EXPONENT_FLOOR)
    return rounded.toExponential();
  return rounded.toFixed();
};

// --- Arithmetic ---

const applyBinary = (
  operator: BinaryOperator,
  a: Decimal,
  b: Decimal,
): Decimal => {
  switch (operator) {
    case '+':
      return a.plus(b);
    case '-':
      return a.minus(b);
    case 'x':
      return a.times(b);
    case '/':
      if (b.isZero()) throw new Error('Error');
      return a.div(b);
  }
};

// Two-pass precedence: fold x and / left-to-right first, then + and -.
// No parentheses in this mode; the sequence shape leaves room to add them later.
const evaluate = (
  operands: Value[],
  operators: BinaryOperator[],
): Value => {
  if (operands.length === 0) throw new Error('Error');
  if (operators.length !== operands.length - 1)
    throw new TypeError(
      `evaluate: expected ${operands.length - 1} operators for ${operands.length} operands, got ${operators.length}`,
    );

  const values = [toDecimal(operands[0])];
  const additive: BinaryOperator[] = [];

  for (let i = 0; i < operators.length; i++) {
    const operator = operators[i];
    const next = toDecimal(operands[i + 1]);
    if (operator === 'x' || operator === '/') {
      const left = values[values.length - 1];
      values[values.length - 1] = applyBinary(operator, left, next);
    } else {
      additive.push(operator);
      values.push(next);
    }
  }

  let result = values[0];
  for (let i = 0; i < additive.length; i++)
    result = applyBinary(additive[i], result, values[i + 1]);

  return fromDecimal(result);
};

const applyUnary = (operator: UnaryOperator, value: Value): Value => {
  const d = toDecimal(value);
  switch (operator) {
    case 'reciprocal':
      if (d.isZero()) throw new Error('Error');
      return fromDecimal(new D(1).div(d));
    case 'square':
      return fromDecimal(d.times(d));
    case 'sqrt':
      if (d.isNegative()) throw new Error('Error');
      return fromDecimal(d.sqrt());
  }
};

const percent = (value: Value, base: Value | null): Value => {
  const d = toDecimal(value);
  const scaled = base === null ? d : toDecimal(base).times(d);
  return fromDecimal(scaled.div(100));
};

export const basicEvaluator: Evaluator = {
  parse: parseValue,
  evaluate,
  applyUnary,
  percent,
  format,
};

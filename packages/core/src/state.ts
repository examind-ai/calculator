// UI-agnostic state machine for the calculator.
//
// This owns the input semantics that make CE differ from C, that make `%`
// contextual, and - critically - that decide when the current register is a
// committable operand vs a pending operator slot. It holds NO React and NO
// styling so it can be unit-tested directly and reused by later modes.
//
// Model: a committed expression (`operands` + `operators`) plus a single
// current register rendered as `entry` (a string, to preserve "0." and "-0"
// while typing). During input the invariant is
// `operators.length === operands.length`: every committed operand is followed
// by an operator, and `entry` holds the next, not-yet-committed operand.

import {
  BinaryOperator,
  Evaluator,
  UnaryOperator,
  basicEvaluator,
} from './evaluator';

export interface CalculatorState {
  operands: number[];
  operators: BinaryOperator[];
  // Display string for the current register (main line).
  entry: string;
  // Next digit starts a fresh entry (set after ops, unary/percent results, =).
  overwrite: boolean;
  // A binary operator is pending and no fresh operand has been entered yet.
  // Distinguishes an operator swap (`2 + x 3`) from committing an operand.
  awaitingOperand: boolean;
  // The last committed action was `=`; operands/operators still hold the
  // evaluated expression so the top line can render "a + b =".
  justEquals: boolean;
  // The last binary operator + right operand, replayed when `=` is pressed
  // again (iPhone-style: 9 x 6 = -> 54, = -> 324, = -> 1944).
  repeatOperator: BinaryOperator | null;
  repeatOperand: number | null;
  // The current entry has been touched (typed, or produced by a unary/percent/
  // negate) since the last reset point (initial, C, =, or backspace-to-0).
  // Drives the C-vs-AC key: C while dirty, AC when clean. A bare binary operator
  // leaves it unchanged - so `9 x` stays C, but `9 x 6 =` then `+` stays AC.
  dirty: boolean;
  error: boolean;
}

export type CalculatorAction =
  | { type: 'digit'; value: string }
  | { type: 'decimal' }
  | { type: 'binary'; operator: BinaryOperator }
  | { type: 'unary'; operator: UnaryOperator }
  | { type: 'percent' }
  | { type: 'negate' }
  | { type: 'backspace' }
  | { type: 'equals' }
  | { type: 'clear' }
  | { type: 'clearEntry' };

export const initialState: CalculatorState = {
  operands: [],
  operators: [],
  entry: '0',
  overwrite: true,
  awaitingOperand: false,
  justEquals: false,
  repeatOperator: null,
  repeatOperand: null,
  dirty: false,
  error: false,
};

// Cap typed entry at ~15 significant digits: past this a JS double cannot
// represent the number precisely, so further digits are noise. Also bounds how
// wide a *typed* value can ever get (the skin still auto-shrinks the font).
const MAX_SIGNIFICANT_DIGITS = 15;

// Count the significant digits already typed into an entry string: digits only
// (sign and decimal point dropped), with leading zeros not counted. "0.00123"
// -> 3, "100" -> 3, "0" -> 0.
const significantDigitCount = (entry: string): number =>
  entry.replace(/[^0-9]/g, '').replace(/^0+/, '').length;

// Format a computed result for display, bounded so it never becomes an
// unreadable 20+ digit fixed string:
// - trims binary float noise to ~12 significant figures (0.1 + 0.2 -> "0.3");
// - uses exponential notation for magnitudes outside [1e-6, 1e12], so a very
//   large or very small result stays compact (1e+20, not 100000000000000000000).
// Non-finite values are handled upstream (surfaced as Error) before reaching here.
const formatNumber = (value: number): string => {
  if (value === 0) return '0';
  const rounded = Number(value.toPrecision(12));
  const magnitude = Math.abs(rounded);
  if (magnitude >= 1e12 || magnitude < 1e-6)
    return rounded.toExponential();
  return String(rounded);
};

// Render operators with their proper glyphs on the expression line
// (x -> times, / -> divide, - -> minus); + is unchanged.
const OPERATOR_SYMBOLS: Record<BinaryOperator, string> = {
  '+': '+',
  '-': '−',
  x: '×',
  '/': '÷',
};

const operatorSymbol = (operator: BinaryOperator): string =>
  OPERATOR_SYMBOLS[operator];

// The current register's numeric value.
const currentValue = (state: CalculatorState): number =>
  Number(state.entry);

// After `=`, the result becomes the seed for whatever comes next; clear the
// old committed tokens so the new action starts from a clean slate. Also clear
// the repeat fields: a unary / percent / negate applied to a result breaks the
// repeat chain, so a following `=` is a stable no-op rather than replaying the
// pre-unary operation one press late.
const afterEquals = (state: CalculatorState): CalculatorState => ({
  ...state,
  operands: [],
  operators: [],
  justEquals: false,
  repeatOperator: null,
  repeatOperand: null,
});

const clearAll = (): CalculatorState => ({ ...initialState });

const digit = (
  state: CalculatorState,
  value: string,
): CalculatorState => {
  if (state.justEquals)
    return {
      ...clearAll(),
      entry: value,
      overwrite: false,
      dirty: true,
    };

  // Starting a fresh entry (after an op / result) or replacing the leading 0.
  if (state.overwrite || state.entry === '0')
    return {
      ...state,
      entry: value,
      overwrite: false,
      awaitingOperand: false,
      dirty: true,
    };

  // Appending: past the significant-digit cap the extra digit is noise, so
  // ignore it (real calculators cap input too).
  if (significantDigitCount(state.entry) >= MAX_SIGNIFICANT_DIGITS)
    return state;

  return {
    ...state,
    entry: state.entry + value,
    overwrite: false,
    awaitingOperand: false,
    dirty: true,
  };
};

const decimal = (state: CalculatorState): CalculatorState => {
  if (state.justEquals)
    return {
      ...clearAll(),
      entry: '0.',
      overwrite: false,
      dirty: true,
    };
  if (state.overwrite)
    return {
      ...state,
      entry: '0.',
      overwrite: false,
      awaitingOperand: false,
      dirty: true,
    };
  if (state.entry.includes('.')) return state;
  return {
    ...state,
    entry: state.entry + '.',
    awaitingOperand: false,
    dirty: true,
  };
};

const binary = (
  state: CalculatorState,
  operator: BinaryOperator,
): CalculatorState => {
  // Continue from a just-computed result as the new first operand.
  if (state.justEquals)
    return {
      ...state,
      operands: [currentValue(state)],
      operators: [operator],
      overwrite: true,
      awaitingOperand: true,
      justEquals: false,
    };

  // No fresh operand entered since the last operator -> swap the operator.
  if (state.awaitingOperand && state.operators.length > 0)
    return {
      ...state,
      operators: [...state.operators.slice(0, -1), operator],
    };

  // Commit the current register as an operand, then push the operator.
  // A unary or percent result IS a committable operand here - that is the
  // #1324 bug: it must not be discarded by treating this as an operator swap.
  return {
    ...state,
    operands: [...state.operands, currentValue(state)],
    operators: [...state.operators, operator],
    overwrite: true,
    awaitingOperand: true,
  };
};

const unary = (
  state: CalculatorState,
  operator: UnaryOperator,
  evaluator: Evaluator,
): CalculatorState => {
  const base = state.justEquals ? afterEquals(state) : state;
  try {
    const result = evaluator.applyUnary(operator, currentValue(base));
    if (!Number.isFinite(result)) throw new Error('Error');
    return {
      ...base,
      entry: formatNumber(result),
      overwrite: true,
      awaitingOperand: false,
      dirty: true,
    };
  } catch {
    return { ...base, error: true };
  }
};

// Contextual percent: with a pending operator, `x %` reads as a percentage of
// the preceding operand (200 + 10 % -> 20 -> 220); otherwise as value/100.
const percent = (state: CalculatorState): CalculatorState => {
  const base = state.justEquals ? afterEquals(state) : state;
  const value = currentValue(base);
  const result =
    base.operands.length > 0
      ? (base.operands[base.operands.length - 1] * value) / 100
      : value / 100;
  if (!Number.isFinite(result)) return { ...base, error: true };
  return {
    ...base,
    entry: formatNumber(result),
    overwrite: true,
    awaitingOperand: false,
    dirty: true,
  };
};

const negate = (state: CalculatorState): CalculatorState => {
  // A binary operator is pending and no fresh operand has been typed yet, so
  // `entry` still shows the committed left operand - negating it would be
  // meaningless. No-op (matches iPhone: `5 + ±` stays `5`, never flashes `-5`).
  if (state.awaitingOperand) return state;
  const base = state.justEquals ? afterEquals(state) : state;
  if (base.entry === '0' || base.entry === '0.') return base;
  const entry = base.entry.startsWith('-')
    ? base.entry.slice(1)
    : '-' + base.entry;
  return { ...base, entry, dirty: true };
};

const backspace = (state: CalculatorState): CalculatorState => {
  // Only editable while the user is typing an entry.
  if (state.overwrite || state.justEquals) return state;
  const trimmed = state.entry.slice(0, -1);
  const entry = trimmed === '' || trimmed === '-' ? '0' : trimmed;
  // Deleting the entry back to 0 resets it to a clean (AC) state.
  return {
    ...state,
    entry,
    overwrite: entry === '0',
    dirty: entry !== '0',
  };
};

const equals = (
  state: CalculatorState,
  evaluator: Evaluator,
): CalculatorState => {
  // Repeated `=`: replay the last operation on the running result, iPhone-
  // style (9 x 6 = -> 54, = -> 324). Re-render the expression as "result op b ="
  // rather than appending the result onto the committed operands.
  if (state.justEquals) {
    if (state.repeatOperator === null || state.repeatOperand === null)
      return state;
    const operands = [currentValue(state), state.repeatOperand];
    const operators = [state.repeatOperator];
    try {
      const result = evaluator.evaluate(operands, operators);
      if (!Number.isFinite(result)) throw new Error('Error');
      return {
        ...state,
        operands,
        operators,
        entry: formatNumber(result),
        overwrite: true,
        awaitingOperand: false,
        justEquals: true,
        dirty: false,
      };
    } catch {
      return { ...state, error: true };
    }
  }

  if (state.operators.length === 0)
    return {
      ...state,
      overwrite: true,
      justEquals: true,
      dirty: false,
    };

  const operands = [...state.operands, currentValue(state)];
  try {
    const result = evaluator.evaluate(operands, state.operators);
    if (!Number.isFinite(result)) throw new Error('Error');
    return {
      ...state,
      operands,
      entry: formatNumber(result),
      overwrite: true,
      awaitingOperand: false,
      justEquals: true,
      dirty: false,
      // Remember the last operator + right operand to replay on repeated `=`.
      repeatOperator: state.operators[state.operators.length - 1],
      repeatOperand: operands[operands.length - 1],
    };
  } catch {
    return { ...state, error: true };
  }
};

const clearEntry = (state: CalculatorState): CalculatorState => {
  if (state.error) return clearAll();
  // After `=` the evaluated expression's operands/operators still linger; clear
  // them first (like negate / percent / unary do) so CE starts a clean context
  // instead of leaving 3 operands vs 1 operator and dropping the next operand.
  const base = state.justEquals ? afterEquals(state) : state;
  return {
    ...base,
    entry: '0',
    overwrite: true,
    // Re-await the operand for a still-pending operator.
    awaitingOperand: base.operators.length > 0,
    justEquals: false,
    dirty: false,
  };
};

export const createReducer =
  (evaluator: Evaluator = basicEvaluator) =>
  (
    state: CalculatorState,
    action: CalculatorAction,
  ): CalculatorState => {
    // In an error state only C / CE recover; everything else is inert.
    if (
      state.error &&
      action.type !== 'clear' &&
      action.type !== 'clearEntry'
    )
      return state;

    switch (action.type) {
      case 'digit':
        return digit(state, action.value);
      case 'decimal':
        return decimal(state);
      case 'binary':
        return binary(state, action.operator);
      case 'unary':
        return unary(state, action.operator, evaluator);
      case 'percent':
        return percent(state);
      case 'negate':
        return negate(state);
      case 'backspace':
        return backspace(state);
      case 'equals':
        return equals(state, evaluator);
      case 'clear':
        return clearAll();
      case 'clearEntry':
        return clearEntry(state);
    }
  };

export const calculatorReducer = createReducer();

// --- Selectors (derive the two display lines from state) ---

export const getDisplay = (state: CalculatorState): string =>
  state.error ? 'Error' : state.entry;

// The single clear key is contextual: `C` (clear only the current entry) when
// there IS a current entry to clear, else `AC` (clear everything). An entry
// exists (`dirty`) the moment any key writes the current value - digit, decimal,
// unary, percent, negate - and stops existing when it is consumed by `=`, wiped
// by clear, or backspaced away to 0. A bare binary operator neither creates nor
// clears an entry, so it leaves the mode unchanged (`9 x` stays C; `9 x 6 =`
// then `+` stays AC until the next value is entered).
export const getClearMode = (state: CalculatorState): 'C' | 'AC' =>
  state.dirty && !state.error ? 'C' : 'AC';

// Top line: the running expression with operator feedback.
// "9 -", "7 + 8", "2 + 3 x 4", and after `=` "2 + 3 x 4 =".
export const getExpression = (state: CalculatorState): string => {
  if (state.error) return '';

  const parts: string[] = [];
  for (let i = 0; i < state.operands.length; i++) {
    parts.push(formatNumber(state.operands[i]));
    if (i < state.operators.length)
      parts.push(operatorSymbol(state.operators[i]));
  }

  if (state.justEquals)
    return parts.length ? `${parts.join(' ')} =` : `${state.entry} =`;

  // Append the in-progress operand unless we are awaiting one (the operator
  // was just pressed and `entry` still shows the prior operand).
  if (!state.awaitingOperand) parts.push(state.entry);

  return parts.join(' ');
};

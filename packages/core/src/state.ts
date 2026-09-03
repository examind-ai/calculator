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
import { Value } from './value';

export interface CalculatorState {
  // Committed operands, exact (see value.ts). Never JS numbers.
  operands: Value[];
  operators: BinaryOperator[];
  // Display string for the current register (main line).
  entry: string;
  // The register's exact value when it holds a computed result (after =, a
  // unary, percent or negate on one). `entry` is then the rounded view and
  // this is what the next operation consumes, so 1 / 3 = x 3 = is 1. Null
  // while the register holds typed text - the text itself is exact.
  value: Value | null;
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
  repeatOperand: Value | null;
  // The current entry has been touched (typed, or produced by a unary/percent/
  // negate) since the last reset point (initial, C, =, or backspace-to-0).
  // Drives the C-vs-AC key: C while dirty, AC when clean. A bare binary operator
  // leaves it unchanged - so `9 x` stays C, but `9 x 6 =` then `+` stays AC.
  dirty: boolean;
  error: boolean;
  // A paste that was not a number (Windows: "Invalid input"). The register is
  // cleared and the main line shows the message; a digit, point or new paste
  // recovers directly, C / CE clear it, and every other key is inert until a
  // value is entered - so a stale value can never be operated on by mistake.
  invalidInput: boolean;
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
  | { type: 'clearEntry' }
  // Clipboard text, as copied; the evaluator decides whether it is a number.
  | { type: 'paste'; text: string };

export const initialState: CalculatorState = {
  operands: [],
  operators: [],
  entry: '0',
  value: null,
  overwrite: true,
  awaitingOperand: false,
  justEquals: false,
  repeatOperator: null,
  repeatOperand: null,
  dirty: false,
  error: false,
  invalidInput: false,
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

// The current register as an exact Value: the carried result if there is one,
// else the typed text. `entry` is numeric by construction (digits, one point,
// optional leading minus), so parsing only throws if the state machine itself
// has a bug.
const currentValue = (
  state: CalculatorState,
  evaluator: Evaluator,
): Value => state.value ?? evaluator.parse(state.entry);

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
  // A negative-zero entry ('-0', reachable by backspacing a negated value) is
  // collapsed like '0' but keeps its sign: '-0' + '3' -> '-3', not '-03'.
  if (state.overwrite || state.entry === '0' || state.entry === '-0')
    return {
      ...state,
      entry:
        !state.overwrite && state.entry === '-0'
          ? '-' + value
          : value,
      value: null,
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
    value: null,
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
      value: null,
      overwrite: false,
      awaitingOperand: false,
      dirty: true,
    };
  if (state.entry.includes('.')) return state;
  return {
    ...state,
    entry: state.entry + '.',
    value: null,
    awaitingOperand: false,
    dirty: true,
  };
};

const binary = (
  state: CalculatorState,
  operator: BinaryOperator,
  evaluator: Evaluator,
): CalculatorState => {
  // Continue from a just-computed result as the new first operand.
  if (state.justEquals)
    return {
      ...state,
      operands: [currentValue(state, evaluator)],
      operators: [operator],
      overwrite: true,
      awaitingOperand: true,
      justEquals: false,
      // The result is now an operand, not something = can replay.
      repeatOperator: null,
      repeatOperand: null,
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
  try {
    const value = currentValue(state, evaluator);
    return {
      ...state,
      operands: [...state.operands, value],
      operators: [...state.operators, operator],
      // The committed operand is now a value: render it as one ("5." -> "5").
      entry: evaluator.format(value),
      value,
      overwrite: true,
      awaitingOperand: true,
    };
  } catch {
    return { ...state, error: true };
  }
};

const unary = (
  state: CalculatorState,
  operator: UnaryOperator,
  evaluator: Evaluator,
): CalculatorState => {
  const base = state.justEquals ? afterEquals(state) : state;
  try {
    const result = evaluator.applyUnary(
      operator,
      currentValue(base, evaluator),
    );
    return {
      ...base,
      entry: evaluator.format(result),
      value: result,
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
const percent = (
  state: CalculatorState,
  evaluator: Evaluator,
): CalculatorState => {
  const base = state.justEquals ? afterEquals(state) : state;
  const left =
    base.operands.length > 0
      ? base.operands[base.operands.length - 1]
      : null;
  try {
    const result = evaluator.percent(
      currentValue(base, evaluator),
      left,
    );
    return {
      ...base,
      entry: evaluator.format(result),
      value: result,
      overwrite: true,
      awaitingOperand: false,
      dirty: true,
    };
  } catch {
    return { ...base, error: true };
  }
};

const negate = (state: CalculatorState): CalculatorState => {
  // A binary operator is pending and no fresh operand has been typed yet, so
  // `entry` still shows the committed left operand - negating it would be
  // meaningless. No-op (matches iPhone: `5 + ±` stays `5`, never flashes `-5`).
  if (state.awaitingOperand) return state;
  const base = state.justEquals ? afterEquals(state) : state;
  if (base.entry === '0' || base.entry === '0.') return base;
  const flip = (text: string): string =>
    text.startsWith('-') ? text.slice(1) : '-' + text;
  // A carried result is negated exactly alongside its rounded view. Its
  // canonical form is never "-0" (format renders zero as "0", caught above),
  // so a sign flip keeps it canonical.
  return {
    ...base,
    entry: flip(base.entry),
    value: base.value === null ? null : (flip(base.value) as Value),
    dirty: true,
  };
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
    const operators = [state.repeatOperator];
    try {
      const operands = [
        currentValue(state, evaluator),
        state.repeatOperand,
      ];
      const result = evaluator.evaluate(operands, operators);
      return {
        ...state,
        operands,
        operators,
        entry: evaluator.format(result),
        value: result,
        overwrite: true,
        awaitingOperand: false,
        justEquals: true,
        dirty: false,
      };
    } catch {
      return { ...state, error: true };
    }
  }

  // Bare `=` on a lone entry: the entry becomes a result, so render it as
  // one ("5." -> "5", "-0" -> "0") and carry it exactly like any result.
  if (state.operators.length === 0) {
    try {
      const value = currentValue(state, evaluator);
      return {
        ...state,
        entry: evaluator.format(value),
        value,
        overwrite: true,
        justEquals: true,
        dirty: false,
      };
    } catch {
      return { ...state, error: true };
    }
  }

  try {
    const operands = [
      ...state.operands,
      currentValue(state, evaluator),
    ];
    const result = evaluator.evaluate(operands, state.operators);
    return {
      ...state,
      operands,
      entry: evaluator.format(result),
      value: result,
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

// Pasted text replaces the current register with the number it contains,
// rounded to what the keypad could have produced, and behaves like a result
// (the next operation consumes it, a digit starts fresh). Text that is not a
// number clears the register and shows "Invalid input" rather than being
// silently ignored: otherwise the student could operate on the stale value
// believing the paste had landed. It is not the sticky Error state - nothing
// mathematically wrong happened - so typing recovers immediately.
const paste = (
  state: CalculatorState,
  text: string,
  evaluator: Evaluator,
): CalculatorState => {
  const base = state.justEquals ? clearAll() : state;
  let value: Value;
  try {
    value = evaluator.paste(text);
  } catch {
    return {
      ...base,
      entry: '0',
      value: null,
      overwrite: true,
      // Keep a pending operator waiting for its operand.
      awaitingOperand: base.operators.length > 0,
      dirty: true,
      invalidInput: true,
    };
  }
  return {
    ...base,
    entry: evaluator.format(value),
    value,
    overwrite: true,
    awaitingOperand: false,
    dirty: true,
  };
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
    value: null,
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

    // After an invalid paste only entering a value (digit, point, paste) or
    // clearing gets out; operators, unary, percent, = and backspace are inert.
    if (state.invalidInput) {
      switch (action.type) {
        case 'digit':
        case 'decimal':
        case 'paste':
        case 'clear':
        case 'clearEntry':
          state = { ...state, invalidInput: false };
          break;
        default:
          return state;
      }
    }

    switch (action.type) {
      case 'digit':
        return digit(state, action.value);
      case 'decimal':
        return decimal(state);
      case 'binary':
        return binary(state, action.operator, evaluator);
      case 'unary':
        return unary(state, action.operator, evaluator);
      case 'percent':
        return percent(state, evaluator);
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
      case 'paste':
        return paste(state, action.text, evaluator);
    }
  };

export const calculatorReducer = createReducer();

// --- Selectors (derive the two display lines from state) ---

export const getDisplay = (state: CalculatorState): string => {
  if (state.error) return 'Error';
  if (state.invalidInput) return 'Invalid input';
  return state.entry;
};

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
// Operands are exact Values, so the evaluator that produced them renders them;
// pass the same one given to `createReducer` (basic when omitted).
export const getExpression = (
  state: CalculatorState,
  evaluator: Evaluator = basicEvaluator,
): string => {
  if (state.error) return '';

  const parts: string[] = [];
  for (let i = 0; i < state.operands.length; i++) {
    parts.push(evaluator.format(state.operands[i]));
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

// Evaluation seam for the calculator.
//
// The UI + state machine (state.ts) speak only to the `Evaluator` interface, so
// later modes (Excel-formula / financial / scientific) can drop in their own
// implementation - e.g. backed by @formulajs/formulajs - without touching the
// skin or the reducer. Operands and operators arrive as parallel sequences so
// precedence (and, later, parentheses / multi-argument functions) stays
// expressible rather than being baked into a single running total.

export type BinaryOperator = '+' | '-' | 'x' | '/';

export type UnaryOperator = 'reciprocal' | 'square' | 'sqrt';

export interface Evaluator {
  // Evaluate a flat sequence: operands[0] op[0] operands[1] op[1] ...
  // `operators.length` must be `operands.length - 1`.
  evaluate: (
    operands: number[],
    operators: BinaryOperator[],
  ) => number;
  applyUnary: (operator: UnaryOperator, value: number) => number;
}

const applyBinary = (
  operator: BinaryOperator,
  a: number,
  b: number,
): number => {
  switch (operator) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case 'x':
      return a * b;
    case '/':
      if (b === 0) throw new Error('Error');
      return a / b;
  }
};

// Two-pass precedence: fold x and / left-to-right first, then + and -.
// No parentheses in this mode; the sequence shape leaves room to add them later.
const evaluate = (
  operands: number[],
  operators: BinaryOperator[],
): number => {
  if (operands.length === 0) throw new Error('Error');

  const values = [operands[0]];
  const additive: BinaryOperator[] = [];

  for (let i = 0; i < operators.length; i++) {
    const operator = operators[i];
    const next = operands[i + 1];
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

  return result;
};

const applyUnary = (
  operator: UnaryOperator,
  value: number,
): number => {
  switch (operator) {
    case 'reciprocal':
      if (value === 0) throw new Error('Error');
      return 1 / value;
    case 'square':
      return value * value;
    case 'sqrt':
      if (value < 0) throw new Error('Error');
      return Math.sqrt(value);
  }
};

export const basicEvaluator: Evaluator = { evaluate, applyUnary };

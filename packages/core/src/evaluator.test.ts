import { BinaryOperator, basicEvaluator } from './evaluator';

const evaluate = (operands: number[], operators: BinaryOperator[]) =>
  basicEvaluator.evaluate(operands, operators);

describe('basicEvaluator.evaluate - precedence', () => {
  it('applies x/ before +/-: 2 + 3 x 4 = 14', () => {
    expect(evaluate([2, 3, 4], ['+', 'x'])).toBe(14);
  });

  it('12 - 2 x 3 = 6', () => {
    expect(evaluate([12, 2, 3], ['-', 'x'])).toBe(6);
  });

  it('2 + 3 x 4 - 1 = 13', () => {
    expect(evaluate([2, 3, 4, 1], ['+', 'x', '-'])).toBe(13);
  });

  it('evaluates same-precedence left-to-right: 10 / 2 / 5 = 1', () => {
    expect(evaluate([10, 2, 5], ['/', '/'])).toBe(1);
  });

  it('single operand returns itself', () => {
    expect(evaluate([42], [])).toBe(42);
  });
});

describe('basicEvaluator.applyUnary', () => {
  it('sqrt 9 = 3', () => {
    expect(basicEvaluator.applyUnary('sqrt', 9)).toBe(3);
  });

  it('5 ^2 = 25', () => {
    expect(basicEvaluator.applyUnary('square', 5)).toBe(25);
  });

  it('1/4 = 0.25', () => {
    expect(basicEvaluator.applyUnary('reciprocal', 4)).toBe(0.25);
  });
});

describe('basicEvaluator - errors', () => {
  it('throws on divide by zero', () => {
    expect(() => evaluate([5, 0], ['/'])).toThrow('Error');
  });

  it('throws on reciprocal of zero', () => {
    expect(() => basicEvaluator.applyUnary('reciprocal', 0)).toThrow(
      'Error',
    );
  });

  it('throws on sqrt of a negative', () => {
    expect(() => basicEvaluator.applyUnary('sqrt', -4)).toThrow(
      'Error',
    );
  });
});

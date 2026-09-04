import { BinaryOperator, basicEvaluator } from './evaluator';
import { Value, parseValue } from './value';

const v = (text: string | number): Value => parseValue(String(text));
const vs = (...texts: (string | number)[]): Value[] => texts.map(v);

const evaluate = (
  operands: Value[],
  operators: BinaryOperator[],
): string => basicEvaluator.evaluate(operands, operators);

describe('basicEvaluator.evaluate - precedence', () => {
  it('applies x/ before +/-: 2 + 3 x 4 = 14', () => {
    expect(evaluate(vs(2, 3, 4), ['+', 'x'])).toBe('14');
  });

  it('12 - 2 x 3 = 6', () => {
    expect(evaluate(vs(12, 2, 3), ['-', 'x'])).toBe('6');
  });

  it('2 + 3 x 4 - 1 = 13', () => {
    expect(evaluate(vs(2, 3, 4, 1), ['+', 'x', '-'])).toBe('13');
  });

  it('evaluates same-precedence left-to-right: 10 / 2 / 5 = 1', () => {
    expect(evaluate(vs(10, 2, 5), ['/', '/'])).toBe('1');
  });

  it('evaluates subtraction left-to-right: 10 - 2 - 3 = 5', () => {
    expect(evaluate(vs(10, 2, 3), ['-', '-'])).toBe('5');
  });

  it('single operand returns itself', () => {
    expect(evaluate(vs(42), [])).toBe('42');
  });
});

describe('basicEvaluator.evaluate - exactness', () => {
  it('0.1 + 0.2 = 0.3 exactly', () => {
    expect(evaluate(vs('0.1', '0.2'), ['+'])).toBe('0.3');
  });

  it('0.1 x 3 = 0.3 exactly', () => {
    expect(evaluate(vs('0.1', 3), ['x'])).toBe('0.3');
  });

  it('1.1 - 1 = 0.1 exactly', () => {
    expect(evaluate(vs('1.1', 1), ['-'])).toBe('0.1');
  });

  it('keeps a 16-digit integer product exact', () => {
    expect(evaluate(vs(99999999, 99999999), ['x'])).toBe(
      '9999999800000001',
    );
  });

  it('keeps a 30-digit product of two 15-digit entries exact', () => {
    expect(
      evaluate(vs('999999999999999', '999999999999999'), ['x']),
    ).toBe('999999999999998000000000000001');
  });

  it('1 / 3 carries 40 significant digits', () => {
    expect(evaluate(vs(1, 3), ['/'])).toBe('0.' + '3'.repeat(40));
  });

  it('1 / 3 x 3 evaluates to forty 9s, which the display rounds to 1', () => {
    const result = evaluate(vs(1, 3, 3), ['/', 'x']);
    expect(result).toBe('0.' + '9'.repeat(40));
    expect(basicEvaluator.format(result as Value)).toBe('1');
  });
});

describe('basicEvaluator.applyUnary', () => {
  it('sqrt 9 = 3', () => {
    expect(basicEvaluator.applyUnary('sqrt', v(9))).toBe('3');
  });

  it('5 ^2 = 25', () => {
    expect(basicEvaluator.applyUnary('square', v(5))).toBe('25');
  });

  it('1.5 ^2 = 2.25 exactly', () => {
    expect(basicEvaluator.applyUnary('square', v('1.5'))).toBe(
      '2.25',
    );
  });

  it('1/4 = 0.25', () => {
    expect(basicEvaluator.applyUnary('reciprocal', v(4))).toBe(
      '0.25',
    );
  });

  it('sqrt 2 squared displays as 2', () => {
    const root = basicEvaluator.applyUnary('sqrt', v(2));
    const back = basicEvaluator.applyUnary('square', root);
    expect(basicEvaluator.format(back)).toBe('2');
  });
});

describe('basicEvaluator.percent', () => {
  it('50 % with no base = 0.5', () => {
    expect(basicEvaluator.percent(v(50), null)).toBe('0.5');
  });

  it('200 + 10 % reads 10 as a percentage of 200 = 20', () => {
    expect(basicEvaluator.percent(v(10), v(200))).toBe('20');
  });

  it('is exact: 0.3 % = 0.003', () => {
    expect(basicEvaluator.percent(v('0.3'), null)).toBe('0.003');
  });
});

describe('basicEvaluator.parse', () => {
  it('canonicalises typed text', () => {
    expect(basicEvaluator.parse('0.')).toBe('0');
    expect(basicEvaluator.parse('-0.50')).toBe('-0.5');
  });

  it('throws on non-numeric text', () => {
    expect(() => basicEvaluator.parse('abc')).toThrow('Error');
  });
});

describe('basicEvaluator.format', () => {
  const format = (text: string) => basicEvaluator.format(v(text));

  it('renders zero as "0"', () => {
    expect(format('0')).toBe('0');
  });

  it('keeps mid-range values in plain notation', () => {
    expect(format('15')).toBe('15');
    expect(format('0.3')).toBe('0.3');
    expect(format('-2.5')).toBe('-2.5');
  });

  it('rounds half up at the display precision', () => {
    // 15 significant digits: the 16th digit is a 5 followed by nothing.
    expect(format('0.1234567890123455')).toBe('0.123456789012346');
    expect(format('0.6666666666666666666666666666666666666667')).toBe(
      '0.666666666666667',
    );
  });

  it('does not show trailing zeros after rounding', () => {
    expect(format('0.' + '9'.repeat(40))).toBe('1');
    expect(format('2.000000000000000000000000000000000000001')).toBe(
      '2',
    );
  });

  it('switches to exponential at 1e15', () => {
    expect(format('999999999999999')).toBe('999999999999999');
    expect(format('1000000000000000')).toBe('1e+15');
    expect(format('9999999800000001')).toBe('9.9999998e+15');
  });

  it('shows exact integer results up to 15 digits in full', () => {
    expect(format('1524155677489')).toBe('1524155677489');
    expect(format('123456789012345')).toBe('123456789012345');
  });

  it('switches to exponential below 1e-6', () => {
    expect(format('0.000001')).toBe('0.000001');
    expect(format('0.0000001')).toBe('1e-7');
    expect(format('0.0000000100000001')).toBe('1.00000001e-8');
  });

  it('formats a huge canonical exponent value', () => {
    expect(format('1.5e+488')).toBe('1.5e+488');
  });
});

describe('basicEvaluator - errors', () => {
  it('throws on divide by zero', () => {
    expect(() => evaluate(vs(5, 0), ['/'])).toThrow('Error');
  });

  it('throws on reciprocal of zero', () => {
    expect(() =>
      basicEvaluator.applyUnary('reciprocal', v(0)),
    ).toThrow('Error');
  });

  it('throws on sqrt of a negative', () => {
    expect(() => basicEvaluator.applyUnary('sqrt', v(-4))).toThrow(
      'Error',
    );
  });

  it('throws on an empty operand list', () => {
    expect(() => evaluate([], [])).toThrow('Error');
  });

  it('throws on a malformed sequence (operator count mismatch)', () => {
    expect(() => evaluate(vs(1, 2), [])).toThrow(TypeError);
    expect(() => evaluate(vs(1), ['+'])).toThrow(TypeError);
  });
});

describe('basicEvaluator.paste', () => {
  const paste = (text: string) => basicEvaluator.paste(text);

  it.each([
    ['1234', '1234'],
    ['1,234,567.5', '1234567.5'],
    ['  42  ', '42'],
    ['-3', '-3'],
    ['−3', '-3'],
    ['+7', '7'],
    ['$1,234.50', '1234.5'],
    ['.5', '0.5'],
    ['5.', '5'],
    ['1.5e-7', '0.00000015'],
    ['1E3', '1000'],
    ['0.1', '0.1'],
  ])('accepts %j -> %j', (text, expected) => {
    expect(paste(text)).toBe(expected);
  });

  it('rounds to the display precision instead of truncating', () => {
    expect(paste('3.14159265358979323846')).toBe('3.14159265358979');
    // 17 integer digits keep their magnitude.
    expect(paste('12345678901234567')).toBe('12345678901234600');
  });

  it.each([
    '',
    '   ',
    'abc',
    '12abc',
    '1.2.3',
    '1 + 2',
    '1,2,3.4.5',
    '--5',
    'NaN',
    'Infinity',
    '1e',
    '1e5e5',
  ])('rejects %j', text => {
    expect(() => paste(text)).toThrow('Error');
  });
});

describe('basicEvaluator - additive residue below the guard band is zero', () => {
  it('1 / 3 x 3 - 1 = 0, not -1e-40', () => {
    expect(evaluate(vs(1, 3, 3, 1), ['/', 'x', '-'])).toBe('0');
  });

  it('sqrt 2 squared minus 2 = 0, not 1e-39', () => {
    const root = basicEvaluator.applyUnary('sqrt', v(2));
    const square = basicEvaluator.applyUnary('square', root);
    expect(evaluate([square, v(2)], ['-'])).toBe('0');
  });

  it('a 40-digit residue added to a value vanishes: 1 + 1e-40 - 1 = 0', () => {
    expect(evaluate(vs(1, '1e-40', 1), ['+', '-'])).toBe('0');
  });

  it('keeps every genuine small difference', () => {
    expect(evaluate(vs('1.00000000000001', 1), ['-'])).toBe(
      '0.00000000000001',
    );
    // 1e-30 relative: well inside the data, far above the guard band.
    expect(evaluate(vs('1', '0.' + '9'.repeat(30)), ['-'])).toBe(
      '0.' + '0'.repeat(29) + '1',
    );
    // A tiny value on its own is not a residue - nothing to be relative to.
    expect(evaluate(vs('1e-38', '2e-38'), ['+'])).toBe(
      '0.' + '0'.repeat(37) + '3',
    );
    expect(evaluate(vs('1e-38', 0), ['-'])).toBe(
      '0.' + '0'.repeat(37) + '1',
    );
  });

  it('cuts exactly at 10^-35 relative to the larger operand', () => {
    expect(evaluate(vs('1', '0.' + '9'.repeat(34)), ['-'])).toBe(
      '0.' + '0'.repeat(33) + '1',
    );
    expect(evaluate(vs('1', '0.' + '9'.repeat(35)), ['-'])).toBe(
      '0.' + '0'.repeat(34) + '1',
    );
    expect(evaluate(vs('1', '0.' + '9'.repeat(36)), ['-'])).toBe('0');
  });

  it('does not touch multiplication or division', () => {
    expect(evaluate(vs('1e-20', '1e-20'), ['x'])).toBe(
      '0.' + '0'.repeat(39) + '1',
    );
    expect(evaluate(vs('1e-20', '1e20'), ['/'])).toBe(
      '0.' + '0'.repeat(39) + '1',
    );
  });
});

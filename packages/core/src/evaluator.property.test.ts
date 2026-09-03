// Property-based checks of the basic evaluator against an independent oracle.
//
// The oracle computes with exact BigInt rationals and its own recursive-
// descent precedence, sharing no code or library with the evaluator under
// test. It asserts what the design promises: + - x are exact; / is correct
// to the 40-digit working precision; the display never shows more than 15
// significant digits and never misrepresents the value.

import fc from 'fast-check';

import { DISPLAY_DIGITS, basicEvaluator } from './evaluator';
import type { BinaryOperator } from './evaluator';
import { WORKING_PRECISION, parseValue } from './value';
import type { Value } from './value';

// --- Exact rationals over BigInt ---

interface Rational {
  n: bigint;
  d: bigint; // always > 0
}

const gcd = (a: bigint, b: bigint): bigint => {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
};

const rational = (n: bigint, d: bigint): Rational => {
  if (d === 0n) throw new Error('division by zero');
  if (d < 0n) [n, d] = [-n, -d];
  const g = gcd(n, d);
  return g > 1n ? { n: n / g, d: d / g } : { n, d };
};

const rAdd = (a: Rational, b: Rational) =>
  rational(a.n * b.d + b.n * a.d, a.d * b.d);
const rSub = (a: Rational, b: Rational) =>
  rational(a.n * b.d - b.n * a.d, a.d * b.d);
const rMul = (a: Rational, b: Rational) =>
  rational(a.n * b.n, a.d * b.d);
const rDiv = (a: Rational, b: Rational) =>
  rational(a.n * b.d, a.d * b.n);
const rAbs = (a: Rational): Rational => ({
  n: a.n < 0n ? -a.n : a.n,
  d: a.d,
});
const rIsZero = (a: Rational) => a.n === 0n;
// a <= b
const rLte = (a: Rational, b: Rational) => a.n * b.d <= b.n * a.d;

// Parse a decimal string - typed ("-12.50") or canonical Value ("1.5e+60",
// "0.333...") - into an exact rational. Written from the grammar, not shared
// with value.ts.
const toRational = (text: string): Rational => {
  const match = /^(-?)(\d+)(?:\.(\d+))?(?:e([+-]\d+))?$/.exec(text);
  if (!match) throw new Error(`not a decimal: ${text}`);
  const [, sign, whole, frac = '', exp = '0'] = match;
  let n = BigInt(whole + frac);
  let d = 10n ** BigInt(frac.length);
  const e = Number(exp);
  if (e > 0) n *= 10n ** BigInt(e);
  else if (e < 0) d *= 10n ** BigInt(-e);
  return rational(sign === '-' ? -n : n, d);
};

// Significant digits of a rational, or Infinity if it does not terminate.
// A rational terminates iff its reduced denominator has no prime factors
// other than 2 and 5.
const significantDigitsOf = (r: Rational): number => {
  if (rIsZero(r)) return 0;
  let d = r.d;
  let k = 0;
  while (d % 2n === 0n) [d, k] = [d / 2n, k + 1];
  while (d % 5n === 0n) [d, k] = [d / 5n, k + 1];
  if (d !== 1n) return Infinity;
  // r = n / r.d and r.d divides 10^k, so n * 10^k / r.d is an integer.
  let m = (r.n < 0n ? -r.n : r.n) * 10n ** BigInt(k);
  m /= r.d;
  while (m % 10n === 0n) m /= 10n;
  return m.toString().length;
};

interface OracleResult {
  value: Rational;
  // Every value the evaluation passed through, operands included. Rounding
  // errors are bounded relative to these, not to the final result, because
  // a subtraction can cancel leading digits (0.7 - 0.63 keeps 1/10th of the
  // magnitude but all of the absolute error).
  intermediates: Rational[];
}

// Independent precedence: parse `operands op operands ...` as
//   expr := term (('+' | '-') term)*
//   term := operand (('x' | '/') operand)*
const oracle = (
  operands: string[],
  operators: BinaryOperator[],
): OracleResult => {
  const intermediates: Rational[] = [];
  const note = (r: Rational): Rational => {
    intermediates.push(r);
    return r;
  };
  let i = 0;
  const term = (): Rational => {
    let acc = note(toRational(operands[i]));
    while (
      i < operators.length &&
      (operators[i] === 'x' || operators[i] === '/')
    ) {
      const op = operators[i];
      const rhs = note(toRational(operands[i + 1]));
      acc = note(op === 'x' ? rMul(acc, rhs) : rDiv(acc, rhs));
      i++;
    }
    return acc;
  };
  let acc = term();
  while (i < operators.length) {
    const op = operators[i];
    i++;
    const rhs = term();
    acc = note(op === '+' ? rAdd(acc, rhs) : rSub(acc, rhs));
  }
  return { value: acc, intermediates };
};

// 10^-k as a rational.
const pow10 = (k: number): Rational => rational(1n, 10n ** BigInt(k));

const rMax = (rs: Rational[]): Rational =>
  rs.reduce((m, r) => (rLte(m, r) ? r : m));

// Absolute error budget for a result computed at `digits` significant
// figures: each of the (at most operators.length) roundings is below
// 10^-(digits - 1) relative to the value it rounded, and multiplication /
// division carry a relative error forward unchanged, so every contribution
// is bounded by that fraction of the largest intermediate magnitude.
const errorBudget = (
  { intermediates }: OracleResult,
  digits: number,
  roundings: number,
): Rational =>
  rMul(
    rMul(rMax(intermediates.map(rAbs)), pow10(digits - 1)),
    rational(BigInt(Math.max(1, roundings)), 1n),
  );

const within = (
  actual: Rational,
  exact: Rational,
  budget: Rational,
) => rLte(rAbs(rSub(actual, exact)), budget);

// --- Generators ---

// A typed entry: up to 15 significant digits, optional fraction, optional
// sign. Mirrors what the state machine can actually commit as an operand.
const digitString = (min: number, max: number) =>
  fc
    .array(fc.integer({ min: 0, max: 9 }), {
      minLength: min,
      maxLength: max,
    })
    .map(ds => ds.join(''));

const operandArb: fc.Arbitrary<string> = fc
  .tuple(
    fc.boolean(),
    fc.integer({ min: 0, max: 15 }),
    fc.integer({ min: 0, max: 15 }),
  )
  .chain(([negative, wholeLen, fracLen]) => {
    const totalLen = Math.min(15, Math.max(1, wholeLen + fracLen));
    const whole = Math.min(wholeLen, totalLen);
    const frac = totalLen - whole;
    return fc
      .tuple(
        whole === 0 ? fc.constant('0') : digitString(whole, whole),
        frac === 0 ? fc.constant('') : digitString(frac, frac),
      )
      .map(([w, f]) => {
        const stripped = w.replace(/^0+(?=\d)/, '');
        const text = f ? `${stripped}.${f}` : stripped;
        return negative && /[1-9]/.test(text) ? `-${text}` : text;
      });
  });

const operatorArb: fc.Arbitrary<BinaryOperator> = fc.constantFrom(
  '+',
  '-',
  'x',
  '/',
);

// A well-formed expression: n operands, n - 1 operators, 1 <= n <= 6.
const expressionArb = fc
  .integer({ min: 1, max: 6 })
  .chain(n =>
    fc.tuple(
      fc.array(operandArb, { minLength: n, maxLength: n }),
      fc.array(operatorArb, { minLength: n - 1, maxLength: n - 1 }),
    ),
  );

const values = (texts: string[]): Value[] => texts.map(parseValue);

// Does the oracle hit a division by zero anywhere in this expression?
const dividesByZero = (
  operands: string[],
  operators: BinaryOperator[],
): boolean => {
  try {
    oracle(operands, operators);
    return false;
  } catch {
    return true;
  }
};

const RUNS = { numRuns: 500 };

// --- Properties ---

describe('basicEvaluator.evaluate vs an exact rational oracle', () => {
  // Every intermediate of a division-free expression terminates; while they
  // all fit in the working precision nothing is ever rounded.
  const fitsWorkingPrecision = ([operands, operators]: [
    string[],
    BinaryOperator[],
  ]) =>
    !operators.includes('/') &&
    oracle(operands, operators).intermediates.every(
      r => significantDigitsOf(r) <= WORKING_PRECISION,
    );

  it('is exact when no intermediate exceeds the working precision', () => {
    fc.assert(
      fc.property(
        expressionArb.filter(fitsWorkingPrecision),
        ([operands, operators]) => {
          const actual = basicEvaluator.evaluate(
            values(operands),
            operators,
          );
          const exact = oracle(operands, operators).value;
          const got = toRational(actual);
          expect(got.n).toBe(exact.n);
          expect(got.d).toBe(exact.d);
        },
      ),
      RUNS,
    );
  });

  it('two 15-digit entries always combine exactly', () => {
    fc.assert(
      fc.property(
        operandArb,
        operandArb.filter(text => /[1-9]/.test(text)),
        fc.constantFrom<BinaryOperator>('+', '-', 'x'),
        (a, b, op) => {
          const actual = basicEvaluator.evaluate(values([a, b]), [
            op,
          ]);
          const exact = oracle([a, b], [op]).value;
          const got = toRational(actual);
          expect(got.n).toBe(exact.n);
          expect(got.d).toBe(exact.d);
        },
      ),
      RUNS,
    );
  });

  it('is correct to the working precision for any expression', () => {
    fc.assert(
      fc.property(
        expressionArb.filter(
          ([ops, operators]) => !dividesByZero(ops, operators),
        ),
        ([operands, operators]) => {
          const actual = basicEvaluator.evaluate(
            values(operands),
            operators,
          );
          const result = oracle(operands, operators);
          const budget = errorBudget(
            result,
            WORKING_PRECISION,
            operators.length,
          );
          expect(
            within(toRational(actual), result.value, budget),
          ).toBe(true);
        },
      ),
      RUNS,
    );
  });

  it('the display is the oracle value rounded to 15 digits, within the working-precision budget', () => {
    fc.assert(
      fc.property(
        expressionArb.filter(
          ([ops, operators]) => !dividesByZero(ops, operators),
        ),
        ([operands, operators]) => {
          const actual = basicEvaluator.evaluate(
            values(operands),
            operators,
          );
          const shown = toRational(basicEvaluator.format(actual));
          const result = oracle(operands, operators);
          // |shown - exact| <= |shown - actual| + |actual - exact|: one
          // display rounding of `actual`, plus the working-precision budget.
          const budget = rAdd(
            rMul(rAbs(toRational(actual)), pow10(DISPLAY_DIGITS - 1)),
            errorBudget(result, WORKING_PRECISION, operators.length),
          );
          expect(within(shown, result.value, budget)).toBe(true);
        },
      ),
      RUNS,
    );
  });

  it('throws exactly when the oracle divides by zero', () => {
    fc.assert(
      fc.property(expressionArb, ([operands, operators]) => {
        const expectThrow = dividesByZero(operands, operators);
        const threw = (() => {
          try {
            basicEvaluator.evaluate(values(operands), operators);
            return false;
          } catch {
            return true;
          }
        })();
        expect(threw).toBe(expectThrow);
      }),
      RUNS,
    );
  });
});

describe('inverse operations round-trip at display precision', () => {
  const nonZero = operandArb.filter(text => /[1-9]/.test(text));

  it('a / b x b displays as a', () => {
    fc.assert(
      fc.property(operandArb, nonZero, (a, b) => {
        const result = basicEvaluator.evaluate(values([a, b, b]), [
          '/',
          'x',
        ]);
        expect(basicEvaluator.format(result)).toBe(
          basicEvaluator.format(parseValue(a)),
        );
      }),
      RUNS,
    );
  });

  it('a x b / b displays as a', () => {
    fc.assert(
      fc.property(operandArb, nonZero, (a, b) => {
        const result = basicEvaluator.evaluate(values([a, b, b]), [
          'x',
          '/',
        ]);
        expect(basicEvaluator.format(result)).toBe(
          basicEvaluator.format(parseValue(a)),
        );
      }),
      RUNS,
    );
  });

  it('sqrt then square displays as the original (non-negative a)', () => {
    fc.assert(
      fc.property(
        operandArb.filter(text => !text.startsWith('-')),
        a => {
          const root = basicEvaluator.applyUnary(
            'sqrt',
            parseValue(a),
          );
          const back = basicEvaluator.applyUnary('square', root);
          expect(basicEvaluator.format(back)).toBe(
            basicEvaluator.format(parseValue(a)),
          );
        },
      ),
      RUNS,
    );
  });

  it('reciprocal twice displays as the original (non-zero a)', () => {
    fc.assert(
      fc.property(nonZero, a => {
        const once = basicEvaluator.applyUnary(
          'reciprocal',
          parseValue(a),
        );
        const twice = basicEvaluator.applyUnary('reciprocal', once);
        expect(basicEvaluator.format(twice)).toBe(
          basicEvaluator.format(parseValue(a)),
        );
      }),
      RUNS,
    );
  });
});

describe('basicEvaluator.format', () => {
  const significantDigits = (shown: string): number => {
    const mantissa = shown.split('e')[0].replace(/[-.]/g, '');
    return mantissa.replace(/^0+/, '').length;
  };

  const anyValue = expressionArb
    .filter(([ops, operators]) => !dividesByZero(ops, operators))
    .map(([operands, operators]) =>
      basicEvaluator.evaluate(values(operands), operators),
    );

  it('never shows more than DISPLAY_DIGITS significant digits', () => {
    fc.assert(
      fc.property(anyValue, value => {
        expect(
          significantDigits(basicEvaluator.format(value)),
        ).toBeLessThanOrEqual(DISPLAY_DIGITS);
      }),
      RUNS,
    );
  });

  it('is a correctly rounded view of the value', () => {
    fc.assert(
      fc.property(anyValue, value => {
        const exact = toRational(value);
        const shown = toRational(basicEvaluator.format(value));
        const budget = rMul(rAbs(exact), pow10(DISPLAY_DIGITS - 1));
        expect(within(shown, exact, budget)).toBe(true);
      }),
      RUNS,
    );
  });

  it('has no trailing zeros, no negative zero, and re-parses as a Value', () => {
    fc.assert(
      fc.property(anyValue, value => {
        const shown = basicEvaluator.format(value);
        expect(shown).not.toMatch(/\.\d*0(?:e|$)/);
        expect(shown).not.toMatch(/\.(?:e|$)/);
        expect(shown).not.toBe('-0');
        expect(() => parseValue(shown)).not.toThrow();
      }),
      RUNS,
    );
  });

  it('a typed entry (<= 15 digits) displays with no loss at all', () => {
    fc.assert(
      fc.property(operandArb, text => {
        const shown = basicEvaluator.format(parseValue(text));
        const exact = toRational(text);
        const got = toRational(shown);
        expect(got.n).toBe(exact.n);
        expect(got.d).toBe(exact.d);
      }),
      RUNS,
    );
  });
});

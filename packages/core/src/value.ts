// Exact numeric value for the calculator.
//
// This is the ONLY file that imports decimal.js. Everything else in core - the
// Evaluator contract, the state machine, the selectors - speaks `Value`: a
// branded canonical decimal string such as "0.3", "-15" or
// "0.3333333333333333333333333333333333333333". Strings are exact, JSON-safe
// and library-neutral, so `CalculatorState` never holds a library object and
// the library can be swapped by editing this file alone.

import { Decimal } from 'decimal.js';

export type { Decimal };

// Canonical decimal string. Only `parseValue` / `fromDecimal` construct one, so
// an arbitrary string cannot masquerade as an operand.
export type Value = string & { readonly __brand: 'Value' };

// Working precision, in significant digits, for every arithmetic operation.
// Two 15-digit entries multiply to at most 30 digits, so 40 keeps exact
// operations exact with guard digits to spare; inexact ones (division, roots)
// carry 25 digits below anything the display shows.
export const WORKING_PRECISION = 40;

// A private clone so a host page that also uses decimal.js cannot change the
// calculator's precision or rounding from under it. Round half up is what
// students are taught. toExpNeg / toExpPos only govern when `toString()`
// switches to exponent notation for the *canonical* form - exact either way.
export const D = Decimal.clone({
  precision: WORKING_PRECISION,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -50,
  toExpPos: 50,
});

export const toDecimal = (value: Value): Decimal => new D(value);

// Canonicalise a finite Decimal. Non-finite results (Infinity / NaN, e.g. from
// an overflow past decimal.js's exponent range) are an Error, never a Value.
export const fromDecimal = (d: Decimal): Value => {
  if (!d.isFinite()) throw new Error('Error');
  return d.toString() as Value;
};

// Parse user-typed text ("0.", "-0.5", "007") into a canonical Value.
// Throws Error on anything that is not a finite decimal number.
export const parseValue = (text: string): Value => {
  let d: Decimal;
  try {
    d = new D(text);
  } catch {
    throw new Error('Error');
  }
  return fromDecimal(d);
};

import { groupDigits, groupExpression } from './format';

describe('groupDigits', () => {
  it.each([
    ['0', '0'],
    ['7', '7'],
    ['999', '999'],
    ['1000', '1,000'],
    ['123456789', '123,456,789'],
    ['123456789012345', '123,456,789,012,345'],
  ])(
    'groups the integer part in threes: %s -> %s',
    (input, expected) => {
      expect(groupDigits(input)).toBe(expected);
    },
  );

  it('never groups digits after the decimal point', () => {
    expect(groupDigits('1234.5678')).toBe('1,234.5678');
    expect(groupDigits('0.123456789')).toBe('0.123456789');
    expect(groupDigits('0.333333333333333')).toBe(
      '0.333333333333333',
    );
  });

  it('preserves a typed trailing point and trailing zeros', () => {
    expect(groupDigits('1234.')).toBe('1,234.');
    expect(groupDigits('123909.90')).toBe('123,909.90');
    expect(groupDigits('0.')).toBe('0.');
  });

  it('keeps the sign in front', () => {
    expect(groupDigits('-1234')).toBe('-1,234');
    expect(groupDigits('-0.5')).toBe('-0.5');
    expect(groupDigits('-0')).toBe('-0');
  });

  it('leaves exponential notation alone', () => {
    expect(groupDigits('9.9999998e+15')).toBe('9.9999998e+15');
    expect(groupDigits('1e+15')).toBe('1e+15');
    expect(groupDigits('1.25e-8')).toBe('1.25e-8');
  });

  it('passes non-numbers through untouched', () => {
    expect(groupDigits('Error')).toBe('Error');
    expect(groupDigits('')).toBe('');
    expect(groupDigits('=')).toBe('=');
    expect(groupDigits('×')).toBe('×');
  });
});

describe('groupExpression', () => {
  it('groups each numeric token and keeps operators and =', () => {
    expect(groupExpression('1234 × 5 =')).toBe('1,234 × 5 =');
    expect(groupExpression('1000000 + 2000000')).toBe(
      '1,000,000 + 2,000,000',
    );
    expect(groupExpression('9 −')).toBe('9 −');
  });

  it('handles a bare value and the empty (error) line', () => {
    expect(groupExpression('123456789')).toBe('123,456,789');
    expect(groupExpression('')).toBe('');
  });

  it('leaves negative and exponential operands intact', () => {
    expect(groupExpression('-54 × 2 =')).toBe('-54 × 2 =');
    expect(groupExpression('99999999 × 99999999 =')).toBe(
      '99,999,999 × 99,999,999 =',
    );
    expect(groupExpression('5 × 1e-7 =')).toBe('5 × 1e-7 =');
  });
});

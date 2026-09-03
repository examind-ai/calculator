import {
  D,
  WORKING_PRECISION,
  fromDecimal,
  parseValue,
  toDecimal,
} from './value';

describe('parseValue - canonical form', () => {
  it('keeps a plain integer', () => {
    expect(parseValue('42')).toBe('42');
  });

  it('drops a trailing decimal point: "5." -> "5"', () => {
    expect(parseValue('5.')).toBe('5');
  });

  it('drops trailing zeros: "0.50" -> "0.5"', () => {
    expect(parseValue('0.50')).toBe('0.5');
  });

  it('drops leading zeros: "007" -> "7"', () => {
    expect(parseValue('007')).toBe('7');
  });

  it('collapses negative zero: "-0." -> "0"', () => {
    expect(parseValue('-0.')).toBe('0');
    expect(parseValue('-0')).toBe('0');
  });

  it('keeps a negative decimal exactly', () => {
    expect(parseValue('-0.1')).toBe('-0.1');
  });

  it('preserves every digit of a long decimal', () => {
    const long = '0.' + '3'.repeat(WORKING_PRECISION);
    expect(parseValue(long)).toBe(long);
  });
});

describe('parseValue - rejects non-numbers', () => {
  it.each(['', '-', 'abc', '1.2.3', 'NaN', 'Infinity'])(
    'throws Error on %j',
    text => {
      expect(() => parseValue(text)).toThrow('Error');
    },
  );
});

describe('Decimal round trip', () => {
  it('toDecimal -> fromDecimal is lossless', () => {
    const value = parseValue(
      '123456789012345.678901234567890123456789',
    );
    expect(fromDecimal(toDecimal(value))).toBe(value);
  });

  it('fromDecimal throws on Infinity and NaN', () => {
    expect(() => fromDecimal(new D(1).div(0))).toThrow('Error');
    expect(() => fromDecimal(new D(0).div(0))).toThrow('Error');
  });

  it('fromDecimal renders negative zero as "0"', () => {
    expect(fromDecimal(new D(0).times(-5))).toBe('0');
  });
});

describe('D - configured decimal instance', () => {
  it('computes at the working precision: 1 / 3 has 40 threes', () => {
    expect(new D(1).div(3).toString()).toBe(
      '0.' + '3'.repeat(WORKING_PRECISION),
    );
  });

  it('is exact for decimal addition: 0.1 + 0.2 = 0.3', () => {
    expect(new D('0.1').plus('0.2').toString()).toBe('0.3');
  });

  it('is exact for a 16-digit integer product', () => {
    expect(new D('99999999').times('99999999').toString()).toBe(
      '9999999800000001',
    );
  });

  it('rounds half up', () => {
    expect(new D('2.5').toDecimalPlaces(0).toString()).toBe('3');
    expect(new D('-2.5').toDecimalPlaces(0).toString()).toBe('-3');
  });

  it('is isolated from the global Decimal configuration', async () => {
    const { Decimal } = await import('decimal.js');
    Decimal.set({ precision: 5 });
    try {
      expect(new D(1).div(3).toString()).toBe(
        '0.' + '3'.repeat(WORKING_PRECISION),
      );
    } finally {
      Decimal.set({ precision: 20 });
    }
  });
});

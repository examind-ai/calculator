// Presentation helpers for the two display lines.
//
// Digit grouping is a *view* concern: the engine's strings (`entry`, `Value`,
// the selectors' output) stay plain so arithmetic, parsing and tests are
// unaffected. These helpers insert thousands separators into a rendered
// string, the way the iPhone and Windows calculators do (123,456,789), and are
// deliberately string-based - converting to a JS number to format it would
// reintroduce binary floating point into the display path.

// Always comma grouping with a period decimal: the keypad has a "." key and
// the engine emits ".", so a locale with comma decimals would contradict the
// buttons. Locale-aware formatting would be a separate feature that also
// changes the keypad and the parser.
const GROUP_SEPARATOR = ',';

// A rendered number: sign, integer digits, optional fraction (possibly a bare
// trailing point while typing), optional exponent.
const NUMBER = /^(-?)(\d+)(\.\d*)?(e[+-]?\d+)?$/;

// Insert separators into the integer part of one rendered number. Anything
// that is not a number ("Error", an operator glyph, "=") passes through.
export const groupDigits = (text: string): string => {
  const match = NUMBER.exec(text);
  if (!match) return text;
  const [, sign, integer, fraction = '', exponent = ''] = match;
  // Exponential notation is already compact; grouping its mantissa would read
  // as noise (1,234.5e+20). Leave it alone.
  if (exponent) return text;
  const grouped = integer.replace(
    /\B(?=(\d{3})+$)/g,
    GROUP_SEPARATOR,
  );
  return sign + grouped + fraction;
};

// Group every numeric token of an expression line ("1234 × 5 =" ->
// "1,234 × 5 ="). Tokens are space-separated by construction (see
// getExpression), so no operator glyph is ever mistaken for a digit.
export const groupExpression = (text: string): string =>
  text.split(' ').map(groupDigits).join(' ');

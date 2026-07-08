import { useLayoutEffect, useRef, useState } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import {
  CalculatorAction,
  useCalculator,
  useGlobalKeyboard,
} from '@examind/calculator-react';

// The skin: an EXAMIND-themed (MUI, light + dark) button grid over the
// headless engine (@examind/calculator-core via @examind/calculator-react).
// Styling uses theme palette tokens only, so dark mode falls out of the host
// theme with no hardcoded colors. Later modes swap the evaluator; this grid
// stays the same shape.

type KeyVariant = 'digit' | 'function' | 'operator' | 'equals';

interface CalcKey {
  label: string;
  testId: string;
  ariaLabel: string;
  action: CalculatorAction;
  variant: KeyVariant;
  // Number of grid columns to span (defaults to 1).
  span?: number;
  // The contextual clear key: label + action are derived from state at render.
  dynamicClear?: boolean;
}

// Windows "Standard" layout, row by row. `data-testid` values are the stable
// selectors from the spec.
const KEYS: CalcKey[] = [
  {
    label: 'AC',
    testId: 'calc-key-clear',
    ariaLabel: 'clear',
    action: { type: 'clear' },
    variant: 'function',
    span: 2,
    dynamicClear: true,
  },
  {
    label: '%',
    testId: 'calc-key-percent',
    ariaLabel: 'percent',
    action: { type: 'percent' },
    variant: 'function',
  },
  {
    label: '⌫',
    testId: 'calc-key-backspace',
    ariaLabel: 'backspace',
    action: { type: 'backspace' },
    variant: 'function',
  },
  {
    label: '1/x',
    testId: 'calc-key-reciprocal',
    ariaLabel: 'reciprocal',
    action: { type: 'unary', operator: 'reciprocal' },
    variant: 'function',
  },
  {
    label: 'x²',
    testId: 'calc-key-square',
    ariaLabel: 'square',
    action: { type: 'unary', operator: 'square' },
    variant: 'function',
  },
  {
    label: '√',
    testId: 'calc-key-sqrt',
    ariaLabel: 'square root',
    action: { type: 'unary', operator: 'sqrt' },
    variant: 'function',
  },
  {
    label: '÷',
    testId: 'calc-key-divide',
    ariaLabel: 'divide',
    action: { type: 'binary', operator: '/' },
    variant: 'operator',
  },
  {
    label: '7',
    testId: 'calc-key-7',
    ariaLabel: 'seven',
    action: { type: 'digit', value: '7' },
    variant: 'digit',
  },
  {
    label: '8',
    testId: 'calc-key-8',
    ariaLabel: 'eight',
    action: { type: 'digit', value: '8' },
    variant: 'digit',
  },
  {
    label: '9',
    testId: 'calc-key-9',
    ariaLabel: 'nine',
    action: { type: 'digit', value: '9' },
    variant: 'digit',
  },
  {
    label: '×',
    testId: 'calc-key-multiply',
    ariaLabel: 'multiply',
    action: { type: 'binary', operator: 'x' },
    variant: 'operator',
  },
  {
    label: '4',
    testId: 'calc-key-4',
    ariaLabel: 'four',
    action: { type: 'digit', value: '4' },
    variant: 'digit',
  },
  {
    label: '5',
    testId: 'calc-key-5',
    ariaLabel: 'five',
    action: { type: 'digit', value: '5' },
    variant: 'digit',
  },
  {
    label: '6',
    testId: 'calc-key-6',
    ariaLabel: 'six',
    action: { type: 'digit', value: '6' },
    variant: 'digit',
  },
  {
    label: '-',
    testId: 'calc-key-subtract',
    ariaLabel: 'subtract',
    action: { type: 'binary', operator: '-' },
    variant: 'operator',
  },
  {
    label: '1',
    testId: 'calc-key-1',
    ariaLabel: 'one',
    action: { type: 'digit', value: '1' },
    variant: 'digit',
  },
  {
    label: '2',
    testId: 'calc-key-2',
    ariaLabel: 'two',
    action: { type: 'digit', value: '2' },
    variant: 'digit',
  },
  {
    label: '3',
    testId: 'calc-key-3',
    ariaLabel: 'three',
    action: { type: 'digit', value: '3' },
    variant: 'digit',
  },
  {
    label: '+',
    testId: 'calc-key-add',
    ariaLabel: 'add',
    action: { type: 'binary', operator: '+' },
    variant: 'operator',
  },
  {
    label: '±',
    testId: 'calc-key-negate',
    ariaLabel: 'negate',
    action: { type: 'negate' },
    variant: 'digit',
  },
  {
    label: '0',
    testId: 'calc-key-0',
    ariaLabel: 'zero',
    action: { type: 'digit', value: '0' },
    variant: 'digit',
  },
  {
    label: '.',
    testId: 'calc-key-decimal',
    ariaLabel: 'decimal point',
    action: { type: 'decimal' },
    variant: 'digit',
  },
  {
    label: '=',
    testId: 'calc-key-equals',
    ariaLabel: 'equals',
    action: { type: 'equals' },
    variant: 'equals',
  },
];

const buttonColor = (variant: KeyVariant) => {
  if (variant === 'equals') return 'primary';
  if (variant === 'operator') return 'secondary';
  return 'inherit';
};

// Base display font (rem) and the readable floor the auto-shrink stops at.
const DISPLAY_BASE_FONT_REM = 2;
const DISPLAY_MIN_FONT_REM = 0.75;

// Auto-shrink the display font so the full value always fits its box - a
// calculator must never clip or ellipsize a number. Short values keep the base
// font; the shrink kicks in only when the value would otherwise overflow (e.g.
// a long typed number or an exponential result). Structure only - no colors.
const useAutoFitFont = (value: string): {
  ref: React.RefObject<HTMLSpanElement>;
  fontRem: number;
} => {
  const ref = useRef<HTMLSpanElement>(null);
  const [fontRem, setFontRem] = useState(DISPLAY_BASE_FONT_REM);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Measure the natural width at the base font, independent of the last size.
    el.style.fontSize = `${DISPLAY_BASE_FONT_REM}rem`;
    const { scrollWidth, clientWidth } = el;
    if (scrollWidth > clientWidth && clientWidth > 0) {
      // Linear in font size (single nowrap line); a small safety factor keeps
      // sub-pixel rounding from nudging it back over the edge.
      const scaled =
        (DISPLAY_BASE_FONT_REM * clientWidth * 0.98) / scrollWidth;
      setFontRem(Math.max(DISPLAY_MIN_FONT_REM, scaled));
    } else {
      setFontRem(DISPLAY_BASE_FONT_REM);
    }
  }, [value]);

  return { ref, fontRem };
};

export interface CalculatorProps {
  // Attach keyboard handling to the window so keys work without focusing the
  // widget. Defaults to true.
  globalKeyboard?: boolean;
}

export const Calculator = ({
  globalKeyboard = true,
}: CalculatorProps = {}) => {
  const { display, expression, clearMode, dispatch, handleKey } =
    useCalculator();

  useGlobalKeyboard(handleKey, globalKeyboard);

  const { ref: displayRef, fontRem: displayFontRem } =
    useAutoFitFont(display);

  return (
    <Paper
      elevation={3}
      sx={{
        width: 320,
        maxWidth: '100%',
        p: 2,
        borderRadius: 2,
        bgcolor: 'background.default',
      }}
      role="group"
      aria-label="calculator"
    >
      <Box
        sx={{
          mb: 1.5,
          px: 1.5,
          py: 1,
          borderRadius: 1,
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          textAlign: 'right',
          overflow: 'hidden',
        }}
      >
        <Typography
          data-testid="calculator-expression"
          variant="body2"
          aria-live="polite"
          sx={{
            color: 'text.secondary',
            minHeight: '1.25rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {expression}
        </Typography>
        <Typography
          data-testid="calculator-display"
          aria-live="polite"
          ref={displayRef}
          style={{ fontSize: `${displayFontRem}rem` }}
          sx={{
            color: 'text.primary',
            fontWeight: 500,
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {display}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1,
        }}
      >
        {KEYS.map(key => {
          // The contextual clear key shows AC (clear all) or C (clear entry)
          // depending on whether an entry is being typed.
          const label = key.dynamicClear ? clearMode : key.label;
          const action: CalculatorAction = key.dynamicClear
            ? clearMode === 'C'
              ? { type: 'clearEntry' }
              : { type: 'clear' }
            : key.action;
          const ariaLabel = key.dynamicClear
            ? clearMode === 'C'
              ? 'clear entry'
              : 'clear'
            : key.ariaLabel;
          return (
            <Button
              key={key.testId}
              data-testid={key.testId}
              aria-label={ariaLabel}
              variant="contained"
              color={buttonColor(key.variant)}
              onClick={() => dispatch(action)}
              sx={{
                minWidth: 0,
                py: 1.25,
                fontSize: '1.05rem',
                textTransform: 'none',
                gridColumn: key.span
                  ? `span ${key.span}`
                  : undefined,
              }}
            >
              {label}
            </Button>
          );
        })}
      </Box>
    </Paper>
  );
};

export default Calculator;

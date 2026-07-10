import { ReactNode, useMemo, useState } from 'react';
import {
  Box,
  CssBaseline,
  FormControlLabel,
  Link,
  Stack,
  Switch,
  ThemeProvider,
  Typography,
  createTheme,
} from '@mui/material';
import Calculator, { Evaluator } from '@examind/calculator-mui';
import { basicEvaluator } from '@examind/calculator-react';

import BareSkin from './BareSkin';

// A stand-in "mode" that proves the shipped skin routes evaluation through a
// custom evaluator: x-squared returns a fixed sentinel (42) instead of v*v,
// while everything else defers to basic arithmetic. Real modes (financial /
// scientific) plug into the same `evaluator` seam.
const SENTINEL_SQUARE = 42;
const sentinelEvaluator: Evaluator = {
  evaluate: basicEvaluator.evaluate,
  applyUnary: (operator, value) =>
    operator === 'square'
      ? SENTINEL_SQUARE
      : basicEvaluator.applyUnary(operator, value),
};

const Section = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) => (
  <Stack spacing={1.5} alignItems="center">
    <Stack spacing={0.25} alignItems="center">
      <Typography variant="subtitle1" fontWeight={600}>
        {title}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {subtitle}
      </Typography>
    </Stack>
    {children}
  </Stack>
);

const App = () => {
  const [dark, setDark] = useState(true);
  const theme = useMemo(
    () => createTheme({ palette: { mode: dark ? 'dark' : 'light' } }),
    [dark],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', px: 3, py: 5 }}>
        <Stack spacing={1} alignItems="center" sx={{ mb: 5 }}>
          <Typography variant="h4" fontWeight={700}>
            @examind/calculator
          </Typography>
          <Typography color="text.secondary" textAlign="center">
            A headless calculator engine with framework skins - the
            same core, any UI.
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            textAlign="center"
            sx={{ maxWidth: 460 }}
          >
            The MUI skin has no colors of its own - it adopts the
            surrounding MUI theme. This demo uses stock MUI defaults
            (purple/blue); dropped into your app it takes on your
            palette. Toggle the theme to see it recolor.
          </Typography>
          <Link
            href="https://github.com/examind-ai/calculator"
            target="_blank"
            rel="noopener"
          >
            github.com/examind-ai/calculator
          </Link>
          <FormControlLabel
            control={
              <Switch
                checked={dark}
                onChange={e => setDark(e.target.checked)}
              />
            }
            label="Dark theme"
          />
        </Stack>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={6}
          justifyContent="center"
          alignItems="flex-start"
        >
          <Section
            title="@examind/calculator-mui"
            subtitle="MUI skin - inherits your theme, keyboard enabled"
          >
            <Calculator />
          </Section>
          <Section
            title="useCalculator()"
            subtitle="raw hook + plain HTML buttons - bring your own UI"
          >
            <BareSkin />
          </Section>
          <Section
            title="custom evaluator"
            subtitle="same MUI skin, a mode-swapped engine (x² -> 42)"
          >
            <Calculator
              evaluator={sentinelEvaluator}
              globalKeyboard={false}
            />
          </Section>
        </Stack>
      </Box>
    </ThemeProvider>
  );
};

export default App;

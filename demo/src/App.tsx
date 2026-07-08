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
import Calculator from '@examind/calculator-mui';

import BareSkin from './BareSkin';

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
            subtitle="the MUI skin (keyboard enabled)"
          >
            <Calculator />
          </Section>
          <Section
            title="useCalculator()"
            subtitle="raw hook + plain HTML buttons - bring your own UI"
          >
            <BareSkin />
          </Section>
        </Stack>
      </Box>
    </ThemeProvider>
  );
};

export default App;

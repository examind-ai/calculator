import { CSSProperties } from 'react';
import {
  CalculatorAction,
  useCalculator,
} from '@examind/calculator-react';

// A deliberately plain skin - no design system, just HTML buttons - built
// directly on useCalculator() to show the engine is UI-agnostic.

interface Key {
  label: string;
  action: CalculatorAction;
  dynamicClear?: boolean;
}

const KEYS: Key[] = [
  { label: 'AC', action: { type: 'clear' }, dynamicClear: true },
  { label: '%', action: { type: 'percent' } },
  { label: '⌫', action: { type: 'backspace' } },
  { label: '÷', action: { type: 'binary', operator: '/' } },
  { label: '7', action: { type: 'digit', value: '7' } },
  { label: '8', action: { type: 'digit', value: '8' } },
  { label: '9', action: { type: 'digit', value: '9' } },
  { label: '×', action: { type: 'binary', operator: 'x' } },
  { label: '4', action: { type: 'digit', value: '4' } },
  { label: '5', action: { type: 'digit', value: '5' } },
  { label: '6', action: { type: 'digit', value: '6' } },
  { label: '-', action: { type: 'binary', operator: '-' } },
  { label: '1', action: { type: 'digit', value: '1' } },
  { label: '2', action: { type: 'digit', value: '2' } },
  { label: '3', action: { type: 'digit', value: '3' } },
  { label: '+', action: { type: 'binary', operator: '+' } },
  { label: '±', action: { type: 'negate' } },
  { label: '0', action: { type: 'digit', value: '0' } },
  { label: '.', action: { type: 'decimal' } },
  { label: '=', action: { type: 'equals' } },
];

const box: CSSProperties = {
  width: 240,
  border: '1px solid #8888',
  borderRadius: 8,
  padding: 12,
  fontFamily: 'system-ui, sans-serif',
};

const screen: CSSProperties = {
  textAlign: 'right',
  padding: '8px 10px',
  marginBottom: 10,
  border: '1px solid #8884',
  borderRadius: 6,
  minHeight: 44,
};

const grid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 6,
};

const btn: CSSProperties = {
  padding: '10px 0',
  fontSize: 16,
  cursor: 'pointer',
  borderRadius: 6,
  border: '1px solid #8886',
  background: 'transparent',
  color: 'inherit',
};

export const BareSkin = () => {
  const { display, expression, clearMode, dispatch } =
    useCalculator();

  return (
    <div style={box}>
      <div style={screen}>
        <div style={{ fontSize: 12, opacity: 0.6, minHeight: 16 }}>
          {expression}
        </div>
        <div style={{ fontSize: 26 }}>{display}</div>
      </div>
      <div style={grid}>
        {KEYS.map(key => {
          const label = key.dynamicClear ? clearMode : key.label;
          const action: CalculatorAction = key.dynamicClear
            ? clearMode === 'C'
              ? { type: 'clearEntry' }
              : { type: 'clear' }
            : key.action;
          return (
            <button
              key={key.label}
              style={btn}
              onClick={() => dispatch(action)}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BareSkin;

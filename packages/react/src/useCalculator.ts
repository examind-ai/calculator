import { useCallback, useMemo, useReducer } from 'react';

import {
  CalculatorAction,
  CalculatorState,
  Evaluator,
  createReducer,
  getClearMode,
  getDisplay,
  getExpression,
  initialState,
} from '@examind/calculator-core';

// Map a physical keyboard key to a calculator action (null = ignore the key).
export const keyToAction = (
  key: string,
): CalculatorAction | null => {
  if (/^[0-9]$/.test(key)) return { type: 'digit', value: key };
  switch (key) {
    case '.':
      return { type: 'decimal' };
    case '+':
      return { type: 'binary', operator: '+' };
    case '-':
      return { type: 'binary', operator: '-' };
    case '*':
      return { type: 'binary', operator: 'x' };
    case '/':
      return { type: 'binary', operator: '/' };
    case '%':
      return { type: 'percent' };
    case '=':
    case 'Enter':
      return { type: 'equals' };
    case 'Backspace':
      return { type: 'backspace' };
    case 'Escape':
      return { type: 'clear' };
    default:
      return null;
  }
};

export interface UseCalculatorResult {
  state: CalculatorState;
  // The two display lines + the contextual clear-key mode, derived from state.
  display: string;
  expression: string;
  clearMode: 'C' | 'AC';
  error: boolean;
  dispatch: (action: CalculatorAction) => void;
  // Translate a keyboard event into an action and dispatch it. Calls
  // preventDefault and returns true when the key mapped to an action.
  handleKey: (
    event: Pick<KeyboardEvent, 'key' | 'preventDefault'>,
  ) => boolean;
}

// Headless calculator: owns the reducer + selectors + keyboard mapping, with no
// UI and no side effects. Pass a custom `evaluator` to swap in a later mode
// (financial / scientific); omit it for basic arithmetic.
export const useCalculator = (
  evaluator?: Evaluator,
): UseCalculatorResult => {
  const reducer = useMemo(
    () => createReducer(evaluator),
    [evaluator],
  );
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleKey = useCallback(
    (event: Pick<KeyboardEvent, 'key' | 'preventDefault'>) => {
      const action = keyToAction(event.key);
      if (!action) return false;
      event.preventDefault();
      dispatch(action);
      return true;
    },
    [],
  );

  return {
    state,
    display: getDisplay(state),
    expression: getExpression(state),
    clearMode: getClearMode(state),
    error: state.error,
    dispatch,
    handleKey,
  };
};

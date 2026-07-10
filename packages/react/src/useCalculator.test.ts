// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { keyToAction, useCalculator } from './useCalculator';

describe('keyToAction', () => {
  it.each(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])(
    'maps the digit "%s" to a digit action',
    key => {
      expect(keyToAction(key)).toEqual({ type: 'digit', value: key });
    },
  );

  it('maps "." to decimal', () => {
    expect(keyToAction('.')).toEqual({ type: 'decimal' });
  });

  it.each([
    ['+', '+'],
    ['-', '-'],
    ['*', 'x'],
    ['/', '/'],
  ] as const)('maps "%s" to the "%s" binary operator', (key, operator) => {
    expect(keyToAction(key)).toEqual({ type: 'binary', operator });
  });

  it('maps "%" to percent', () => {
    expect(keyToAction('%')).toEqual({ type: 'percent' });
  });

  it.each(['=', 'Enter'])('maps "%s" to equals', key => {
    expect(keyToAction(key)).toEqual({ type: 'equals' });
  });

  it('maps "Backspace" to backspace', () => {
    expect(keyToAction('Backspace')).toEqual({ type: 'backspace' });
  });

  it('maps "Escape" to clear', () => {
    expect(keyToAction('Escape')).toEqual({ type: 'clear' });
  });

  it.each(['a', 'F1', 'Delete', 'Shift', 'ArrowLeft', ' ', ''])(
    'returns null for the unmapped key %o',
    key => {
      expect(keyToAction(key)).toBeNull();
    },
  );
});

describe('useCalculator', () => {
  it('exposes the initial display, expression, clear mode and error', () => {
    const { result } = renderHook(() => useCalculator());
    expect(result.current.display).toBe('0');
    expect(result.current.expression).toBe('0');
    expect(result.current.clearMode).toBe('AC');
    expect(result.current.error).toBe(false);
  });

  it('dispatches an action that flows through the selectors', () => {
    const { result } = renderHook(() => useCalculator());
    act(() => result.current.dispatch({ type: 'digit', value: '7' }));
    expect(result.current.display).toBe('7');
    // A live entry flips the contextual clear key to C.
    expect(result.current.clearMode).toBe('C');
  });

  it('computes a full expression through dispatched actions', () => {
    const { result } = renderHook(() => useCalculator());
    act(() => result.current.dispatch({ type: 'digit', value: '7' }));
    act(() => result.current.dispatch({ type: 'binary', operator: '+' }));
    act(() => result.current.dispatch({ type: 'digit', value: '8' }));
    act(() => result.current.dispatch({ type: 'equals' }));
    expect(result.current.display).toBe('15');
    expect(result.current.expression).toBe('7 + 8 =');
  });

  it('handleKey maps a key, dispatches it, prevents default and returns true', () => {
    const { result } = renderHook(() => useCalculator());
    const preventDefault = vi.fn();
    let handled: boolean | undefined;
    act(() => {
      handled = result.current.handleKey({ key: '7', preventDefault });
    });
    expect(handled).toBe(true);
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(result.current.display).toBe('7');
  });

  it('handleKey ignores an unmapped key without preventing default', () => {
    const { result } = renderHook(() => useCalculator());
    const preventDefault = vi.fn();
    let handled: boolean | undefined;
    act(() => {
      handled = result.current.handleKey({ key: 'a', preventDefault });
    });
    expect(handled).toBe(false);
    expect(preventDefault).not.toHaveBeenCalled();
    expect(result.current.display).toBe('0');
  });
});

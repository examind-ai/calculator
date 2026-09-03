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
  ] as const)(
    'maps "%s" to the "%s" binary operator',
    (key, operator) => {
      expect(keyToAction(key)).toEqual({ type: 'binary', operator });
    },
  );

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

  // The Windows "Standard" layout the MUI skin follows: Escape clears all (AC),
  // while the physical Delete key is CE (clear the current entry only).
  it('maps "Delete" to clearEntry (CE), distinct from Escape', () => {
    expect(keyToAction('Delete')).toEqual({ type: 'clearEntry' });
    expect(keyToAction('Delete')).not.toEqual(keyToAction('Escape'));
  });

  it.each(['a', 'F1', 'Shift', 'ArrowLeft', ' ', ''])(
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
    act(() =>
      result.current.dispatch({ type: 'binary', operator: '+' }),
    );
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
      handled = result.current.handleKey({
        key: '7',
        preventDefault,
      });
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
      handled = result.current.handleKey({
        key: 'a',
        preventDefault,
      });
    });
    expect(handled).toBe(false);
    expect(preventDefault).not.toHaveBeenCalled();
    expect(result.current.display).toBe('0');
  });
});

describe('useCalculator - digit grouping', () => {
  const type = (
    result: { current: ReturnType<typeof useCalculator> },
    keys: string,
  ) => {
    for (const key of keys.split(' '))
      act(() => {
        result.current.handleKey({ key, preventDefault: () => {} });
      });
  };

  it('groups the display and expression lines by default', () => {
    const { result } = renderHook(() => useCalculator());
    type(result, '1 2 3 4 5 6 7 * 2 =');
    expect(result.current.display).toBe('2,469,134');
    expect(result.current.expression).toBe('1,234,567 × 2 =');
  });

  it('leaves the fraction, a typed trailing point and exponents alone', () => {
    const { result } = renderHook(() => useCalculator());
    type(result, '1 2 3 4 . 5 0');
    expect(result.current.display).toBe('1,234.50');
    type(result, 'Escape 1 2 3 4 .');
    expect(result.current.display).toBe('1,234.');
    type(result, 'Escape 1 / 8 0 0 0 0 0 0 0 =');
    expect(result.current.display).toBe('1.25e-8');
  });

  it('never groups the raw state', () => {
    const { result } = renderHook(() => useCalculator());
    type(result, '1 2 3 4 5 6 7 * 2 =');
    expect(result.current.state.entry).toBe('2469134');
    expect(result.current.state.operands).toEqual(['1234567', '2']);
  });

  it('can be turned off', () => {
    const { result } = renderHook(() =>
      useCalculator(undefined, { grouping: false }),
    );
    type(result, '1 2 3 4 5 6 7 * 2 =');
    expect(result.current.display).toBe('2469134');
    expect(result.current.expression).toBe('1234567 × 2 =');
  });
});

describe('useCalculator - handlePaste', () => {
  const pasteEvent = (text: string | null) => ({
    clipboardData:
      text === null
        ? null
        : ({ getData: () => text } as unknown as DataTransfer),
    preventDefault: vi.fn(),
  });

  it('dispatches the clipboard text, prevents default and returns true', () => {
    const { result } = renderHook(() => useCalculator());
    const event = pasteEvent('1,234.5');
    let handled = false;
    act(() => {
      handled = result.current.handlePaste(event);
    });
    expect(handled).toBe(true);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(result.current.display).toBe('1,234.5');
    expect(result.current.state.value).toBe('1234.5');
  });

  it('feeds a pending operator: 5 + paste 3 = -> 8', () => {
    const { result } = renderHook(() => useCalculator());
    act(() => {
      result.current.dispatch({ type: 'digit', value: '5' });
      result.current.dispatch({ type: 'binary', operator: '+' });
    });
    act(() => {
      result.current.handlePaste(pasteEvent('3'));
    });
    act(() => result.current.dispatch({ type: 'equals' }));
    expect(result.current.display).toBe('8');
  });

  it('still consumes the event when the text is not a number', () => {
    const { result } = renderHook(() => useCalculator());
    const event = pasteEvent('hello');
    let handled = false;
    act(() => {
      handled = result.current.handlePaste(event);
    });
    expect(handled).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(result.current.display).toBe('0');
    expect(result.current.error).toBe(false);
  });

  it('ignores an event with no text', () => {
    const { result } = renderHook(() => useCalculator());
    const empty = pasteEvent('');
    const none = pasteEvent(null);
    let handled = true;
    act(() => {
      handled =
        result.current.handlePaste(empty) ||
        result.current.handlePaste(none);
    });
    expect(handled).toBe(false);
    expect(empty.preventDefault).not.toHaveBeenCalled();
  });
});

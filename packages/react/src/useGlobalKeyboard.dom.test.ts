// @vitest-environment jsdom
//
// DOM-level coverage of the `useGlobalKeyboard` hook (attach / detach and the
// `enabled` flag). The pure guard predicate `shouldIgnoreGlobalKey` is covered
// separately, without a DOM, in `useGlobalKeyboard.test.ts`.
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useGlobalKeyboard } from './useGlobalKeyboard';

const pressKey = (init: KeyboardEventInit = { key: '7' }): void => {
  window.dispatchEvent(new KeyboardEvent('keydown', init));
};

describe('useGlobalKeyboard', () => {
  it('attaches a window keydown listener that forwards keys (enabled by default)', () => {
    const handleKey = vi.fn();
    renderHook(() => useGlobalKeyboard(handleKey));
    pressKey();
    expect(handleKey).toHaveBeenCalledOnce();
  });

  it('detaches the listener on unmount', () => {
    const handleKey = vi.fn();
    const { unmount } = renderHook(() => useGlobalKeyboard(handleKey));
    unmount();
    pressKey();
    expect(handleKey).not.toHaveBeenCalled();
  });

  it('does not attach a listener when disabled', () => {
    const handleKey = vi.fn();
    renderHook(() => useGlobalKeyboard(handleKey, false));
    pressKey();
    expect(handleKey).not.toHaveBeenCalled();
  });

  it('attaches once the enabled flag flips on', () => {
    const handleKey = vi.fn();
    const { rerender } = renderHook(
      ({ enabled }) => useGlobalKeyboard(handleKey, enabled),
      { initialProps: { enabled: false } },
    );
    pressKey();
    expect(handleKey).not.toHaveBeenCalled();
    rerender({ enabled: true });
    pressKey();
    expect(handleKey).toHaveBeenCalledOnce();
  });

  it('applies the ignore guard, skipping modifier chords', () => {
    const handleKey = vi.fn();
    renderHook(() => useGlobalKeyboard(handleKey));
    pressKey({ key: '7', ctrlKey: true });
    expect(handleKey).not.toHaveBeenCalled();
  });
});

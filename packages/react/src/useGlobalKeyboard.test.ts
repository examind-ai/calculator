import { describe, expect, it } from 'vitest';

import {
  GlobalKeyGuardEvent,
  shouldIgnoreGlobalKey,
} from './useGlobalKeyboard';

// A stand-in for an event target: only the fields the guard reads.
const target = (
  fields: { tagName?: string; isContentEditable?: boolean },
): EventTarget => fields as unknown as EventTarget;

// Build a guardable event with sensible defaults (no modifiers, no target).
const evt = (
  over: Partial<GlobalKeyGuardEvent> = {},
): GlobalKeyGuardEvent => ({
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  target: null,
  ...over,
});

describe('shouldIgnoreGlobalKey', () => {
  it('passes through a plain key with no target (drives the calculator)', () => {
    expect(shouldIgnoreGlobalKey(evt())).toBe(false);
  });

  it('passes through a plain key on a non-editable element', () => {
    expect(
      shouldIgnoreGlobalKey(evt({ target: target({ tagName: 'BUTTON' }) })),
    ).toBe(false);
  });

  it.each(['INPUT', 'TEXTAREA', 'SELECT'])(
    'ignores keys targeting an editable <%s>',
    tag => {
      expect(
        shouldIgnoreGlobalKey(evt({ target: target({ tagName: tag }) })),
      ).toBe(true);
    },
  );

  it('is case-insensitive on tagName', () => {
    expect(
      shouldIgnoreGlobalKey(evt({ target: target({ tagName: 'input' }) })),
    ).toBe(true);
  });

  it('ignores keys targeting a contentEditable element', () => {
    expect(
      shouldIgnoreGlobalKey(
        evt({ target: target({ tagName: 'DIV', isContentEditable: true }) }),
      ),
    ).toBe(true);
  });

  it.each([
    ['ctrlKey', { ctrlKey: true }],
    ['metaKey', { metaKey: true }],
    ['altKey', { altKey: true }],
  ] as const)(
    'ignores keys with %s modifier (browser/app shortcut)',
    (_name, mod) => {
      expect(shouldIgnoreGlobalKey(evt(mod))).toBe(true);
    },
  );
});

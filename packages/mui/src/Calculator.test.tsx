// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Calculator } from './Calculator';

afterEach(cleanup);

describe('<Calculator /> (MUI skin)', () => {
  it('computes 7 + 8 = 15 through key clicks', () => {
    render(<Calculator globalKeyboard={false} />);
    fireEvent.click(screen.getByTestId('calc-key-7'));
    fireEvent.click(screen.getByTestId('calc-key-add'));
    fireEvent.click(screen.getByTestId('calc-key-8'));
    fireEvent.click(screen.getByTestId('calc-key-equals'));

    expect(screen.getByTestId('calculator-display').textContent).toBe('15');
    expect(screen.getByTestId('calculator-expression').textContent).toBe(
      '7 + 8 =',
    );
  });

  it('flips the contextual clear key AC -> C -> AC', () => {
    render(<Calculator globalKeyboard={false} />);
    const clear = screen.getByTestId('calc-key-clear');
    expect(clear.textContent).toBe('AC');

    // A live entry turns the key into C (clear entry only).
    fireEvent.click(screen.getByTestId('calc-key-7'));
    expect(clear.textContent).toBe('C');

    // C clears just the entry and drops back to AC.
    fireEvent.click(clear);
    expect(screen.getByTestId('calculator-display').textContent).toBe('0');
    expect(clear.textContent).toBe('AC');
  });

  it('accepts keyboard input when globalKeyboard is on', () => {
    render(<Calculator />);
    // keydown bubbles from the document up to the window listener the hook adds.
    fireEvent.keyDown(document.body, { key: '4' });
    fireEvent.keyDown(document.body, { key: '2' });

    expect(screen.getByTestId('calculator-display').textContent).toBe('42');
  });
});

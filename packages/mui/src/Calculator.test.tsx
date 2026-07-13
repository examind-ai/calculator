// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Calculator } from './Calculator';

afterEach(cleanup);

describe('<Calculator /> (MUI skin)', () => {
  it('computes 7 + 8 = 15 through key clicks', () => {
    render(<Calculator />);
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
    render(<Calculator />);
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

  it('is keyboard-driven only while focus is within the widget', () => {
    render(<Calculator />);
    const widget = screen.getByRole('group', { name: 'calculator' });

    // A key pressed outside the widget must not reach it.
    fireEvent.keyDown(document.body, { key: '4' });
    expect(screen.getByTestId('calculator-display').textContent).toBe('0');

    // Keys within the widget (root is the focus owner) drive it.
    fireEvent.keyDown(widget, { key: '4' });
    fireEvent.keyDown(widget, { key: '2' });
    expect(screen.getByTestId('calculator-display').textContent).toBe('42');
  });

  it('exposes a focusable root and non-tabbable grid buttons', () => {
    render(<Calculator />);
    expect(screen.getByRole('group', { name: 'calculator' })).toHaveProperty(
      'tabIndex',
      0,
    );
    expect(screen.getByTestId('calc-key-7')).toHaveProperty('tabIndex', -1);
    expect(screen.getByTestId('calc-key-equals')).toHaveProperty(
      'tabIndex',
      -1,
    );
  });

  it('does not double-activate: Enter within the widget applies equals once', () => {
    render(<Calculator />);
    const widget = screen.getByRole('group', { name: 'calculator' });
    fireEvent.click(screen.getByTestId('calc-key-7'));
    fireEvent.click(screen.getByTestId('calc-key-add'));
    fireEvent.click(screen.getByTestId('calc-key-8'));

    // Enter maps to equals; the button grid is out of the tab order, so the
    // root is the only thing that handles the key - exactly one equals.
    fireEvent.keyDown(widget, { key: 'Enter' });
    expect(screen.getByTestId('calculator-display').textContent).toBe('15');
    expect(screen.getByTestId('calculator-expression').textContent).toBe(
      '7 + 8 =',
    );
  });

  it('turns the keyboard fully off with keyboard={false} (clicks still work)', () => {
    render(<Calculator keyboard={false} />);
    const widget = screen.getByRole('group', { name: 'calculator' });

    // Not focusable, and no key handler: typing does nothing.
    expect(widget).toHaveProperty('tabIndex', -1);
    fireEvent.keyDown(widget, { key: '4' });
    expect(screen.getByTestId('calculator-display').textContent).toBe('0');

    // On-screen buttons still work by click.
    fireEvent.click(screen.getByTestId('calc-key-4'));
    expect(screen.getByTestId('calculator-display').textContent).toBe('4');
  });

  it('does not cross-fire between two calculators', () => {
    render(
      <>
        <Calculator />
        <Calculator />
      </>,
    );
    const [first, second] = screen.getAllByRole('group', {
      name: 'calculator',
    });

    fireEvent.keyDown(first, { key: '5' });
    expect(within(first).getByTestId('calculator-display').textContent).toBe(
      '5',
    );
    expect(within(second).getByTestId('calculator-display').textContent).toBe(
      '0',
    );

    fireEvent.keyDown(second, { key: '7' });
    expect(within(second).getByTestId('calculator-display').textContent).toBe(
      '7',
    );
    // The first calculator is untouched by the second's keystroke.
    expect(within(first).getByTestId('calculator-display').textContent).toBe(
      '5',
    );
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Exercise } from '../../data/curriculum';
import { Ordering } from './Ordering';

const exercise: Extract<Exercise, { kind: 'ordering' }> = {
  id: 'desaturation-order',
  kind: 'ordering',
  prompt: 'Order a disciplined first response.',
  steps: ['Check signal', 'Ventilate manually', 'Auscultate', 'Recruit'],
  explanation: 'A disciplined response preserves oxygen delivery while checking causes.',
};

describe('Ordering', () => {
  it('requires the learner to move a step before checking the order', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();

    render(<Ordering exercise={exercise} onAnswer={onAnswer} />);

    const checkOrder = screen.getByRole('button', { name: /check order/i });
    expect(checkOrder).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /move "Recruit" down/i }));

    expect(checkOrder).toBeEnabled();

    await user.click(checkOrder);

    expect(onAnswer).toHaveBeenCalledTimes(1);
  });

  it('gives ordering controls step-specific accessible names', () => {
    render(<Ordering exercise={exercise} onAnswer={vi.fn()} />);

    expect(screen.getByRole('button', { name: /move "Recruit" down/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /move "Check signal" down/i })).toBeInTheDocument();
  });
});

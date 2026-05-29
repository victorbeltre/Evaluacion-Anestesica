import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MultipleChoice } from './MultipleChoice';
import type { Exercise } from '../../data/curriculum';

const exercise: Extract<Exercise, { kind: 'mcq' }> = {
  id: 'briefing-mcq',
  kind: 'mcq',
  prompt: 'Which action reduces early team error?',
  options: ['Delay arterial access', 'Run a structured brief', 'Document every 15 minutes'],
  answer: 'Run a structured brief',
  explanation: 'Structured briefs create shared expectations.',
};

describe('MultipleChoice', () => {
  it('requires an explicit submission and reports whether the selected option is correct', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();

    render(<MultipleChoice exercise={exercise} onAnswer={onAnswer} />);

    await user.click(screen.getByRole('radio', { name: 'Run a structured brief' }));
    expect(onAnswer).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /check answer/i }));

    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenCalledWith(true);
    expect(screen.getByText('Structured briefs create shared expectations.')).toBeInTheDocument();
  });
});

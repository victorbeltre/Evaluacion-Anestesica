import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { LessonNode } from '../../data/curriculum';
import { ExercisePanel } from './ExercisePanel';

const node: LessonNode = {
  id: 'perioperative-briefing',
  title: 'High-risk perioperative brief',
  domainId: 'foundations',
  difficulty: 'R3',
  estimatedMinutes: 7,
  summary: 'Practice team communication and escalation thresholds.',
  exercises: [
    {
      id: 'briefing-mcq',
      kind: 'mcq',
      prompt: 'Which pre-induction action most directly reduces team error?',
      options: ['Increase fresh gas flow', 'Run a structured brief'],
      answer: 'Run a structured brief',
      explanation: 'A structured brief creates shared expectations.',
    },
  ],
};

describe('ExercisePanel', () => {
  it('allows replay feedback without calling answer scoring for an already scored exercise', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    const onComplete = vi.fn();

    render(
      <ExercisePanel
        completed
        mastery={100}
        node={node}
        onAnswer={onAnswer}
        onComplete={onComplete}
        scoredExerciseIds={['briefing-mcq']}
      />,
    );

    await user.click(screen.getByLabelText('Run a structured brief'));
    await user.click(screen.getByRole('button', { name: /check answer/i }));

    expect(screen.getByText('Correct')).toBeInTheDocument();
    expect(onAnswer).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /finish review/i })).toBeEnabled();
  });
});

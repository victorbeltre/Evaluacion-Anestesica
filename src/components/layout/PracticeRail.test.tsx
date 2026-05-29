import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { curriculum } from '../../data/curriculum';
import type { ProgressState } from '../../state/progress';
import { PracticeRail } from './PracticeRail';

const baseProgress: ProgressState = {
  xp: 45,
  streak: 3,
  hearts: 4,
  masteryByNode: {
    'perioperative-briefing': 80,
  },
  completedNodeIds: ['perioperative-briefing'],
  scoredExerciseIds: ['briefing-mcq'],
  reviewQueue: [],
};

describe('PracticeRail', () => {
  it('shows mastery, flashcards due, and weak-area indicators', () => {
    render(<PracticeRail progress={baseProgress} selectedNode={curriculum[0].nodes[0]} />);

    expect(screen.getByText('Mastery')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('Flashcards')).toBeInTheDocument();
    expect(screen.getByText('Weak areas')).toBeInTheDocument();
    expect(screen.getByText(/perioperative briefing/i)).toBeInTheDocument();
  });
});

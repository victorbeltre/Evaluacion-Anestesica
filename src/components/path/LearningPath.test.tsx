import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { curriculum } from '../../data/curriculum';
import { LearningPath } from './LearningPath';

describe('LearningPath', () => {
  it('clamps displayed mastery labels and bar widths', () => {
    const domain = curriculum[0];

    render(
      <LearningPath
        completedNodeIds={['perioperative-briefing']}
        domain={domain}
        masteryByNode={{
          'perioperative-briefing': 150,
          'perioperative-ethics': -25,
        }}
        onSelectNode={vi.fn()}
        selectedNodeId="perioperative-briefing"
      />,
    );

    expect(screen.getByText('100% mastery')).toBeInTheDocument();
    expect(screen.getByText('0% mastery')).toBeInTheDocument();

    const bars = document.querySelectorAll<HTMLElement>('.mastery-track span');
    expect(bars[0]).toHaveStyle({ width: '100%' });
    expect(bars[1]).toHaveStyle({ width: '0%' });
  });
});

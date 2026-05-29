import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mockedProgress = vi.hoisted(() => ({
  value: {
    xp: 0,
    streak: 0,
    hearts: 4,
    masteryByNode: {},
    completedNodeIds: [],
    reviewQueue: [],
  },
}));

vi.mock('./state/progress', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./state/progress')>();

  return {
    ...actual,
    loadProgress: () => mockedProgress.value,
    saveProgress: vi.fn(),
  };
});

describe('App', () => {
  it('clamps the displayed selected lesson mastery', async () => {
    mockedProgress.value = {
      xp: 0,
      streak: 0,
      hearts: 4,
      masteryByNode: {
        'perioperative-briefing': 150,
      },
      completedNodeIds: [],
      reviewQueue: [],
    };
    const { default: App } = await import('./App');

    render(<App />);

    expect(
      screen.getByText((content, element) => element?.tagName === 'DD' && content === '100%'),
    ).toBeInTheDocument();
  });
});

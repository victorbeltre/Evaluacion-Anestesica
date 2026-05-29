import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyAnswerResult,
  completeNode,
  createInitialProgress,
  loadProgress,
  saveProgress,
  type ProgressState,
} from './progress';

describe('progress state', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('awards XP and mastery for a correct answer', () => {
    const progress = createInitialProgress();

    const next = applyAnswerResult(progress, {
      nodeId: 'perioperative-briefing',
      exerciseId: 'briefing-mcq',
      correct: true,
    });

    expect(next.xp).toBe(progress.xp + 10);
    expect(next.hearts).toBe(progress.hearts);
    expect(next.masteryByNode['perioperative-briefing']).toBe(1);
    expect(next.reviewQueue).toEqual([]);
    expect(progress.masteryByNode['perioperative-briefing']).toBeUndefined();
  });

  it('records a correct answer as scored and does not award answer XP for the same exercise twice', () => {
    const progress = createInitialProgress();

    const firstScore = applyAnswerResult(progress, {
      nodeId: 'perioperative-briefing',
      exerciseId: 'briefing-mcq',
      correct: true,
    });
    const replayScore = applyAnswerResult(firstScore, {
      nodeId: 'perioperative-briefing',
      exerciseId: 'briefing-mcq',
      correct: true,
    });

    expect(firstScore.scoredExerciseIds).toEqual(['briefing-mcq']);
    expect(replayScore.xp).toBe(firstScore.xp);
    expect(replayScore.masteryByNode['perioperative-briefing']).toBe(
      firstScore.masteryByNode['perioperative-briefing'],
    );
    expect(replayScore.scoredExerciseIds).toEqual(['briefing-mcq']);
  });

  it('uses scored exercise history across persisted progress reloads', () => {
    const progress: ProgressState = {
      ...createInitialProgress(),
      xp: 10,
      masteryByNode: {
        'perioperative-briefing': 1,
      },
      scoredExerciseIds: ['briefing-mcq'],
    };

    localStorage.setItem('milaringo-progress', JSON.stringify(progress));

    const replayScore = applyAnswerResult(loadProgress(), {
      nodeId: 'perioperative-briefing',
      exerciseId: 'briefing-mcq',
      correct: true,
    });

    expect(replayScore.xp).toBe(progress.xp);
    expect(replayScore.masteryByNode).toEqual(progress.masteryByNode);
    expect(replayScore.scoredExerciseIds).toEqual(['briefing-mcq']);
  });

  it('removes a queued node from review after a later correct answer', () => {
    const progress: ProgressState = {
      ...createInitialProgress(),
      reviewQueue: [
        {
          nodeId: 'ventilation-perfusion',
          exerciseId: 'vq-mcq',
        },
        {
          nodeId: 'right-ventricle',
          exerciseId: 'rv-matching',
        },
      ],
    };

    const next = applyAnswerResult(progress, {
      nodeId: 'ventilation-perfusion',
      exerciseId: 'vq-mcq',
      correct: true,
    });

    expect(next.reviewQueue).toEqual([
      {
        nodeId: 'right-ventricle',
        exerciseId: 'rv-matching',
      },
    ]);
  });

  it('removes a heart and queues review for a wrong answer', () => {
    const progress = createInitialProgress();

    const next = applyAnswerResult(progress, {
      nodeId: 'ventilation-perfusion',
      exerciseId: 'vq-mcq',
      correct: false,
    });

    expect(next.xp).toBe(progress.xp);
    expect(next.hearts).toBe(progress.hearts - 1);
    expect(next.masteryByNode['ventilation-perfusion']).toBeUndefined();
    expect(next.reviewQueue).toEqual([
      {
        nodeId: 'ventilation-perfusion',
        exerciseId: 'vq-mcq',
      },
    ]);
  });

  it('does not queue duplicate node ids for repeated wrong answers', () => {
    const progress = applyAnswerResult(createInitialProgress(), {
      nodeId: 'ventilation-perfusion',
      exerciseId: 'vq-mcq',
      correct: false,
    });

    const next = applyAnswerResult(progress, {
      nodeId: 'ventilation-perfusion',
      exerciseId: 'vq-fill-blank',
      correct: false,
    });

    expect(next.reviewQueue.map((item) => item.nodeId)).toEqual(['ventilation-perfusion']);
  });

  it('does not reduce hearts below zero', () => {
    const progress: ProgressState = {
      ...createInitialProgress(),
      hearts: 0,
    };

    const next = applyAnswerResult(progress, {
      nodeId: 'right-ventricle',
      exerciseId: 'rv-matching',
      correct: false,
    });

    expect(next.hearts).toBe(0);
  });

  it('marks a node complete and grants completion XP once', () => {
    const progress = createInitialProgress();

    const firstCompletion = completeNode(progress, 'perioperative-briefing');
    const repeatedCompletion = completeNode(firstCompletion, 'perioperative-briefing');

    expect(firstCompletion.completedNodeIds).toEqual(['perioperative-briefing']);
    expect(firstCompletion.xp).toBe(progress.xp + 25);
    expect(repeatedCompletion.completedNodeIds).toEqual(['perioperative-briefing']);
    expect(repeatedCompletion.xp).toBe(firstCompletion.xp);
  });

  it('falls back to initial progress when saved localStorage data is missing or invalid', () => {
    expect(loadProgress()).toEqual(createInitialProgress());

    localStorage.setItem('milaringo-progress', '{bad json');

    expect(loadProgress()).toEqual(createInitialProgress());
  });

  it('loads valid saved progress from localStorage', () => {
    const progress: ProgressState = {
      xp: 30,
      streak: 3,
      hearts: 4,
      masteryByNode: {
        'perioperative-briefing': 2,
      },
      completedNodeIds: ['perioperative-briefing'],
      scoredExerciseIds: ['briefing-mcq'],
      reviewQueue: [
        {
          nodeId: 'ventilation-perfusion',
          exerciseId: 'vq-mcq',
        },
      ],
    };

    localStorage.setItem('milaringo-progress', JSON.stringify(progress));

    expect(loadProgress()).toEqual(progress);
  });

  it('sanitizes out-of-range and malformed saved progress values', () => {
    localStorage.setItem(
      'milaringo-progress',
      JSON.stringify({
        xp: -10,
        streak: Number.POSITIVE_INFINITY,
        hearts: 99,
        masteryByNode: {
          'perioperative-briefing': 150,
          'right-ventricle': -20,
          invalid: Number.NaN,
        },
        completedNodeIds: ['perioperative-briefing', 5, null],
        scoredExerciseIds: ['briefing-mcq', 8, 'briefing-mcq', null],
        reviewQueue: [
          {
            nodeId: 'ventilation-perfusion',
            exerciseId: 'vq-mcq',
          },
          {
            nodeId: 'ventilation-perfusion',
            exerciseId: 'vq-repeat',
          },
          {
            nodeId: 4,
            exerciseId: 'bad',
          },
        ],
      }),
    );

    expect(loadProgress()).toEqual({
      ...createInitialProgress(),
      hearts: 4,
      masteryByNode: {
        'perioperative-briefing': 100,
        'right-ventricle': 0,
      },
      completedNodeIds: ['perioperative-briefing'],
      scoredExerciseIds: ['briefing-mcq'],
      reviewQueue: [
        {
          nodeId: 'ventilation-perfusion',
          exerciseId: 'vq-mcq',
        },
      ],
    });
  });

  it('does not throw when the localStorage accessor fails', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('storage blocked');
    });

    expect(() => loadProgress()).not.toThrow();
    expect(loadProgress()).toEqual(createInitialProgress());
    expect(() => saveProgress(createInitialProgress())).not.toThrow();
  });

  it('saves progress to localStorage and does not throw if storage write fails', () => {
    const progress = applyAnswerResult(createInitialProgress(), {
      nodeId: 'perioperative-briefing',
      exerciseId: 'briefing-mcq',
      correct: true,
    });
    const setItem = vi.spyOn(Storage.prototype, 'setItem');

    expect(() => saveProgress(progress)).not.toThrow();
    expect(JSON.parse(localStorage.getItem('milaringo-progress') ?? '{}')).toMatchObject({
      xp: 10,
      hearts: 4,
    });

    setItem.mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(() => saveProgress(progress)).not.toThrow();
  });
});

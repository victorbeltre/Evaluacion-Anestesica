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
      hearts: 5,
    });

    setItem.mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(() => saveProgress(progress)).not.toThrow();
  });
});

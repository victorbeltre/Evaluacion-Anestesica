const STORAGE_KEY = 'milaringo-progress';
const INITIAL_HEARTS = 4;
const CORRECT_ANSWER_XP = 10;
const NODE_COMPLETION_XP = 25;
const MIN_HEARTS = 0;
const MAX_HEARTS = 4;
const MIN_MASTERY = 0;
const MAX_MASTERY = 100;

export type ReviewQueueItem = {
  nodeId: string;
  exerciseId: string;
};

export type ProgressState = {
  xp: number;
  streak: number;
  hearts: number;
  masteryByNode: Record<string, number>;
  completedNodeIds: string[];
  scoredExerciseIds: string[];
  reviewQueue: ReviewQueueItem[];
};

export type AnswerResult = {
  nodeId: string;
  exerciseId: string;
  correct: boolean;
};

export function createInitialProgress(): ProgressState {
  return {
    xp: 0,
    streak: 0,
    hearts: INITIAL_HEARTS,
    masteryByNode: {},
    completedNodeIds: [],
    scoredExerciseIds: [],
    reviewQueue: [],
  };
}

export function applyAnswerResult(progress: ProgressState, result: AnswerResult): ProgressState {
  if (progress.scoredExerciseIds.includes(result.exerciseId)) {
    return progress;
  }

  if (result.correct) {
    return {
      ...progress,
      xp: progress.xp + CORRECT_ANSWER_XP,
      masteryByNode: {
        ...progress.masteryByNode,
        [result.nodeId]: (progress.masteryByNode[result.nodeId] ?? 0) + 1,
      },
      scoredExerciseIds: [...progress.scoredExerciseIds, result.exerciseId],
      reviewQueue: progress.reviewQueue.filter((item) => item.nodeId !== result.nodeId),
    };
  }

  const alreadyQueued = progress.reviewQueue.some((item) => item.nodeId === result.nodeId);

  return {
    ...progress,
    hearts: Math.max(0, progress.hearts - 1),
    reviewQueue: alreadyQueued
      ? progress.reviewQueue
      : [
          ...progress.reviewQueue,
          {
            nodeId: result.nodeId,
            exerciseId: result.exerciseId,
          },
        ],
  };
}

export function completeNode(progress: ProgressState, nodeId: string): ProgressState {
  if (progress.completedNodeIds.includes(nodeId)) {
    return progress;
  }

  return {
    ...progress,
    xp: progress.xp + NODE_COMPLETION_XP,
    completedNodeIds: [...progress.completedNodeIds, nodeId],
  };
}

export function loadProgress(): ProgressState {
  try {
    const storage = getStorage();

    if (!storage) {
      return createInitialProgress();
    }

    const stored = storage.getItem(STORAGE_KEY);

    if (!stored) {
      return createInitialProgress();
    }

    return parseProgress(stored) ?? createInitialProgress();
  } catch {
    return createInitialProgress();
  }
}

export function saveProgress(progress: ProgressState): void {
  try {
    const storage = getStorage();

    if (!storage) {
      return;
    }

    storage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage can fail in private browsing, quota exhaustion, or locked-down tests.
  }
}

export function clampMasteryForDisplay(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }

  return clamp(Math.round(value), MIN_MASTERY, MAX_MASTERY);
}

function getStorage(): Storage | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function parseProgress(stored: string): ProgressState | undefined {
  const parsed: unknown = JSON.parse(stored);

  if (!parsed || typeof parsed !== 'object') {
    return undefined;
  }

  return sanitizeProgress(parsed);
}

function sanitizeProgress(value: object): ProgressState {
  const initial = createInitialProgress();
  const candidate = value as Partial<ProgressState> & {
    nodeMastery?: unknown;
  };

  return {
    xp: sanitizeNonNegativeNumber(candidate.xp, initial.xp),
    streak: sanitizeNonNegativeNumber(candidate.streak, initial.streak),
    hearts: sanitizeClampedNumber(candidate.hearts, initial.hearts, MIN_HEARTS, MAX_HEARTS),
    masteryByNode: sanitizeMastery(candidate.masteryByNode ?? candidate.nodeMastery),
    completedNodeIds: sanitizeStringArray(candidate.completedNodeIds),
    scoredExerciseIds: sanitizeUniqueStringArray(candidate.scoredExerciseIds),
    reviewQueue: sanitizeReviewQueue(candidate.reviewQueue),
  };
}

function sanitizeNonNegativeNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function sanitizeClampedNumber(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return clamp(value, minimum, maximum);
}

function sanitizeMastery(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1]))
      .map(([nodeId, mastery]) => [nodeId, clamp(mastery, MIN_MASTERY, MAX_MASTERY)]),
  );
}

function sanitizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === 'string');
}

function sanitizeUniqueStringArray(value: unknown): string[] {
  return [...new Set(sanitizeStringArray(value))];
}

function sanitizeReviewQueue(value: unknown): ReviewQueueItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenNodeIds = new Set<string>();
  const reviewQueue: ReviewQueueItem[] = [];

  for (const item of value) {
    if (!isReviewQueueItem(item) || seenNodeIds.has(item.nodeId)) {
      continue;
    }

    seenNodeIds.add(item.nodeId);
    reviewQueue.push(item);
  }

  return reviewQueue;
}

function isReviewQueueItem(value: unknown): value is ReviewQueueItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ReviewQueueItem>;

  return typeof candidate.nodeId === 'string' && typeof candidate.exerciseId === 'string';
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

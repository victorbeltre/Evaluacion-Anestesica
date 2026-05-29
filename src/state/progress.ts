const STORAGE_KEY = 'milaringo-progress';
const INITIAL_HEARTS = 5;
const CORRECT_ANSWER_XP = 10;
const NODE_COMPLETION_XP = 25;

export type ReviewQueueItem = {
  nodeId: string;
  exerciseId: string;
};

export type ProgressState = {
  xp: number;
  hearts: number;
  masteryByNode: Record<string, number>;
  completedNodeIds: string[];
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
    hearts: INITIAL_HEARTS,
    masteryByNode: {},
    completedNodeIds: [],
    reviewQueue: [],
  };
}

export function applyAnswerResult(progress: ProgressState, result: AnswerResult): ProgressState {
  if (result.correct) {
    return {
      ...progress,
      xp: progress.xp + CORRECT_ANSWER_XP,
      masteryByNode: {
        ...progress.masteryByNode,
        [result.nodeId]: (progress.masteryByNode[result.nodeId] ?? 0) + 1,
      },
    };
  }

  return {
    ...progress,
    hearts: Math.max(0, progress.hearts - 1),
    reviewQueue: [
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
  const storage = getStorage();

  if (!storage) {
    return createInitialProgress();
  }

  try {
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
  const storage = getStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage can fail in private browsing, quota exhaustion, or locked-down tests.
  }
}

function getStorage(): Storage | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return window.localStorage;
}

function parseProgress(stored: string): ProgressState | undefined {
  const parsed: unknown = JSON.parse(stored);

  if (!isProgressState(parsed)) {
    return undefined;
  }

  return parsed;
}

function isProgressState(value: unknown): value is ProgressState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ProgressState>;

  return (
    typeof candidate.xp === 'number' &&
    typeof candidate.hearts === 'number' &&
    isStringNumberRecord(candidate.masteryByNode) &&
    isStringArray(candidate.completedNodeIds) &&
    Array.isArray(candidate.reviewQueue) &&
    candidate.reviewQueue.every(isReviewQueueItem)
  );
}

function isStringNumberRecord(value: unknown): value is Record<string, number> {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.values(value).every((entry) => typeof entry === 'number')
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isReviewQueueItem(value: unknown): value is ReviewQueueItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ReviewQueueItem>;

  return typeof candidate.nodeId === 'string' && typeof candidate.exerciseId === 'string';
}

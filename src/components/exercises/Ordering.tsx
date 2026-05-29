import { useEffect, useState } from 'react';
import type { Exercise } from '../../data/curriculum';

type OrderingExercise = Extract<Exercise, { kind: 'ordering' }>;

type OrderingProps = {
  exercise: OrderingExercise;
  onAnswer: (correct: boolean) => void;
};

export function Ordering({ exercise, onAnswer }: OrderingProps) {
  const [orderedSteps, setOrderedSteps] = useState(() => initialOrder(exercise.steps));
  const [result, setResult] = useState<boolean | undefined>();
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    setOrderedSteps(initialOrder(exercise.steps));
    setResult(undefined);
    setHasInteracted(false);
  }, [exercise.id, exercise.steps]);

  function moveStep(index: number, direction: -1 | 1) {
    setOrderedSteps((current) => {
      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      setHasInteracted(true);
      return next;
    });
  }

  function handleSubmit() {
    const correct = orderedSteps.every((step, index) => step === exercise.steps[index]);
    setResult(correct);
    onAnswer(correct);
  }

  return (
    <div className="exercise-body">
      <p className="exercise-prompt">{exercise.prompt}</p>
      <ol className="ordering-list">
        {orderedSteps.map((step, index) => (
          <li key={step}>
            <span>{step}</span>
            <div className="step-controls">
              <button
                aria-label={`Move "${step}" up`}
                disabled={result !== undefined || index === 0}
                onClick={() => moveStep(index, -1)}
                type="button"
              >
                Up
              </button>
              <button
                aria-label={`Move "${step}" down`}
                disabled={result !== undefined || index === orderedSteps.length - 1}
                onClick={() => moveStep(index, 1)}
                type="button"
              >
                Down
              </button>
            </div>
          </li>
        ))}
      </ol>

      {result !== undefined ? (
        <div className={result ? 'answer-feedback is-correct' : 'answer-feedback is-incorrect'} role="status">
          <strong>{result ? 'Correct' : 'Review this sequence'}</strong>
          <span>{exercise.explanation}</span>
        </div>
      ) : null}

      <button
        className="primary-action"
        disabled={!hasInteracted || result !== undefined}
        onClick={handleSubmit}
        type="button"
      >
        Check order
      </button>
    </div>
  );
}

function initialOrder(steps: string[]) {
  return steps.length > 1 ? [...steps].reverse() : steps;
}

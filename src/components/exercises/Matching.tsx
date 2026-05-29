import { useEffect, useState } from 'react';
import type { Exercise } from '../../data/curriculum';

type MatchingExercise = Extract<Exercise, { kind: 'matching' }>;

type MatchingProps = {
  exercise: MatchingExercise;
  onAnswer: (correct: boolean) => void;
};

export function Matching({ exercise, onAnswer }: MatchingProps) {
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [result, setResult] = useState<boolean | undefined>();
  const rightOptions = exercise.pairs.map((pair) => pair.right);

  useEffect(() => {
    setMatches({});
    setResult(undefined);
  }, [exercise.id]);

  function handleSubmit() {
    const correct = exercise.pairs.every((pair) => matches[pair.left] === pair.right);
    setResult(correct);
    onAnswer(correct);
  }

  const allMatched = exercise.pairs.every((pair) => matches[pair.left]);

  return (
    <div className="exercise-body">
      <p className="exercise-prompt">{exercise.prompt}</p>
      <div className="matching-grid">
        {exercise.pairs.map((pair) => (
          <label className="match-row" key={pair.left}>
            <span>{pair.left}</span>
            <select
              disabled={result !== undefined}
              onChange={(event) => setMatches((current) => ({ ...current, [pair.left]: event.target.value }))}
              value={matches[pair.left] ?? ''}
            >
              <option value="">Choose match</option>
              {rightOptions.map((right) => (
                <option key={right} value={right}>
                  {right}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      {result !== undefined ? <Feedback correct={result} explanation={exercise.explanation} /> : null}

      <button className="primary-action" disabled={!allMatched || result !== undefined} onClick={handleSubmit} type="button">
        Check matches
      </button>
    </div>
  );
}

function Feedback({ correct, explanation }: { correct: boolean; explanation: string }) {
  return (
    <div className={correct ? 'answer-feedback is-correct' : 'answer-feedback is-incorrect'} role="status">
      <strong>{correct ? 'Correct' : 'Review this'}</strong>
      <span>{explanation}</span>
    </div>
  );
}

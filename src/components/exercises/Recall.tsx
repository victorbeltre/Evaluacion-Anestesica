import { FormEvent, useEffect, useState } from 'react';
import type { Exercise } from '../../data/curriculum';

type RecallExercise = Extract<Exercise, { kind: 'recall' }>;

type RecallProps = {
  exercise: RecallExercise;
  onAnswer: (correct: boolean) => void;
};

export function Recall({ exercise, onAnswer }: RecallProps) {
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<boolean | undefined>();

  useEffect(() => {
    setAnswer('');
    setResult(undefined);
  }, [exercise.id]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const normalizedAnswer = normalize(answer);
    const correct = exercise.accepted.some((accepted) => normalize(accepted) === normalizedAnswer);
    setResult(correct);
    onAnswer(correct);
  }

  return (
    <form className="exercise-body" onSubmit={handleSubmit}>
      <label className="recall-field">
        <span>{exercise.prompt}</span>
        <input
          disabled={result !== undefined}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="Type your answer"
          value={answer}
        />
      </label>

      {result !== undefined ? (
        <div className={result ? 'answer-feedback is-correct' : 'answer-feedback is-incorrect'} role="status">
          <strong>{result ? 'Correct' : 'Accepted answers'}</strong>
          <span>{result ? exercise.explanation : `${exercise.accepted.join(', ')}. ${exercise.explanation}`}</span>
        </div>
      ) : null}

      <button className="primary-action" disabled={!answer.trim() || result !== undefined} type="submit">
        Check answer
      </button>
    </form>
  );
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

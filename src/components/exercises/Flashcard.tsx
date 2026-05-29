import { useEffect, useState } from 'react';
import type { Exercise } from '../../data/curriculum';

type FlashcardExercise = Extract<Exercise, { kind: 'flashcard' }>;

type FlashcardProps = {
  exercise: FlashcardExercise;
  onAnswer: (correct: boolean) => void;
};

export function Flashcard({ exercise, onAnswer }: FlashcardProps) {
  const [revealed, setRevealed] = useState(false);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    setRevealed(false);
    setAnswered(false);
  }, [exercise.id]);

  function handleSelfGrade(correct: boolean) {
    setAnswered(true);
    onAnswer(correct);
  }

  return (
    <div className="exercise-body">
      <div className="flashcard-surface">
        <p className="eyebrow">Flashcard</p>
        <strong>{exercise.front}</strong>
        {revealed ? <span>{exercise.back}</span> : null}
      </div>

      {answered ? (
        <div className="answer-feedback is-correct" role="status">
          <strong>Logged</strong>
          <span>Your self-check has been added to this lesson.</span>
        </div>
      ) : null}

      {revealed ? (
        <div className="exercise-actions">
          <button disabled={answered} onClick={() => handleSelfGrade(false)} type="button">
            Review again
          </button>
          <button className="primary-action" disabled={answered} onClick={() => handleSelfGrade(true)} type="button">
            I remembered it
          </button>
        </div>
      ) : (
        <button className="primary-action" onClick={() => setRevealed(true)} type="button">
          Reveal answer
        </button>
      )}
    </div>
  );
}

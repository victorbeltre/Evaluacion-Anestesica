import { useEffect, useState } from 'react';
import type { Exercise } from '../../data/curriculum';

type MultipleChoiceExercise = Extract<Exercise, { kind: 'mcq' }>;

type MultipleChoiceProps = {
  exercise: MultipleChoiceExercise;
  onAnswer: (correct: boolean) => void;
};

export function MultipleChoice({ exercise, onAnswer }: MultipleChoiceProps) {
  const [selectedOption, setSelectedOption] = useState('');
  const [result, setResult] = useState<boolean | undefined>();

  useEffect(() => {
    setSelectedOption('');
    setResult(undefined);
  }, [exercise.id]);

  function handleSubmit() {
    const correct = selectedOption === exercise.answer;
    setResult(correct);
    onAnswer(correct);
  }

  return (
    <div className="exercise-body">
      <fieldset className="choice-list" disabled={result !== undefined}>
        <legend>{exercise.prompt}</legend>
        {exercise.options.map((option) => (
          <label className="choice-option" key={option}>
            <input
              checked={selectedOption === option}
              name={exercise.id}
              onChange={() => setSelectedOption(option)}
              type="radio"
              value={option}
            />
            <span>{option}</span>
          </label>
        ))}
      </fieldset>

      {result !== undefined ? (
        <div className={result ? 'answer-feedback is-correct' : 'answer-feedback is-incorrect'} role="status">
          <strong>{result ? 'Correct' : 'Review this'}</strong>
          <span>{exercise.explanation}</span>
        </div>
      ) : null}

      <button className="primary-action" disabled={!selectedOption || result !== undefined} onClick={handleSubmit} type="button">
        Check answer
      </button>
    </div>
  );
}

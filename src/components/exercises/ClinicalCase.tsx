import { useEffect, useState } from 'react';
import type { Exercise } from '../../data/curriculum';

type CaseExercise = Extract<Exercise, { kind: 'case' }>;

type ClinicalCaseProps = {
  exercise: CaseExercise;
  onAnswer: (correct: boolean) => void;
};

export function ClinicalCase({ exercise, onAnswer }: ClinicalCaseProps) {
  const [selectedOption, setSelectedOption] = useState('');
  const [result, setResult] = useState<CaseExercise['options'][number] | undefined>();

  useEffect(() => {
    setSelectedOption('');
    setResult(undefined);
  }, [exercise.id]);

  function handleSubmit() {
    const option = exercise.options.find((candidate) => candidate.label === selectedOption);

    if (!option) {
      return;
    }

    setResult(option);
    onAnswer(option.safe);
  }

  return (
    <div className="exercise-body">
      <div className="case-stem">
        <h3>{exercise.title}</h3>
        <p>{exercise.stem}</p>
      </div>

      <fieldset className="choice-list" disabled={result !== undefined}>
        <legend>{exercise.decisionPrompt}</legend>
        {exercise.options.map((option) => (
          <label className="choice-option" key={option.label}>
            <input
              checked={selectedOption === option.label}
              name={exercise.id}
              onChange={() => setSelectedOption(option.label)}
              type="radio"
              value={option.label}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>

      {result ? (
        <div className={result.safe ? 'answer-feedback is-correct' : 'answer-feedback is-incorrect'} role="status">
          <strong>{result.safe ? 'Safe choice' : 'Review this choice'}</strong>
          <span>{result.feedback}</span>
        </div>
      ) : null}

      <button className="primary-action" disabled={!selectedOption || result !== undefined} onClick={handleSubmit} type="button">
        Submit decision
      </button>
    </div>
  );
}

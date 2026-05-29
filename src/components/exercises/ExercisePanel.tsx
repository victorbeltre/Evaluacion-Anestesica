import { useEffect, useState } from 'react';
import type { Exercise, LessonNode } from '../../data/curriculum';
import { ClinicalCase } from './ClinicalCase';
import { Flashcard } from './Flashcard';
import { Matching } from './Matching';
import { MultipleChoice } from './MultipleChoice';
import { Ordering } from './Ordering';
import { Recall } from './Recall';

type ExercisePanelProps = {
  node: LessonNode;
  completed: boolean;
  mastery: number;
  onAnswer: (correct: boolean, exercise: Exercise) => void;
  onComplete: () => void;
  scoredExerciseIds: string[];
};

export function ExercisePanel({
  node,
  completed,
  mastery,
  onAnswer,
  onComplete,
  scoredExerciseIds,
}: ExercisePanelProps) {
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const exercise = node.exercises[exerciseIndex];
  const isLastExercise = exerciseIndex === node.exercises.length - 1;

  useEffect(() => {
    setExerciseIndex(0);
    setAnswered(false);
  }, [node.id]);

  function handleAnswer(correct: boolean) {
    if (answered || !exercise) {
      return;
    }

    setAnswered(true);
    if (scoredExerciseIds.includes(exercise.id)) {
      return;
    }

    onAnswer(correct, exercise);
  }

  function handleContinue() {
    if (!isLastExercise) {
      setExerciseIndex((current) => current + 1);
      setAnswered(false);
      return;
    }

    onComplete();
  }

  return (
    <section className="lesson-card" aria-labelledby="lesson-title">
      <div>
        <p className="eyebrow">{completed ? 'Completed lesson' : 'Interactive lesson'}</p>
        <h2 id="lesson-title">{node.title}</h2>
        <p>{node.summary}</p>
      </div>

      <dl className="lesson-meta">
        <div>
          <dt>Difficulty</dt>
          <dd>{node.difficulty}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>{node.estimatedMinutes} min</dd>
        </div>
        <div>
          <dt>Exercise</dt>
          <dd>
            {exerciseIndex + 1}/{node.exercises.length}
          </dd>
        </div>
        <div>
          <dt>Mastery</dt>
          <dd>{mastery}%</dd>
        </div>
      </dl>

      {exercise ? <ExerciseView exercise={exercise} onAnswer={handleAnswer} /> : null}

      <button className="primary-action" disabled={!answered} onClick={handleContinue} type="button">
        {isLastExercise ? (completed ? 'Finish review' : 'Complete lesson') : 'Next exercise'}
      </button>
    </section>
  );
}

function ExerciseView({ exercise, onAnswer }: { exercise: Exercise; onAnswer: (correct: boolean) => void }) {
  switch (exercise.kind) {
    case 'mcq':
      return <MultipleChoice exercise={exercise} onAnswer={onAnswer} />;
    case 'matching':
      return <Matching exercise={exercise} onAnswer={onAnswer} />;
    case 'ordering':
      return <Ordering exercise={exercise} onAnswer={onAnswer} />;
    case 'recall':
      return <Recall exercise={exercise} onAnswer={onAnswer} />;
    case 'flashcard':
      return <Flashcard exercise={exercise} onAnswer={onAnswer} />;
    case 'case':
      return <ClinicalCase exercise={exercise} onAnswer={onAnswer} />;
  }
}

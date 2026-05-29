import { Activity, CalendarDays, Flame, Heart, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import type { ReactNode } from 'react';
import type { LessonNode } from '../../data/curriculum';
import type { ProgressState } from '../../state/progress';

type PracticeRailProps = {
  progress: ProgressState;
  selectedNode?: LessonNode;
};

export function PracticeRail({ progress, selectedNode }: PracticeRailProps) {
  const reviewCount = progress.reviewQueue.length;
  const firstExercise = selectedNode?.exercises[0];
  const reviewStatus = reviewCount === 0 ? 'Clear' : `${reviewCount} waiting`;

  return (
    <aside className="practice-rail" id="practice" aria-label="Practice status">
      <section className="rail-panel progress-panel" aria-label="Progress summary">
        <div className="metric-grid">
          <Metric icon={<Trophy size={18} />} label="XP" value={progress.xp} />
          <Metric icon={<Flame size={18} />} label="Streak" value={`${progress.streak}d`} />
          <Metric icon={<Heart size={18} />} label="Hearts" value={`${progress.hearts}/4`} />
          <Metric icon={<RotateCcw size={18} />} label="Review" value={reviewStatus} />
        </div>
      </section>

      <section className="rail-panel" id="review">
        <div className="rail-panel-title">
          <Activity size={18} />
          <h2>Review queue</h2>
        </div>
        <p className="rail-copy">
          {reviewCount === 0
            ? 'No weak spots queued. Missed questions will collect here for spaced repair.'
            : 'Prioritize queued misses before advancing to new attending-level material.'}
        </p>
      </section>

      <section className="rail-panel">
        <div className="rail-panel-title">
          <Sparkles size={18} />
          <h2>Quick case</h2>
        </div>
        <p className="case-title">{selectedNode?.title ?? 'Select a lesson'}</p>
        <p className="rail-copy">
          {firstExercise?.kind === 'case'
            ? firstExercise.title
            : selectedNode?.summary ?? 'Choose an unlocked node to preview the next practice prompt.'}
        </p>
      </section>

      <section className="rail-panel weekly-panel">
        <div className="rail-panel-title">
          <CalendarDays size={18} />
          <h2>Weekly simulation</h2>
        </div>
        <p className="case-title">Saturday crisis run</p>
        <p className="rail-copy">A 15-minute mixed oral-board style sprint unlocks after two completed lessons.</p>
      </section>
    </aside>
  );
}

type MetricProps = {
  icon: ReactNode;
  label: string;
  value: string | number;
};

function Metric({ icon, label, value }: MetricProps) {
  return (
    <div className="metric-card">
      <span className="metric-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="metric-value">{value}</span>
      <span className="metric-label">{label}</span>
    </div>
  );
}

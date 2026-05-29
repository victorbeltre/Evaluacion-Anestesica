import { useEffect, useMemo, useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { PracticeRail } from './components/layout/PracticeRail';
import { LearningPath } from './components/path/LearningPath';
import { curriculum, type CurriculumDomain, type LessonNode } from './data/curriculum';
import { completeNode, loadProgress, saveProgress, type ProgressState } from './state/progress';

function firstUnlockedNode(domain: CurriculumDomain, completedNodeIds: string[]): LessonNode {
  return (
    domain.nodes.find((node) => !node.unlockedAfter || completedNodeIds.includes(node.unlockedAfter)) ??
    domain.nodes[0]
  );
}

function findNode(domain: CurriculumDomain, nodeId: string): LessonNode | undefined {
  return domain.nodes.find((node) => node.id === nodeId);
}

export default function App() {
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress());
  const [selectedDomainId, setSelectedDomainId] = useState(() => curriculum[0].id);
  const selectedDomain = useMemo(
    () => curriculum.find((domain) => domain.id === selectedDomainId) ?? curriculum[0],
    [selectedDomainId],
  );
  const [selectedNodeId, setSelectedNodeId] = useState(() =>
    firstUnlockedNode(curriculum[0], progress.completedNodeIds).id,
  );

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    const selectedNode = findNode(selectedDomain, selectedNodeId);
    const selectedLocked = selectedNode?.unlockedAfter && !progress.completedNodeIds.includes(selectedNode.unlockedAfter);

    if (!selectedNode || selectedLocked) {
      setSelectedNodeId(firstUnlockedNode(selectedDomain, progress.completedNodeIds).id);
    }
  }, [progress.completedNodeIds, selectedDomain, selectedNodeId]);

  const selectedNode = findNode(selectedDomain, selectedNodeId) ?? firstUnlockedNode(selectedDomain, progress.completedNodeIds);
  const isSelectedComplete = progress.completedNodeIds.includes(selectedNode.id);
  const selectedMastery = Math.round(progress.masteryByNode[selectedNode.id] ?? 0);

  function handleSelectDomain(domainId: string) {
    const nextDomain = curriculum.find((domain) => domain.id === domainId);

    if (!nextDomain) {
      return;
    }

    setSelectedDomainId(domainId);
    setSelectedNodeId(firstUnlockedNode(nextDomain, progress.completedNodeIds).id);
  }

  function handleSelectNode(nodeId: string) {
    const node = findNode(selectedDomain, nodeId);
    const locked = node?.unlockedAfter && !progress.completedNodeIds.includes(node.unlockedAfter);

    if (!node || locked) {
      return;
    }

    setSelectedNodeId(nodeId);
  }

  function handleCompleteSelectedNode() {
    setProgress((current) => completeNode(current, selectedNode.id));
  }

  return (
    <AppShell
      domains={curriculum}
      onSelectDomain={handleSelectDomain}
      practiceRail={<PracticeRail progress={progress} selectedNode={selectedNode} />}
      selectedDomainId={selectedDomain.id}
    >
      <LearningPath
        completedNodeIds={progress.completedNodeIds}
        domain={selectedDomain}
        masteryByNode={progress.masteryByNode}
        onSelectNode={handleSelectNode}
        selectedNodeId={selectedNode.id}
      />

      <section className="lesson-card" aria-labelledby="lesson-title">
        <div>
          <p className="eyebrow">Placeholder lesson</p>
          <h2 id="lesson-title">{selectedNode.title}</h2>
          <p>{selectedNode.summary}</p>
        </div>

        <dl className="lesson-meta">
          <div>
            <dt>Difficulty</dt>
            <dd>{selectedNode.difficulty}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>{selectedNode.estimatedMinutes} min</dd>
          </div>
          <div>
            <dt>Exercises</dt>
            <dd>{selectedNode.exercises.length}</dd>
          </div>
          <div>
            <dt>Mastery</dt>
            <dd>{selectedMastery}%</dd>
          </div>
        </dl>

        <div className="lesson-placeholder">
          <strong>Exercise components are coming next.</strong>
          <span>
            For now, use this card to preview the lesson focus and mark completion while the path and progress
            systems are wired.
          </span>
        </div>

        <button
          className="primary-action"
          disabled={isSelectedComplete}
          onClick={handleCompleteSelectedNode}
          type="button"
        >
          {isSelectedComplete ? 'Completed' : 'Mark lesson complete'}
        </button>
      </section>
    </AppShell>
  );
}

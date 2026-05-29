import { useEffect, useMemo, useState } from 'react';
import { ExercisePanel } from './components/exercises/ExercisePanel';
import { AppShell } from './components/layout/AppShell';
import { PracticeRail } from './components/layout/PracticeRail';
import { LearningPath } from './components/path/LearningPath';
import { curriculum, type CurriculumDomain, type Exercise, type LessonNode } from './data/curriculum';
import {
  applyAnswerResult,
  clampMasteryForDisplay,
  completeNode,
  loadProgress,
  saveProgress,
  type ProgressState,
} from './state/progress';

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
  const selectedMastery = clampMasteryForDisplay(progress.masteryByNode[selectedNode.id]);

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

  function handleAnswerSelectedNode(correct: boolean, exercise: Exercise) {
    setProgress((current) =>
      applyAnswerResult(current, {
        correct,
        exerciseId: exercise.id,
        nodeId: selectedNode.id,
      }),
    );
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

      <ExercisePanel
        completed={isSelectedComplete}
        mastery={selectedMastery}
        node={selectedNode}
        onAnswer={handleAnswerSelectedNode}
        onComplete={handleCompleteSelectedNode}
        scoredExerciseIds={progress.scoredExerciseIds}
      />
    </AppShell>
  );
}

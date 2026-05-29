import { Check, Lock, Play } from 'lucide-react';
import type { CurriculumDomain, LessonNode } from '../../data/curriculum';

type LearningPathProps = {
  domain: CurriculumDomain;
  selectedNodeId: string;
  completedNodeIds: string[];
  masteryByNode: Record<string, number>;
  onSelectNode: (nodeId: string) => void;
};

export function LearningPath({
  domain,
  selectedNodeId,
  completedNodeIds,
  masteryByNode,
  onSelectNode,
}: LearningPathProps) {
  return (
    <section className="learning-path" aria-labelledby="path-title">
      <div className="path-header">
        <div>
          <p className="eyebrow">Selected domain</p>
          <h1 id="path-title">{domain.title}</h1>
          <p>{domain.description}</p>
        </div>
        <span className="path-count">{domain.nodes.length} nodes</span>
      </div>

      <div className="node-lane">
        {domain.nodes.map((node, index) => {
          const locked = isLocked(node, completedNodeIds);
          const completed = completedNodeIds.includes(node.id);
          const selected = node.id === selectedNodeId;
          const mastery = Math.round(masteryByNode[node.id] ?? 0);

          return (
            <button
              aria-current={selected ? 'step' : undefined}
              className={[
                'path-node',
                selected ? 'is-selected' : '',
                completed ? 'is-completed' : '',
                locked ? 'is-locked' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={locked}
              key={node.id}
              onClick={() => onSelectNode(node.id)}
              type="button"
            >
              <span className="node-index">{index + 1}</span>
              <span className="node-status" aria-hidden="true">
                {locked ? <Lock size={16} /> : completed ? <Check size={16} /> : <Play size={16} />}
              </span>
              <span className="node-body">
                <span className="node-kicker">
                  {node.difficulty} | {node.estimatedMinutes} min
                </span>
                <strong>{node.title}</strong>
                <span>{node.summary}</span>
                <span className="mastery-track" aria-hidden="true">
                  <span style={{ width: `${mastery}%` }} />
                </span>
                <span className="mastery-label">{mastery}% mastery</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function isLocked(node: LessonNode, completedNodeIds: string[]) {
  return Boolean(node.unlockedAfter && !completedNodeIds.includes(node.unlockedAfter));
}

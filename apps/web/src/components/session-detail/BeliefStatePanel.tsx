import { Brain, Key, User, Link, Database, File } from 'lucide-react';
import { ExplorationPath } from './ExplorationPath';
import { ConfidenceGauge } from './ConfidenceGauge';
import { cn } from '@/lib/utils';
import type { AgentSession, Asset, BeliefState } from '@ghostnet/shared';

interface BeliefStatePanelProps {
  session: AgentSession;
  beliefState: BeliefState | null;
  className?: string;
}

const ASSET_ICONS: Record<Asset['type'], typeof Key> = {
  credential: Key,
  user: User,
  endpoint: Link,
  bucket: Database,
  file: File,
};

function ConfidenceBar({ value, className }: { value: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  const color =
    clamped >= 80 ? 'bg-threat-critical' :
    clamped >= 60 ? 'bg-threat-high' :
    clamped >= 40 ? 'bg-threat-medium' :
    'bg-cyan';

  return (
    <div className={cn('h-1.5 w-full rounded-full bg-border', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', color)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function BeliefStatePanel({
  session,
  beliefState,
  className,
}: BeliefStatePanelProps) {
  const goal = beliefState?.inferredGoal?.goal ?? session.inferredGoal;
  const goalConfidence = beliefState?.inferredGoal?.confidence ?? session.goalConfidence;
  const explorationPath = beliefState?.explorationPath ?? session.explorationPath;
  const assets = beliefState?.discoveredAssets ?? session.believedAssets ?? [];
  const confidence = beliefState?.confidenceScore ?? session.goalConfidence;

  return (
    <div className={cn('space-y-5', className)}>
      <div className="flex items-center gap-2">
        <Brain size={18} className="text-cyan" />
        <h2 className="font-heading text-xs font-semibold uppercase tracking-wider text-text-secondary">
          What the Agent Believes
        </h2>
      </div>

      {/* Inferred Goal */}
      <div className="rounded-card border border-border bg-elevated p-3">
        <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
          Inferred Goal
        </span>
        {goal ? (
          <>
            <p className="mt-1.5 text-sm font-medium text-text-primary">
              {goal}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <ConfidenceBar value={goalConfidence * 100} />
              <span className="shrink-0 font-mono text-[10px] text-text-secondary">
                {Math.round(goalConfidence * 100)}%
              </span>
            </div>
          </>
        ) : (
          <p className="mt-1.5 text-xs text-text-muted italic">
            Not yet inferred
          </p>
        )}
      </div>

      {/* Exploration Path */}
      <div>
        <span className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-text-muted">
          Exploration Path
        </span>
        <ExplorationPath path={explorationPath} />
      </div>

      {/* Discovered Assets */}
      <div>
        <span className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-text-muted">
          Discovered Assets
        </span>
        {assets.length === 0 ? (
          <p className="text-xs text-text-muted italic">No assets discovered</p>
        ) : (
          <div className="space-y-1.5">
            {assets.map((asset, i) => {
              const Icon = ASSET_ICONS[asset.type] ?? File;
              return (
                <div
                  key={`${asset.type}-${asset.value}-${i}`}
                  className="flex items-center gap-2 rounded-input bg-elevated px-2.5 py-1.5"
                >
                  <Icon size={14} className="shrink-0 text-text-secondary" />
                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-text-primary">
                    {asset.value}
                  </span>
                  <span className="shrink-0 rounded-badge bg-border px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-text-muted">
                    {asset.type}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confidence Score */}
      <div className="flex flex-col items-center rounded-card border border-border bg-elevated p-4">
        <span className="mb-3 text-[10px] font-medium uppercase tracking-wider text-text-muted">
          Confidence Score
        </span>
        <ConfidenceGauge value={Math.round(confidence * 100)} size={90} />
      </div>
    </div>
  );
}

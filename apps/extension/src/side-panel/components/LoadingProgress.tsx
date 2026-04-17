import type { PipelineStageKey, PipelineStageStatus } from '../store/card-store.js';

const STAGES: { key: PipelineStageKey; label: string }[] = [
  { key: 'pageSense', label: 'PageSense' },
  { key: 'distiller', label: 'Distiller' },
  { key: 'cardwright', label: 'Cardwright' },
];

function iconFor(status: PipelineStageStatus): string {
  switch (status) {
    case 'running':
      return '⏳';
    case 'done':
      return '✓';
    case 'failed':
      return '✗';
    default:
      return '·';
  }
}

function rowClass(status: PipelineStageStatus): string {
  switch (status) {
    case 'running':
      return 'text-seed dark:text-emerald-400';
    case 'done':
      return 'text-emerald-700 dark:text-emerald-300';
    case 'failed':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-stone-400 dark:text-stone-500';
  }
}

type LoadingProgressProps = {
  visible: boolean;
  pipeline: Record<PipelineStageKey, PipelineStageStatus>;
};

export function LoadingProgress({ visible, pipeline }: LoadingProgressProps) {
  if (!visible) return null;
  return (
    <section
      className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-xs dark:border-stone-700 dark:bg-stone-900/60"
      aria-live="polite"
    >
      <div className="mb-2 font-medium text-stone-700 dark:text-stone-200">流水线</div>
      <ul className="space-y-1">
        {STAGES.map(({ key, label }) => {
          const status = pipeline[key];
          return (
            <li key={key} className={`flex items-center justify-between gap-2 ${rowClass(status)}`}>
              <span className="font-mono text-[11px]">{label}</span>
              <span className="tabular-nums" title={status}>
                {iconFor(status)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

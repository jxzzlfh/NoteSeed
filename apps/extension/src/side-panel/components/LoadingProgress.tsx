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
      return 'text-seed';
    case 'done':
      return 'text-emerald-600';
    case 'failed':
      return 'text-red-500';
    default:
      return 'text-stone-300';
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
      className="rounded-xl border border-stone-200 bg-white p-3.5 shadow-sm"
      aria-live="polite"
    >
      <div className="mb-2 text-xs font-semibold text-stone-500">流水线</div>
      <ul className="space-y-1">
        {STAGES.map(({ key, label }) => {
          const status = pipeline[key];
          return (
            <li key={key} className={`flex items-center justify-between gap-2 text-xs ${rowClass(status)}`}>
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

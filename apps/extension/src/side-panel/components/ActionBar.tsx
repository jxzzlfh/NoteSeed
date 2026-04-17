import { TEMPLATE_OPTIONS } from '../labels.js';

type ActionBarProps = {
  templateId: string;
  onTemplateChange: (id: string) => void;
  onGenerate: () => void;
  onReRecognize: () => void;
  disabled?: boolean;
  generating?: boolean;
  captureReady?: boolean;
};

export function ActionBar({
  templateId,
  onTemplateChange,
  onGenerate,
  onReRecognize,
  disabled,
  generating,
  captureReady,
}: ActionBarProps) {
  const busy = Boolean(generating || disabled);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex flex-1 min-w-[8rem] items-center justify-center gap-1 rounded-md bg-seed px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-seed/90 disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-none"
          onClick={onGenerate}
          disabled={busy || !captureReady}
        >
          {generating ? '生成中…' : '⚡ 一键制卡'}
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-1 rounded-md border border-soil/40 bg-white px-3 py-2 text-sm font-medium text-soil transition hover:bg-soil/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-600 dark:bg-stone-900 dark:text-amber-200 dark:hover:bg-stone-800"
          onClick={onReRecognize}
          disabled={busy}
        >
          ↻ 重新识别
        </button>
      </div>
      <label className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-300">
        <span className="shrink-0">模板</span>
        <select
          className="min-w-0 flex-1 rounded-md border border-stone-200 bg-white px-2 py-1.5 text-sm text-stone-900 shadow-sm focus:border-seed focus:outline-none focus:ring-1 focus:ring-seed dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
          value={templateId}
          onChange={(e) => onTemplateChange(e.target.value)}
          disabled={busy}
        >
          {TEMPLATE_OPTIONS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

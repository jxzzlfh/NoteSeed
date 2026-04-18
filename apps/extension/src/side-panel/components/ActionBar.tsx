import { TEMPLATE_OPTIONS } from '../labels.js';

type ActionBarProps = {
  templateId: string;
  onTemplateChange: (id: string) => void;
  customPrompt: string;
  onCustomPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  onReRecognize: () => void;
  disabled?: boolean;
  generating?: boolean;
  captureReady?: boolean;
};

export function ActionBar({
  templateId,
  onTemplateChange,
  customPrompt,
  onCustomPromptChange,
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
          className="inline-flex min-w-[8rem] flex-1 items-center justify-center gap-1.5 rounded-lg bg-seed px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-seed/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onGenerate}
          disabled={busy || !captureReady}
        >
          {generating ? '生成中…' : '⚡ 一键制卡'}
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-600 shadow-sm transition hover:bg-stone-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onReRecognize}
          disabled={busy}
        >
          ↻ 重新识别
        </button>
      </div>
      <label className="flex items-center gap-2 text-xs text-stone-500">
        <span className="shrink-0 font-medium">模板</span>
        <select
          className="min-w-0 flex-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-sm text-stone-700 shadow-sm focus:border-seed focus:outline-none focus:ring-2 focus:ring-seed/20"
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
      {templateId === 'custom' && (
        <textarea
          className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-2 text-sm text-stone-700 shadow-sm placeholder:text-stone-400 focus:border-seed focus:outline-none focus:ring-2 focus:ring-seed/20"
          rows={3}
          maxLength={500}
          placeholder="输入自定义提示词，例如：提取关键财务数据和投资建议…"
          value={customPrompt}
          onChange={(e) => onCustomPromptChange(e.target.value)}
          disabled={busy}
        />
      )}
    </div>
  );
}

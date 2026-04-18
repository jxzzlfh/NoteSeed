import type { KnowledgeCard } from '@noteseed/shared-types';

type ExportBarProps = {
  markdown: string;
  card: KnowledgeCard | null;
  onSave: () => void;
  saving?: boolean;
  disabled?: boolean;
};

function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportBar({ markdown, card, onSave, saving, disabled }: ExportBarProps) {
  const baseName =
    (card?.source.title || 'noteseed-card').replace(/[<>:"/\\|?*]+/g, '_').slice(0, 80) || 'noteseed-card';

  return (
    <div className="flex flex-wrap gap-2 pb-1">
      <button
        type="button"
        className="inline-flex min-w-[4.5rem] flex-1 items-center justify-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-2 text-xs font-medium text-stone-600 shadow-sm transition hover:bg-stone-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(markdown);
          } catch {
            /* ignore */
          }
        }}
        disabled={disabled || !markdown}
      >
        📋 复制
      </button>
      <button
        type="button"
        className="inline-flex min-w-[4.5rem] flex-1 items-center justify-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-2 text-xs font-medium text-stone-600 shadow-sm transition hover:bg-stone-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => downloadMarkdown(`${baseName}.md`, markdown)}
        disabled={disabled || !markdown}
      >
        ⬇ 下载
      </button>
      <button
        type="button"
        className="inline-flex min-w-[6rem] flex-[2] items-center justify-center gap-1 rounded-lg bg-seed px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-seed/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        onClick={onSave}
        disabled={disabled || saving || !card}
      >
        {saving ? '保存中…' : '✦ 保存'}
      </button>
    </div>
  );
}

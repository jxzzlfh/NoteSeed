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
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="inline-flex flex-1 min-w-[5rem] items-center justify-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-2 text-xs font-medium text-stone-800 shadow-sm transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
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
        className="inline-flex flex-1 min-w-[5rem] items-center justify-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-2 text-xs font-medium text-stone-800 shadow-sm transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
        onClick={() => downloadMarkdown(`${baseName}.md`, markdown)}
        disabled={disabled || !markdown}
      >
        ⬇ 下载
      </button>
      <button
        type="button"
        className="inline-flex flex-[2] min-w-[6rem] items-center justify-center gap-1 rounded-md bg-seed px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-seed/90 disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-none"
        onClick={onSave}
        disabled={disabled || saving || !card}
      >
        {saving ? '保存中…' : '🚀 保存'}
      </button>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { KnowledgeCard } from '@noteseed/shared-types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type CardPreviewProps = {
  card: KnowledgeCard;
  markdown: string;
  onMarkdownChange: (md: string) => void;
  onTitleChange: (title: string) => void;
  onTagsChange: (tags: string[]) => void;
};

export function CardPreview({ card, markdown, onMarkdownChange, onTitleChange, onTagsChange }: CardPreviewProps) {
  const [mode, setMode] = useState<'preview' | 'source'>('preview');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(card.source.title);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    setTitleDraft(card.source.title);
  }, [card.source.title]);

  const tags = card.analysis.tags;

  const commitTitle = useCallback(() => {
    const next = titleDraft.trim() || card.source.title;
    onTitleChange(next);
    setEditingTitle(false);
  }, [card.source.title, onTitleChange, titleDraft]);

  const addTag = useCallback(
    (raw: string) => {
      const t = raw.trim();
      if (!t || tags.includes(t)) return;
      onTagsChange([...tags, t]);
      setTagInput('');
    },
    [onTagsChange, tags]
  );

  const removeTag = useCallback(
    (t: string) => {
      onTagsChange(tags.filter((x) => x !== t));
    },
    [onTagsChange, tags]
  );

  const markdownBody = useMemo(() => {
    const lines = markdown.split('\n');
    if (lines[0]?.trim().startsWith('# ')) {
      return lines.slice(1).join('\n').replace(/^\n+/, '');
    }
    return markdown;
  }, [markdown]);

  return (
    <section className="flex min-h-0 flex-col gap-2 rounded-lg border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900/80">
      <div className="flex items-start justify-between gap-2 border-b border-stone-100 px-3 py-2 dark:border-stone-800">
        {editingTitle ? (
          <input
            className="w-full rounded border border-seed/50 bg-white px-2 py-1 text-sm font-semibold text-stone-900 focus:outline-none focus:ring-1 focus:ring-seed dark:border-emerald-700 dark:bg-stone-950 dark:text-stone-100"
            value={titleDraft}
            autoFocus
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitTitle();
              }
              if (e.key === 'Escape') {
                setTitleDraft(card.source.title);
                setEditingTitle(false);
              }
            }}
          />
        ) : (
          <h2
            className="line-clamp-2 cursor-text select-text text-sm font-semibold text-stone-900 dark:text-stone-100"
            title="双击编辑标题"
            onDoubleClick={() => setEditingTitle(true)}
          >
            {card.source.title || '（无标题）'}
          </h2>
        )}
        <div className="flex shrink-0 gap-1 rounded-md bg-stone-100 p-0.5 dark:bg-stone-800">
          <button
            type="button"
            className={`rounded px-2 py-1 text-[11px] font-medium ${
              mode === 'preview'
                ? 'bg-white text-seed shadow-sm dark:bg-stone-900 dark:text-emerald-400'
                : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
            onClick={() => setMode('preview')}
          >
            预览
          </button>
          <button
            type="button"
            className={`rounded px-2 py-1 text-[11px] font-medium ${
              mode === 'source'
                ? 'bg-white text-seed shadow-sm dark:bg-stone-900 dark:text-emerald-400'
                : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
            onClick={() => setMode('source')}
          >
            源码
          </button>
        </div>
      </div>

      <div className="px-3 pb-2">
        <div className="mb-1 text-[11px] font-medium text-stone-500 dark:text-stone-400">标签</div>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full bg-seed/10 px-2 py-0.5 text-[11px] text-seed dark:bg-emerald-900/40 dark:text-emerald-300"
            >
              {t}
              <button
                type="button"
                className="rounded hover:bg-seed/20 dark:hover:bg-emerald-800/40"
                aria-label={`移除标签 ${t}`}
                onClick={() => removeTag(t)}
              >
                ×
              </button>
            </span>
          ))}
          <input
            className="min-w-[6rem] flex-1 rounded border border-dashed border-stone-200 bg-transparent px-2 py-0.5 text-[11px] text-stone-800 focus:border-seed focus:outline-none dark:border-stone-600 dark:text-stone-200"
            placeholder="添加标签…"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addTag(tagInput);
              }
            }}
            onBlur={() => {
              if (tagInput.trim()) addTag(tagInput);
            }}
          />
        </div>
      </div>

      <div className="min-h-[12rem] max-h-[40vh] overflow-auto border-t border-stone-100 px-3 py-2 dark:border-stone-800">
        {mode === 'preview' ? (
          <article
            className="markdown-preview text-sm leading-relaxed text-stone-800 dark:text-stone-200 [&_a]:text-seed [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-stone-300 [&_blockquote]:pl-3 [&_blockquote]:text-stone-600 dark:[&_blockquote]:border-stone-600 dark:[&_blockquote]:text-stone-400 [&_code]:rounded [&_code]:bg-stone-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[11px] dark:[&_code]:bg-stone-800 [&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-sm [&_h2]:font-semibold [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-stone-100 [&_pre]:p-2 dark:[&_pre]:bg-stone-950 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-stone-200 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-stone-200 [&_th]:px-2 [&_th]:py-1 dark:[&_td]:border-stone-700 dark:[&_th]:border-stone-700 [&_ul]:list-disc [&_ul]:pl-5"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownBody || '_（空内容）_'}</ReactMarkdown>
          </article>
        ) : (
          <textarea
            className="h-full min-h-[12rem] w-full resize-y rounded-md border border-stone-200 bg-stone-50 p-2 font-mono text-[11px] leading-relaxed text-stone-900 focus:border-seed focus:outline-none focus:ring-1 focus:ring-seed dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100"
            value={markdown}
            spellCheck={false}
            onChange={(e) => onMarkdownChange(e.target.value)}
          />
        )}
      </div>
    </section>
  );
}

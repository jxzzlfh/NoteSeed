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
    const first = lines[0]?.trim() ?? '';
    if (first.startsWith('## ') || first.startsWith('# ')) {
      return lines.slice(1).join('\n').replace(/^\n+/, '');
    }
    return markdown;
  }, [markdown]);

  return (
    <section className="flex min-h-0 flex-col rounded-xl border border-stone-200 bg-white shadow-sm">
      {/* Title bar */}
      <div className="flex items-start justify-between gap-2 border-b border-stone-100 px-3.5 py-2.5">
        {editingTitle ? (
          <input
            className="w-full rounded-md border border-seed/40 bg-seed/5 px-2 py-1 text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-seed/30"
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
            className="line-clamp-2 cursor-text select-text text-sm font-bold leading-snug text-stone-800"
            title="双击编辑标题"
            onDoubleClick={() => setEditingTitle(true)}
          >
            {card.source.title || '（无标题）'}
          </h2>
        )}
        <div className="flex shrink-0 gap-0.5 rounded-lg bg-stone-100 p-0.5">
          <button
            type="button"
            className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
              mode === 'preview'
                ? 'bg-white text-seed shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
            onClick={() => setMode('preview')}
          >
            预览
          </button>
          <button
            type="button"
            className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
              mode === 'source'
                ? 'bg-white text-seed shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
            onClick={() => setMode('source')}
          >
            源码
          </button>
        </div>
      </div>

      {/* Tags */}
      <div className="border-b border-stone-100 px-3.5 py-2">
        <div className="mb-1.5 text-[11px] font-medium text-stone-400">标签</div>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full bg-seed/8 px-2.5 py-0.5 text-[11px] font-medium text-seed"
            >
              {t}
              <button
                type="button"
                className="ml-0.5 rounded-full text-seed/50 transition hover:text-seed"
                aria-label={`移除标签 ${t}`}
                onClick={() => removeTag(t)}
              >
                ×
              </button>
            </span>
          ))}
          <input
            className="min-w-[6rem] flex-1 rounded-md border border-dashed border-stone-200 bg-transparent px-2 py-0.5 text-[11px] text-stone-600 placeholder:text-stone-300 focus:border-seed focus:outline-none"
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

      {/* Content */}
      <div className="min-h-[12rem] max-h-[40vh] overflow-auto px-3.5 py-3">
        {mode === 'preview' ? (
          <article className="prose prose-sm prose-stone max-w-none text-sm leading-relaxed text-stone-700 [&_a]:text-seed [&_a]:no-underline [&_a]:hover:underline [&_blockquote]:border-l-[3px] [&_blockquote]:border-seed/30 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-stone-500 [&_code]:rounded [&_code]:bg-stone-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[11px] [&_code]:text-seed [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-[13px] [&_h2]:font-bold [&_h2]:text-stone-800 [&_h3]:mb-1.5 [&_h3]:mt-3 [&_h3]:text-[13px] [&_h3]:font-semibold [&_h3]:text-stone-700 [&_hr]:my-3 [&_hr]:border-stone-200 [&_li]:my-0.5 [&_li]:text-stone-600 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1.5 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-stone-50 [&_pre]:p-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-stone-200 [&_td]:px-2 [&_td]:py-1 [&_td]:text-stone-600 [&_th]:border [&_th]:border-stone-200 [&_th]:bg-stone-50 [&_th]:px-2 [&_th]:py-1 [&_th]:font-semibold [&_ul]:list-disc [&_ul]:pl-5">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownBody || '_（空内容）_'}</ReactMarkdown>
          </article>
        ) : (
          <textarea
            className="h-full min-h-[12rem] w-full resize-y rounded-lg border border-stone-200 bg-stone-50 p-3 font-mono text-[11px] leading-relaxed text-stone-700 focus:border-seed focus:outline-none focus:ring-2 focus:ring-seed/20"
            value={markdown}
            spellCheck={false}
            onChange={(e) => onMarkdownChange(e.target.value)}
          />
        )}
      </div>
    </section>
  );
}

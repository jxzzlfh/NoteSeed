import type { PageSource } from '@noteseed/shared-types';

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

type PageInfoPanelProps = {
  pageSource: PageSource | null;
  loading?: boolean;
};

export function PageInfoPanel({ pageSource, loading }: PageInfoPanelProps) {
  if (loading) {
    return (
      <section className="rounded-xl border border-stone-200 bg-white p-3.5 shadow-sm">
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-3/4 rounded bg-stone-100" />
          <div className="h-3 w-1/2 rounded bg-stone-100" />
          <div className="h-3 w-2/3 rounded bg-stone-100" />
        </div>
      </section>
    );
  }

  if (!pageSource) {
    return (
      <section className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-3.5 text-sm text-stone-400">
        未获取页面信息。请刷新页面或重新打开侧栏后再试。
      </section>
    );
  }

  const { title, url, metadata } = pageSource;

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-3.5 shadow-sm">
      <h2 className="line-clamp-2 text-sm font-bold leading-snug text-stone-800" title={title}>
        {title || '（无标题）'}
      </h2>
      <dl className="mt-2 space-y-1 text-xs text-stone-500">
        <div className="flex gap-2">
          <dt className="w-8 shrink-0 text-stone-400">来源</dt>
          <dd className="min-w-0 truncate font-mono text-[11px]" title={url}>
            {domainFromUrl(url)}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-8 shrink-0 text-stone-400">作者</dt>
          <dd className="min-w-0 truncate">{metadata.author ?? '—'}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-8 shrink-0 text-stone-400">日期</dt>
          <dd className="min-w-0 truncate">{formatDate(metadata.publishedAt)}</dd>
        </div>
      </dl>
    </section>
  );
}

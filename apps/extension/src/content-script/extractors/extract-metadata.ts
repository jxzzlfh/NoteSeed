import type { PageSourceMetadata } from '@noteseed/shared-types';

type PartialMeta = Partial<PageSourceMetadata>;

function getMetaContent(doc: Document, attr: 'name' | 'property' | 'http-equiv', key: string): string | undefined {
  const el = doc.querySelector(`meta[${attr}="${CSS.escape(key)}"]`);
  const content = el?.getAttribute('content')?.trim();
  return content && content.length > 0 ? content : undefined;
}

function siteNameFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function normalizeIsoDate(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function pickString(v: unknown): string | undefined {
  if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  return undefined;
}

function extractAuthorFromLd(value: unknown): string | undefined {
  if (typeof value === 'string') return value.trim() || undefined;
  if (!value || typeof value !== 'object') return undefined;
  const o = value as Record<string, unknown>;
  if (typeof o.name === 'string') return o.name.trim() || undefined;
  return undefined;
}

function walkJsonLd(node: unknown, acc: PartialMeta): void {
  if (node === null || node === undefined) return;
  if (Array.isArray(node)) {
    for (const item of node) walkJsonLd(item, acc);
    return;
  }
  if (typeof node !== 'object') return;

  const o = node as Record<string, unknown>;

  if (o['@graph']) {
    walkJsonLd(o['@graph'], acc);
  }

  const typeVal = o['@type'];
  const types: string[] = Array.isArray(typeVal)
    ? typeVal.filter((t): t is string => typeof t === 'string')
    : typeof typeVal === 'string'
      ? [typeVal]
      : [];

  const isRelevant = types.some((t) =>
    /Article|NewsArticle|BlogPosting|TechArticle|WebPage|Blog|CreativeWork/i.test(t)
  );

  if (isRelevant || Object.keys(o).some((k) => /author|datePublished|publisher|headline/i.test(k))) {
    if (!acc.author) {
      const author = o.author ?? o.creator;
      if (Array.isArray(author)) {
        const names = author.map(extractAuthorFromLd).filter(Boolean) as string[];
        if (names.length > 0) acc.author = names.join(', ');
      } else {
        const a = extractAuthorFromLd(author);
        if (a) acc.author = a;
      }
    }

    const pub =
      pickString(o.datePublished as string | undefined) ??
      pickString(o.dateCreated as string | undefined) ??
      pickString(o.uploadDate as string | undefined);
    if (!acc.publishedAt && pub) {
      acc.publishedAt = normalizeIsoDate(pub);
    }

    if (!acc.siteName && o.publisher && typeof o.publisher === 'object') {
      const p = o.publisher as Record<string, unknown>;
      const name = pickString(p.name as string | undefined);
      if (name) acc.siteName = name;
    }

  }

  for (const v of Object.values(o)) {
    if (v && typeof v === 'object') walkJsonLd(v, acc);
  }
}

function parseJsonLdScripts(doc: Document, acc: PartialMeta): void {
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const s of scripts) {
    const text = s.textContent?.trim();
    if (!text) continue;
    try {
      const data = JSON.parse(text) as unknown;
      walkJsonLd(data, acc);
    } catch {
      /* ignore invalid JSON-LD */
    }
  }
}

/**
 * Pull author, dates, site name, and language from Open Graph, meta tags, and JSON-LD.
 */
export function extractPageMetadata(doc: Document, pageUrl: string): PageSourceMetadata {
  const acc: PartialMeta = {};

  acc.siteName =
    getMetaContent(doc, 'property', 'og:site_name') ??
    getMetaContent(doc, 'name', 'application-name');

  acc.author =
    getMetaContent(doc, 'property', 'article:author') ??
    getMetaContent(doc, 'property', 'og:author') ??
    getMetaContent(doc, 'name', 'author') ??
    getMetaContent(doc, 'name', 'twitter:creator');

  acc.publishedAt =
    normalizeIsoDate(
      getMetaContent(doc, 'property', 'article:published_time') ??
        getMetaContent(doc, 'property', 'og:published_time') ??
        getMetaContent(doc, 'name', 'article:published_time') ??
        getMetaContent(doc, 'name', 'date') ??
        getMetaContent(doc, 'name', 'pubdate')
    );

  const httpEquivLang = doc
    .querySelector('meta[http-equiv="content-language"]')
    ?.getAttribute('content')
    ?.trim();

  acc.language =
    getMetaContent(doc, 'property', 'og:locale')?.replace(/_/g, '-') ??
    doc.documentElement.lang?.trim() ??
    (httpEquivLang && httpEquivLang.length > 0 ? httpEquivLang : undefined);

  parseJsonLdScripts(doc, acc);

  const siteName = acc.siteName && acc.siteName.length > 0 ? acc.siteName : siteNameFromUrl(pageUrl);

  return {
    siteName: siteName.length > 0 ? siteName : siteNameFromUrl(pageUrl) || 'unknown',
    author: acc.author,
    publishedAt: acc.publishedAt,
    language: acc.language,
  };
}

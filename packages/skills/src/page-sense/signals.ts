import type { PageType } from '@noteseed/shared-types';

export type SignalSource = 'domain' | 'dom' | 'keywords';

/** Heuristic signal from URL structure, DOM shape, or vocabulary. */
export interface Signal {
  source: SignalSource;
  pageType: PageType;
  /** Relative strength in \([0, 1]\). */
  weight: number;
}

function clampWeight(n: number): number {
  return Math.min(1, Math.max(0, n));
}

type DomainRule = {
  test: (host: string, pathname: string) => boolean;
  pageType: PageType;
  weight: number;
};

const DOMAIN_RULES: DomainRule[] = [
  {
    test: (h) =>
      h === 'github.com' ||
      h.endsWith('.github.com') ||
      h === 'gitlab.com' ||
      h === 'bitbucket.org' ||
      h === 'gitee.com',
    pageType: 'doc',
    weight: 0.75,
  },
  {
    test: (h) => h === 'gist.github.com',
    pageType: 'doc',
    weight: 0.7,
  },
  {
    test: (h, p) =>
      (h.includes('stackoverflow.com') || h.endsWith('stackexchange.com')) &&
      (p.includes('/questions/') || p.includes('/q/')),
    pageType: 'discussion',
    weight: 0.85,
  },
  {
    test: (h, p) => h.includes('zhihu.com') && p.includes('/question/'),
    pageType: 'discussion',
    weight: 0.85,
  },
  {
    test: (h) =>
      h === 'medium.com' ||
      h.endsWith('.medium.com') ||
      h.includes('substack.com') ||
      h.includes('ghost.io'),
    pageType: 'opinion',
    weight: 0.65,
  },
  {
    test: (h) =>
      h === 'developer.mozilla.org' ||
      h.includes('readthedocs.io') ||
      h.includes('readthedocs.org') ||
      h === 'docs.rs' ||
      h.endsWith('devdocs.io'),
    pageType: 'doc',
    weight: 0.9,
  },
  {
    test: (h) =>
      h === 'www.npmjs.com' ||
      h === 'npmjs.com' ||
      h === 'pypi.org' ||
      h === 'crates.io',
    pageType: 'tool',
    weight: 0.7,
  },
  {
    test: (h) =>
      h.includes('reuters.com') ||
      h.includes('bbc.') ||
      h.includes('nytimes.com') ||
      h.includes('theguardian.com') ||
      h.includes('cnn.com') ||
      h.endsWith('news') ||
      h.includes('news.'),
    pageType: 'news',
    weight: 0.55,
  },
  {
    test: (h, p) => h.includes('reddit.com') && p.includes('/comments/'),
    pageType: 'discussion',
    weight: 0.75,
  },
  {
    test: (h) => h === 'news.ycombinator.com',
    pageType: 'discussion',
    weight: 0.6,
  },
  {
    test: (h) => h.includes('wikipedia.org') || h.includes('wikimedia.org'),
    pageType: 'resource',
    weight: 0.55,
  },
  {
    test: (h) => h.includes('arxiv.org') || h.includes('doi.org'),
    pageType: 'longform',
    weight: 0.5,
  },
];

/**
 * Infer likely page types from hostname and path patterns (no AI).
 */
export function detectByDomain(url: string): Signal[] {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const pathname = u.pathname.toLowerCase();
    const out: Signal[] = [];
    for (const rule of DOMAIN_RULES) {
      if (rule.test(host, pathname)) {
        out.push({
          source: 'domain',
          pageType: rule.pageType,
          weight: clampWeight(rule.weight),
        });
      }
    }
    return out;
  } catch {
    return [];
  }
}

function countRegex(haystack: string, re: RegExp): number {
  const m = haystack.match(re);
  return m ? m.length : 0;
}

/**
 * Count structural HTML cues: code blocks, lists, headings.
 */
export function detectByDOM(html: string | undefined): Signal[] {
  if (!html || html.trim() === '') {
    return [];
  }

  const lower = html.toLowerCase();
  const preBlocks = countRegex(lower, /<pre\b/g);
  const codeTags = countRegex(lower, /<code\b/g);
  const orderedLists = countRegex(lower, /<ol\b/g);
  const headings =
    countRegex(lower, /<h1\b/g) +
    countRegex(lower, /<h2\b/g) +
    countRegex(lower, /<h3\b/g) +
    countRegex(lower, /<h4\b/g) +
    countRegex(lower, /<h5\b/g) +
    countRegex(lower, /<h6\b/g);

  const codeScore = preBlocks + Math.min(codeTags, preBlocks + 20);
  const out: Signal[] = [];

  if (codeScore >= 3 || preBlocks >= 1) {
    out.push({
      source: 'dom',
      pageType: 'doc',
      weight: clampWeight(0.45 + Math.min(0.45, codeScore * 0.05)),
    });
  }

  if (orderedLists >= 2 && headings >= 2) {
    out.push({
      source: 'dom',
      pageType: 'tutorial',
      weight: clampWeight(0.5 + Math.min(0.35, orderedLists * 0.06)),
    });
  }

  if (headings >= 6 && codeScore < 4) {
    out.push({
      source: 'dom',
      pageType: 'longform',
      weight: clampWeight(0.4 + Math.min(0.35, headings * 0.03)),
    });
  }

  return out;
}

type KeywordRule = { re: RegExp; pageType: PageType; weight: number };

const KEYWORD_RULES: KeywordRule[] = [
  {
    re: /教程|步骤|tutorial|step\s*by\s*step|walkthrough|how\s*to|getting\s*started/i,
    pageType: 'tutorial',
    weight: 0.55,
  },
  { re: /观点|评论|opinion|editorial|essay(?!.*question)/i, pageType: 'opinion', weight: 0.5 },
  { re: /突发|报道|press\s*release|breaking|according\s*to|Reuters|美联社/i, pageType: 'news', weight: 0.45 },
  { re: /API\b|参数|arguments?\b|returns?\b|RFC\s*\d+|reference|endpoint|schema/i, pageType: 'doc', weight: 0.55 },
  { re: /pricing|subscribe|license|download\s+installer|changelog/i, pageType: 'tool', weight: 0.45 },
  { re: /awesome\s+list|curated|resources?\s+list|合集|书单/i, pageType: 'resource', weight: 0.5 },
  { re: /chapter|前言|结论|thousand\s*words|long\s*read/i, pageType: 'longform', weight: 0.35 },
  { re: /question|问题|讨论|thread|consensus|投票/i, pageType: 'discussion', weight: 0.45 },
];

/**
 * Keyword-based heuristics over plain text (title + body).
 */
export function detectByKeywords(text: string): Signal[] {
  if (!text || text.trim() === '') {
    return [];
  }
  const out: Signal[] = [];
  for (const rule of KEYWORD_RULES) {
    if (rule.re.test(text)) {
      out.push({
        source: 'keywords',
        pageType: rule.pageType,
        weight: clampWeight(rule.weight),
      });
    }
  }
  return out;
}

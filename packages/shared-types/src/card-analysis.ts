/**
 * CardAnalysis — Structured analysis result from the Skills pipeline.
 * @see PRD §9.1.2
 */

/**
 * 8 semantic page types that NoteSeed can identify.
 * Each type triggers a different extraction strategy in Distiller.
 * @see PRD §6.3 PageSense
 */
export const PAGE_TYPES = [
  'tutorial',
  'opinion',
  'news',
  'doc',
  'tool',
  'resource',
  'longform',
  'discussion',
] as const;

export type PageType = (typeof PAGE_TYPES)[number];

/** Tutorial-specific fields: step-by-step content */
export interface TutorialFields {
  prerequisites?: string[];
  steps?: string[];
  warnings?: string[];
}

/** Opinion/editorial-specific fields: arguments and quotes */
export interface OpinionFields {
  keyPoints?: string[];
  quotes?: string[];
  counterArguments?: string[];
}

/** News-specific fields: 5W1H factual structure */
export interface NewsFields {
  whoWhatWhenWhere?: string;
  keyFacts?: string[];
}

/** Documentation-specific fields: API signatures and params */
export interface DocFields {
  apiSignature?: string;
  params?: Array<{ name: string; type: string; desc: string }>;
  examples?: string[];
}

/** Tool/product-specific fields */
export interface ToolFields {
  useCase?: string;
  pros?: string[];
  cons?: string[];
  pricing?: string;
}

/** Resource/link collection fields */
export interface ResourceFields {
  description?: string;
  highlights?: string[];
  bestFor?: string;
}

/** Long-form article fields */
export interface LongformFields {
  outline?: string[];
  keyInsights?: string[];
}

/** Discussion/Q&A fields */
export interface DiscussionFields {
  question?: string;
  topAnswers?: string[];
  consensus?: string;
  controversy?: string;
}

/** Union of all page-type-specific field sets */
export interface CardFields
  extends TutorialFields,
    OpinionFields,
    NewsFields,
    DocFields,
    ToolFields,
    ResourceFields,
    LongformFields,
    DiscussionFields {
  /** Generic action items applicable to any page type */
  actionItems?: string[];
  /** Generic facts applicable to any page type */
  facts?: string[];
}

export interface CardAnalysis {
  /** One of the 8 recognized page types */
  pageType: PageType;
  /** Confidence score 0–1 for the page type classification */
  confidence: number;
  /** One-paragraph summary of the page content */
  summary: string;
  /** Structured fields, varying by pageType */
  fields: CardFields;
  /** 3 recommended tags */
  tags: string[];
  /** Hierarchical category, e.g. "技术/前端" */
  category?: string;
  /** Template ID suggested by PageSense */
  suggestedTemplate: string;
  /** 0–1 score indicating how novel this content is vs existing cards */
  noveltyScore?: number;
}

/**
 * PageSource — Raw data captured from a web page.
 * @see PRD §9.1.1
 */
export interface PageSourceMetadata {
  siteName: string;
  author?: string;
  /** ISO 8601 date string */
  publishedAt?: string;
  language?: string;
}

export interface PageSource {
  /** Unique identifier (UUID v4) */
  sourceId: string;
  url: string;
  title: string;
  rawHTML?: string;
  cleanText: string;
  /** If user selected text on the page, only that portion is processed */
  selectedText?: string;
  metadata: PageSourceMetadata;
  /** ISO 8601 timestamp when content was collected */
  collectedAt: string;
}

/**
 * Unified error codes for NoteSeed.
 * @see PRD §10.2
 */
export const ERROR_CODES = {
  /** Page content extraction failed */
  EXTRACT_FAILED: 4001,
  /** Page type classification confidence too low */
  LOW_CONFIDENCE: 4002,
  /** Target note system not authorized */
  TARGET_UNAUTHORIZED: 4003,
  /** Target note system API rate limited */
  TARGET_RATE_LIMITED: 4004,
  /** Skill execution timed out */
  SKILL_TIMEOUT: 5001,
  /** LLM API call failed */
  LLM_CALL_FAILED: 5002,
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface NoteSeedError {
  code: ErrorCode;
  message: string;
  /** Optional details for debugging (never exposed to end users) */
  details?: string;
}

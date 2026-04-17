/**
 * @noteseed/skills
 * Skills engine — the core intelligence layer of NoteSeed.
 */

// Orchestrator (main entry point)
export { generateCard } from './orchestrator/index.js';
export type { GenerateCardOptions, GenerateCardResult } from './orchestrator/index.js';

// Individual Skills
export { run as runPageSense } from './page-sense/index.js';
export { run as runContextualizer } from './contextualizer/index.js';
export { run as runDistiller } from './distiller/index.js';
export { run as runTagger } from './tagger/index.js';
export { run as runCardwright } from './cardwright/index.js';

// LLM utilities
export { callClaude } from './llm/client.js';
export { MODELS, getFastModel, getPowerfulModel } from './llm/models.js';
export { createProvider, configFromEnv } from './llm/factory.js';
export { setActiveProvider, clearActiveProvider } from './llm/provider.js';
export type { LLMProvider } from './llm/provider.js';

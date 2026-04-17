import { describe, it, expect } from 'vitest';
import { estimateReadingTime, detectLanguageLabel } from '../reading-time.js';

describe('estimateReadingTime', () => {
  it('estimates Chinese text reading time', () => {
    const text = '这'.repeat(600);
    const result = estimateReadingTime(text);
    expect(result).toBe('2 min');
  });

  it('estimates English text reading time', () => {
    const words = Array.from({ length: 400 }, (_, i) => `word${i}`).join(' ');
    const result = estimateReadingTime(words);
    expect(result).toBe('2 min');
  });

  it('returns < 1 min for very short text', () => {
    const result = estimateReadingTime('Hello world');
    expect(result).toBe('< 1 min');
  });

  it('returns 0 min for empty text', () => {
    expect(estimateReadingTime('')).toBe('0 min');
  });

  it('handles mixed CJK/English text', () => {
    const text = '这是一段混合 English and 中文的文本，主要用于测试';
    const result = estimateReadingTime(text);
    expect(result).toMatch(/\d+ min/);
  });
});

describe('detectLanguageLabel', () => {
  it('detects Chinese text', () => {
    expect(detectLanguageLabel('这是一段中文文本，用来测试语言检测功能')).toBe('zh');
  });

  it('detects English text', () => {
    expect(detectLanguageLabel('This is an English paragraph for testing')).toBe('en');
  });

  it('returns und for empty text', () => {
    expect(detectLanguageLabel('')).toBe('und');
  });
});

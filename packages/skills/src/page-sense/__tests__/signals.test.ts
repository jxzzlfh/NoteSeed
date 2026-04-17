import { describe, it, expect } from 'vitest';
import { detectByDomain, detectByDOM, detectByKeywords } from '../signals.js';

describe('detectByDomain', () => {
  it('maps github.com to doc', () => {
    const signals = detectByDomain('https://github.com/user/repo');
    expect(signals.some((s) => s.pageType === 'doc')).toBe(true);
  });

  it('returns empty for unknown domain', () => {
    const signals = detectByDomain('https://random-site.example.com/page');
    expect(signals.length).toBe(0);
  });
});

describe('detectByDOM', () => {
  it('detects code blocks', () => {
    const html = '<html><body><pre><code>const x = 1;</code></pre><pre><code>const y = 2;</code></pre></body></html>';
    const signals = detectByDOM(html);
    expect(signals.length).toBeGreaterThan(0);
  });

  it('handles undefined html', () => {
    const signals = detectByDOM(undefined);
    expect(signals).toEqual([]);
  });
});

describe('detectByKeywords', () => {
  it('detects tutorial keywords in Chinese', () => {
    const text = '本教程将分步骤教你如何使用 Docker 容器化你的应用';
    const signals = detectByKeywords(text);
    expect(signals.some((s) => s.pageType === 'tutorial')).toBe(true);
  });

  it('detects opinion keywords', () => {
    const text = 'In my opinion, the industry is moving towards a controversial direction. I argue that...';
    const signals = detectByKeywords(text);
    expect(signals.some((s) => s.pageType === 'opinion')).toBe(true);
  });

  it('detects doc keywords', () => {
    const text = 'API Reference: GET /api/v1/users. Parameters: id (string), limit (number). Returns JSON.';
    const signals = detectByKeywords(text);
    expect(signals.some((s) => s.pageType === 'doc')).toBe(true);
  });
});

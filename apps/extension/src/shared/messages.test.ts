import { describe, expect, it } from 'vitest';
import type { Message } from './messages.js';

describe('Message union', () => {
  it('narrows CAPTURE_PAGE', () => {
    const msg: Message = { type: 'CAPTURE_PAGE' };
    expect(msg.type).toBe('CAPTURE_PAGE');
  });
});

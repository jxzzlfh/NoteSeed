import { describe, it, expect, vi, beforeEach } from 'vitest';

const TEST_KEY = Buffer.from('a'.repeat(32)).toString('base64');

vi.stubEnv('CREDENTIAL_ENCRYPTION_KEY', TEST_KEY);
vi.stubEnv('DATABASE_URL', 'postgresql://localhost:5432/test');
vi.stubEnv('REDIS_URL', 'redis://localhost:6379');
vi.stubEnv('JWT_SECRET', 'test-jwt-secret-at-least-16-chars');
vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');

const { encrypt, decrypt } = await import('../crypto.js');

describe('crypto', () => {
  it('encrypts and decrypts back to original', () => {
    const plaintext = 'my-secret-memos-token-12345';
    const cipher = encrypt(plaintext);
    const recovered = decrypt(cipher);
    expect(recovered).toBe(plaintext);
  });

  it('encrypts empty string', () => {
    const cipher = encrypt('');
    const recovered = decrypt(cipher);
    expect(recovered).toBe('');
  });

  it('produces different ciphertext for same plaintext', () => {
    const plaintext = 'same-text';
    const cipher1 = encrypt(plaintext);
    const cipher2 = encrypt(plaintext);
    expect(cipher1).not.toBe(cipher2);
  });

  it('produces different ciphertext for different plaintext', () => {
    const cipher1 = encrypt('hello');
    const cipher2 = encrypt('world');
    expect(cipher1).not.toBe(cipher2);
  });

  it('handles unicode content', () => {
    const plaintext = '你好世界🌱 NoteSeed';
    const cipher = encrypt(plaintext);
    const recovered = decrypt(cipher);
    expect(recovered).toBe(plaintext);
  });

  it('handles JSON credential data', () => {
    const cred = JSON.stringify({ baseUrl: 'https://memos.example.com', accessToken: 'xyz' });
    const cipher = encrypt(cred);
    const recovered = JSON.parse(decrypt(cipher)) as { baseUrl: string; accessToken: string };
    expect(recovered.baseUrl).toBe('https://memos.example.com');
    expect(recovered.accessToken).toBe('xyz');
  });

  it('throws on tampered ciphertext', () => {
    const cipher = encrypt('test');
    const tampered = cipher.slice(0, -2) + 'AA';
    expect(() => decrypt(tampered)).toThrow();
  });
});

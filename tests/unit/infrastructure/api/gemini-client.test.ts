import { GoogleGenAI } from '@google/genai';
import { describe, it, expect } from '@jest/globals';

import { getGeminiSingletonClient } from '../../../../src/infrastructure/api/gemini-client';

describe('getGeminiSingletonClient', () => {
  it('throws if API key is empty', () => {
    expect(() => getGeminiSingletonClient({ apiKey: '' }))
      .toThrow('Gemini requires an API key.');
  });

  it('returns a valid GoogleGenAI instance', () => {
    const client = getGeminiSingletonClient({ apiKey: 'valid-key' });
    expect(client).toBeInstanceOf(GoogleGenAI);
  });

  it('returns the same instance for the same API key (singleton)', () => {
    const client1 = getGeminiSingletonClient({ apiKey: 'shared-key' });
    const client2 = getGeminiSingletonClient({ apiKey: 'shared-key' });
    expect(client1).toBe(client2);
  });

  it('returns different instances for different API keys', () => {
    const client1 = getGeminiSingletonClient({ apiKey: 'key-A' });
    const client2 = getGeminiSingletonClient({ apiKey: 'key-B' });
    expect(client1).not.toBe(client2);
  });
});


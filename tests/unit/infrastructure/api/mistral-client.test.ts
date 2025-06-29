import { describe, it, expect } from '@jest/globals';
import { Mistral } from '@mistralai/mistralai';

import { getMistralSingletonClient } from '../../../../src/infrastructure/api/mistral-client';

describe('getMistralSingletonClient', () => {
  it('throws if API key is empty', () => {
    expect(() => getMistralSingletonClient({ apiKey: '' }))
      .toThrow('Mistral requires an API key.');
  });

  it('returns a valid Mistral client instance', () => {
    const client = getMistralSingletonClient({ apiKey: 'valid-key' });
    expect(client).toBeInstanceOf(Mistral);
  });

  it('returns the same instance for the same API key (singleton)', () => {
    const client1 = getMistralSingletonClient({ apiKey: 'shared-key' });
    const client2 = getMistralSingletonClient({ apiKey: 'shared-key' });
    expect(client1).toBe(client2);
  });

  it('returns different instances for different API keys', () => {
    const client1 = getMistralSingletonClient({ apiKey: 'key-A' });
    const client2 = getMistralSingletonClient({ apiKey: 'key-B' });
    expect(client1).not.toBe(client2);
  });

  it('creates a client with a custom timeout without throwing', () => {
    const client = getMistralSingletonClient({ apiKey: 'timeout-key', timeoutMs: 10_000 });
    expect(client).toBeInstanceOf(Mistral);
  });
});

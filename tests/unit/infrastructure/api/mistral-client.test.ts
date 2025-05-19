import { describe, it, expect } from '@jest/globals';
import { Mistral } from '@mistralai/mistralai';

import { getMistralSingletonClient } from '../../../../src/infrastructure/api/mistral-client';

describe('getMistralSingletonClient', () => {
  it('throws if no API key is provided', () => {
    expect(() => {
      
      getMistralSingletonClient({ apiKey: '' });
    }).toThrow('Mistral requires an API key.');
  });

  it('returns a Mistral client instance', () => {
    const client = getMistralSingletonClient({ apiKey: 'key1' });
    expect(client).toBeInstanceOf(Mistral);
  });

  it('returns the same instance for the same API key', () => {
    const client1 = getMistralSingletonClient({ apiKey: 'key2' });
    const client2 = getMistralSingletonClient({ apiKey: 'key2' });
    expect(client1).toBe(client2);
  });

  it('returns a different instance for different API keys', () => {
    const client1 = getMistralSingletonClient({ apiKey: 'key3' });
    const client2 = getMistralSingletonClient({ apiKey: 'key4' });
    expect(client1).not.toBe(client2);
  });
});

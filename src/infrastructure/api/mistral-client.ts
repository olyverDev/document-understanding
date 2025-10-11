import { Mistral } from '@mistralai/mistralai';

export const getMistralSingletonClient = (() => {
  const cache = new Map<string, Mistral>();

  return ({ apiKey, timeoutMs = 20_000 }: { apiKey: string; timeoutMs?: number }): Mistral => {
    if (!apiKey) throw new Error('Mistral requires an API key.');
    if (cache.has(apiKey)) return cache.get(apiKey)!;

    const client = new Mistral({ apiKey, timeoutMs });
    cache.set(apiKey, client);
    return client;
  };
})();

import { Mistral } from '@mistralai/mistralai';

export const getMistralSingletonClient = (() => {
  const cache = new Map<string, Mistral>();

  return ({ apiKey }: { apiKey: string }): Mistral => {
    if (!apiKey) throw new Error('Mistral requires an API key.');
    if (cache.has(apiKey)) return cache.get(apiKey)!;

    const client = new Mistral({ apiKey });
    cache.set(apiKey, client);
    return client;
  };
})();

import { GoogleGenAI } from '@google/genai';

export const getGeminiSingletonClient = (() => {
  const cache = new Map<string, GoogleGenAI>();

  return ({ apiKey }: { apiKey: string }): GoogleGenAI => {
    if (!apiKey) throw new Error('Gemini requires an API key.');
    if (cache.has(apiKey)) return cache.get(apiKey)!;

    const client = new GoogleGenAI({ apiKey });
    cache.set(apiKey, client);
    return client;
  };
})();

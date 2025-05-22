## Adding a new Provider

To add a new provider (e.g. `openai`, `tesseract`) to the system, implement needed adapters (`VisualStructuring` or `OCR` + `TextStructuring`) and register them in the corresponding provider registries.

### 1. Add the provider key

Add the provider identifier:

```ts
// src/infrastructure/providers/variants.ts

export const Providers = {
  Mistral: 'mistral',
  OpenAI: 'openai', // 👈 Add this line
} as const;

export type ProviderName = typeof Providers[keyof typeof Providers];
```

---

### 2. Implement the TextStructuring adapter (or any other)

Create a file:

```
src/infrastructure/adapters/text-structuring/openai.ts
```

Implement the `TextStructuring<T>` interface:

```ts
import type { TextStructuring } from '../../../ports/text-structuring';

export class OpenAITextStructuring<T> implements TextStructuring<T> {
  constructor(private readonly config: { token: string; model?: string }) {}

  async parse(input: { text: string; prompt: string; outputSchema?: object }): Promise<T> {
    // Implement OpenAI LLM logic
    return {} as T;
  }
}

export const OpenAITextStructuringFactory = <T>(config: { token: string; model?: string }): TextStructuring<T> => {
  return new OpenAITextStructuring<T>(config);
};
```

---

### 3. Register new TextStructuring provider

In `src/infrastructure/providers/text-structuring.ts`:

```ts
import { OpenaiTextStructuringFactory } from '../adapters/text-structuring/openai';

export const TextStructuringProvidersRegistry = {
  mistral: mistralTextStructuringFactory,
  openai: OpenaiOCRFactory, // 👈 Add this
} as const;
```

---

### 6. Use the new provider

You can now use the new provider like described [here](./custom-usage.md)

---

### Summary

To add a provider:
1. Define a key in `variants.ts`
2. Implement the adapter(s)
3. Register in the relevant registry
4. Done — the type system will infer config shape and usage

### Different Providers for OCR + TextUnderstanding
You can add different providers for `OCR` and `TextStructuring` (e.g. Tesseract and OpenAI respectively). OCR + TextUnderstanding is a two-step pipeline and can involve multiple technologies.

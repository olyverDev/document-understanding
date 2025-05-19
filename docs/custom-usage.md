### Document Understanding Pipeline (Generic Engine)

You can build a custom understanding pipeline using the engine and providers registry.

```ts
import { DocumentUnderstandingServiceFactory } from 'document-understanding';
import { Providers } from 'document-understanding';
import type { OCRInput } from 'document-understanding';
import schema from './your-custom-schema.json';
import prompt from './your-custom-prompt';

const engine = DocumentUnderstandingServiceFactory<PrescriptionDocument>({
  ocr: {
    provider: Providers.Mistral,
    config: { apiKey: 'sk-...' },
  },
  textStructuring: {
    provider: Providers.Mistral,
    config: { apiKey: 'sk-...' },
  },
});

const result = await engine.understand(input, {
  prompt,
  outputSchema: schema,
});
```

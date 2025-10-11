### Document Understanding Pipeline

You can build a specific understanding pipeline using the `DocumentUnderstandingService` with either a **visual** or **ocr-text-structuring** engine strategy.

#### Example: VisualUnderstanding Pipeline

#### Example: OCRTextUnderstanding two step Pipeline

```ts
import {
  OCRTextUnderstanding,
  DocumentUnderstandingService
  OCRProvidersRegistry,
  TextStructuringProvidersRegistry,
  Providers,
} from 'document-understanding';
import type { OCRInput } from 'document-understanding';
import prompt from './specific-document-prompt';
import schema from './specific-document-schema.json';

const ocr = OCRProvidersRegistry[Providers.Mistral]({ apiKey: 'sk-...' });
const textStructuring = TextStructuringProvidersRegistry[Providers.Mistral]<SpecificDocument>({
  apiKey: 'sk-...',
});

const engine = new OCRTextUnderstanding(ocr, textStructuring);

const service = new DocumentUnderstandingService(engine, prompt, schema);

const result: SpecificDocument = await service.understand(input);
```

```ts
import { VisualUnderstanding, DocumentUnderstandingService, VisualStructuringProvidersRegistry, Providers } from 'document-understanding';
import type { VisualDocument } from 'document-understanding';
import type { PrescriptionDocuments } from 'document-understanding/prescription';
import prompt from './specific-document-prompt';
import schema from './specific-document-schema.json';

const adapter = VisualStructuringProvidersRegistry[Providers.Mistral]<PrescriptionDocuments>({
  apiKey: 'sk-...',
});

const engine = new VisualUnderstanding(adapter);

const service = new DocumentUnderstandingService(engine, prompt, schema);

const result: SpecificDocument = await service.understand(input);
```

#### Core service role

The [`DocumentUnderstandingService<T>`](../src/core/service.ts) class unifies prompt and schema injection for any [`UnderstandingEngine<T>](../src/engine/understanding-engine.interface.ts)

import { DocumentUnderstandingService } from '../../core/service';
import { OCRTextUnderstanding } from '../../engine/ocr-text-understanding';
import { OCRProvidersRegistry, Providers, TextStructuringProvidersRegistry } from '../../infrastructure/providers';

import type { PrescriptionDocuments } from './models';
import prompt from './prompt';
import schema from './schema.json';

type PrescriptionUnderstandingContext = {
  prompt: string;
  outputSchema: typeof schema;
};

export interface MistralOptions {
  apiKey: string;
  model?: string;
}

export type MistralResult = {
  isInitialized: true;
  service: DocumentUnderstandingService<PrescriptionDocuments, PrescriptionUnderstandingContext>;
} | {
  isInitialized: false;
  error?: Error;
};

/**
 * @docs Prescription Understanding – Mistral OCR + Text Understanding  Pipeline
 *
 * This implementation leverages the Mistral OCR and Completion APIs to perform
 * two-step **Image-To-Markdown** + **Markdown-To-Json** structuring by providing:
 * - A static prescription-specific `prompt`
 * - A corresponding JSON `schema`
 *
 * Engine is made of adapters and injected into the core `DocumentUnderstandingService`,
 * allowing downstream consumers to extract structured data from
 * images or PDFs of optical prescriptions.
 *
 * Internally, this uses the Mistral providers defined in the corresponding registries
 */
export function MistralPrescriptionUnderstandingFactory(
  options: MistralOptions,
): MistralResult {
  try {
    const mistralOCRAdapter = OCRProvidersRegistry[Providers.Mistral]({
      apiKey: options.apiKey,
      model: options.model,
    });

    const mistralTextStructuringAdapter = TextStructuringProvidersRegistry[Providers.Mistral]<PrescriptionDocuments>({
      apiKey: options.apiKey,
      model: options.model ?? 'mistral-medium-latest',
    });

    const engine = new OCRTextUnderstanding<PrescriptionDocuments>(mistralOCRAdapter, mistralTextStructuringAdapter);
    const engineContext: PrescriptionUnderstandingContext = {
      prompt,
      outputSchema: schema,
    };
    const service = new DocumentUnderstandingService<PrescriptionDocuments, PrescriptionUnderstandingContext>(engine, engineContext);

    return { service, isInitialized: true };
  } catch (error) {
    return { error, isInitialized: false } as MistralResult;
  }
};

import { DocumentUnderstandingService } from '../..';
import { VisualUnderstanding } from '../../engine/visual-understanding';
import { Providers, VisualStructuringProvidersRegistry } from '../../infrastructure/providers';

import type { PrescriptionDocuments } from './models';
import prompt from './prompt';
import schema from './schema.json';

export interface MistralOptions {
  apiKey: string;
  model?: string;
}

/**
 * @docs Prescription Understanding – Mistral Visual Strategy
 *
 * For the Prescription domain, the most effective understanding strategy
 * has proven to be **visual understanding** using Mistral AI.
 *
 * This implementation leverages the Mistral Completion API to perform
 * direct **Image-To-Json** structuring by providing:
 * - A static prescription-specific `prompt`
 * - A corresponding JSON `schema`
 *
 * The strategy is injected into a reusable `DocumentUnderstandingService`,
 * allowing downstream consumers to extract structured data from
 * images or PDFs of optical prescriptions.
 *
 * Internally, this uses the Mistral provider registered in the
 * `VisualStructuringProvidersRegistry`.
 */
export function MistralPrescriptionUnderstanding(
  options: MistralOptions,
): DocumentUnderstandingService<PrescriptionDocuments> {
  const mistralAdapter = VisualStructuringProvidersRegistry[Providers.Mistral]<PrescriptionDocuments>({
    apiKey: options.apiKey,
    model: options.model ?? 'mistral-medium-latest',
  });

  const engine = new VisualUnderstanding(mistralAdapter);

  return new DocumentUnderstandingService(engine, prompt, schema);
}

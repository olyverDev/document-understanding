import { Providers } from '../../infrastructure/providers';

import { PrescriptionUnderstandingService } from './understanding';

export interface MistralOptions {
  apiKey: string;
  OCRModel?: string;
  textStructuringModel?: string;
}

export function MistralPrescriptionUnderstanding(
  options: MistralOptions
): PrescriptionUnderstandingService {
  return new PrescriptionUnderstandingService({
    ocr: {
      provider: Providers.Mistral,
      config: {
        apiKey: options.apiKey,
        model: options.OCRModel,
      },
    },
    textStructuring: {
      provider: Providers.Mistral,
      config: {
        apiKey: options.apiKey,
        model: options.textStructuringModel,
      },
    },
  });
}

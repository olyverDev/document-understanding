import type { DocumentUnderstandingService } from '../../engine/document-understanding';
import { DocumentUnderstandingServiceFactory } from '../../engine/document-understanding-factory';
import type {
  OCRProvidersConfigs,
  TextStructuringProvidersConfigs,
} from '../../infrastructure/providers';
import { OCRInput } from '../../ports/ocr';

import prompt from './prompt';
import schema from './schema.json';
import type { PrescriptionDocument } from './types';


export type PrescriptionUnderstandingConfig<
  OCR extends keyof OCRProvidersConfigs = 'mistral',
  TextStructuring extends keyof TextStructuringProvidersConfigs = 'mistral'
> = {
  ocr: {
    provider: OCR;
    config: OCRProvidersConfigs[OCR];
  };
  textStructuring: {
    provider: TextStructuring;
    config: TextStructuringProvidersConfigs[TextStructuring];
  };
};

export class PrescriptionUnderstandingService {
  private readonly understandingService: DocumentUnderstandingService<PrescriptionDocument>;

  constructor(config: PrescriptionUnderstandingConfig) {
    this.understandingService = DocumentUnderstandingServiceFactory<PrescriptionDocument>(config);
  }

  async understand(prescriptionOCRInput: OCRInput): Promise<PrescriptionDocument> {
    return this.understandingService.understand(prescriptionOCRInput, {
      prompt,
      outputSchema: schema,
    });
  }
}

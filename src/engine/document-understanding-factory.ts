import { OCRProvidersRegistry, TextStructuringProvidersRegistry } from '../infrastructure/providers';
import type { OCRProvidersConfigs, TextStructuringProvidersRegistryType } from '../infrastructure/providers';

import { DocumentUnderstandingService } from './document-understanding';

export function DocumentUnderstandingServiceFactory<
  T,
  OCR extends keyof OCRProvidersConfigs = 'mistral',
  TextStructuring extends keyof TextStructuringProvidersRegistryType = 'mistral'
>(config: {
  ocr: {
    provider: OCR;
    config: OCRProvidersConfigs[OCR];
  };
  textStructuring: {
    provider: TextStructuring;
    config: Parameters<TextStructuringProvidersRegistryType[TextStructuring]>[0];
  };
}): DocumentUnderstandingService<T> {
  const ocrAdapter = OCRProvidersRegistry[config.ocr.provider](config.ocr.config);
  const textStructuringAdapter = TextStructuringProvidersRegistry[config.textStructuring.provider]<T>(
    config.textStructuring.config
  );
  return new DocumentUnderstandingService<T>(ocrAdapter, textStructuringAdapter);
}

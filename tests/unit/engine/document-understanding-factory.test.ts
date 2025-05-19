import { DocumentUnderstandingService } from '../../../src/engine/document-understanding';
import { DocumentUnderstandingServiceFactory } from '../../../src/engine/document-understanding-factory';
import { OCRProvidersRegistry } from '../../../src/infrastructure/providers/ocr';
import { TextStructuringProvidersRegistry } from '../../../src/infrastructure/providers/text-structuring';
import { Providers } from '../../../src/infrastructure/providers/variants';

const mockOCR = { recognizeText: jest.fn() };
const mockStructuring = { parse: jest.fn() };

jest.mock('../../../src/infrastructure/providers/ocr', () => ({
  OCRProvidersRegistry: {
    mistral: jest.fn(() => mockOCR),
  },
}));

jest.mock('../../../src/infrastructure/providers/text-structuring', () => ({
  TextStructuringProvidersRegistry: {
    mistral: jest.fn(() => mockStructuring),
  },
}));

describe('DocumentUnderstandingServiceFactory', () => {
  it('creates a DocumentUnderstandingService instance with correct adapters', () => {
    const config = {
      ocr: {
        provider: Providers.Mistral,
        config: { apiKey: 'key-ocr' },
      },
      textStructuring: {
        provider: Providers.Mistral,
        config: { apiKey: 'key-struct' },
      },
    };

    const service = DocumentUnderstandingServiceFactory<{ foo: string }>(config);

    expect(service).toBeInstanceOf(DocumentUnderstandingService);
    expect(OCRProvidersRegistry[Providers.Mistral]).toHaveBeenCalledWith(config.ocr.config);
    expect(TextStructuringProvidersRegistry[Providers.Mistral]).toHaveBeenCalledWith(config.textStructuring.config);
  });
});

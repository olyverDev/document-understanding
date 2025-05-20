import { MistralPrescriptionUnderstanding } from '../../../../src/domains/prescription/mistral-understanding';
import { PrescriptionUnderstandingService } from '../../../../src/domains/prescription/understanding';
import { OCRProvidersRegistry } from '../../../../src/infrastructure/providers/ocr';
import { TextStructuringProvidersRegistry } from '../../../../src/infrastructure/providers/text-structuring';
import { Providers } from '../../../../src/infrastructure/providers/variants';

jest.mock('../../../../src/infrastructure/providers/ocr', () => ({
  OCRProvidersRegistry: {
    mistral: jest.fn(() => ({ recognizeText: jest.fn() })),
  },
}));

jest.mock('../../../../src/infrastructure/providers/text-structuring', () => ({
  TextStructuringProvidersRegistry: {
    mistral: jest.fn(() => ({ parse: jest.fn() })),
  },
}));

describe('MistralPrescriptionUnderstanding', () => {
  const mockApiKey = 'sk-test';
  const mockOCRModel = 'mistral-ocr-latest';
  const mockTextModel = 'mistral-medium-latest';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a PrescriptionUnderstandingService with explicit model configs', () => {
    const service = MistralPrescriptionUnderstanding({
      apiKey: mockApiKey,
      OCRModel: mockOCRModel,
      textStructuringModel: mockTextModel,
    });

    expect(service).toBeInstanceOf(PrescriptionUnderstandingService);

    expect(OCRProvidersRegistry[Providers.Mistral]).toHaveBeenCalledWith({
      apiKey: mockApiKey,
      model: mockOCRModel,
    });

    expect(TextStructuringProvidersRegistry[Providers.Mistral]).toHaveBeenCalledWith({
      apiKey: mockApiKey,
      model: mockTextModel,
    });
  });

  it('creates a PrescriptionUnderstandingService with default (undefined) model configs', () => {
    const service = MistralPrescriptionUnderstanding({
      apiKey: mockApiKey,
    });

    expect(service).toBeInstanceOf(PrescriptionUnderstandingService);

    expect(OCRProvidersRegistry[Providers.Mistral]).toHaveBeenCalledWith({
      apiKey: mockApiKey,
      model: undefined,
    });

    expect(TextStructuringProvidersRegistry[Providers.Mistral]).toHaveBeenCalledWith({
      apiKey: mockApiKey,
      model: undefined,
    });
  });
});

describe('PrescriptionUnderstandingService (direct constructor)', () => {
  it('can be constructed directly', () => {
    const service = new PrescriptionUnderstandingService({
      ocr: {
        provider: Providers.Mistral,
        config: { apiKey: 'sk-test', model: 'ocr' },
      },
      textStructuring: {
        provider: Providers.Mistral,
        config: { apiKey: 'sk-test', model: 'llm' },
      },
    });

    expect(service).toBeInstanceOf(PrescriptionUnderstandingService);
  });
});

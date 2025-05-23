import { DocumentUnderstandingService } from '../../../../src';
import { MistralPrescriptionUnderstanding } from '../../../../src/domains/prescription/mistral';
import prompt from '../../../../src/domains/prescription/prompt';
import schema from '../../../../src/domains/prescription/schema.json';
import { VisualUnderstanding } from '../../../../src/engine/visual-understanding';
import { Providers } from '../../../../src/infrastructure/providers/variants';
import { VisualStructuringProvidersRegistry } from '../../../../src/infrastructure/providers/visual-structuring';

jest.mock('../../../../src/infrastructure/providers/visual-structuring', () => ({
  VisualStructuringProvidersRegistry: {
    mistral: jest.fn(),
  },
}));

jest.mock('../../../../src/engine/visual-understanding');
jest.mock('../../../../src', () => {
  const actual = jest.requireActual('../../../../src');
  return {
    ...actual,
    DocumentUnderstandingService: jest.fn(),
  };
});

describe('MistralPrescriptionUnderstanding', () => {
  const mockApiKey = 'sk-test';
  const mockAdapter = { parse: jest.fn() };
  const mockEngine = { understand: jest.fn() };
  const mockService = { understand: jest.fn() };

  const mockedRegistry = VisualStructuringProvidersRegistry[Providers.Mistral] as jest.Mock;
  const MockVisualUnderstanding = VisualUnderstanding as jest.Mock;
  const MockDocumentUnderstandingService = DocumentUnderstandingService as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedRegistry.mockReturnValue(mockAdapter);
    MockVisualUnderstanding.mockReturnValue(mockEngine);
    MockDocumentUnderstandingService.mockReturnValue(mockService);
  });

  it('returns initialized result with default model', () => {
    const result = MistralPrescriptionUnderstanding({ apiKey: mockApiKey });

    expect(mockedRegistry).toHaveBeenCalledWith({
      apiKey: mockApiKey,
      model: 'mistral-medium-latest',
    });

    expect(MockVisualUnderstanding).toHaveBeenCalledWith(mockAdapter);
    expect(MockDocumentUnderstandingService).toHaveBeenCalledWith(mockEngine, prompt, schema);

    expect(result.isInitialized).toBe(true);
    if (result.isInitialized) {
      expect(result.service).toBe(mockService);
    }
  });

  it('uses custom model override', () => {
    const result = MistralPrescriptionUnderstanding({
      apiKey: mockApiKey,
      model: 'mistral-large-latest',
    });

    expect(mockedRegistry).toHaveBeenCalledWith({
      apiKey: mockApiKey,
      model: 'mistral-large-latest',
    });

    expect(result.isInitialized).toBe(true);
    if (result.isInitialized) {
      expect(result.service).toBe(mockService);
    }
  });

  it('returns error if initialization fails', () => {
    mockedRegistry.mockImplementation(() => {
      throw new Error('Registry failure');
    });

    const result = MistralPrescriptionUnderstanding({ apiKey: mockApiKey });

    expect(result.isInitialized).toBe(false);
    if (!result.isInitialized) {
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Registry failure');
    }
  });
});

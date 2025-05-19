import type { PrescriptionDocument } from '../../../../src/domains/prescription/types';
import { PrescriptionUnderstandingService } from '../../../../src/domains/prescription/understanding';
import { DocumentUnderstandingServiceFactory as OriginalFactory } from '../../../../src/engine/document-understanding-factory';
import { Providers } from '../../../../src/infrastructure/providers';
import type { OCRInput } from '../../../../src/ports/ocr';

const mockUnderstand = jest.fn().mockResolvedValue({ patient: { firstName: 'John' } });

jest.mock('../../../../src/engine/document-understanding-factory', () => ({
  DocumentUnderstandingServiceFactory: jest.fn(() => ({
    understand: mockUnderstand,
  })),
}));

// Re-cast the mocked factory for proper access to .mock
const DocumentUnderstandingServiceFactory = OriginalFactory as jest.MockedFunction<typeof OriginalFactory>;

describe('PrescriptionUnderstandingService', () => {
  const mockInput: OCRInput = {
    source: 'base64',
    file: 'FAKE_BASE64',
    documentType: 'image',
  };

  const expected: PrescriptionDocument = {
    patient: { firstName: 'John' },
  } as any;

  it('creates and uses DocumentUnderstandingService to return a parsed result', async () => {
    const service = new PrescriptionUnderstandingService({
      ocr: {
        provider: Providers.Mistral,
        config: { apiKey: 'ocr-key', model: 'mistral-ocr-latest' },
      },
      textStructuring: {
        provider: Providers.Mistral,
        config: { apiKey: 'struct-key', model: 'mistral-large-latest' },
      },
    });

    const result = await service.understand(mockInput);

    expect(result).toEqual(expected);

    expect(DocumentUnderstandingServiceFactory).toHaveBeenCalledWith({
      ocr: {
        provider: 'mistral',
        config: { apiKey: 'ocr-key', model: 'mistral-ocr-latest' },
      },
      textStructuring: {
        provider: 'mistral',
        config: { apiKey: 'struct-key', model: 'mistral-large-latest' },
      },
    });

    const instance = DocumentUnderstandingServiceFactory.mock.results[0].value;
    expect(instance.understand).toHaveBeenCalledWith(
      mockInput,
      expect.objectContaining({
        prompt: expect.any(String),
        outputSchema: expect.any(Object),
      })
    );
  });
});

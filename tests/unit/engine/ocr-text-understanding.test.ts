import { OCRTextUnderstanding } from '../../../src/engine/ocr-text-understanding';
import type { OCR } from '../../../src/ports/ocr';
import type { TextStructuring } from '../../../src/ports/text-structuring';
import type { StructuringFactors } from '../../../src/typings/structuring-factors';
import type { VisualDocument } from '../../../src/typings/visual-document';

describe('OCRTextUnderstanding', () => {
  const mockOCR: OCR = {
    recognizeText: jest.fn(),
  };

  const mockTextStructuring: TextStructuring<{ value: string }> = {
    parse: jest.fn(),
  };

  const adapter = new OCRTextUnderstanding(mockOCR, mockTextStructuring);

  const document: VisualDocument = {
    source: 'base64',
    file: 'img==',
    documentType: 'image',
  };

  const factors: StructuringFactors = {
    prompt: 'Extract value',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('extracts and parses OCR text successfully', async () => {
    (mockOCR.recognizeText as jest.Mock).mockResolvedValueOnce('markdown text');
    (mockTextStructuring.parse as jest.Mock).mockResolvedValueOnce({ value: 'done' });

    const result = await adapter.understand(document, factors);

    expect(mockOCR.recognizeText).toHaveBeenCalledWith(document);
    expect(mockTextStructuring.parse).toHaveBeenCalledWith('markdown text', factors);
    expect(result).toEqual({ value: 'done' });
  });

  it('throws if OCR returns empty text', async () => {
    (mockOCR.recognizeText as jest.Mock).mockResolvedValueOnce('');

    await expect(adapter.understand(document, factors)).rejects.toThrow('OCR returned no text');
  });

  it('propagates OCR errors', async () => {
    const error = new Error('OCR failed');
    (mockOCR.recognizeText as jest.Mock).mockRejectedValueOnce(error);

    await expect(adapter.understand(document, factors)).rejects.toThrow(error);
  });

  it('propagates parsing errors', async () => {
    (mockOCR.recognizeText as jest.Mock).mockResolvedValueOnce('text');
    const error = new Error('Parse failed');
    (mockTextStructuring.parse as jest.Mock).mockRejectedValueOnce(error);

    await expect(adapter.understand(document, factors)).rejects.toThrow(error);
  });
});

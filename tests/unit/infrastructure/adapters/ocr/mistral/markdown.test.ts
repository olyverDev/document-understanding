import type { Mistral } from '@mistralai/mistralai';
import type { OCRResponse } from '@mistralai/mistralai/models/components';

import { OCRProcessingError } from '../../../../../../src/errors';
import { MistralMarkdownOCR } from '../../../../../../src/infrastructure/adapters/ocr/mistral/markdown';
import type { VisualDocument } from '../../../../../../src/typings/visual-document';


describe('MistralMarkdownOCR', () => {
  const mockProcess = jest.fn();
  const mockClient = {
    ocr: { process: mockProcess },
  } as unknown as Mistral;

  const adapter = new MistralMarkdownOCR(mockClient, 'mock-model');

  const base64Image: VisualDocument = {
    source: 'base64',
    file: 'img==',
    documentType: 'image',
  };

  const mockResponse = (markdown: string): OCRResponse => ({
    model: 'mistral-ocr-latest',
    usageInfo: { pagesProcessed: 1 },
    pages: [
      {
        index: 0,
        markdown,
        images: [],
        dimensions: null,
      },
    ],
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('recognizes markdown from image input', async () => {
    mockProcess.mockResolvedValueOnce(mockResponse('# heading'));

    const result = await adapter.recognize(base64Image);

    expect(result).toBe('# heading');
    expect(mockProcess).toHaveBeenCalledWith({
      model: 'mock-model',
      document: { type: 'image_url', imageUrl: 'img==' },
      includeImageBase64: false,
    });
  });

  it('returns empty string if OCR response has no markdown', async () => {
    mockProcess.mockResolvedValueOnce(mockResponse('   ')); // trimmed to ''

    const result = await adapter.recognize(base64Image);
    expect(result).toBe('');
  });

  it('rethrows OCRProcessingError as-is', async () => {
    const err = new OCRProcessingError('wrapped');
    mockProcess.mockRejectedValueOnce(err);

    await expect(adapter.recognize(base64Image)).rejects.toBe(err);
  });

  it('wraps unknown errors in OCRProcessingError', async () => {
    mockProcess.mockRejectedValueOnce(new Error('native error'));

    await expect(adapter.recognize(base64Image)).rejects.toThrow(OCRProcessingError);
  });
});

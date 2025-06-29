import type { Mistral } from '@mistralai/mistralai';

import { OCRProcessingError } from '../../../../../../src/errors';
import { MistralTextChunksOCR } from '../../../../../../src/infrastructure/adapters/ocr/mistral/text-chunks';
import type { VisualDocument } from '../../../../../../src/typings/visual-document';


describe('MistralTextChunksOCR', () => {
  const mockProcess = jest.fn();
  const mockClient = {
    ocr: { process: mockProcess },
  } as unknown as Mistral;

  const adapter = new MistralTextChunksOCR(mockClient, 'mock-model');

  const input: VisualDocument = {
    source: 'base64',
    file: 'img==',
    documentType: 'image',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns joined textChunks from parsed annotation', async () => {
    const annotation = JSON.stringify({
      textChunks: ['Line 1', 'Line 2'],
    });

    mockProcess.mockResolvedValueOnce({
      documentAnnotation: annotation,
    });

    const result = await adapter.recognize(input);
    expect(result).toBe('Line 1\nLine 2');

    expect(mockProcess).toHaveBeenCalledWith({
      model: 'mock-model',
      document: { type: 'image_url', imageUrl: input.file },
      includeImageBase64: false,
      documentAnnotationFormat: MistralTextChunksOCR['documentAnnotationFormat'],
    });
  });

  it('returns empty string if annotation is blank', async () => {
    mockProcess.mockResolvedValueOnce({
      documentAnnotation: '   ',
    });

    const result = await adapter.recognize(input);
    expect(result).toBe('');
  });

  it('throws if annotation is null', async () => {
    mockProcess.mockResolvedValueOnce({
      documentAnnotation: null,
    });

    await expect(adapter.recognize(input)).rejects.toThrow(OCRProcessingError);
  });

  it('throws OCRProcessingError for invalid JSON', async () => {
    mockProcess.mockResolvedValueOnce({
      documentAnnotation: 'not-json',
    });

    await expect(adapter.recognize(input)).rejects.toThrow(OCRProcessingError);
  });

  it('rethrows OCRProcessingError as-is', async () => {
    const error = new OCRProcessingError('wrapped');
    mockProcess.mockRejectedValueOnce(error);

    await expect(adapter.recognize(input)).rejects.toBe(error);
  });

  it('wraps unknown errors in OCRProcessingError', async () => {
    mockProcess.mockRejectedValueOnce(new Error('native'));

    await expect(adapter.recognize(input)).rejects.toThrow(OCRProcessingError);
  });
});

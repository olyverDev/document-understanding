import type { Mistral } from '@mistralai/mistralai';

import { OCRProcessingError } from '../../../../../src/errors/ocr';
import { MistralOCR } from '../../../../../src/infrastructure/adapters/ocr/mistral';
import type { OCRInput } from '../../../../../src/ports/ocr';

describe('MistralOCR', () => {
  const mockProcess = jest.fn();
  const mockClient = {
    ocr: {
      process: mockProcess,
    },
  } as unknown as Mistral;

  const modelName = 'mistral-ocr-latest';
  const adapter = new MistralOCR(mockClient, { model: modelName });

  const base64Image: OCRInput = {
    source: 'base64',
    file: 'img==',
    documentType: 'image',
  };

  const base64Pdf: OCRInput = {
    source: 'base64',
    file: 'pdf==',
    documentType: 'pdf',
  };

  const urlImage: OCRInput = {
    source: 'url',
    file: 'https://example.com/img.jpg',
    documentType: 'image',
  };

  const urlPdf: OCRInput = {
    source: 'url',
    file: 'https://example.com/file.pdf',
    documentType: 'pdf',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles base64 image input', async () => {
    mockProcess.mockResolvedValueOnce({
      pages: [{ markdown: '# image' }],
    });

    const result = await adapter.recognizeText(base64Image);
    expect(result).toBe('# image');

    expect(mockClient.ocr.process).toHaveBeenCalledWith({
      model: modelName,
      document: {
        type: 'image_url',
        imageUrl: 'data:image/jpeg;base64,img==',
      },
      imageLimit: null,
      imageMinSize: null,
      includeImageBase64: false,
    });
  });

  it('handles base64 PDF input', async () => {
    mockProcess.mockResolvedValueOnce({
      pages: [{ markdown: '# pdf' }],
    });

    const result = await adapter.recognizeText(base64Pdf);
    expect(result).toBe('# pdf');

    expect(mockClient.ocr.process).toHaveBeenCalledWith({
      model: modelName,
      document: {
        type: 'document_url',
        documentUrl: 'data:application/pdf;base64,pdf==',
      },
      imageLimit: null,
      imageMinSize: null,
      includeImageBase64: false,
    });
  });

  it('handles URL image input', async () => {
    mockProcess.mockResolvedValueOnce({
      pages: [{ markdown: '# url image' }],
    });

    const result = await adapter.recognizeText(urlImage);
    expect(result).toBe('# url image');

    expect(mockClient.ocr.process).toHaveBeenCalledWith({
      model: modelName,
      document: {
        type: 'image_url',
        imageUrl: 'https://example.com/img.jpg',
      },
      imageLimit: null,
      imageMinSize: null,
      includeImageBase64: false,
    });
  });

  it('handles URL PDF input', async () => {
    mockProcess.mockResolvedValueOnce({
      pages: [{ markdown: '# url pdf' }],
    });

    const result = await adapter.recognizeText(urlPdf);
    expect(result).toBe('# url pdf');

    expect(mockClient.ocr.process).toHaveBeenCalledWith({
      model: modelName,
      document: {
        type: 'document_url',
        documentUrl: 'https://example.com/file.pdf',
      },
      imageLimit: null,
      imageMinSize: null,
      includeImageBase64: false,
    });
  });

  it('throws if no markdown is found', async () => {
    mockProcess.mockResolvedValueOnce({ pages: [{}] });

    await expect(adapter.recognizeText(base64Image)).rejects.toThrow(OCRProcessingError);
  });

  it('rethrows OCRProcessingError as-is', async () => {
    const err = new OCRProcessingError('wrapped');
    mockProcess.mockRejectedValueOnce(err);

    await expect(adapter.recognizeText(base64Image)).rejects.toBe(err);
  });

  it('wraps unknown errors', async () => {
    mockProcess.mockRejectedValueOnce(new Error('unknown'));

    await expect(adapter.recognizeText(base64Image)).rejects.toThrow(OCRProcessingError);
  });

  it('throws for unsupported input combo', () => {
    const invalid: OCRInput = {
      // @ts-expect-error unsupported source
      source: 'blob',
      file: '',
      documentType: 'pdf',
    };

    expect(() =>
      adapter['convertOCRInputToDocumentContentChunk'](invalid)
    ).toThrow();
  });
});

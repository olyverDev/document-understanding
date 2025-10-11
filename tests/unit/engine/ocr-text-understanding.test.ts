import { OCRTextUnderstanding } from '../../../src/engine/ocr-text-understanding';
import type { OCR } from '../../../src/ports/ocr.interface';
import type { TextStructuring } from '../../../src/ports/text-structuring.interface';
import type { VisualDocument } from '../../../src/typings/visual-document';

describe('OCRTextUnderstanding', () => {
  const recognize = jest.fn();
  const parse = jest.fn();

  const mockOCR: OCR<string> = { recognize };
  const mockTextStructuring: TextStructuring<{ value: string }> = { parse };

  const adapter = new OCRTextUnderstanding(mockOCR, mockTextStructuring);

  const input: VisualDocument = {
    source: 'base64',
    file: 'img==',
    documentType: 'image',
  };

  const context = { prompt: 'Extract value' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('successfully performs OCR and parses the result', async () => {
    recognize.mockResolvedValueOnce('markdown text');
    parse.mockResolvedValueOnce({ value: 'done' });

    const result = await adapter.understand(input, context);

    expect(recognize).toHaveBeenCalledWith(input);
    expect(parse).toHaveBeenCalledWith('markdown text', context);
    expect(result).toEqual({ value: 'done' });
  });

  it('parses empty OCR result as valid', async () => {
    recognize.mockResolvedValueOnce('');
    parse.mockResolvedValueOnce({ value: 'empty-ok' });

    const result = await adapter.understand(input, context);

    expect(parse).toHaveBeenCalledWith('', context);
    expect(result).toEqual({ value: 'empty-ok' });
  });

  it('parses whitespace OCR result as valid', async () => {
    recognize.mockResolvedValueOnce('   ');
    parse.mockResolvedValueOnce({ value: 'spaces-ok' });

    const result = await adapter.understand(input, context);

    expect(parse).toHaveBeenCalledWith('   ', context);
    expect(result).toEqual({ value: 'spaces-ok' });
  });

  it('throws if OCR returns an object instead of a string', async () => {
    const invalidResult = {
      markdown: '# Heading',
      images: [],
    };

    recognize.mockResolvedValueOnce(invalidResult);

    await expect(adapter.understand(input, context)).rejects.toThrow();
  });

  it('propagates error if OCR fails', async () => {
    const error = new Error('OCR failed');
    recognize.mockRejectedValueOnce(error);

    await expect(adapter.understand(input, context)).rejects.toThrow(error);
  });

  it('propagates error if parsing fails', async () => {
    recognize.mockResolvedValueOnce('some text');
    const error = new Error('Parse failed');
    parse.mockRejectedValueOnce(error);

    await expect(adapter.understand(input, context)).rejects.toThrow(error);
  });
});

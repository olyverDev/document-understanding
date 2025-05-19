import { DocumentUnderstandingService } from '../../../src/engine/document-understanding';
import type { OCR } from '../../../src/ports/ocr';
import type { TextStructuring } from '../../../src/ports/text-structuring';

describe('DocumentUnderstandingService', () => {
  const fakeOCRText = '# Markdown content from OCR';
  const fakeStructuredData = { structured: true };
  const fakeInput = {
    source: 'base64',
    file: 'FAKE_BASE64_DATA',
    documentType: 'image',
  } as const;

  const prompt = 'Analyze this text';
  const outputSchema = { type: 'object', properties: {} };

  const createMocks = () => {
    const ocr: OCR = {
      recognizeText: jest.fn().mockResolvedValue(fakeOCRText),
    };

    const textStructuring: TextStructuring<any> = {
      parse: jest.fn().mockResolvedValue(fakeStructuredData),
    };

    return { ocr, textStructuring };
  };

  it('calls OCR and then structuring, returning structured data', async () => {
    const { ocr, textStructuring } = createMocks();
    const service = new DocumentUnderstandingService(ocr, textStructuring);

    const result = await service.understand(fakeInput, {
      prompt,
      outputSchema,
    });

    expect(ocr.recognizeText).toHaveBeenCalledWith(fakeInput);
    expect(textStructuring.parse).toHaveBeenCalledWith({
      text: fakeOCRText,
      prompt,
      outputSchema,
    });
    expect(result).toEqual(fakeStructuredData);
  });

  it('throws if OCR returns null', async () => {
    const { ocr, textStructuring } = createMocks();
    (ocr.recognizeText as jest.Mock).mockResolvedValueOnce(null);

    const service = new DocumentUnderstandingService(ocr, textStructuring);

    await expect(
      service.understand(fakeInput, { prompt })
    ).rejects.toThrow('OCR returned no text');

    expect(textStructuring.parse).not.toHaveBeenCalled();
  });
});

import type { Mistral } from '@mistralai/mistralai';
import type { OCRResponse, OCRPageObject } from '@mistralai/mistralai/models/components';

import { MistralOCRBase } from '../../../../../../src/infrastructure/adapters/ocr/mistral/base';
import type { VisualDocument } from '../../../../../../src/typings/visual-document';

class MistralOCRTest extends MistralOCRBase {
  recognize(): Promise<unknown> {
    throw new Error('not implemented');
  }

  public testConvertDocumentToContentChunk(input: VisualDocument) {
    return this.convertDocumentToContentChunk(input);
  }

  public testExtractMarkdown(response: OCRResponse): string {
    return this.extractMarkdown(response);
  }
}

describe('MistralOCRBase', () => {
  const dummyClient = {} as Mistral;
  const OCRService = new MistralOCRTest(dummyClient, 'test-model');

  describe('convertDocumentToContentChunk', () => {
    const base64Image: VisualDocument = {
      source: 'base64',
      file: 'data:image==',
      documentType: 'image',
    };

    const urlImage: VisualDocument = {
      source: 'url',
      file: 'https://example.com/image.jpg',
      documentType: 'image',
    };

    const base64Pdf: VisualDocument = {
      source: 'base64',
      file: 'data:pdf==',
      documentType: 'pdf',
    };

    const urlPdf: VisualDocument = {
      source: 'url',
      file: 'https://example.com/doc.pdf',
      documentType: 'pdf',
    };

    it('converts base64 image to image_url chunk', () => {
      expect(OCRService.testConvertDocumentToContentChunk(base64Image)).toEqual({
        type: 'image_url',
        imageUrl: base64Image.file,
      });
    });

    it('converts url image to image_url chunk', () => {
      expect(OCRService.testConvertDocumentToContentChunk(urlImage)).toEqual({
        type: 'image_url',
        imageUrl: urlImage.file,
      });
    });

    it('converts base64 pdf to document_url chunk', () => {
      expect(OCRService.testConvertDocumentToContentChunk(base64Pdf)).toEqual({
        type: 'document_url',
        documentUrl: base64Pdf.file,
      });
    });

    it('converts url pdf to document_url chunk', () => {
      expect(OCRService.testConvertDocumentToContentChunk(urlPdf)).toEqual({
        type: 'document_url',
        documentUrl: urlPdf.file,
      });
    });

    it('throws for unsupported source/documentType combination', () => {
      const invalid = {
        source: 'blob',
        file: 'blob',
        documentType: 'pdf',
      } as unknown as VisualDocument;

      expect(() => OCRService.testConvertDocumentToContentChunk(invalid)).toThrow(
        'Unsupported OCR input: blob:pdf'
      );
    });
  });

  describe('extractMarkdown', () => {
    const page = (markdown: string, index: number = 0): OCRPageObject => ({
      index,
      markdown,
      images: [],
      dimensions: null,
    });

    const mockResponse = (pages: OCRPageObject[]): OCRResponse => ({
      model: 'mistral-ocr-latest',
      usageInfo: { pagesProcessed: 1 },
      pages,
    });

    it('returns empty string when no pages', () => {
      expect(OCRService.testExtractMarkdown(mockResponse([]))).toBe('');
    });

    it('handles case where response.pages is undefined', () => {
      const response = {
        model: 'mistral-ocr-latest',
        durationMs: 0,
        // pages: undefined (implicitly missing)
      } as unknown as OCRResponse;

      const result = OCRService.testExtractMarkdown(response);
      expect(result).toBe('');
    });

    it('returns trimmed markdown from a single page', () => {
      expect(OCRService.testExtractMarkdown(mockResponse([page('  Hello world  ')]))).toBe('Hello world');
    });
    
    it('skips empty or whitespace-only markdown pages', () => {
      const response = mockResponse([
        page('  '),
        page('Page A'),
        page('\n\n'),
        page('Page B'),
      ]);

      expect(OCRService.testExtractMarkdown(response)).toBe(
        '### Page 1\n\nPage A\n\n### Page 2\n\nPage B'
      );
    });

    it('returns markdown directly when there is exactly one valid page', () => {
      const response = mockResponse([
        page('  This is a trimmed single page  '),
      ]);

      const result = OCRService.testExtractMarkdown(response);

      expect(result).toBe('This is a trimmed single page');
    });

    it('returns empty string when a single page exists but markdown is empty after trim', () => {
      const response = mockResponse([
        page('   '), // gets trimmed to ''
      ]);

      const result = OCRService.testExtractMarkdown(response);

      expect(result).toBe('');
    });

    it('adds headers for multiple valid pages', () => {
      const response = mockResponse([
        page('First page'),
        page('Second page'),
        page('Third page'),
      ]);

      expect(OCRService.testExtractMarkdown(response)).toBe(
        '### Page 1\n\nFirst page\n\n### Page 2\n\nSecond page\n\n### Page 3\n\nThird page'
      );
    });
  });
});

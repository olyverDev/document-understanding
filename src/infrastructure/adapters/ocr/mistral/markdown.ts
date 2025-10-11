import { OCRProcessingError } from '../../../../errors';
import { OCR } from '../../../../ports/ocr.interface';
import { VisualDocument } from '../../../../typings/visual-document';

import { MistralOCRBase } from './base';

export class MistralMarkdownOCR extends MistralOCRBase implements OCR<string> {
  async recognize(input: VisualDocument) {
    try {
      const response = await this.client.ocr.process({
        model: this.model,
        document: this.convertDocumentToContentChunk(input),
        includeImageBase64: false,
      });

      return this.extractMarkdown(response);
    } catch (error) {
      if (error instanceof OCRProcessingError) {
        throw error;
      }

      throw new OCRProcessingError((error as Error)?.message, error);
    }
  }
}

import { responseFormatFromZodObject } from '@mistralai/mistralai/extra/structChat';
import { z } from 'zod';

import { OCRProcessingError } from '../../../../errors';
import type { OCR } from '../../../../ports/ocr.interface';
import type { VisualDocument } from '../../../../typings/visual-document';

import { MistralOCRBase } from './base';

export class MistralTextChunksOCR extends MistralOCRBase implements OCR<string> {
  protected static readonly schema = z.object({
    textChunks: z.array(z.string()).describe(
      `An ordered list of plain text lines extracted from the document. 
      Extract everything as printed or handwritten text, not as illustrations, diagrams, images or tables.`
    ),
  }).strict();

  protected static readonly documentAnnotationFormat = responseFormatFromZodObject(MistralTextChunksOCR.schema);

  async recognize(input: VisualDocument) {
    try {
      const response = await this.client.ocr.process({
        model: this.model,
        document: this.convertDocumentToContentChunk(input),
        includeImageBase64: false,
        documentAnnotationFormat: MistralTextChunksOCR.documentAnnotationFormat,
      });

      const annotation = response.documentAnnotation;

      if (annotation == null) {
        throw new OCRProcessingError('No data found in Mistral OCR response');
      }

      if (!annotation?.trim()) {
        return '';
      }

      const parsed: z.infer<typeof MistralTextChunksOCR.schema> = JSON.parse(annotation);

      return parsed.textChunks.join('\n');
    } catch (error) {
      if (error instanceof OCRProcessingError) {
        throw error;
      }

      throw new OCRProcessingError((error as Error)?.message, error);
    }
  }
}

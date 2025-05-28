import type { OCR } from '../ports/ocr.interface';
import type { TextStructuring } from '../ports/text-structuring.interface';
import type { VisualDocument } from '../typings/visual-document';

import { UnderstandingEngine } from './understanding-engine.interface';

export class OCRTextUnderstanding<T, C = unknown> implements UnderstandingEngine<T, C> {
  constructor(
    private readonly ocr: OCR,
    private readonly textStructuring: TextStructuring<T, C>
  ) {}

  async understand(document: VisualDocument, context?: C): Promise<T> {
    const text = await this.ocr.recognizeText(document);

    if (!text) {
      throw new Error('OCR returned no text');
    }

    return this.textStructuring.parse(text, context);
  }
}

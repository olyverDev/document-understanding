import type { OCR } from '../ports/ocr';
import type { TextStructuring } from '../ports/text-structuring';
import type { StructuringFactors } from '../typings/structuring-factors';
import type { VisualDocument } from '../typings/visual-document';

import { UnderstandingEngine } from './understanding-engine';

export class OCRTextUnderstanding<T> implements UnderstandingEngine<T> {
  constructor(
    private readonly ocr: OCR,
    private readonly textStructuring: TextStructuring<T>
  ) {}

  async understand(document: VisualDocument, factors: StructuringFactors): Promise<T> {
    const text = await this.ocr.recognizeText(document);

    if (!text) {
      throw new Error('OCR returned no text');
    }

    return this.textStructuring.parse(text, factors);
  }
}

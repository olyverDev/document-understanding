import type { OCR } from '../ports/ocr.interface';
import type { TextStructuring } from '../ports/text-structuring.interface';
import type { VisualDocument } from '../typings/visual-document';

import { UnderstandingEngine } from './understanding-engine.interface';

export class OCRTextUnderstanding<T, C = unknown> implements UnderstandingEngine<T, C> {
  constructor(
    private readonly ocr: OCR<string>,
    private readonly textStructuring: TextStructuring<T, C>
  ) {}

  async understand(document: VisualDocument, context?: C): Promise<T> {
    const recognized = await this.ocr.recognize(document);

    /**
     * NOTE: only an OCR that returns text can be used by `OCRTextUnderstanding` engine
     * because `TextStructuring` adapter is desgined for text only input
     */
    if (typeof recognized !== 'string') {
      throw new Error('Invalid OCR result — expected string output for this engine');
    }

    return this.textStructuring.parse(recognized, context);
  }
}

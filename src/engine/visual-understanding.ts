import type { VisualStructuring } from '../ports/visual-structuring';
import type { StructuringFactors } from '../typings/structuring-factors';
import type { VisualDocument } from '../typings/visual-document';

import { UnderstandingEngine } from './understanding-engine';

export class VisualUnderstanding<T> implements UnderstandingEngine<T> {
  constructor(private readonly adapter: VisualStructuring<T>) {}

  understand(document: VisualDocument, factors: StructuringFactors): Promise<T> {
    return this.adapter.parse(document, factors);
  }
}

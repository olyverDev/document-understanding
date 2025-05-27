import type { VisualStructuring } from '../ports/visual-structuring.interface';
import type { VisualDocument } from '../typings/visual-document';

import { UnderstandingEngine } from './understanding-engine.interface';

export class VisualUnderstanding<T, C = unknown> implements UnderstandingEngine<T, C> {
  constructor(private readonly adapter: VisualStructuring<T, C>) {}

  understand(document: VisualDocument, context?: C): Promise<T> {
    return this.adapter.parse(document, context);
  }
}

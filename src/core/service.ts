import type { UnderstandingEngine } from '../engine/understanding-engine';
import type { VisualDocument } from '../typings/visual-document';

export class DocumentUnderstandingService<T, C = unknown> {
  constructor(
    private readonly engine: UnderstandingEngine<T, C>,
    private readonly engineContext?: C
  ) {}

  async understand(document: VisualDocument): Promise<T> {
    return this.engine.understand(document, this.engineContext);
  }
}

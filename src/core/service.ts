import type { UnderstandingEngine } from '../engine/understanding-engine';
import type { VisualDocument } from '../typings/visual-document';

export class DocumentUnderstandingService<T> {
  constructor(
    private readonly engine: UnderstandingEngine<T>,
    private readonly prompt: string,
    private readonly outputSchema?: Record<string, unknown>,
  ) {}

  async understand(document: VisualDocument): Promise<T> {
    return this.engine.understand(document, {
      prompt: this.prompt,
      outputSchema: this.outputSchema,
    });
  }
}

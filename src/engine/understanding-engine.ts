import type { VisualDocument } from '../typings/visual-document';

export interface UnderstandingEngine<T, C = unknown> {
  understand(document: VisualDocument, engineContext?: C): Promise<T>;
}

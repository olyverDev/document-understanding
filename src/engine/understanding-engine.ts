import type { StructuringFactors } from '../typings/structuring-factors';
import type { VisualDocument } from '../typings/visual-document';

export interface UnderstandingEngine<T> {
  understand(document: VisualDocument, factors: StructuringFactors): Promise<T>;
}

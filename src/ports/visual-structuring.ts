import { StructuringFactors } from "../typings/structuring-factors";
import type { VisualDocument } from "../typings/visual-document";

export interface VisualStructuring<T> {
  parse(input: VisualDocument, options: StructuringFactors): Promise<T>;
}

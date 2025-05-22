import { VisualDocument } from "../typings/visual-document";

export interface OCR {
  /**
   * Processes a file contents (image or PDF) and returns extracted markdown/plaintext.
   * @param input VisualDocument The input object containing the source, file content, and document type.
   * @returns A promise that resolves to the extracted markdown/plaintext or null if no text is found.
   */
  recognizeText(input: VisualDocument): Promise<string>;
}

export type OCRInput =
  | { source: 'base64'; file: string; documentType: 'image' | 'pdf' }
  | { source: 'url'; file: string; documentType: 'image' | 'pdf' };

export interface OCR {
  /**
   * Processes a file contents (image or PDF) and returns extracted markdown/plaintext.
   * @param input OCRInput The input object containing the source, file content, and document type.
   * @returns A promise that resolves to the extracted markdown/plaintext or null if no text is found.
   */
  recognizeText(input: OCRInput): Promise<string | null>;
}

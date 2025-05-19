export class OCRProcessingError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(`OCR failed: ${message}`);
    this.name = 'OCRProcessingError';
  }
}

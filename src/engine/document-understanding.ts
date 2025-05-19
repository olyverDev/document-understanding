import type { OCR, OCRInput } from '../ports/ocr';
import type { TextStructuring } from '../ports/text-structuring';

export class DocumentUnderstandingService<T> {
  constructor(
    private readonly ocr: OCR,
    private readonly textStructuring: TextStructuring<T>
  ) {}

  async understand(input: OCRInput, options: {
    prompt: string;
    outputSchema?: object;
  }): Promise<T> {
    const text = await this.ocr.recognizeText(input);
    if (!text) throw new Error('OCR returned no text');

    await new Promise((resolve) => setTimeout(resolve, 1000));

    return this.textStructuring.parse({
      text,
      prompt: options.prompt,
      outputSchema: options.outputSchema,
    });
  }
}

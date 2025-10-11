import { Mistral } from "@mistralai/mistralai";
import { DocumentURLChunk, ImageURLChunk, OCRResponse } from "@mistralai/mistralai/models/components";

import { VisualDocument } from "../../../../typings/visual-document";

export abstract class MistralOCRBase {
  constructor(
    protected readonly client: Mistral,
    protected readonly model: string
  ) {}

  abstract recognize(input: VisualDocument): Promise<unknown>;

  protected extractMarkdown(response: OCRResponse): string {
    const pages = response?.pages
      ?.map((page) => page?.markdown.trim())
      .filter(Boolean) ?? [];

    if (pages.length <= 1) {
      return pages[0] || '';
    }

    return pages
      .map((content, i) => `### Page ${i + 1}\n\n${content}`)
      .join('\n\n');
  }

  protected convertDocumentToContentChunk(input: VisualDocument): ImageURLChunk | DocumentURLChunk {
    const { source, file, documentType } = input;
    const strategy = `${source}:${documentType}` as const;

    const strategies: Record<typeof strategy, ImageURLChunk | DocumentURLChunk> = {
      'base64:image': { type: 'image_url', imageUrl: file },
      'url:image': { type: 'image_url', imageUrl: file },
      'base64:pdf': { type: 'document_url', documentUrl: file },
      'url:pdf': { type: 'document_url', documentUrl: file },
    };

    const chunk = strategies[strategy];

    if (!chunk) {
      throw new Error(`Unsupported OCR input: ${strategy}`);
    }

    return chunk;
  }
}

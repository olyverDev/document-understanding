import { Mistral } from '@mistralai/mistralai';
import type { ImageURLChunk, DocumentURLChunk } from '@mistralai/mistralai/models/components';

import { OCRProcessingError } from '../../../errors/ocr';
import type { OCR } from '../../../ports/ocr';
import type { VisualDocument } from '../../../typings/visual-document';
import { getMistralSingletonClient } from '../../api/mistral-client';

interface MistralOCRConfig {
  model: string;
}

export class MistralOCR implements OCR {
  private readonly modelName: string;

  constructor(
    private readonly client: Mistral,
    config: MistralOCRConfig
  ) {
    this.modelName = config.model;
  }

  private convertVisualDocumentToDocumentContentChunk(input: VisualDocument): ImageURLChunk | DocumentURLChunk {
    const { source, file, documentType } = input;

    type Key = `${typeof source}:${typeof documentType}`;

    const strategies: Record<Key, ImageURLChunk | DocumentURLChunk> = {
      'base64:image': {
        type: 'image_url',
        imageUrl: `data:image/jpeg;base64,${file}`,
      },
      'base64:pdf': {
        type: 'document_url',
        documentUrl: `data:application/pdf;base64,${file}`,
      },
      'url:image': {
        type: 'image_url',
        imageUrl: file,
      },
      'url:pdf': {
        type: 'document_url',
        documentUrl: file,
      },
    };

    const currentStrategy: Key = `${source}:${documentType}`;
    const documentContentChunk = strategies[currentStrategy];

    if (!documentContentChunk) {
      throw new Error(`Unsupported OCR input for ${source} ${documentType}`);
    }

    return documentContentChunk;
  }

  async recognizeText(input: VisualDocument): Promise<string> {
    try {
      const response = await this.client.ocr.process({
        model: this.modelName,
        document: this.convertVisualDocumentToDocumentContentChunk(input),
        includeImageBase64: false,
        imageLimit: null,
        imageMinSize: null, 
      });

      const resultMarkdown = response?.pages?.[0]?.markdown || null;

      if (!resultMarkdown) {
        throw new OCRProcessingError('No markdown content found in the Mistral OCR response', response);
      }

      return resultMarkdown;
    } catch (error) {
      if (error instanceof OCRProcessingError) {
        throw error;
      }

      throw new OCRProcessingError((error as Error)?.message, error);
    }
  }
}

export type MistralOCRCFactoryConfig = {
  apiKey: string;
  model?: string;
};

export const MistralOCRFactory = (config: MistralOCRCFactoryConfig): OCR => {
  const client = getMistralSingletonClient({ apiKey: config.apiKey });
  return new MistralOCR(client, { model: config.model ?? 'mistral-ocr-latest' });
};

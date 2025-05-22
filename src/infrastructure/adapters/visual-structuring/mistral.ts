import { Mistral } from '@mistralai/mistralai';
import type { ContentChunk, JsonSchema } from '@mistralai/mistralai/models/components';

import { VisualStructuringError } from '../../../errors/visual-structuring';
import type { VisualStructuring } from '../../../ports/visual-structuring';
import { StructuringFactors } from '../../../typings/structuring-factors';
import type { VisualDocument } from '../../../typings/visual-document';
import { getMistralSingletonClient } from '../../api/mistral-client';

interface MistralVisualStructuringConfig {
  model: string;
}

export class MistralVisualStructuring<T> implements VisualStructuring<T> {
  private readonly modelName: string;

  constructor(
    private readonly client: Mistral,
    config: MistralVisualStructuringConfig
  ) {
    this.modelName = config.model;
  }

  private getBase64MimeAndExtension(base64: string): { mime: string; ext: string; content: string } {
    const match = base64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/);
    if (match) {
      const mime = match[1];
      const ext = mime.split('/')[1];
      const content = match[2];
      return { mime, ext, content };
    }

    // Fallback: assume jpeg if no MIME prefix
    return { mime: 'image/jpeg', ext: 'jpg', content: base64 };
  }

  private convertVisualDocumentToContentChunk(input: VisualDocument): ContentChunk {
    const { source, file, documentType } = input;

    type Key = `${typeof source}:${typeof documentType}`;

    const strategies: Record<Key, () => ContentChunk> = {
      'base64:pdf': () => ({
        type: 'document_url',
        documentUrl: `data:application/pdf;base64,${file}`,
      }),

      'base64:image': () => {
        const { mime, content } = this.getBase64MimeAndExtension(file);
        return {
          type: 'image_url',
          imageUrl: `data:${mime};base64,${content}`,
        };
      },

      'url:pdf': () => ({
        type: 'document_url',
        documentUrl: file,
      }),

      'url:image': () => ({
        type: 'image_url',
        imageUrl: file,
      }),
    };

    const currentStrategy: Key = `${source}:${documentType}`;
    const resolve = strategies[currentStrategy];

    if (!resolve) {
      throw new Error(`Unsupported OCR input source: ${source}, type: ${documentType}`);
    }

    return resolve();
  }

  async parse(input: VisualDocument, {
    prompt,
    outputSchema,
  }: StructuringFactors): Promise<T> {
    const contentChunk = this.convertVisualDocumentToContentChunk(input);

    const messageContent: ContentChunk[] = [
      { type: 'text', text: prompt },
      contentChunk,
    ];

    try {
      const response = await this.client.chat.complete({
        model: this.modelName,
        messages: [
          {
            role: 'user',
            content: messageContent,
          },
        ],
        responseFormat: outputSchema
          ? {
              type: 'json_schema',
              jsonSchema: {
                strict: true,
                schemaDefinition: outputSchema as JsonSchema['schemaDefinition'],
                name: outputSchema.title as string,
                description: outputSchema.description as string,
              },
            }
          : {
              type: 'json_object',
            },
      });

      const raw = response?.choices?.[0]?.message?.content;

      if (typeof raw !== 'string') {
        throw new VisualStructuringError('Expected response to be a string.');
      }

      return JSON.parse(raw) as T;
    } catch (error) {
      if (error instanceof VisualStructuringError) {
        throw error;
      }

      const message =
        error instanceof SyntaxError
          ? 'Failed to parse response as JSON'
          : (error as Error).message;

      throw new VisualStructuringError(message, error);
    }
  }
}

interface MistralVisualStructuringFactoryConfig {
  apiKey: string;
  model?: string;
}

export function MistralVisualStructuringFactory<T>(
  config: MistralVisualStructuringFactoryConfig
): VisualStructuring<T> {
  const client = getMistralSingletonClient({ apiKey: config.apiKey });

  return new MistralVisualStructuring<T>(client, {
    model: config.model ?? 'mistral-medium-latest',
  });
}

import { Mistral } from '@mistralai/mistralai';
import type { ContentChunk, JsonSchema } from '@mistralai/mistralai/models/components';

import { VisualStructuringError } from '../../../errors/visual-structuring';
import type { VisualStructuring } from '../../../ports/visual-structuring.interface';
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

  private convertDocumentToContentChunk(input: VisualDocument): ContentChunk {
    const { source, file, documentType } = input;

    type Key = `${typeof source}:${typeof documentType}`;

    /**
     * NOTE: `base64:pdf` is not supported by Mistral Completion API
     * So the `documentUrl` should start from `https`, at least it says it in the error
     * 
     * {
        type: 'document_url',
        documentUrl: file,
      }
      * Docs are not very detailed regarding `ContentChunk` for Completion API, `documentUrl` is a `string`
     */
    const strategies: Partial<Record<Key, ContentChunk>> = {
      'base64:image': {
          type: 'image_url',
          imageUrl: file,
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
      throw new Error(`Unsupported OCR input source: ${source}, type: ${documentType}`);
    }

    return documentContentChunk;
  }

  async parse(input: VisualDocument, {
    prompt,
    outputSchema,
  }: StructuringFactors): Promise<T> {
    const contentChunk = this.convertDocumentToContentChunk(input);

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

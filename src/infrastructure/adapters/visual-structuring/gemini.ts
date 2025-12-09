import { GoogleGenAI, Part, Schema, Type } from '@google/genai';

import { VisualStructuringError } from '../../../errors/visual-structuring';
import type { VisualStructuring } from '../../../ports/visual-structuring.interface';
import type { VisualDocument } from '../../../typings/visual-document';

interface GeminiVisualStructuringConfig {
  model: string;
}

export interface GeminiVisualStructuringContext {
  prompt: string;
  outputSchema?: Record<string, unknown>;
}

export class GeminiVisualStructuring<T> implements VisualStructuring<T, GeminiVisualStructuringContext> {
  private readonly modelName: string;

  constructor(
    private readonly client: GoogleGenAI,
    config: GeminiVisualStructuringConfig
  ) {
    this.modelName = config.model;
  }

  private convertDocumentToPart(input: VisualDocument): Part {
    const { source, file, documentType } = input;

    type Key = `${typeof source}:${typeof documentType}`;

    const strategies: Partial<Record<Key, Part>> = {
      'base64:image': {
        inlineData: {
          data: file.replace(/^data:image\/\w+;base64,/, ''),
          mimeType: this.extractMimeType(file) || 'image/jpeg',
        },
      },
      'url:image': {
        fileData: {
          mimeType: 'image/jpeg',
          fileUri: file,
        },
      },
      'url:pdf': {
        fileData: {
          mimeType: 'application/pdf',
          fileUri: file,
        },
      },
    };

    const currentStrategy: Key = `${source}:${documentType}`;
    const part = strategies[currentStrategy];

    if (!part) {
      throw new Error(`Unsupported visual input source: ${source}, type: ${documentType}`);
    }

    return part;
  }

  private extractMimeType(base64String: string): string | null {
    const match = base64String.match(/^data:(image\/\w+);base64,/);
    return match ? match[1] : null;
  }

  private convertSchemaToGeminiFormat(schema: Record<string, unknown>): Schema {
    // Convert JSON Schema to Gemini's schema format
    const convertType = (type: string): Type => {
      const typeMap: Record<string, Type> = {
        'string': Type.STRING,
        'number': Type.NUMBER,
        'integer': Type.INTEGER,
        'boolean': Type.BOOLEAN,
        'array': Type.ARRAY,
        'object': Type.OBJECT,
      };
      return typeMap[type] || Type.STRING;
    };

    // Handle array schemas (top-level arrays)
    if (schema.type === 'array' && schema.items) {
      const items = schema.items as Record<string, unknown>;
      return {
        type: Type.ARRAY,
        items: items.type === 'object' 
          ? this.convertSchemaToGeminiFormat(items)
          : { type: convertType(items.type as string) },
        description: schema.description as string | undefined,
      };
    }

    // Handle object schemas
    if (!schema.properties) {
      return {
        type: Type.OBJECT,
        properties: {},
      };
    }

    const convertProperties = (props: Record<string, unknown>): Record<string, Schema> => {
      const result: Record<string, Schema> = {};
      for (const [key, value] of Object.entries(props)) {
        const propValue = value as Record<string, unknown>;
        if (propValue.type === 'array' && propValue.items) {
          const items = propValue.items as Record<string, unknown>;
          result[key] = {
            type: Type.ARRAY,
            items: items.type === 'object' 
              ? this.convertSchemaToGeminiFormat(items)
              : { type: convertType(items.type as string) },
            description: propValue.description as string | undefined,
          };
        } else if (propValue.type === 'object' && propValue.properties) {
          result[key] = this.convertSchemaToGeminiFormat(propValue);
        } else {
          const schema: Schema = {
            type: convertType(propValue.type as string),
            description: propValue.description as string | undefined,
          };
          
          // Handle enum constraints
          if (propValue.enum && Array.isArray(propValue.enum)) {
            schema.enum = propValue.enum as string[];
          }
          
          result[key] = schema;
        }
      }
      return result;
    };

    return {
      type: Type.OBJECT,
      properties: convertProperties(schema.properties as Record<string, unknown>),
      required: (schema.required as string[]) || [],
    };
  }

  async parse(input: VisualDocument, {
    prompt,
    outputSchema,
  }: GeminiVisualStructuringContext): Promise<T> {
    const documentPart = this.convertDocumentToPart(input);

    try {
      const config: {
        temperature?: number;
        responseMimeType?: string;
        responseSchema?: Schema;
      } = {
        temperature: 0.1,
        responseMimeType: 'application/json',
      };

      if (outputSchema) {
        config.responseSchema = this.convertSchemaToGeminiFormat(outputSchema);
      }

      const chat = this.client.chats.create({
        model: this.modelName,
        config,
      });

      const result = await chat.sendMessage({
        message: [
          { text: prompt },
          documentPart,
        ],
      });

      const text = result.text;

      if (!text) {
        throw new VisualStructuringError('Expected response to contain text.');
      }

      return JSON.parse(text) as T;
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

interface GeminiVisualStructuringFactoryConfig {
  client: GoogleGenAI;
  model?: string;
}

export function GeminiVisualStructuringFactory<T>(
  config: GeminiVisualStructuringFactoryConfig
): VisualStructuring<T, GeminiVisualStructuringContext> {
  return new GeminiVisualStructuring<T>(config.client, {
    model: config.model ?? 'gemini-2.0-flash-exp',
  });
}

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

  private static readonly BASE64_DATA_URI_PATTERN = /^data:(image\/\w+);base64,/;

  private extractMimeType(base64String: string): string | null {
    const match = base64String.match(GeminiVisualStructuring.BASE64_DATA_URI_PATTERN);
    return match ? match[1] : null;
  }

  private detectMimeTypeFromUrl(url: string, documentType: 'image' | 'pdf'): string {
    if (documentType === 'pdf') {
      return 'application/pdf';
    }

    const extension = url.split('.').pop()?.toLowerCase();
    const mimeTypeMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'bmp': 'image/bmp',
    };

    return mimeTypeMap[extension || ''] || 'image/jpeg';
  }

  private convertDocumentToPart(input: VisualDocument): Part {
    const { source, file, documentType } = input;

    type Key = `${typeof source}:${typeof documentType}`;

    const strategies: Partial<Record<Key, Part>> = {
      'base64:image': {
        inlineData: {
          data: file.replace(GeminiVisualStructuring.BASE64_DATA_URI_PATTERN, ''),
          mimeType: this.extractMimeType(file) || 'image/jpeg',
        },
      },
      'url:image': {
        fileData: {
          fileUri: file,
          // mimeType is typed as optional in SDK but marked "Required" in docs
          // Gemini may auto-detect from fileUri, but providing it for safety
          mimeType: this.detectMimeTypeFromUrl(file, 'image'),
        },
      },
      'url:pdf': {
        fileData: {
          fileUri: file,
          mimeType: this.detectMimeTypeFromUrl(file, 'pdf'),
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

  private convertJsonSchemaTypeToGeminiType(jsonSchemaType: string): Type {
    const typeMap: Record<string, Type> = {
      'string': Type.STRING,
      'number': Type.NUMBER,
      'integer': Type.INTEGER,
      'boolean': Type.BOOLEAN,
      'array': Type.ARRAY,
      'object': Type.OBJECT,
    };
    return typeMap[jsonSchemaType] || Type.STRING;
  }

  private convertArraySchemaToGeminiFormat(schema: Record<string, unknown>): Schema {
    const items = schema.items as Record<string, unknown>;
    return {
      type: Type.ARRAY,
      items: items.type === 'object' 
        ? this.convertSchemaToGeminiFormat(items)
        : { type: this.convertJsonSchemaTypeToGeminiType(items.type as string) },
      description: schema.description as string | undefined,
    };
  }

  private convertObjectPropertyToGeminiSchema(
    propValue: Record<string, unknown>
  ): Schema {
    if (propValue.type === 'array' && propValue.items) {
      const items = propValue.items as Record<string, unknown>;
      return {
        type: Type.ARRAY,
        items: items.type === 'object' 
          ? this.convertSchemaToGeminiFormat(items)
          : { type: this.convertJsonSchemaTypeToGeminiType(items.type as string) },
        description: propValue.description as string | undefined,
      };
    }
    
    if (propValue.type === 'object' && propValue.properties) {
      return this.convertSchemaToGeminiFormat(propValue);
    }
    
    const schema: Schema = {
      type: this.convertJsonSchemaTypeToGeminiType(propValue.type as string),
      description: propValue.description as string | undefined,
    };
    
    if (propValue.enum && Array.isArray(propValue.enum)) {
      schema.enum = propValue.enum as string[];
    }
    
    return schema;
  }

  private convertPropertiesToGeminiFormat(
    properties: Record<string, unknown>
  ): Record<string, Schema> {
    return Object.entries(properties).reduce(
      (result, [key, value]) => {
        const propValue = value as Record<string, unknown>;
        result[key] = this.convertObjectPropertyToGeminiSchema(propValue);
        return result;
      },
      {} as Record<string, Schema>
    );
  }

  private convertSchemaToGeminiFormat(schema: Record<string, unknown>): Schema {
    if (schema.type === 'array' && schema.items) {
      return this.convertArraySchemaToGeminiFormat(schema);
    }

    if (!schema.properties) {
      return {
        type: Type.OBJECT,
        properties: {},
      };
    }

    return {
      type: Type.OBJECT,
      properties: this.convertPropertiesToGeminiFormat(
        schema.properties as Record<string, unknown>
      ),
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

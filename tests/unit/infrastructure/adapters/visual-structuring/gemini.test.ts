import type { GoogleGenAI } from '@google/genai';

import { VisualStructuringError } from '../../../../../src/errors/visual-structuring';
import { GeminiVisualStructuring } from '../../../../../src/infrastructure/adapters/visual-structuring/gemini';
import type { VisualDocument } from '../../../../../src/typings/visual-document';

describe('GeminiVisualStructuringAdapter', () => {
  const mockSendMessage = jest.fn();
  const mockChatsCreate = jest.fn();
  
  const mockClient = {
    chats: {
      create: mockChatsCreate,
    },
  } as unknown as GoogleGenAI;

  const model = 'gemini-2.0-flash-exp';
  const adapter = new GeminiVisualStructuring<{ field: string }>(mockClient, { model });

  const base64Image: VisualDocument = {
    source: 'base64',
    documentType: 'image',
    file: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA...',
  };

  const urlImage: VisualDocument = {
    source: 'url',
    documentType: 'image',
    file: 'https://example.com/sample.jpg',
  };

  const urlPDF: VisualDocument = {
    source: 'url',
    documentType: 'pdf',
    file: 'https://example.com/sample.pdf',
  };

  const prompt = 'Extract data from image';
  const schema = {
    title: 'TestSchema',
    description: 'Just a test',
    type: 'object',
    properties: { field: { type: 'string' } },
    required: ['field'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockChatsCreate.mockReturnValue({
      sendMessage: mockSendMessage,
    });
  });

  it('parses valid response correctly with schema', async () => {
    const expected = { field: 'value' };
    mockSendMessage.mockResolvedValueOnce({
      text: JSON.stringify(expected),
    });

    const result = await adapter.parse(base64Image, { prompt, outputSchema: schema });
    expect(result).toEqual(expected);
    
    expect(mockChatsCreate).toHaveBeenCalledWith({
      model,
      config: expect.objectContaining({
        responseMimeType: 'application/json',
        responseSchema: expect.any(Object),
      }),
    });
    expect(mockSendMessage).toHaveBeenCalledWith({
      message: expect.arrayContaining([
        expect.objectContaining({ text: prompt }),
        expect.any(Object),
      ]),
    });
  });

  it('parses valid response without schema', async () => {
    const expected = { field: 'fallback' };
    mockSendMessage.mockResolvedValueOnce({
      text: JSON.stringify(expected),
    });

    const result = await adapter.parse(base64Image, { prompt });

    expect(result).toEqual(expected);
    expect(mockChatsCreate).toHaveBeenCalledWith({
      model,
      config: expect.objectContaining({
        responseMimeType: 'application/json',
      }),
    });
  });

  it('throws VisualStructuringError if response text is empty', async () => {
    mockSendMessage.mockResolvedValueOnce({
      text: '',
    });

    await expect(adapter.parse(base64Image, { prompt, outputSchema: schema }))
      .rejects.toThrow(VisualStructuringError);
  });

  it('throws VisualStructuringError if content is invalid JSON', async () => {
    mockSendMessage.mockResolvedValueOnce({
      text: '{ invalid json',
    });

    await expect(adapter.parse(base64Image, { prompt, outputSchema: schema }))
      .rejects.toThrow(VisualStructuringError);
  });

  it('rethrows VisualStructuringError as-is', async () => {
    const error = new VisualStructuringError('already wrapped');
    mockSendMessage.mockRejectedValueOnce(error);

    await expect(adapter.parse(base64Image, { prompt, outputSchema: schema }))
      .rejects.toBe(error);
  });

  it('wraps unexpected SDK errors into VisualStructuringError', async () => {
    mockSendMessage.mockRejectedValueOnce(new Error('SDK exploded'));

    await expect(adapter.parse(base64Image, { prompt, outputSchema: schema }))
      .rejects.toThrow(VisualStructuringError);
  });

  it('throws for unsupported base64 PDF input', () => {
    const invalid: VisualDocument = {
      source: 'base64',
      documentType: 'pdf',
      file: 'data:application/pdf;base64,JVBERi0xLjQKJ...',
    };

    expect(() =>
      adapter['convertDocumentToPart'](invalid)
    ).toThrow('Unsupported visual input source: base64, type: pdf');
  });

  it('converts base64 image to inline data part correctly', () => {
    const part = adapter['convertDocumentToPart'](base64Image);
    expect(part).toEqual({
      inlineData: {
        data: 'iVBORw0KGgoAAAANSUhEUgAAA...',
        mimeType: 'image/png',
      },
    });
  });

  it('converts URL image to file data part correctly', () => {
    const part = adapter['convertDocumentToPart'](urlImage);
    expect(part).toEqual({
      fileData: {
        mimeType: 'image/jpeg',
        fileUri: urlImage.file,
      },
    });
  });

  it('converts URL PDF to file data part correctly', () => {
    const part = adapter['convertDocumentToPart'](urlPDF);
    expect(part).toEqual({
      fileData: {
        mimeType: 'application/pdf',
        fileUri: urlPDF.file,
      },
    });
  });

  it('extracts MIME type from base64 string correctly', () => {
    const jpegBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...';
    const mimeType = adapter['extractMimeType'](jpegBase64);
    expect(mimeType).toBe('image/jpeg');
  });

  it('returns null for MIME type when not present', () => {
    const plainBase64 = 'iVBORw0KGgoAAAANSUhEUgAAA...';
    const mimeType = adapter['extractMimeType'](plainBase64);
    expect(mimeType).toBeNull();
  });

  it('converts JSON schema to Gemini format correctly', () => {
    const jsonSchema = {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'The name' },
        age: { type: 'integer' },
        active: { type: 'boolean' },
      },
      required: ['name'],
    };

    const geminiSchema = adapter['convertSchemaToGeminiFormat'](jsonSchema);
    
    expect(geminiSchema).toEqual({
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING', description: 'The name' },
        age: { type: 'INTEGER', description: undefined },
        active: { type: 'BOOLEAN', description: undefined },
      },
      required: ['name'],
    });
  });

  it('converts nested object schema correctly', () => {
    const nestedSchema = {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      },
    };

    const geminiSchema = adapter['convertSchemaToGeminiFormat'](nestedSchema);
    
    expect(geminiSchema.properties).toBeDefined();
    expect(geminiSchema.properties!.user).toEqual({
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING', description: undefined },
      },
      required: [],
    });
  });

  it('converts array schema correctly', () => {
    const arraySchema = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    };

    const geminiSchema = adapter['convertSchemaToGeminiFormat'](arraySchema);
    
    expect(geminiSchema.properties).toBeDefined();
    expect(geminiSchema.properties!.items).toEqual({
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: undefined,
    });
  });

  it('converts array of objects schema correctly', () => {
    const arrayObjectSchema = {
      type: 'object',
      properties: {
        users: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
      },
    };

    const geminiSchema = adapter['convertSchemaToGeminiFormat'](arrayObjectSchema);
    
    expect(geminiSchema.properties).toBeDefined();
    expect(geminiSchema.properties!.users).toEqual({
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING', description: undefined },
        },
        required: [],
      },
      description: undefined,
    });
  });
});


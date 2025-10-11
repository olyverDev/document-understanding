import type { Mistral } from '@mistralai/mistralai';

import { VisualStructuringError } from '../../../../../src/errors/visual-structuring';
import { MistralVisualStructuring } from '../../../../../src/infrastructure/adapters/visual-structuring/mistral';
import type { VisualDocument } from '../../../../../src/typings/visual-document';

describe('MistralVisualStructuringAdapter', () => {
  const mockComplete = jest.fn();
  const mockClient = {
    chat: { complete: mockComplete },
  } as unknown as Mistral;

  const model = 'mistral-medium-latest';
  const adapter = new MistralVisualStructuring<{ field: string }>(mockClient, { model });

  const base64Image: VisualDocument = {
    source: 'base64',
    documentType: 'image',
    file: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA...',
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
    strict: true,
    schemaDefinition: {
      type: 'object',
      properties: { field: { type: 'string' } },
      required: ['field'],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('parses valid response correctly', async () => {
    const expected = { field: 'value' };
    mockComplete.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(expected) } }],
    });

    const result = await adapter.parse(base64Image, { prompt, outputSchema: schema });
    expect(result).toEqual(expected);
  });

  it('uses json_object format if outputSchema is not provided', async () => {
    const expected = { field: 'fallback' };
    mockComplete.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(expected) } }],
    });

    const result = await adapter.parse(base64Image, { prompt });

    expect(result).toEqual(expected);
    expect(mockComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        responseFormat: { type: 'json_object' },
      })
    );
  });

  it('throws VisualStructuringError if response content is null', async () => {
    mockComplete.mockResolvedValueOnce({
      choices: [{ message: { content: null } }],
    });

    await expect(adapter.parse(base64Image, { prompt, outputSchema: schema }))
      .rejects.toThrow(VisualStructuringError);
  });

  it('throws VisualStructuringError if content is invalid JSON', async () => {
    mockComplete.mockResolvedValueOnce({
      choices: [{ message: { content: '{ invalid json' } }],
    });

    await expect(adapter.parse(base64Image, { prompt, outputSchema: schema }))
      .rejects.toThrow(VisualStructuringError);
  });

  it('rethrows VisualStructuringError as-is', async () => {
    const error = new VisualStructuringError('already wrapped');
    mockComplete.mockRejectedValueOnce(error);

    await expect(adapter.parse(base64Image, { prompt, outputSchema: schema }))
      .rejects.toBe(error);
  });

  it('wraps unexpected SDK errors into VisualStructuringError', async () => {
    mockComplete.mockRejectedValueOnce(new Error('SDK exploded'));

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
      adapter['convertDocumentToContentChunk'](invalid)
    ).toThrow();
  });

  it('converts base64 image to image_url chunk correctly', () => {
    const chunk = adapter['convertDocumentToContentChunk'](base64Image);
    expect(chunk).toEqual({
      type: 'image_url',
      imageUrl: base64Image.file,
    });
  });

  it('converts URL pdf to document_url chunk correctly', () => {
    const chunk = adapter['convertDocumentToContentChunk'](urlPDF);
    expect(chunk).toEqual({
      type: 'document_url',
      documentUrl: urlPDF.file,
    });
  });
});

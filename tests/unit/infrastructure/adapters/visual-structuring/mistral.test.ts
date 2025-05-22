import type { Mistral } from '@mistralai/mistralai';

import { VisualStructuringError } from '../../../../../src/errors/visual-structuring';
import { MistralVisualStructuring } from '../../../../../src/infrastructure/adapters/visual-structuring/mistral';
import type { StructuringFactors } from '../../../../../src/typings/structuring-factors';
import type { VisualDocument } from '../../../../../src/typings/visual-document';

describe('MistralVisualStructuringAdapter', () => {
  const mockProcess = jest.fn();
  const mockClient = {
    chat: {
      complete: mockProcess,
    },
  } as unknown as Mistral;

  const model = 'mistral-medium-latest';
  const adapter = new MistralVisualStructuring<{ field: string }>(mockClient, { model });

  const base64Image: VisualDocument = {
    source: 'base64',
    documentType: 'image',
    file: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA...',
  };

  const prompt = 'Extract data from image';
  const schema: StructuringFactors['outputSchema'] = {
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
    mockProcess.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(expected) } }],
    });

    const result = await adapter.parse(base64Image, { prompt, outputSchema: schema });
    expect(result).toEqual(expected);
  });

  it('throws VisualStructuringError if response content is null', async () => {
    mockProcess.mockResolvedValueOnce({
      choices: [{ message: { content: null } }],
    });

    await expect(
      adapter.parse(base64Image, { prompt, outputSchema: schema })
    ).rejects.toThrow(VisualStructuringError);
  });

  it('throws VisualStructuringError if content is invalid JSON', async () => {
    mockProcess.mockResolvedValueOnce({
      choices: [{ message: { content: '{ invalid json' } }],
    });

    await expect(
      adapter.parse(base64Image, { prompt, outputSchema: schema })
    ).rejects.toThrow(VisualStructuringError);
  });

  it('rethrows VisualStructuringError as-is', async () => {
    const error = new VisualStructuringError('already wrapped');
    mockProcess.mockRejectedValueOnce(error);

    await expect(
      adapter.parse(base64Image, { prompt, outputSchema: schema })
    ).rejects.toBe(error);
  });

  it('wraps unexpected SDK errors into VisualStructuringError', async () => {
    mockProcess.mockRejectedValueOnce(new Error('SDK exploded'));

    await expect(
      adapter.parse(base64Image, { prompt, outputSchema: schema })
    ).rejects.toThrow(VisualStructuringError);
  });

  it('throws for unsupported input combination', () => {
    const invalid: VisualDocument = {
      // @ts-expect-error — intentionally invalid
      source: 'blob',
      documentType: 'pdf',
      file: '...',
    };

    expect(() =>
      adapter['convertVisualDocumentToContentChunk'](invalid)
    ).toThrowError(/Unsupported OCR input source/);
  });
});

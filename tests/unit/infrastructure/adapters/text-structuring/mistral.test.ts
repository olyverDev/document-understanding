import { Mistral } from '@mistralai/mistralai';

import { TextStructuringError } from '../../../../../src/errors/text-structuring';
import { MistralTextStructuring } from '../../../../../src/infrastructure/adapters/text-structuring/mistral';

describe('MistralTextStructuring', () => {
  const mockComplete = jest.fn();

  const mockClient = {
    chat: {
      complete: mockComplete,
    },
  } as unknown as Mistral;

  const model = 'mistral-medium-latest';
  const adapter = new MistralTextStructuring<{ value: string }>(mockClient, { model });

  const prompt = 'Extract a single value.';
  const text = 'markdown content';

  const schema = {
    title: 'Doc',
    description: 'desc',
    type: 'object',
    properties: {
      value: { type: 'string' },
    },
    required: ['value'],
    additionalProperties: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('parses valid JSON with schema', async () => {
    const expected = { value: 'done' };

    mockComplete.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(expected) } }],
    });

    const result = await adapter.parse(text, { prompt, outputSchema: schema });

    expect(result).toEqual(expected);

    expect(mockComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        model,
        messages: expect.any(Array),
        responseFormat: expect.objectContaining({
          type: 'json_schema',
          jsonSchema: expect.objectContaining({
            name: schema.title,
            description: schema.description,
            strict: true,
            schemaDefinition: schema,
          }),
        }),
      })
    );
  });

  it('throws TextStructuringError if response content is not a string', async () => {
    mockComplete.mockResolvedValueOnce({
      choices: [{ message: { content: null } }],
    });

    await expect(
      adapter.parse(text, { prompt, outputSchema: schema })
    ).rejects.toThrow(TextStructuringError);
  });

  it('throws TextStructuringError on invalid JSON', async () => {
    mockComplete.mockResolvedValueOnce({
      choices: [{ message: { content: '{ not json' } }],
    });

    await expect(
      adapter.parse(text, { prompt, outputSchema: schema })
    ).rejects.toThrow(TextStructuringError);
  });

  it('rethrows an existing TextStructuringError', async () => {
    const error = new TextStructuringError('Already wrapped');
    mockComplete.mockRejectedValueOnce(error);

    await expect(
      adapter.parse(text, { prompt, outputSchema: schema })
    ).rejects.toBe(error);
  });

  it('throws TextStructuringError on unexpected SDK error', async () => {
    mockComplete.mockRejectedValueOnce(new Error('Unknown'));

    await expect(
      adapter.parse(text, { prompt, outputSchema: schema })
    ).rejects.toThrow(TextStructuringError);
  });

  it('handles missing choices gracefully', async () => {
    mockComplete.mockResolvedValueOnce({
      choices: [],
    });

    await expect(
      adapter.parse(text, { prompt, outputSchema: schema })
    ).rejects.toThrow(TextStructuringError);
  });

  it('handles undefined choices field', async () => {
    mockComplete.mockResolvedValueOnce({
      choices: undefined,
    });

    await expect(
      adapter.parse(text, { prompt, outputSchema: schema })
    ).rejects.toThrow(TextStructuringError);
  });
});

import { Mistral } from '@mistralai/mistralai';

import { TextStructuringError } from '../../../../../src/errors/text-structuring';
import { MistralTextStructuring } from '../../../../../src/infrastructure/adapters/text-structuring/mistral';

describe('MistralTextStructuring', () => {
  const mockProcess = jest.fn();
  const mockClient = {
    chat: {
      complete: mockProcess,
    },
  } as unknown as Mistral;

  const modelName = 'mistral-medium-latest';
  const adapter = new MistralTextStructuring<{ value: string }>(
    mockClient,
    { model: modelName }
  );

  const prompt = 'Extract value from markdown.';
  const text = 'Sample OCR markdown';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('parses valid JSON when no schema is provided', async () => {
    const expected = { value: 'done' };
    mockProcess.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(expected) } }],
    });

    const result = await adapter.parse({ prompt, text });
    expect(result).toEqual(expected);
    expect(mockProcess).toHaveBeenCalledWith(
      expect.objectContaining({
        model: modelName,
        responseFormat: { type: 'json_object' },
      })
    );
  });

  it('parses valid JSON when schema is provided', async () => {
    const expected = { value: 'structured' };
    mockProcess.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(expected) } }],
    });

    const schema = {
      title: 'Doc',
      type: 'object',
      description: 'Simple test schema',
      properties: {
        value: { type: 'string' },
      },
      required: ['value'],
      additionalProperties: false,
    };

    const result = await adapter.parse({ prompt, text, outputSchema: schema });
    expect(result).toEqual(expected);
    expect(mockProcess).toHaveBeenCalledWith(
      expect.objectContaining({
        responseFormat: {
          type: 'json_schema',
          jsonSchema: expect.objectContaining({
            schemaDefinition: schema,
            strict: true,
            name: schema.title,
          }),
        },
      })
    );
  });

  it('throws a TextStructuringError when response is not a string', async () => {
    mockProcess.mockResolvedValueOnce({
      choices: [{ message: { content: null } }],
    });

    await expect(adapter.parse({ prompt, text })).rejects.toThrow(TextStructuringError);
  });

  it('throws a TextStructuringError on invalid JSON', async () => {
    mockProcess.mockResolvedValueOnce({
      choices: [{ message: { content: '{ broken json' } }],
    });

    await expect(adapter.parse({ prompt, text })).rejects.toThrow(TextStructuringError);
  });

  it('rethrows TextStructuringError as-is', async () => {
    const error = new TextStructuringError('Already wrapped');
    mockProcess.mockRejectedValueOnce(error);

    await expect(adapter.parse({ prompt, text })).rejects.toBe(error);
  });

  it('throws TextStructuringError on unexpected SDK errors', async () => {
    mockProcess.mockRejectedValueOnce(new Error('Boom'));

    await expect(adapter.parse({ prompt, text })).rejects.toThrow(TextStructuringError);
  });
});

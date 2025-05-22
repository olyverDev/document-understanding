import { DocumentUnderstandingService } from '../../../src/core/service';
import type { UnderstandingEngine } from '../../../src/engine/understanding-engine';
import type { VisualDocument } from '../../../src/typings/visual-document';

describe('DocumentUnderstandingService', () => {
  const mockUnderstand = jest.fn();

  const mockEngine: UnderstandingEngine<{ field: string }> = {
    understand: mockUnderstand,
  };

  const prompt = 'Extract data';
  const outputSchema = {
    title: 'Schema',
    description: 'Some schema',
    type: 'object',
    properties: {
      field: { type: 'string' },
    },
    required: ['field'],
  };

  const document: VisualDocument = {
    source: 'base64',
    file: 'data:image/png;base64,...',
    documentType: 'image',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls engine.understand with prompt and schema', async () => {
    const expected = { field: 'value' };
    mockUnderstand.mockResolvedValueOnce(expected);

    const service = new DocumentUnderstandingService(mockEngine, prompt, outputSchema);
    const result = await service.understand(document);

    expect(mockUnderstand).toHaveBeenCalledWith(document, {
      prompt,
      outputSchema,
    });

    expect(result).toEqual(expected);
  });

  it('works without outputSchema', async () => {
    const expected = { field: 'value' };
    mockUnderstand.mockResolvedValueOnce(expected);

    const service = new DocumentUnderstandingService(mockEngine, prompt);
    const result = await service.understand(document);

    expect(mockUnderstand).toHaveBeenCalledWith(document, {
      prompt,
      outputSchema: undefined,
    });

    expect(result).toEqual(expected);
  });

  it('propagates errors from engine', async () => {
    const error = new Error('Engine failed');
    mockUnderstand.mockRejectedValueOnce(error);

    const service = new DocumentUnderstandingService(mockEngine, prompt, outputSchema);

    await expect(service.understand(document)).rejects.toThrow(error);
  });
});

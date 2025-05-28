import { VisualUnderstanding } from '../../../src/engine/visual-understanding';
import type { VisualStructuring } from '../../../src/ports/visual-structuring.interface';
import type { VisualDocument } from '../../../src/typings/visual-document';

describe('VisualUnderstanding', () => {
  const mockParse = jest.fn();
  const mockAdapter: VisualStructuring<{ value: string }> = {
    parse: mockParse,
  };

  const service = new VisualUnderstanding(mockAdapter);

  const document: VisualDocument = {
    source: 'url',
    file: 'https://example.com/image.jpg',
    documentType: 'image',
  };

  const context = {
    prompt: 'Extract value',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates to adapter.parse and returns result', async () => {
    const expected = { value: 'ok' };
    mockParse.mockResolvedValueOnce(expected);

    const result = await service.understand(document, context);

    expect(mockParse).toHaveBeenCalledWith(document, context);
    expect(result).toEqual(expected);
  });

  it('propagates adapter.parse errors', async () => {
    const error = new Error('adapter failed');
    mockParse.mockRejectedValueOnce(error);

    await expect(service.understand(document, context)).rejects.toThrow(error);
  });
});

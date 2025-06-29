import { VisualUnderstanding } from '../../../src/engine/visual-understanding';
import type { VisualStructuring } from '../../../src/ports/visual-structuring.interface';
import type { VisualDocument } from '../../../src/typings/visual-document';

describe('VisualUnderstanding', () => {
  const parse = jest.fn();
  const adapter: VisualStructuring<{ value: string }> = { parse };
  const service = new VisualUnderstanding(adapter);

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

  it('calls adapter.parse with document and context and returns result', async () => {
    const expected = { value: 'ok' };
    parse.mockResolvedValueOnce(expected);

    const result = await service.understand(document, context);

    expect(parse).toHaveBeenCalledWith(document, context);
    expect(result).toEqual(expected);
  });

  it('throws if adapter.parse throws', async () => {
    const error = new Error('Adapter failed');
    parse.mockRejectedValueOnce(error);

    await expect(service.understand(document, context)).rejects.toThrow(error);
  });
});

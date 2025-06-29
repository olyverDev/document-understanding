import { Mistral } from '@mistralai/mistralai';

import { MistralOCRFactory, MistralOCRVariant } from '../../../../../../src/infrastructure/adapters/ocr/mistral/factory';
import { MistralMarkdownOCR } from '../../../../../../src/infrastructure/adapters/ocr/mistral/markdown';
import { MistralTextChunksOCR } from '../../../../../../src/infrastructure/adapters/ocr/mistral/text-chunks';

describe('MistralOCRFactory', () => {
  const mockClient = {
    ocr: {
      process: jest.fn(),
    },
  } as unknown as Mistral;

  const model = 'sk-test-model';

  it('returns MistralTextChunksOCR by default', () => {
    const instance = MistralOCRFactory({
      client: mockClient,
    });

    expect(instance).toBeInstanceOf(MistralTextChunksOCR);
    // @ts-expect-error — check protected field
    expect(instance.model).toBe('mistral-ocr-latest');
  });

  it('returns MistralMarkdownOCR when variant is markdown', () => {
    const instance = MistralOCRFactory({
      client: mockClient,
      variant: MistralOCRVariant.Markdown,
    });

    expect(instance).toBeInstanceOf(MistralMarkdownOCR);
  });

  it('throws for unknown variant', () => {
    expect(() =>
      MistralOCRFactory({
        client: mockClient,
        // @ts-expect-error intentionally unknown variant
        variant: 'unknown-variant',
      })
    ).toThrow();
  });

  it('uses provided model if set', () => {
    const instance = MistralOCRFactory({
      client: mockClient,
      model,
    });

    // @ts-expect-error testing protected field
    expect(instance.model).toBe(model);
  });

  it('uses default model if not set', () => {
    const instance = MistralOCRFactory({
      client: mockClient,
    });

    // @ts-expect-error testing protected field
    expect(instance.model).toBe('mistral-ocr-latest');
  });
});

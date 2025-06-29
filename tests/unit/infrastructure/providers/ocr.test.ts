import { Mistral } from '@mistralai/mistralai';

import { MistralOCRVariant } from '../../../../src/infrastructure/adapters/ocr/mistral';
import { MistralMarkdownOCR } from '../../../../src/infrastructure/adapters/ocr/mistral/markdown';
import { MistralTextChunksOCR } from '../../../../src/infrastructure/adapters/ocr/mistral/text-chunks';
import { OCRProvidersRegistry } from '../../../../src/infrastructure/providers/ocr';
import { Providers } from '../../../../src/infrastructure/providers/variants';

describe('OCRProvidersRegistry', () => {
  const mockClient = {} as unknown as Mistral;

  it('includes Mistral with a factory function', () => {
    expect(Object.keys(OCRProvidersRegistry)).toContain(Providers.Mistral);
    expect(typeof OCRProvidersRegistry[Providers.Mistral]).toBe('function');
  });

  it('returns MistralTextChunksOCR by default', () => {
    const instance = OCRProvidersRegistry[Providers.Mistral]({ client: mockClient });
    expect(instance).toBeInstanceOf(MistralTextChunksOCR);
  });

  it('returns MistralTextChunksOCR when variant is passed', () => {
    const instance = OCRProvidersRegistry[Providers.Mistral]({
      client: mockClient,
      variant: MistralOCRVariant.TextChunks,
    });
    expect(instance).toBeInstanceOf(MistralTextChunksOCR);
  });

  it('returns MistralMarkdownOCR when variant is passed', () => {
    const instance = OCRProvidersRegistry[Providers.Mistral]({
      client: mockClient,
      variant: MistralOCRVariant.Markdown,
    });
    expect(instance).toBeInstanceOf(MistralMarkdownOCR);
  });

  it('uses default model when model is not provided', () => {
    const instance = OCRProvidersRegistry[Providers.Mistral]({ client: mockClient });
    // @ts-expect-error accessing protected for test
    expect(instance.model).toBe('mistral-ocr-latest');
  });

  it('uses provided model when passed', () => {
    const instance = OCRProvidersRegistry[Providers.Mistral]({
      client: mockClient,
      model: 'custom-model',
    });
    // @ts-expect-error accessing protected for test
    expect(instance.model).toBe('custom-model');
  });
});

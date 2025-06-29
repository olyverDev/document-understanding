import { Mistral } from '@mistralai/mistralai';

import { MistralTextStructuring } from '../../../../src/infrastructure/adapters/text-structuring/mistral';
import { TextStructuringProvidersRegistry } from '../../../../src/infrastructure/providers/text-structuring';
import { Providers } from '../../../../src/infrastructure/providers/variants';

describe('TextStructuringProvidersRegistry', () => {
  const mockClient = {} as unknown as Mistral;

  it('includes Mistral with a factory function', () => {
    expect(Object.keys(TextStructuringProvidersRegistry)).toContain(Providers.Mistral);
    expect(typeof TextStructuringProvidersRegistry[Providers.Mistral]).toBe('function');
  });

  it('has Mistral provider mapped to MistralTextStructuring factory', () => {
    const factory = TextStructuringProvidersRegistry[Providers.Mistral];
    const instance = factory<{ field: string }>({ client: mockClient });

    expect(instance).toBeInstanceOf(MistralTextStructuring);
  });

  it('defaults to `mistral-medium-latest` if model not provided', () => {
    const textStructuring = TextStructuringProvidersRegistry[Providers.Mistral]({
      client: mockClient,
    });

    expect(
      (textStructuring as MistralTextStructuring<object[]>)['modelName']
    ).toBe('mistral-medium-latest');
  });

  it('allows to create MistralTextStructuring with model override', () => {
    const textStructuring = TextStructuringProvidersRegistry[Providers.Mistral]({
      client: mockClient,
      model: 'mistral-large-latest',
    });

    expect(textStructuring).toBeInstanceOf(MistralTextStructuring);
  });
});

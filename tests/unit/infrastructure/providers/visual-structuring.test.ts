import { Mistral } from '@mistralai/mistralai';

import { MistralVisualStructuring } from '../../../../src/infrastructure/adapters/visual-structuring/mistral';
import { Providers } from '../../../../src/infrastructure/providers/variants';
import { VisualStructuringProvidersRegistry } from '../../../../src/infrastructure/providers/visual-structuring';

describe('VisualStructuringProvidersRegistry', () => {
  const mockClient = {} as unknown as Mistral;

  it('includes Mistral with a factory function', () => {
    expect(Object.keys(VisualStructuringProvidersRegistry)).toContain(Providers.Mistral);
    expect(typeof VisualStructuringProvidersRegistry[Providers.Mistral]).toBe('function');
  });

  it('has Mistral provider mapped to MistralVisualStructuring factory', () => {
    const factory = VisualStructuringProvidersRegistry[Providers.Mistral];
    const instance = factory<{ field: string }>({ client: mockClient });

    expect(instance).toBeInstanceOf(MistralVisualStructuring);
  });

  it('defaults to `mistral-medium-latest` if model not provided', () => {
    const visualStructuring = VisualStructuringProvidersRegistry[Providers.Mistral]({
      client: mockClient,
    }) as MistralVisualStructuring<object[]>;

    expect(visualStructuring['modelName']).toBe('mistral-medium-latest');
  });

  it('allows to create MistralVisualStructuring with model override', () => {
    const visualStructuring = VisualStructuringProvidersRegistry[Providers.Mistral]({
      client: mockClient,
      model: 'mistral-large-latest',
    });

    expect(visualStructuring).toBeInstanceOf(MistralVisualStructuring);
  });
});

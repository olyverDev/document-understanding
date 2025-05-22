import type { PrescriptionDocuments } from '../../../../src/domains/prescription/models';
import { MistralVisualStructuring } from '../../../../src/infrastructure/adapters/visual-structuring/mistral';
import { getMistralSingletonClient } from '../../../../src/infrastructure/api/mistral-client';
import { Providers } from '../../../../src/infrastructure/providers/variants';
import { VisualStructuringProvidersRegistry } from '../../../../src/infrastructure/providers/visual-structuring';

jest.mock('../../../../src/infrastructure/api/mistral-client', () => {
  const mockClient = { fake: true };
  return {
    getMistralSingletonClient: jest.fn(() => mockClient),
  };
});

describe('VisualStructuringProvidersRegistry', () => {
  const mockApiKey = 'sk-test';
  const mockedGetClient = getMistralSingletonClient as jest.Mock;

  it('creates MistralVisualStructuring with model override', () => {
    const structuring = VisualStructuringProvidersRegistry[Providers.Mistral]<PrescriptionDocuments>({
      apiKey: mockApiKey,
      model: 'mistral-large-latest',
    });

    expect(structuring).toBeInstanceOf(MistralVisualStructuring);
  });

  it('defaults to `mistral-medium-latest` if model not provided', () => {
    const structuring = VisualStructuringProvidersRegistry[Providers.Mistral]<PrescriptionDocuments>({
      apiKey: mockApiKey,
    });

    expect(structuring).toBeInstanceOf(MistralVisualStructuring);
  });

  it('reuses the same client instance for same API key', () => {
    mockedGetClient.mockClear();

    VisualStructuringProvidersRegistry[Providers.Mistral]<PrescriptionDocuments>({ apiKey: mockApiKey });
    VisualStructuringProvidersRegistry[Providers.Mistral]<PrescriptionDocuments>({ apiKey: mockApiKey });

    expect(mockedGetClient).toHaveBeenCalledTimes(2);
    expect(mockedGetClient).toHaveBeenCalledWith({ apiKey: mockApiKey });
  });

  it('has correct provider key', () => {
    expect(Object.keys(VisualStructuringProvidersRegistry)).toEqual([Providers.Mistral]);
  });
});

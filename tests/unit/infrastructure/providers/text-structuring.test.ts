import type { PrescriptionDocuments } from '../../../../src/domains/prescription/types';
import { MistralTextStructuring } from '../../../../src/infrastructure/adapters/text-structuring/mistral';
import { getMistralSingletonClient } from '../../../../src/infrastructure/api/mistral-client';
import { TextStructuringProvidersRegistry } from '../../../../src/infrastructure/providers/text-structuring';
import { Providers } from '../../../../src/infrastructure/providers/variants';

jest.mock('../../../../src/infrastructure/api/mistral-client', () => {
  const mockClient = { fake: true };
  return {
    getMistralSingletonClient: jest.fn(() => mockClient),
  };
});

describe('TextStructuringProvidersRegistry', () => {
  const mockApiKey = 'sk-test';
  const mockedGetClient = getMistralSingletonClient as jest.Mock;

  it('creates MistralTextStructuring with model override', () => {
    const textStructuring = TextStructuringProvidersRegistry[Providers.Mistral]<PrescriptionDocuments>({
      apiKey: mockApiKey,
      model: 'mistral-large-latest',
    });

    expect(textStructuring).toBeInstanceOf(MistralTextStructuring);
  });

  it('defaults to `mistral-small-latest` if model not provided', () => {
    const textStructuring = TextStructuringProvidersRegistry[Providers.Mistral]<PrescriptionDocuments>({
      apiKey: mockApiKey,
    });

    expect(textStructuring).toBeInstanceOf(MistralTextStructuring);
  });

  it('reuses the same client instance for same API key', () => {
    mockedGetClient.mockClear();

    TextStructuringProvidersRegistry[Providers.Mistral]<PrescriptionDocuments>({ apiKey: mockApiKey });
    TextStructuringProvidersRegistry[Providers.Mistral]<PrescriptionDocuments>({ apiKey: mockApiKey });

    expect(mockedGetClient).toHaveBeenCalledTimes(2);
    expect(mockedGetClient).toHaveBeenCalledWith({ apiKey: mockApiKey });
  });

  it('has correct provider key', () => {
    expect(Object.keys(TextStructuringProvidersRegistry)).toEqual([Providers.Mistral]);
  });
});

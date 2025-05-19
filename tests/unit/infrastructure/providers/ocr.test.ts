import { MistralOCR } from '../../../../src/infrastructure/adapters/ocr/mistral';
import { getMistralSingletonClient } from '../../../../src/infrastructure/api/mistral-client';
import { OCRProvidersRegistry } from '../../../../src/infrastructure/providers/ocr';
import { Providers } from '../../../../src/infrastructure/providers/variants';

jest.mock('../../../../src/infrastructure/api/mistral-client', () => {
  const mockClient = { fake: true };
  return {
    getMistralSingletonClient: jest.fn(() => mockClient),
  };
});

describe('OCRProvidersRegistry', () => {
  const mockApiKey = 'sk-test';
  const mockedGetClient = getMistralSingletonClient as jest.Mock;

  it('creates MistralOCR with model override', () => {
    const ocr = OCRProvidersRegistry[Providers.Mistral]({
      apiKey: mockApiKey,
      model: 'mistral-ocr-latest',
    });

    expect(ocr).toBeInstanceOf(MistralOCR);
  });

  it('defaults to `mistral-ocr-latest` if model not provided', () => {
    const ocr = OCRProvidersRegistry[Providers.Mistral]({
      apiKey: mockApiKey,
    });

    expect(ocr).toBeInstanceOf(MistralOCR);
  });

  it('reuses the same client instance for same API key', () => {
    mockedGetClient.mockClear();

    OCRProvidersRegistry[Providers.Mistral]({ apiKey: mockApiKey });
    OCRProvidersRegistry[Providers.Mistral]({ apiKey: mockApiKey });

    expect(mockedGetClient).toHaveBeenCalledTimes(2);
    expect(mockedGetClient).toHaveBeenCalledWith({ apiKey: mockApiKey });
  });

  it('has correct provider key', () => {
    expect(Object.keys(OCRProvidersRegistry)).toEqual([Providers.Mistral]);
  });
});

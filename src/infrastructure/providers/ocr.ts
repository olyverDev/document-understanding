import { MistralOCRFactory } from '../adapters/ocr/mistral';

import { Providers } from './variants';

export const OCRProvidersRegistry = {
  [Providers.Mistral]: MistralOCRFactory,
} as const;

export type OCRProvidersRegistryType = typeof OCRProvidersRegistry;

export type OCRProvidersConfigs = {
  [K in keyof OCRProvidersRegistryType]: Parameters<OCRProvidersRegistryType[K]>[0];
};

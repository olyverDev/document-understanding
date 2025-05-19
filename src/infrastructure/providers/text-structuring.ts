import { MistralTextStructuringFactory } from '../adapters/text-structuring/mistral';

import { Providers } from './variants';

export const TextStructuringProvidersRegistry = {
  [Providers.Mistral]: MistralTextStructuringFactory,
} as const;

export type TextStructuringProvidersRegistryType = typeof TextStructuringProvidersRegistry;

export type TextStructuringProvidersConfigs = {
  [K in keyof TextStructuringProvidersRegistryType]: Parameters<TextStructuringProvidersRegistryType[K]>[0];
};

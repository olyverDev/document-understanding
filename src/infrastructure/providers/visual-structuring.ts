import { MistralVisualStructuringFactory } from '../adapters/visual-structuring/mistral';

import { Providers } from './variants';

export const VisualStructuringProvidersRegistry = {
  [Providers.Mistral]: MistralVisualStructuringFactory,
} as const;

export type VisualStructuringProvidersRegistryType = typeof VisualStructuringProvidersRegistry;

export type VisualStructuringProvidersConfigs = {
  [K in keyof VisualStructuringProvidersRegistryType]: Parameters<VisualStructuringProvidersRegistryType[K]>[0];
};

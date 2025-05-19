export const Providers = {
  Mistral: 'mistral',
  // tesseract: 'Tesseract',
  // openai: 'Openai',
  // ...
} as const;

export type ProviderName = (typeof Providers)[keyof typeof Providers];

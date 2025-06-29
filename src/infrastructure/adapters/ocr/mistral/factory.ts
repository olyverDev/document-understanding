import { Mistral } from "@mistralai/mistralai";

import { MistralMarkdownOCR } from "./markdown";
import { MistralTextChunksOCR } from "./text-chunks";

export enum MistralOCRVariant {
  TextChunks = 'text-chunks',
  Markdown = 'markdown'
}

/**
 * NOTE: extend if needed with markdown+images (Markdown + BBoxAnnotation)
 * or document+images (DocumentAnnotation + BBoxAnnotation)
 * or any other combination or structure you want to support
 * https://docs.mistral.ai/capabilities/OCR/annotations/
*/
const MistralOCRVariantClassMap = {
  [MistralOCRVariant.Markdown]: MistralMarkdownOCR,
  [MistralOCRVariant.TextChunks]: MistralTextChunksOCR,
} as const;

type MistralOCRVariantMap = {
  [K in keyof typeof MistralOCRVariantClassMap]: InstanceType<typeof MistralOCRVariantClassMap[K]>
};

export interface MistralOCRFactoryConfig<V extends MistralOCRVariant = MistralOCRVariant> {
  variant?: V;
  client: Mistral;
  model?: string;
}

export function MistralOCRFactory<V extends MistralOCRVariant>(
  config: MistralOCRFactoryConfig<V>
): MistralOCRVariantMap[V] {
  const model = config.model ?? 'mistral-ocr-latest';

  const ClassRef = MistralOCRVariantClassMap[config.variant ?? MistralOCRVariant.TextChunks];

    if (!ClassRef) {
    throw new Error(`Unknown OCR variant: ${config.variant}`);
  }

  return new ClassRef(config.client, model) as MistralOCRVariantMap[V];
}

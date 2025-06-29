import { DocumentUnderstandingService } from '../../core/service';
import { OCRTextUnderstanding } from '../../engine/ocr-text-understanding';
import { MistralTextStructuringContext } from '../../infrastructure/adapters/text-structuring/mistral';
import { getMistralSingletonClient } from '../../infrastructure/api/mistral-client';
import {
  OCRProvidersRegistry,
  Providers,
  TextStructuringProvidersRegistry,
} from '../../infrastructure/providers';

import type { MenuItemsList } from './models';
import prompt from './prompt';
import schema from './schema.json';

type MenuUnderstandingContext = {
  prompt: string;
  outputSchema: typeof schema;
};

export interface MistralOptions {
  apiKey: string;
  timeoutMs?: number;
  models?: {
    ocr?: string;
    llm?: string;
  };
}

export type MistralResult = {
  isInitialized: true;
  service: DocumentUnderstandingService<MenuItemsList, MenuUnderstandingContext>;
} | {
  isInitialized: false | undefined;
  error?: Error;
};

/**
 * @docs Menu Understanding – Mistral OCR + Text Understanding Pipeline
 *
 * This implementation uses the Mistral OCR and Completion APIs to perform
 * two-step **Image-To-Text** + **Text-To-Structured JSON** transformation,
 * extracting structured menu items from scanned or photographed menus.
 *
 * It uses a domain-specific `prompt` and corresponding JSON `schema`.
 *
 * Adapters are wired into a `DocumentUnderstandingService` instance.
 */
export function MistralMenuUnderstandingFactory(
  options: MistralOptions,
): MistralResult {
  try {
    const client = getMistralSingletonClient({
      apiKey: options.apiKey,
      timeoutMs: options.timeoutMs,
    });

    const mistralOCRAdapter = OCRProvidersRegistry[Providers.Mistral]({
      client,
      model: options.models?.ocr,
    });

    const mistralTextStructuringAdapter = TextStructuringProvidersRegistry[Providers.Mistral]<MenuItemsList>({
      client,
      model: options.models?.llm,
    });

    const engine = new OCRTextUnderstanding<MenuItemsList, MistralTextStructuringContext>(
      mistralOCRAdapter,
      mistralTextStructuringAdapter,
    );

    const engineContext: MenuUnderstandingContext = {
      prompt,
      outputSchema: schema,
    };

    const service = new DocumentUnderstandingService<MenuItemsList, MenuUnderstandingContext>(
      engine,
      engineContext,
    );

    return { service, isInitialized: true };
  } catch (error) {
    return { error, isInitialized: false } as MistralResult;
  }
}

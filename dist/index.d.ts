import { V as VisualDocument, U as UnderstandingEngine } from './service-B8KzHMnR.js';
export { D as DocumentUnderstandingService } from './service-B8KzHMnR.js';
import { z } from 'zod';
import { JsonSchema } from '@mistralai/mistralai/models/components';

interface OCR {
    /**
     * Processes a file contents (image or PDF) and returns extracted markdown/plaintext.
     * @param input VisualDocument The input object containing the source, file content, and document type.
     * @returns A promise that resolves to the extracted markdown/plaintext or null if no text is found.
     */
    recognizeText(input: VisualDocument): Promise<string>;
}

/**
 * Interface for adapters capable of transforming raw text
 * into structured data using prompts, schemas, or logic engines.
 *
 * This abstraction supports various strategies such as:
 * - LLM-based structuring (e.g., Mistral, OpenAI)
 * - Heuristic or rule-based processing/parsing
 * - Hybrid systems
 *
 * @template T - The expected structured output type.
 */
interface TextStructuring<T, C = unknown> {
    /**
     * Parses raw text into a structured format.
     *
     * @param text - The input text to structure.
     * @param options - optional context/configuration (e.g. rules for the Parser, prompt-schema pair for LLM)
     *
     * @returns A Promise resolving to structured output of type `T`.
     * @throws If parsing fails or the input/provider is invalid.
     */
    parse(text: string, context?: C): Promise<T>;
}

declare class OCRTextUnderstanding<T, C = unknown> implements UnderstandingEngine<T, C> {
    private readonly ocr;
    private readonly textStructuring;
    constructor(ocr: OCR, textStructuring: TextStructuring<T, C>);
    understand(document: VisualDocument, context?: C): Promise<T>;
}

/**
 * Interface for adapters that directly process visual documents
 * to produce structured data using a combination of OCR and Structuring under the hood,
 * also prompts, and schemas.
 *
 * This abstraction is useful for end-to-end visual understanding flows.
 *
 * @template T - The expected structured output type.
 */
interface VisualStructuring<T, C = unknown> {
    /**
     * Parses a visual document (e.g., image or PDF) into structured output.
     *
     * @param input - The visual document to process.
     * @param context - optional context (e.g. Prompt and optional Schema for LLM)
     * @returns A Promise resolving to structured output of type `T`.
     * @throws If visual parsing fails or the provider is misconfigured.
     */
    parse(input: VisualDocument, context?: C): Promise<T>;
}

declare class VisualUnderstanding<T, C = unknown> implements UnderstandingEngine<T, C> {
    private readonly adapter;
    constructor(adapter: VisualStructuring<T, C>);
    understand(document: VisualDocument, context?: C): Promise<T>;
}

declare const Providers: {
    readonly Mistral: "mistral";
};
type ProviderName = (typeof Providers)[keyof typeof Providers];

type MistralOCRCFactoryConfig = {
    apiKey: string;
    model?: string;
};

declare const OCRProvidersRegistry: {
    readonly mistral: (config: MistralOCRCFactoryConfig) => OCR;
};
type OCRProvidersRegistryType = typeof OCRProvidersRegistry;

interface MistralTextStructuringContext {
    prompt: string;
    outputSchema: z.ZodTypeAny;
}
type MistralTextStructuringFactoryConfig = {
    apiKey: string;
    model?: string;
};

declare const TextStructuringProvidersRegistry: {
    readonly mistral: <T>(config: MistralTextStructuringFactoryConfig) => TextStructuring<T, MistralTextStructuringContext>;
};
type TextStructuringProvidersRegistryType = typeof TextStructuringProvidersRegistry;

interface MistralVisualStructuringContext {
    prompt: string;
    outputSchema?: JsonSchema['schemaDefinition'];
}
interface MistralVisualStructuringFactoryConfig {
    apiKey: string;
    model?: string;
}
declare function MistralVisualStructuringFactory<T>(config: MistralVisualStructuringFactoryConfig): VisualStructuring<T, MistralVisualStructuringContext>;

declare const VisualStructuringProvidersRegistry: {
    readonly mistral: typeof MistralVisualStructuringFactory;
};
type VisualStructuringProvidersRegistryType = typeof VisualStructuringProvidersRegistry;

export { OCRProvidersRegistry, type OCRProvidersRegistryType, OCRTextUnderstanding, type ProviderName, Providers, TextStructuringProvidersRegistry, type TextStructuringProvidersRegistryType, VisualDocument, VisualStructuringProvidersRegistry, type VisualStructuringProvidersRegistryType, VisualUnderstanding };

import { V as VisualDocument, U as UnderstandingEngine } from './service-B8KzHMnR.js';
export { D as DocumentUnderstandingService } from './service-B8KzHMnR.js';
import { Mistral } from '@mistralai/mistralai';
import * as _mistralai_mistralai_models_components from '@mistralai/mistralai/models/components';
import { OCRResponse, ImageURLChunk, DocumentURLChunk, JsonSchema } from '@mistralai/mistralai/models/components';
import { z } from 'zod';

/**
 * Interface for OCR adapters.
 * OCR stands for **Optical Character Recognition** — the process of
 * converting visual information into machine-readable formats.
 * These adapters process visual documents such as images or PDFs
 * and extract meaningful content — from raw text (e.g. markdown/plaintext)
 * to structured or annotated data including tables, images, diagrams or regions of interest.
 *
 *
 * @typeParam T - The shape of the recognition result.
 * Typically a `string` (e.g. markdown/plaintext), but can also be
 * a structured object with markdown, images, bounding boxes or annotations.
 */
interface OCR<T = unknown> {
    /**
     * Processes a visual document and extracts its content.
     *
     * @param input - The input document to process (image or PDF).
     * @returns A Promise resolving to the extracted T — which can represent:
     * text, structured fields, visual annotations, or any hybrid format
     * depending on the adapter and document type.
     */
    recognize(input: VisualDocument): Promise<T>;
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
    constructor(ocr: OCR<string>, textStructuring: TextStructuring<T, C>);
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

declare enum Providers {
    Mistral = "mistral"
}
type ProviderName = Providers;

declare abstract class MistralOCRBase {
    protected readonly client: Mistral;
    protected readonly model: string;
    constructor(client: Mistral, model: string);
    abstract recognize(input: VisualDocument): Promise<unknown>;
    protected extractMarkdown(response: OCRResponse): string;
    protected convertDocumentToContentChunk(input: VisualDocument): ImageURLChunk | DocumentURLChunk;
}

declare class MistralMarkdownOCR extends MistralOCRBase implements OCR<string> {
    recognize(input: VisualDocument): Promise<string>;
}

declare class MistralTextChunksOCR extends MistralOCRBase implements OCR<string> {
    protected static readonly schema: z.ZodObject<{
        textChunks: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        textChunks: string[];
    }, {
        textChunks: string[];
    }>;
    protected static readonly documentAnnotationFormat: _mistralai_mistralai_models_components.ResponseFormat;
    recognize(input: VisualDocument): Promise<string>;
}

declare enum MistralOCRVariant {
    TextChunks = "text-chunks",
    Markdown = "markdown"
}
/**
 * NOTE: extend if needed with markdown+images (Markdown + BBoxAnnotation)
 * or document+images (DocumentAnnotation + BBoxAnnotation)
 * or any other combination or structure you want to support
 * https://docs.mistral.ai/capabilities/OCR/annotations/
*/
declare const MistralOCRVariantClassMap: {
    readonly markdown: typeof MistralMarkdownOCR;
    readonly "text-chunks": typeof MistralTextChunksOCR;
};
type MistralOCRVariantMap = {
    [K in keyof typeof MistralOCRVariantClassMap]: InstanceType<typeof MistralOCRVariantClassMap[K]>;
};
interface MistralOCRFactoryConfig<V extends MistralOCRVariant = MistralOCRVariant> {
    variant?: V;
    client: Mistral;
    model?: string;
}
declare function MistralOCRFactory<V extends MistralOCRVariant>(config: MistralOCRFactoryConfig<V>): MistralOCRVariantMap[V];

declare const OCRProvidersRegistry: {
    readonly mistral: typeof MistralOCRFactory;
};
type OCRProvidersRegistryType = typeof OCRProvidersRegistry;

interface MistralTextStructuringContext {
    prompt: string;
    outputSchema: JsonSchema['schemaDefinition'];
}
type MistralTextStructuringFactoryConfig = {
    client: Mistral;
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
    client: Mistral;
    model?: string;
}
declare function MistralVisualStructuringFactory<T>(config: MistralVisualStructuringFactoryConfig): VisualStructuring<T, MistralVisualStructuringContext>;

declare const VisualStructuringProvidersRegistry: {
    readonly mistral: typeof MistralVisualStructuringFactory;
};
type VisualStructuringProvidersRegistryType = typeof VisualStructuringProvidersRegistry;

export { OCRProvidersRegistry, type OCRProvidersRegistryType, OCRTextUnderstanding, type ProviderName, Providers, TextStructuringProvidersRegistry, type TextStructuringProvidersRegistryType, VisualDocument, VisualStructuringProvidersRegistry, type VisualStructuringProvidersRegistryType, VisualUnderstanding };

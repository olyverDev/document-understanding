import { V as VisualDocument, S as StructuringFactors, U as UnderstandingEngine } from './service-wDlDx4Rs.mjs';
export { D as DocumentUnderstandingService } from './service-wDlDx4Rs.mjs';

interface OCR {
    /**
     * Processes a file contents (image or PDF) and returns extracted markdown/plaintext.
     * @param input VisualDocument The input object containing the source, file content, and document type.
     * @returns A promise that resolves to the extracted markdown/plaintext or null if no text is found.
     */
    recognizeText(input: VisualDocument): Promise<string>;
}

/**
 * Interface for adapters capable of transforming unstructured text
 * into structured data using prompts, schemas, or other logic.
 *
 * This abstraction allows pluggable implementations such as:
 * - LLM-based structuring (e.g. Mistral, OpenAI)
 * - Heuristic-based or rule-based structuring
 * - Hybrid logic engines
 *
 * @template T - The expected structured output type.
 */
interface TextStructuring<T = unknown> {
    /**
     * Parses raw text content into structured output.
     *
     * @param text - The raw text to be structured (e.g., from OCR or any source).
     * @param options - StructuringFactors providing prompt and optional schema.
     * @param options.prompt - Prompt to guide the structuring logic (especially for LLMs).
     * @param options.outputSchema - Optional JSON Schema object to define the expected structure of the result.
     *
     * @returns A Promise resolving to structured output of type `T`.
     * @throws May throw an error if parsing fails, input is invalid, or a provider is misconfigured.
     */
    parse(text: string, options: StructuringFactors): Promise<T>;
}

declare class OCRTextUnderstanding<T> implements UnderstandingEngine<T> {
    private readonly ocr;
    private readonly textStructuring;
    constructor(ocr: OCR, textStructuring: TextStructuring<T>);
    understand(document: VisualDocument, factors: StructuringFactors): Promise<T>;
}

interface VisualStructuring<T> {
    parse(input: VisualDocument, options: StructuringFactors): Promise<T>;
}

declare class VisualUnderstanding<T> implements UnderstandingEngine<T> {
    private readonly adapter;
    constructor(adapter: VisualStructuring<T>);
    understand(document: VisualDocument, factors: StructuringFactors): Promise<T>;
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

type MistralTextStructuringFactoryConfig = {
    apiKey: string;
    model?: string;
};

declare const TextStructuringProvidersRegistry: {
    readonly mistral: <T>(config: MistralTextStructuringFactoryConfig) => TextStructuring<T>;
};
type TextStructuringProvidersRegistryType = typeof TextStructuringProvidersRegistry;

interface MistralVisualStructuringFactoryConfig {
    apiKey: string;
    model?: string;
}
declare function MistralVisualStructuringFactory<T>(config: MistralVisualStructuringFactoryConfig): VisualStructuring<T>;

declare const VisualStructuringProvidersRegistry: {
    readonly mistral: typeof MistralVisualStructuringFactory;
};
type VisualStructuringProvidersRegistryType = typeof VisualStructuringProvidersRegistry;

export { OCRProvidersRegistry, type OCRProvidersRegistryType, OCRTextUnderstanding, type ProviderName, Providers, StructuringFactors, TextStructuringProvidersRegistry, type TextStructuringProvidersRegistryType, VisualDocument, VisualStructuringProvidersRegistry, type VisualStructuringProvidersRegistryType, VisualUnderstanding };

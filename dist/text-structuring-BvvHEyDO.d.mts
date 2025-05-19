type OCRInput = {
    source: 'base64';
    file: string;
    documentType: 'image' | 'pdf';
} | {
    source: 'url';
    file: string;
    documentType: 'image' | 'pdf';
};
interface OCR {
    /**
     * Processes a file contents (image or PDF) and returns extracted markdown/plaintext.
     * @param input OCRInput The input object containing the source, file content, and document type.
     * @returns A promise that resolves to the extracted markdown/plaintext or null if no text is found.
     */
    recognizeText(input: OCRInput): Promise<string | null>;
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
     * @param input - The parsing context.
     * @param input.text - The raw text to be structured (e.g., from OCR or any source).
     * @param input.prompt - Optional prompt to guide the structuring logic (especially for LLMs).
     * @param input.outputSchema - Optional JSON Schema object to define the expected structure of the result.
     *
     * @returns A Promise resolving to structured output of type `T`.
     * @throws May throw an error if parsing fails, input is invalid, or a provider is misconfigured.
   */
    parse(input: {
        text: string | null;
        prompt?: string;
        outputSchema?: object | null;
    }): Promise<T>;
}

type MistralOCRCFactoryConfig = {
    apiKey: string;
    model?: string;
};

declare const OCRProvidersRegistry: {
    readonly mistral: (config: MistralOCRCFactoryConfig) => OCR;
};
type OCRProvidersRegistryType = typeof OCRProvidersRegistry;
type OCRProvidersConfigs = {
    [K in keyof OCRProvidersRegistryType]: Parameters<OCRProvidersRegistryType[K]>[0];
};

type MistralTextStructuringFactoryConfig = {
    apiKey: string;
    model?: string;
};

declare const TextStructuringProvidersRegistry: {
    readonly mistral: <T>(config: MistralTextStructuringFactoryConfig) => TextStructuring<T>;
};
type TextStructuringProvidersRegistryType = typeof TextStructuringProvidersRegistry;
type TextStructuringProvidersConfigs = {
    [K in keyof TextStructuringProvidersRegistryType]: Parameters<TextStructuringProvidersRegistryType[K]>[0];
};

export { type OCR as O, type TextStructuring as T, type OCRInput as a, type OCRProvidersConfigs as b, type TextStructuringProvidersRegistryType as c, OCRProvidersRegistry as d, TextStructuringProvidersRegistry as e, type OCRProvidersRegistryType as f, type TextStructuringProvidersConfigs as g };

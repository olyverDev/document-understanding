import { StructuringFactors } from "../typings/structuring-factors";

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
export interface TextStructuring<T = unknown> {
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

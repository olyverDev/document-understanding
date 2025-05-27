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
export interface TextStructuring<T, C = unknown> {
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

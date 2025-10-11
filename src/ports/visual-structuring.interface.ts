import type { VisualDocument } from "../typings/visual-document";

/**
 * Interface for adapters that directly process visual documents
 * to produce structured data using a combination of OCR and Structuring under the hood,
 * also prompts, and schemas.
 *
 * This abstraction is useful for end-to-end visual understanding flows.
 *
 * @template T - The expected structured output type.
 */
export interface VisualStructuring<T, C = unknown> {
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

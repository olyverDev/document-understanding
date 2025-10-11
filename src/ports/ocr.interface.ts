import type { VisualDocument } from "../typings/visual-document";

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
export interface OCR<T = unknown> {
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

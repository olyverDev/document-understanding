### Document Input Examples

```ts
import type { VisualDocument } from 'document-understanding';

// URL + Image
const urlImageInput: VisualDocument = {
  source: 'url',
  file: 'https://example.com/image.jpg',
  documentType: 'image',
};


// Base64 + Image
const base64ImageInput: VisualDocument = {
  source: 'base64',
  file: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...',
  documentType: 'image',
};

/**
 * Base64 + PDF - supported only by Mistral OCR and current two-step pipeline (OCR + LLM)
 * not supported by Mistral Document Understanding (Completions API)
 * There is need to store signed url on Mistral servers to properly understand PDF in a LLM-only pipeline
 * https://docs.mistral.ai/capabilities/OCR/document_understanding/
 */
const base64PdfInput: VisualDocument = {
  source: 'base64',
  file: 'data:application/pdf;base64,JVBERi0xLjQKJcfs...',
  documentType: 'pdf',
};

// URL + PDF
const urlPdfInput: VisualDocument = {
  source: 'url',
  file: 'https://example.com/document.pdf',
  documentType: 'pdf',
};

const result: PrescriptionDocuments = await service.understand(/* your input */);
```

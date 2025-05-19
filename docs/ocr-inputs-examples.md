### OCRInput Examples

```ts
import type { OCRInput } from 'document-understanding';

// URL + Image
const urlImageInput: OCRInput = {
  source: 'url',
  file: 'https://example.com/image.jpg',
  documentType: 'image',
};

// URL + PDF
const urlPdfInput: OCRInput = {
  source: 'url',
  file: 'https://example.com/document.pdf',
  documentType: 'pdf',
};

// Base64 + Image
const base64ImageInput: OCRInput = {
  source: 'base64',
  file: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...',
  documentType: 'image',
};

// Base64 + PDF
const base64PdfInput: OCRInput = {
  source: 'base64',
  file: 'data:application/pdf;base64,JVBERi0xLjQKJcfs...',
  documentType: 'pdf',
};

const result: PrescriptionDocument = await service.understand(/* your input */);
```

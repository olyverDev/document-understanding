# Document Understanding Library

A modular, type-safe OCR + AI-powered document understanding library written in TypeScript.

Currently supports parsing **Eye Prescriptions** photos/documents using the Mistral API with pluggable OCR and schema-based JSON validation. Designed for extensibility to support other document types and Providers.


## Usage

### Prescription as Domain

The library provides a high-level service for extracting structured data from prescription documents using OCR and LLM-based text structuring. You can create a reusable instance using the built-in Mistral-powered factory.

#### Using `MistralPrescriptionUnderstanding`

```ts
import { MistralPrescriptionUnderstanding } from 'document-understanding/prescription';
import type { PrescriptionDocuments } from 'document-understanding/prescription';
import type { OCRInput } from 'document-understanding';

const service = MistralPrescriptionUnderstanding({
  apiKey: 'sk-...',
  OCRModel: 'mistral-ocr-latest', // optional
  textStructuringModel: 'mistral-large-latest', // optional
});

const base64ImageInput: OCRInput = {
  source: 'base64',
  file: '...base64-encoded-image...',
  documentType: 'image',
};

const result: PrescriptionDocuments = await service.understand(base64ImageInput);
```

More [OCRInput examples](docs/ocr-inputs-examples.md)

### Prescription domain-specific context

[LLM Prompt](src/domains/prescription/prompt.ts) (designed rather for Mistral, but would fit any LLM)

[Prescription JSON Schema](src/domains/prescription/schema.json)

## Features

See [features.md](docs/features.md) for feature list library provides

### Custom Document Understanding (Generic Engine)

See [document understanding engine](docs/custom-usage.md) docs


## Architecture

See [architecture.md](docs/architecture.md) for architectural notes


## Supported Providers

### OCR
- MistralOCR (via `@mistralai/mistralai`) as `OCR` | [Document OCR processor](https://docs.mistral.ai/capabilities/document/#document-ocr-processor)

### Text Structuring
- [Mistral Document Understanding](https://docs.mistral.ai/capabilities/document/#document-understanding) as `TextStructuring` (LLM completions using `responseFormat: 'json_schema' | 'json_object'`)


## Adding a new Provider

See [adding-provider.md](docs/adding-provider.md) for instructions on adding new providers.


## Build & Scripts notes

See [build-notes.md](docs/development-notes.md) for development notes.

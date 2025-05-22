# Document Understanding Library

A modular, type-safe OCR + AI-powered document understanding library written in TypeScript.

Currently supports parsing **Eye Prescriptions** photos/documents using the Mistral API with pluggable OCR and schema-based JSON validation. Designed for extensibility to support other document types and Providers.

## Usage

### Domains

#### Prescription

The library provides a high-level service factory for extracting structured data from prescription documents using LLM-based document/text structuring and OCR. You can create a reusable instance using the built-in Mistral-powered factory.

#### Using `MistralPrescriptionUnderstanding`

```ts
import { MistralPrescriptionUnderstanding } from 'document-understanding/prescription';
import type { PrescriptionDocuments } from 'document-understanding/prescription';
import type { VisualDocument } from 'document-understanding';

const service = MistralPrescriptionUnderstanding({
  apiKey: 'sk-...',
  model: 'mistral-medium-latest', // optional
});

const base64ImageInput: VisualDocument = {
  source: 'base64',
  file: '...base64-encoded-image...',
  documentType: 'image',
};

const result: PrescriptionDocuments = await service.understand(base64ImageInput);
```

More [VisualDocument examples](docs/inputs.md)

### Prescription domain-specific context

[LLM Prompt](src/domains/prescription/prompt.ts) (designed rather for Mistral, but would fit any LLM)

[Prescription JSON Schema](src/domains/prescription/schema.json)

## Build & Scripts notes

See [build-notes.md](docs/build-notes.md) for development notes.

## Features

See [features.md](docs/features.md) for feature list library provides

### Building a pipeline of a custom Document Understanding

See [custom usage](docs/building-pipeline.md) docs

### Engine Variants

See [engine variants](docs/engine.md) docs

## Supported Providers

See [supported providers](docs/providers.md) section

## Adding a new Provider

See [adding-provider.md](docs/adding-provider.md) for instructions on adding new providers.

## Architecture

See [architecture.md](docs/architecture.md) for architectural notes and source code structure

# Document Understanding Library

A modular, type-safe OCR + AI-powered document understanding library written in TypeScript.

Currently supports parsing **Eye Prescriptions** photos/documents using the Mistral API with pluggable OCR and schema-based JSON validation. Designed for extensibility to support other document types and Providers.

## Usage

### Domains

#### Menu

The library provides a high-level service factory for extracting structured data from text-only restaurant menus using LLM-based document/text structuring and OCR. You can create a reusable instance using the built-in Mistral-powered factory.

#### Using `MistralMenuUnderstandingFactory`

```ts
import { MistralMenuUnderstandingFactory } from 'document-understanding/menu';
import type { MenuItemsList } from 'document-understanding/menu';
import type { VisualDocument } from 'document-understanding';

const menuUnderstanding = MistralMenuUnderstandingFactory({
  apiKey: 'sk-...',
  // optional and partial model overrides
  models: {
    ocr: 'mistral-ocr-latest',
    llm: 'mistral-medium-latest',
  },
  // optional client-wide timeout in milliseconds
  timeoutMs: 30_000,
});

const base64ImageInput: VisualDocument = {
  source: 'base64',
  file: '...base64-encoded-image...',
  documentType: 'image',
};

if (!menuUnderstanding.isInitialized) {
  /**
   * Handle initialization failure gracefully, e.g.:
   * console.error(menuUnderstanding.error)
   *
   * This check is required in TypeScript projects for safe access.
   * In looser environments, you can use `menuUnderstanding?.service?.understand`
   * or `if (menuUnderstanding.service)` to continue.
   */
}

const result: MenuItemsList = await menuUnderstanding.service.understand(base64ImageInput);
```

More [VisualDocument examples](docs/inputs.md)

### Menu domain-specific context

[LLM Prompt](src/domains/menu/prompt.ts) — tuned to extract cleanly structured dishes, prices, and categories from printed or photographed menus.

[JSON Schema](src/domains/menu/schema.json) — defines a strongly typed format for consistent downstream usage and visualization.

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


### Architecture

The project follows a clean, layered architecture to promote modularity, testability, and separation of concerns.

```
src/
├── domains/
│   └── prescription/            # Domain-specific setup: prompt, schema, service
├── engine/                      # Document-agnostic orchestration (e.g., DocumentUnderstandingService)
├── infrastructure/
│   ├── adapters/                # Provider-specific implementations of ports (e.g., MistralOCR, MistralTextStructuring)
│   ├── api/                     # Low-level SDK client setup (e.g., Mistral Singleton)
│   └── providers/               # Registry for pluggable providers by capability
│       ├── variants.ts          # Enum-style provider identifiers
│       ├── ocr.ts               # OCR provider registry
│       └── text-structuring.ts # Text structuring provider registry
├── ports/                       # Abstract interfaces for OCR and Text Structuring
├── errors/                      # Shared error types (e.g., OCRProcessingError)
```

### Core Layers

- **Ports** – Define abstract interfaces (`OCR`, `TextStructuring`) for interchangeable implementations.
- **Adapters** – Implement ports using real providers (e.g., Mistral SDK).
- **Providers** – Centralized registry binding provider names to adapter factories via `variants.ts` and per-capability maps.
- **Engine** – High-level, provider-agnostic services to run OCR and text structuring / document understanding pipelines.
- **Domains** – Encapsulate domain-specific schema, prompts, and service logic (e.g., prescription understanding).

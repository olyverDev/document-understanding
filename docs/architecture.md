
### Architecture

The project follows a clean, layered architecture to promote modularity, testability, and separation of concerns.

#### Structure

```txt
src/
├── core/
│   └── service.ts                        # Core service class wiring engine + context into a domain service
├── domains/
│   └── menu/                     # Domain-specific setup: prompt, schema, service factory
├── engine/
│   ├── visual-understanding.ts           # Visual pipeline: Image/PDF → structured JSON
│   ├── ocr-text-understanding.ts         # Multi-step pipeline: OCR → structuring
│   └── understanding-engine.interface.ts # Shared interface for understanding engines
├── infrastructure/
│   ├── adapters/                         # Provider-specific implementations of ports
│   │   ├── ocr/
│   │   │   └── mistral/
│   │   │       ├── base.ts               # Common base class for Mistral OCR variants
│   │   │       ├── factory.ts            # Factory to select appropriate Mistral OCR variant
│   │   │       ├── index.ts              # Entry point re-exporting variants
│   │   │       ├── markdown.ts           # Mistral OCR variant returning markdown output
│   │   │       └── text-chunks.ts        # Mistral OCR variant returning text chunks
│   │   ├── text-structuring/
│   │   │   └── mistral.ts                # Mistral-based implementation of TextStructuring
│   │   └── visual-structuring/
│   │       └── mistral.ts                # Mistral-based implementation of VisualStructuring
│   ├── api/                              # e.g. SDK client setup (e.g., Mistral Singleton)
│   └── providers/                        # Registry for pluggable providers by capability
│       ├── variants.ts                   # Enum-style provider identifiers
│       ├── ocr.ts                        # OCR provider registry
│       ├── text-structuring.ts           # Text structuring provider registry
│       └── visual-structuring.ts         # Visual structuring provider registry
├── ports/                                # Abstract interfaces for each capability
│   ├── ocr.interface.ts                  # OCR interface
│   ├── text-structuring.interface.ts     # Text structuring interface
│   └── visual-structuring.interface.ts   # Visual structuring interface
├── errors/                               # Shared error types (e.g., OCRProcessingError)
├── typings/
│   └── visual-document.ts                # Union type for image/pdf inputs (base64/url)
```

### Core Layers

- **Ports** – Define abstract interfaces (`OCR`, `TextStructuring`, `VisualStructuring`) for interchangeable implementations.
- **Adapters** – Implement ports using real providers (e.g., Mistral OCR/LLM).
- **Providers** – Centralized registry binding provider names to adapter factories via `variants.ts` and per-capability maps (e.g. Tesseract as OCR, OpenAI as LLM)
- **Engine** – High-level, provider-agnostic services to run OCR and text structuring / document understanding pipelines.
- **Domains** – Encapsulate domain-specific schema, prompts, and service logic (e.g. menu understanding).

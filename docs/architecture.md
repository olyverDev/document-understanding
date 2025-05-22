
### Architecture

The project follows a clean, layered architecture to promote modularity, testability, and separation of concerns.

#### Structure

```txt
src/
├── domains/
│   └── prescription/              # Domain-specific setup: prompt, schema, service factory
├── engine/
│   ├── visual-understanding.ts    # Visual pipeline: Image/PDF → structured JSON
│   ├── ocr-text-understanding.ts  # Multi-step pipeline: OCR → structuring
│   └── understanding-engine.ts    # Shared interface for understanding engines
├── infrastructure/
│   ├── adapters/                  # Provider-specific implementations of ports
│   │   ├── mistral-ocr.ts
│   │   ├── mistral-text.ts
│   │   └── mistral-visual.ts
│   ├── api/                       # e.g. SDK client setup (e.g., Mistral Singleton)
│   └── providers/                 # Registry for pluggable providers by capability
│       ├── variants.ts            # Enum-style provider identifiers
│       ├── ocr.ts                 # OCR provider registry
│       ├── text-structuring.ts    # Text structuring provider registry
│       └── visual-structuring.ts  # Visual structuring provider registry
├── ports/                         # Abstract interfaces for each capability
│   ├── ocr.ts                     # OCR interface
│   ├── text-structuring.ts        # Text structuring interface
│   └── visual-structuring.ts      # Visual structuring interface
├── errors/                        # Shared error types (e.g., OCRProcessingError)

### Core Layers

- **Ports** – Define abstract interfaces (`OCR`, `TextStructuring`, `VisualStructuring`) for interchangeable implementations.
- **Adapters** – Implement ports using real providers (e.g., Mistral OCR/LLM).
- **Providers** – Centralized registry binding provider names to adapter factories via `variants.ts` and per-capability maps (e.g. Tesseract as OCR, OpenAI as LLM)
- **Engine** – High-level, provider-agnostic services to run OCR and text structuring / document understanding pipelines.
- **Domains** – Encapsulate domain-specific schema, prompts, and service logic (e.g. prescription understanding).

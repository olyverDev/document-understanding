### Engine Variants

- **Visual Understanding** – Handles visual documents (images, PDFs) in a single step using a multimodal LLM (e.g., Mistral with `responseFormat: 'json_schema'`). Uses `VisualStructuring` as pluggable adapter
- **OCR + Text Understanding** – A two-step pipeline: first extract text with OCR, then uses `TextStructuring` as pluggable adapter implementing LLM/Parsing/Heuristics

## Supported Providers listed by library adapters

### OCR
- **MistralOCR** (via `@mistralai/mistralai`) as `OCR`  
  Calls the [Document OCR processor](https://docs.mistral.ai/capabilities/document/#document-ocr-processor) to extract markdown-style or text chunks from documents.

  > Suitable for a two-stage pipeline: first OCR, then separate Text Structuring.

### Text Structuring
- **MistralTextStructuring** (via `@mistralai/mistralai`) as `TextStructuring`  
  Uses [Mistral Document Understanding](https://docs.mistral.ai/capabilities/document/#document-understanding) in `responseFormat: 'json_schema'` or `'json_object'` to convert raw OCR output into structured JSON using a predefined prompt and schema.  

  > Ideal when OCR is already done or when a full text dump is available.

### Visual Structuring
- **MistralVisualStructuring** (via `@mistralai/mistralai`) as `VisualStructuring`  
  Leverages the [Mistral Document Understanding](https://docs.mistral.ai/capabilities/document/#document-understanding) API with `responseFormat: 'json_schema'` to directly process **images or PDFs** using visual context, predefined prompt and schema..  
  This adapter provides multimodal document understanding, interpreting layout and spatial clues in addition to text.

  > Used when the input is an image/PDF and the LLM is expected to handle both **OCR and structuring** in a single step.

- **GeminiVisualStructuring** (via `@google/genai`) as `VisualStructuring`  
  Uses [Google Gemini](https://ai.google.dev/gemini-api/docs/models/gemini) multimodal model to directly process **images or PDFs** into structured JSON output.  
  Supports structured output generation using JSON schemas via Gemini's `responseSchema` configuration.  
  This adapter handles both visual understanding and structuring in a single API call.

  **Supported Input Formats:**
  - Base64-encoded images (PNG, JPEG, etc.)
  - URL-based images (HTTPS)
  - URL-based PDFs (HTTPS)

  **Default Model:** `gemini-2.0-flash-exp`
  
  **Note:** Gemini 1.5 Flash-8B has been deprecated. The default uses Gemini 2.0 Flash Experimental, which provides enhanced performance and capabilities.
  
  **Requirements:**
  - Valid Google AI API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
  - API access enabled for your region
  - Note: Some regions may have restricted access to Gemini API

## Supported Providers

### Visual Structuring
- **MistralVisualStructuring** (via `@mistralai/mistralai`) as `VisualStructuring`  
  Leverages the [Mistral Document Understanding](https://docs.mistral.ai/capabilities/document/#document-understanding) API with `responseFormat: 'json_schema'` to directly process **images or PDFs** using visual context, predefined prompt and schema..  
  This adapter provides multimodal document understanding, interpreting layout and spatial clues in addition to text.

  > Used when the input is an image/PDF and the LLM is expected to handle both **OCR and structuring** in a single step.

### OCR
- **MistralOCR** (via `@mistralai/mistralai`) as `OCR`  
  Calls the [Document OCR processor](https://docs.mistral.ai/capabilities/document/#document-ocr-processor) to extract markdown-style text blocks from documents.  
  Suitable for a two-stage pipeline: first OCR, then separate Text Structuring.

### Text Structuring
- **MistralTextStructuring** (via `@mistralai/mistralai`) as `TextStructuring`  
  Uses [Mistral Document Understanding](https://docs.mistral.ai/capabilities/document/#document-understanding) in `responseFormat: 'json_schema'` or `'json_object'` to convert raw OCR output into structured JSON using a predefined prompt and schema.  

  > Ideal when OCR is already done or when a full text dump is available.

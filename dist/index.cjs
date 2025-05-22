"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  DocumentUnderstandingService: () => DocumentUnderstandingService,
  OCRProvidersRegistry: () => OCRProvidersRegistry,
  Providers: () => Providers,
  TextStructuringProvidersRegistry: () => TextStructuringProvidersRegistry,
  VisualStructuringProvidersRegistry: () => VisualStructuringProvidersRegistry
});
module.exports = __toCommonJS(index_exports);

// src/core/service.ts
var DocumentUnderstandingService = class {
  constructor(engine, prompt, outputSchema) {
    this.engine = engine;
    this.prompt = prompt;
    this.outputSchema = outputSchema;
  }
  async understand(document) {
    return this.engine.understand(document, {
      prompt: this.prompt,
      outputSchema: this.outputSchema
    });
  }
};

// src/infrastructure/providers/variants.ts
var Providers = {
  Mistral: "mistral"
  // tesseract: 'Tesseract',
  // openai: 'Openai',
  // ...
};

// src/errors/ocr.ts
var OCRProcessingError = class extends Error {
  constructor(message, cause) {
    super(`OCR failed: ${message}`);
    this.cause = cause;
    this.name = "OCRProcessingError";
  }
};

// src/infrastructure/api/mistral-client.ts
var import_mistralai = require("@mistralai/mistralai");
var getMistralSingletonClient = /* @__PURE__ */ (() => {
  const cache = /* @__PURE__ */ new Map();
  return ({ apiKey }) => {
    if (!apiKey) throw new Error("Mistral requires an API key.");
    if (cache.has(apiKey)) return cache.get(apiKey);
    const client = new import_mistralai.Mistral({ apiKey });
    cache.set(apiKey, client);
    return client;
  };
})();

// src/infrastructure/adapters/ocr/mistral.ts
var MistralOCR = class {
  constructor(client, config) {
    this.client = client;
    this.modelName = config.model;
  }
  convertVisualDocumentToDocumentContentChunk(input) {
    const { source, file, documentType } = input;
    const strategies = {
      "base64:image": {
        type: "image_url",
        imageUrl: `data:image/jpeg;base64,${file}`
      },
      "base64:pdf": {
        type: "document_url",
        documentUrl: `data:application/pdf;base64,${file}`
      },
      "url:image": {
        type: "image_url",
        imageUrl: file
      },
      "url:pdf": {
        type: "document_url",
        documentUrl: file
      }
    };
    const currentStrategy = `${source}:${documentType}`;
    const documentContentChunk = strategies[currentStrategy];
    if (!documentContentChunk) {
      throw new Error(`Unsupported OCR input for ${source} ${documentType}`);
    }
    return documentContentChunk;
  }
  async recognizeText(input) {
    try {
      const response = await this.client.ocr.process({
        model: this.modelName,
        document: this.convertVisualDocumentToDocumentContentChunk(input),
        includeImageBase64: false,
        imageLimit: null,
        imageMinSize: null
      });
      const resultMarkdown = response?.pages?.[0]?.markdown || null;
      if (!resultMarkdown) {
        throw new OCRProcessingError("No markdown content found in the Mistral OCR response", response);
      }
      return resultMarkdown;
    } catch (error) {
      if (error instanceof OCRProcessingError) {
        throw error;
      }
      throw new OCRProcessingError(error?.message, error);
    }
  }
};
var MistralOCRFactory = (config) => {
  const client = getMistralSingletonClient({ apiKey: config.apiKey });
  return new MistralOCR(client, { model: config.model ?? "mistral-ocr-latest" });
};

// src/infrastructure/providers/ocr.ts
var OCRProvidersRegistry = {
  [Providers.Mistral]: MistralOCRFactory
};

// src/errors/text-structuring.ts
var TextStructuringError = class extends Error {
  constructor(message, cause) {
    super(message);
    this.cause = cause;
    this.name = "TextStructuringError";
  }
};

// src/infrastructure/adapters/text-structuring/mistral.ts
var MistralTextStructuring = class {
  constructor(client, config) {
    this.client = client;
    this.modelName = config.model;
  }
  async parse(text, {
    prompt,
    outputSchema
  }) {
    const messageContent = [
      { type: "text", text: prompt },
      {
        type: "text",
        text: `### File content in Markdown: ${text}`
      }
    ];
    try {
      const chatResponse = await this.client.chat.complete({
        model: this.modelName,
        messages: [
          {
            role: "user",
            content: messageContent
          }
        ],
        responseFormat: outputSchema ? {
          type: "json_schema",
          jsonSchema: {
            strict: true,
            schemaDefinition: outputSchema,
            name: outputSchema.title,
            description: outputSchema.description
          }
        } : {
          type: "json_object"
        }
      });
      const rawOutput = chatResponse?.choices?.[0].message?.content;
      if (typeof rawOutput !== "string") {
        throw new TextStructuringError("Expected Mistral LLM output to be string.");
      }
      const parsedOutput = JSON.parse(rawOutput);
      return parsedOutput;
    } catch (error) {
      if (error instanceof TextStructuringError) {
        throw error;
      }
      const isJSONParseError = error instanceof SyntaxError;
      const message = isJSONParseError ? "Failed to parse Mistral LLM response as JSON" : error?.message;
      throw new TextStructuringError(message, error);
    }
  }
};
var MistralTextStructuringFactory = (config) => {
  const client = getMistralSingletonClient({ apiKey: config.apiKey });
  return new MistralTextStructuring(client, {
    model: config.model ?? "mistral-medium-latest"
  });
};

// src/infrastructure/providers/text-structuring.ts
var TextStructuringProvidersRegistry = {
  [Providers.Mistral]: MistralTextStructuringFactory
};

// src/errors/visual-structuring.ts
var VisualStructuringError = class extends Error {
  constructor(message, cause) {
    super(message);
    this.cause = cause;
    this.name = "VisualStructuringError";
  }
};

// src/infrastructure/adapters/visual-structuring/mistral.ts
var MistralVisualStructuring = class {
  constructor(client, config) {
    this.client = client;
    this.modelName = config.model;
  }
  getBase64MimeAndExtension(base64) {
    const match = base64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/);
    if (match) {
      const mime = match[1];
      const ext = mime.split("/")[1];
      const content = match[2];
      return { mime, ext, content };
    }
    return { mime: "image/jpeg", ext: "jpg", content: base64 };
  }
  convertVisualDocumentToContentChunk(input) {
    const { source, file, documentType } = input;
    const strategies = {
      "base64:pdf": () => ({
        type: "document_url",
        documentUrl: `data:application/pdf;base64,${file}`
      }),
      "base64:image": () => {
        const { mime, content } = this.getBase64MimeAndExtension(file);
        return {
          type: "image_url",
          imageUrl: `data:${mime};base64,${content}`
        };
      },
      "url:pdf": () => ({
        type: "document_url",
        documentUrl: file
      }),
      "url:image": () => ({
        type: "image_url",
        imageUrl: file
      })
    };
    const currentStrategy = `${source}:${documentType}`;
    const resolve = strategies[currentStrategy];
    if (!resolve) {
      throw new Error(`Unsupported OCR input source: ${source}, type: ${documentType}`);
    }
    return resolve();
  }
  async parse(input, {
    prompt,
    outputSchema
  }) {
    const contentChunk = this.convertVisualDocumentToContentChunk(input);
    const messageContent = [
      { type: "text", text: prompt },
      contentChunk
    ];
    try {
      const response = await this.client.chat.complete({
        model: this.modelName,
        messages: [
          {
            role: "user",
            content: messageContent
          }
        ],
        responseFormat: outputSchema ? {
          type: "json_schema",
          jsonSchema: {
            strict: true,
            schemaDefinition: outputSchema,
            name: outputSchema.title,
            description: outputSchema.description
          }
        } : {
          type: "json_object"
        }
      });
      const raw = response?.choices?.[0]?.message?.content;
      if (typeof raw !== "string") {
        throw new VisualStructuringError("Expected response to be a string.");
      }
      return JSON.parse(raw);
    } catch (error) {
      if (error instanceof VisualStructuringError) {
        throw error;
      }
      const message = error instanceof SyntaxError ? "Failed to parse response as JSON" : error.message;
      throw new VisualStructuringError(message, error);
    }
  }
};
function MistralVisualStructuringFactory(config) {
  const client = getMistralSingletonClient({ apiKey: config.apiKey });
  return new MistralVisualStructuring(client, {
    model: config.model ?? "mistral-medium-latest"
  });
}

// src/infrastructure/providers/visual-structuring.ts
var VisualStructuringProvidersRegistry = {
  [Providers.Mistral]: MistralVisualStructuringFactory
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DocumentUnderstandingService,
  OCRProvidersRegistry,
  Providers,
  TextStructuringProvidersRegistry,
  VisualStructuringProvidersRegistry
});
//# sourceMappingURL=index.cjs.map
// src/core/service.ts
var DocumentUnderstandingService = class {
  constructor(engine, engineContext) {
    this.engine = engine;
    this.engineContext = engineContext;
  }
  async understand(document) {
    return this.engine.understand(document, this.engineContext);
  }
};

// src/engine/ocr-text-understanding.ts
var OCRTextUnderstanding = class {
  constructor(ocr, textStructuring) {
    this.ocr = ocr;
    this.textStructuring = textStructuring;
  }
  async understand(document, context) {
    const recognized = await this.ocr.recognize(document);
    if (typeof recognized !== "string") {
      throw new Error("Invalid OCR result \u2014 expected string output for this engine");
    }
    return this.textStructuring.parse(recognized, context);
  }
};

// src/engine/visual-understanding.ts
var VisualUnderstanding = class {
  constructor(adapter) {
    this.adapter = adapter;
  }
  understand(document, context) {
    return this.adapter.parse(document, context);
  }
};

// src/infrastructure/providers/variants.ts
var Providers = /* @__PURE__ */ ((Providers2) => {
  Providers2["Mistral"] = "mistral";
  Providers2["Gemini"] = "gemini";
  return Providers2;
})(Providers || {});

// src/errors/ocr.ts
var OCRProcessingError = class extends Error {
  constructor(message, cause) {
    super(`OCR failed: ${message}`);
    this.cause = cause;
    this.name = "OCRProcessingError";
  }
};

// src/errors/text-structuring.ts
var TextStructuringError = class extends Error {
  constructor(message, cause) {
    super(message);
    this.cause = cause;
    this.name = "TextStructuringError";
  }
};

// src/errors/visual-structuring.ts
var VisualStructuringError = class extends Error {
  constructor(message, cause) {
    super(message);
    this.cause = cause;
    this.name = "VisualStructuringError";
  }
};

// src/infrastructure/adapters/ocr/mistral/base.ts
var MistralOCRBase = class {
  constructor(client, model) {
    this.client = client;
    this.model = model;
  }
  extractMarkdown(response) {
    const pages = response?.pages?.map((page) => page?.markdown.trim()).filter(Boolean) ?? [];
    if (pages.length <= 1) {
      return pages[0] || "";
    }
    return pages.map((content, i) => `### Page ${i + 1}

${content}`).join("\n\n");
  }
  convertDocumentToContentChunk(input) {
    const { source, file, documentType } = input;
    const strategy = `${source}:${documentType}`;
    const strategies = {
      "base64:image": { type: "image_url", imageUrl: file },
      "url:image": { type: "image_url", imageUrl: file },
      "base64:pdf": { type: "document_url", documentUrl: file },
      "url:pdf": { type: "document_url", documentUrl: file }
    };
    const chunk = strategies[strategy];
    if (!chunk) {
      throw new Error(`Unsupported OCR input: ${strategy}`);
    }
    return chunk;
  }
};

// src/infrastructure/adapters/ocr/mistral/markdown.ts
var MistralMarkdownOCR = class extends MistralOCRBase {
  async recognize(input) {
    try {
      const response = await this.client.ocr.process({
        model: this.model,
        document: this.convertDocumentToContentChunk(input),
        includeImageBase64: false
      });
      return this.extractMarkdown(response);
    } catch (error) {
      if (error instanceof OCRProcessingError) {
        throw error;
      }
      throw new OCRProcessingError(error?.message, error);
    }
  }
};

// src/infrastructure/adapters/ocr/mistral/text-chunks.ts
import { responseFormatFromZodObject } from "@mistralai/mistralai/extra/structChat";
import { z } from "zod";
var MistralTextChunksOCR = class _MistralTextChunksOCR extends MistralOCRBase {
  static {
    this.schema = z.object({
      textChunks: z.array(z.string()).describe(
        `An ordered list of plain text lines extracted from the document. 
      Extract everything as printed or handwritten text, not as illustrations, diagrams, images or tables.`
      )
    }).strict();
  }
  static {
    this.documentAnnotationFormat = responseFormatFromZodObject(_MistralTextChunksOCR.schema);
  }
  async recognize(input) {
    try {
      const response = await this.client.ocr.process({
        model: this.model,
        document: this.convertDocumentToContentChunk(input),
        includeImageBase64: false,
        documentAnnotationFormat: _MistralTextChunksOCR.documentAnnotationFormat
      });
      const annotation = response.documentAnnotation;
      if (annotation == null) {
        throw new OCRProcessingError("No data found in Mistral OCR response");
      }
      if (!annotation?.trim()) {
        return "";
      }
      const parsed = JSON.parse(annotation);
      return parsed.textChunks.join("\n");
    } catch (error) {
      if (error instanceof OCRProcessingError) {
        throw error;
      }
      throw new OCRProcessingError(error?.message, error);
    }
  }
};

// src/infrastructure/adapters/ocr/mistral/factory.ts
var MistralOCRVariantClassMap = {
  ["markdown" /* Markdown */]: MistralMarkdownOCR,
  ["text-chunks" /* TextChunks */]: MistralTextChunksOCR
};
function MistralOCRFactory(config) {
  const model = config.model ?? "mistral-ocr-latest";
  const ClassRef = MistralOCRVariantClassMap[config.variant ?? "text-chunks" /* TextChunks */];
  if (!ClassRef) {
    throw new Error(`Unknown OCR variant: ${config.variant}`);
  }
  return new ClassRef(config.client, model);
}

// src/infrastructure/providers/ocr.ts
var OCRProvidersRegistry = {
  ["mistral" /* Mistral */]: MistralOCRFactory
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
      { type: "text", text }
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
        responseFormat: {
          type: "json_schema",
          jsonSchema: {
            strict: true,
            schemaDefinition: outputSchema,
            name: outputSchema.title,
            description: outputSchema.description
          }
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
  return new MistralTextStructuring(config.client, {
    model: config.model ?? "mistral-medium-latest"
  });
};

// src/infrastructure/providers/text-structuring.ts
var TextStructuringProvidersRegistry = {
  ["mistral" /* Mistral */]: MistralTextStructuringFactory
};

// src/infrastructure/adapters/visual-structuring/gemini.ts
import { Type } from "@google/genai";
var GeminiVisualStructuring = class _GeminiVisualStructuring {
  constructor(client, config) {
    this.client = client;
    this.modelName = config.model;
  }
  static {
    this.BASE64_DATA_URI_PATTERN = /^data:(image\/\w+);base64,/;
  }
  extractMimeType(base64String) {
    const match = base64String.match(_GeminiVisualStructuring.BASE64_DATA_URI_PATTERN);
    return match ? match[1] : null;
  }
  detectMimeTypeFromUrl(url, documentType) {
    if (documentType === "pdf") {
      return "application/pdf";
    }
    const extension = url.split(".").pop()?.toLowerCase();
    const mimeTypeMap = {
      "jpg": "image/jpeg",
      "jpeg": "image/jpeg",
      "png": "image/png",
      "gif": "image/gif",
      "webp": "image/webp",
      "svg": "image/svg+xml",
      "bmp": "image/bmp"
    };
    return mimeTypeMap[extension || ""] || "image/jpeg";
  }
  convertDocumentToPart(input) {
    const { source, file, documentType } = input;
    const strategies = {
      "base64:image": {
        inlineData: {
          data: file.replace(_GeminiVisualStructuring.BASE64_DATA_URI_PATTERN, ""),
          mimeType: this.extractMimeType(file) || "image/jpeg"
        }
      },
      "url:image": {
        fileData: {
          fileUri: file,
          // mimeType is typed as optional in SDK but marked "Required" in docs
          // Gemini may auto-detect from fileUri, but providing it for safety
          mimeType: this.detectMimeTypeFromUrl(file, "image")
        }
      },
      "url:pdf": {
        fileData: {
          fileUri: file,
          mimeType: this.detectMimeTypeFromUrl(file, "pdf")
        }
      }
    };
    const currentStrategy = `${source}:${documentType}`;
    const part = strategies[currentStrategy];
    if (!part) {
      throw new Error(`Unsupported visual input source: ${source}, type: ${documentType}`);
    }
    return part;
  }
  convertJsonSchemaTypeToGeminiType(jsonSchemaType) {
    const typeMap = {
      "string": Type.STRING,
      "number": Type.NUMBER,
      "integer": Type.INTEGER,
      "boolean": Type.BOOLEAN,
      "array": Type.ARRAY,
      "object": Type.OBJECT
    };
    return typeMap[jsonSchemaType] || Type.STRING;
  }
  convertArraySchemaToGeminiFormat(schema) {
    const items = schema.items;
    return {
      type: Type.ARRAY,
      items: items.type === "object" ? this.convertSchemaToGeminiFormat(items) : { type: this.convertJsonSchemaTypeToGeminiType(items.type) },
      description: schema.description
    };
  }
  convertObjectPropertyToGeminiSchema(propValue) {
    if (propValue.type === "array" && propValue.items) {
      const items = propValue.items;
      return {
        type: Type.ARRAY,
        items: items.type === "object" ? this.convertSchemaToGeminiFormat(items) : { type: this.convertJsonSchemaTypeToGeminiType(items.type) },
        description: propValue.description
      };
    }
    if (propValue.type === "object" && propValue.properties) {
      return this.convertSchemaToGeminiFormat(propValue);
    }
    const schema = {
      type: this.convertJsonSchemaTypeToGeminiType(propValue.type),
      description: propValue.description
    };
    if (propValue.enum && Array.isArray(propValue.enum)) {
      schema.enum = propValue.enum;
    }
    return schema;
  }
  convertPropertiesToGeminiFormat(properties) {
    return Object.entries(properties).reduce(
      (result, [key, value]) => {
        const propValue = value;
        result[key] = this.convertObjectPropertyToGeminiSchema(propValue);
        return result;
      },
      {}
    );
  }
  convertSchemaToGeminiFormat(schema) {
    if (schema.type === "array" && schema.items) {
      return this.convertArraySchemaToGeminiFormat(schema);
    }
    if (!schema.properties) {
      return {
        type: Type.OBJECT,
        properties: {}
      };
    }
    return {
      type: Type.OBJECT,
      properties: this.convertPropertiesToGeminiFormat(
        schema.properties
      ),
      required: schema.required || []
    };
  }
  async parse(input, {
    prompt,
    outputSchema
  }) {
    const documentPart = this.convertDocumentToPart(input);
    try {
      const config = {
        temperature: 0.1,
        responseMimeType: "application/json"
      };
      if (outputSchema) {
        config.responseSchema = this.convertSchemaToGeminiFormat(outputSchema);
      }
      const chat = this.client.chats.create({
        model: this.modelName,
        config
      });
      const result = await chat.sendMessage({
        message: [
          { text: prompt },
          documentPart
        ]
      });
      const text = result.text;
      if (!text) {
        throw new VisualStructuringError("Expected response to contain text.");
      }
      return JSON.parse(text);
    } catch (error) {
      if (error instanceof VisualStructuringError) {
        throw error;
      }
      const message = error instanceof SyntaxError ? "Failed to parse response as JSON" : error.message;
      throw new VisualStructuringError(message, error);
    }
  }
};
function GeminiVisualStructuringFactory(config) {
  return new GeminiVisualStructuring(config.client, {
    model: config.model ?? "gemini-2.0-flash-exp"
  });
}

// src/infrastructure/adapters/visual-structuring/mistral.ts
var MistralVisualStructuring = class {
  constructor(client, config) {
    this.client = client;
    this.modelName = config.model;
  }
  convertDocumentToContentChunk(input) {
    const { source, file, documentType } = input;
    const strategies = {
      "base64:image": {
        type: "image_url",
        imageUrl: file
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
      throw new Error(`Unsupported OCR input source: ${source}, type: ${documentType}`);
    }
    return documentContentChunk;
  }
  async parse(input, {
    prompt,
    outputSchema
  }) {
    const contentChunk = this.convertDocumentToContentChunk(input);
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
  return new MistralVisualStructuring(config.client, {
    model: config.model ?? "mistral-medium-latest"
  });
}

// src/infrastructure/providers/visual-structuring.ts
var VisualStructuringProvidersRegistry = {
  ["mistral" /* Mistral */]: MistralVisualStructuringFactory,
  ["gemini" /* Gemini */]: GeminiVisualStructuringFactory
};

// src/infrastructure/api/mistral-client.ts
import { Mistral } from "@mistralai/mistralai";
var getMistralSingletonClient = /* @__PURE__ */ (() => {
  const cache = /* @__PURE__ */ new Map();
  return ({ apiKey, timeoutMs = 2e4 }) => {
    if (!apiKey) throw new Error("Mistral requires an API key.");
    if (cache.has(apiKey)) return cache.get(apiKey);
    const client = new Mistral({ apiKey, timeoutMs });
    cache.set(apiKey, client);
    return client;
  };
})();
export {
  DocumentUnderstandingService,
  OCRProvidersRegistry,
  OCRTextUnderstanding,
  Providers,
  TextStructuringProvidersRegistry,
  VisualStructuringProvidersRegistry,
  VisualUnderstanding,
  getMistralSingletonClient
};
//# sourceMappingURL=index.js.map
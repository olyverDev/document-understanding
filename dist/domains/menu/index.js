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

// src/engine/visual-understanding.ts
var VisualUnderstanding = class {
  constructor(adapter) {
    this.adapter = adapter;
  }
  understand(document, context) {
    return this.adapter.parse(document, context);
  }
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
  ["mistral" /* Mistral */]: MistralVisualStructuringFactory
};

// src/domains/menu/prompt.ts
var prompt_default = `# Role

You are menu lens tool, your goal is to categorize text-only restaurant menus for future tagging and visualization.

# Objective

To categorize text-only restaurant menus for future tagging and visualization and mapping.

# Languages

Russian and English are main ones, but may be any

# Output Rules

- Only output a valid **JSON object** of categorized menu
- Each object must strictly follow the schema.

# Final Checklist Before Responding

- Only respond with a valid JSON
- Each field respects value types and format
- JSON follows the schema and contains no extra fields or formatting`;

// src/domains/menu/schema.json
var schema_default = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "MenuItemsList",
  description: "Structured list of categorized text-only restaurant menu items.",
  type: "array",
  items: {
    title: "MenuItem",
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the dish or item, exactly as found in the text menu (capitalization preserved)."
      },
      category: {
        type: "string",
        description: "High-level category this item belongs to.",
        enum: [
          "appetizer",
          "main_course",
          "side_dish",
          "dessert",
          "beverage",
          "alcohol",
          "soup",
          "salad",
          "bread",
          "combo",
          "other"
        ]
      },
      description: {
        type: "string",
        description: "Optional description or list of ingredients if present near the item. Otherwise, leave as empty string.",
        default: ""
      },
      price: {
        type: "string",
        description: "Optional price, as text (e.g. '12$', '\u20BD350', '\u043E\u0442 15 \u0440\u0443\u0431.', '\u20AC9.50'). Leave as empty string if not found.",
        default: ""
      },
      language: {
        type: "string",
        description: "Detected language of the item name (e.g. 'en', 'ru', 'fr')."
      }
    },
    required: [
      "name",
      "category",
      "language"
    ],
    additionalProperties: false
  }
};

// src/domains/menu/mistral.ts
function MistralMenuUnderstandingFactory(options) {
  try {
    const client = getMistralSingletonClient({
      apiKey: options.apiKey,
      timeoutMs: options.timeoutMs
    });
    const mistralVisualStructuringAdapter = VisualStructuringProvidersRegistry["mistral" /* Mistral */]({
      client,
      model: options.models?.llm
    });
    const engine = new VisualUnderstanding(
      mistralVisualStructuringAdapter
    );
    const engineContext = {
      prompt: prompt_default,
      outputSchema: schema_default
    };
    const service = new DocumentUnderstandingService(
      engine,
      engineContext
    );
    return { service, isInitialized: true };
  } catch (error) {
    return { error, isInitialized: false };
  }
}
export {
  MistralMenuUnderstandingFactory
};
//# sourceMappingURL=index.js.map
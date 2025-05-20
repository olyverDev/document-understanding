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

// src/domains/prescription/index.ts
var prescription_exports = {};
__export(prescription_exports, {
  MistralPrescriptionUnderstanding: () => MistralPrescriptionUnderstanding,
  PrescriptionUnderstandingService: () => PrescriptionUnderstandingService
});
module.exports = __toCommonJS(prescription_exports);

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
  convertOCRInputToDocumentContentChunk(input) {
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
        document: this.convertOCRInputToDocumentContentChunk(input),
        includeImageBase64: false,
        imageLimit: null,
        imageMinSize: null
      });
      const resultMarkdown = response?.pages?.[0]?.markdown || null;
      if (!resultMarkdown) {
        throw new OCRProcessingError("No markdown content found in the Mistral OCR response", response);
      }
      console.log({ resultMarkdown });
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
  async parse({
    text,
    prompt,
    outputSchema = null
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

// src/engine/document-understanding.ts
var DocumentUnderstandingService = class {
  constructor(ocr, textStructuring) {
    this.ocr = ocr;
    this.textStructuring = textStructuring;
  }
  async understand(input, options) {
    const text = await this.ocr.recognizeText(input);
    if (!text) throw new Error("OCR returned no text");
    return this.textStructuring.parse({
      text,
      prompt: options.prompt,
      outputSchema: options.outputSchema
    });
  }
};

// src/engine/document-understanding-factory.ts
function DocumentUnderstandingServiceFactory(config) {
  const ocrAdapter = OCRProvidersRegistry[config.ocr.provider](config.ocr.config);
  const textStructuringAdapter = TextStructuringProvidersRegistry[config.textStructuring.provider](
    config.textStructuring.config
  );
  return new DocumentUnderstandingService(ocrAdapter, textStructuringAdapter);
}

// src/domains/prescription/prompt.ts
var prompt_default = `# Role

You are an experienced optometrist responsible for transcribing glasses prescriptions into structured JSON format.

# Objective

Analyze the content of a scanned or handwritten prescription and extract all relevant information into a **JSON array** of prescription objects. The format must match the JSON Schema provided to the system.

# Language Priority

Prescriptions may appear in multiple languages. Use the following priority to interpret content:
1. French (primary)
2. English (secondary)
3. Latin (fallback if relevant)
4. Any other (fallback)

# Output Rules

- Only output a valid **JSON array** of prescription objects.
- Each object must strictly follow the schema.
- Do **not** output any text, markdown, explanations, or formatting around the JSON.
- Leave missing or unknown fields as empty strings "".

# Extraction Instructions

## Eye Identification

Identify which side of the prescription the values belong to by looking for labels. Do **not** guess or infer the eye \u2014 only assign values when one of these labels is **explicitly found near the data**.

- **Right eye ('prescription.right')**
  - Common labels: OD, \u0152il droit, (E)il droit, oculus dexter
- **Left eye ('prescription.left')**
  - Common labels: OG, \u0152il gauche, (E)il gauche, oculus sinister
- **Both eyes ('OU')**
  - Common labels: OU, \u0152il Utile, (E)il Utile, oculus uterque
  - If found, copy the same values into both 'left' and 'right'

## Data Field Mapping

For each labeled eye section, look for and extract the following values:

- 'sphere':
  - Labeled as SPH, S, Sph\xE8re
  - Range: -20 to +20
  - May be written as "plan" if 0
- 'cylinder':
  - Labeled as CYL, C, cylindre, cylinder
  - Range: -10 to 0
  - Often in parentheses, e.g. '(-0.50)'
- 'axis':
  - Labeled as AXE, Ax, axis
  - Range: 0-180
  - May include \xB0 or * after the number
  - Usually only present when cylinder is present
- 'visionType':
  - Inferred from context:
    - "VL" = vision de loin, myopia, distance vision
    - "VP" = vision de pr\xE8s, presbytie, near vision

## Prescriber data

- 'prescriber': Prescriber/Doctor name. Extract when available. May start with Dr, Docteur or other similar words. Most likely will be placed on the top of the page.

## Patient Data

- 'patient.firstName' and 'lastName': Extract when available. May start with Madame, Monsieur or other similar words. There may be birthdate near or around it.
- 'patient.birthdate': Optional, format 'YYYY-MM-DD'. Places near patient name.

## Prescription Date

- 'prescription.prescribedAt':
  - Labeled as: Date de prescription, Date, valable
  - Format: 'YYYY-MM-DD'

# Pattern Matching Examples

You may encounter different ways of expressing the same values. Use these common patterns to guide extraction:

1. **OD +1.00 (-0.50) 180\xB0** \u2192 sphere = +1.00, cylinder = -0.50, axis = 180
2. **OG +2.00 (-0.75 90\xB0) Add +2.50** \u2192 left eye with sphere, cylinder, axis
3. **Left Eye +1.25 / -0.50 Ax 135** \u2192 use slashes and Ax to extract values
4. **(90\xB0 -1.00) +1.50 Add +2.00** \u2192 parenthesis-first order may apply

# Parsing Layout Variations

- Values may appear to the right, below, or above their corresponding labels.
- Layouts may be:
  - Inline: 'OD +2.00 (-1.00) 180\xB0'
  - Columnar: labels on one line, values below
  - Mixed: tables or stacked formats
- Always associate values with the **nearest valid label**.
- Avoid misattributing values from one eye to the other.

# Multiple Prescriptions

If the image contains more than one prescription (e.g., multiple people or visits):
- Return a **JSON array with multiple objects**
- Each object must be complete and valid

# Final Checklist Before Responding

- Only respond with a valid JSON array
- All extracted fields are placed under the correct eye
- Each field respects value types and format
- Missing values are empty strings
- You did **not** copy values between eyes unless explicitly marked as OU
- JSON follows the schema and contains no extra fields or formatting
`;

// src/domains/prescription/schema.json
var schema_default = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "PrescriptionList",
  description: "A list of glasses prescriptions.",
  type: "array",
  items: {
    title: "Prescription",
    description: "Schema for structuring glasses prescription information based on instructions.",
    type: "object",
    properties: {
      patient: {
        type: "object",
        description: "Information about the patient.",
        properties: {
          firstName: {
            type: "string",
            description: "Patient's first name. May start with Madam, Monsieur or similar"
          },
          lastName: {
            type: "string",
            description: "Patient's last name."
          },
          birthdate: {
            type: "string",
            description: "Patient's birth date in YYYY-MM-DD format."
          }
        },
        required: [
          "firstName",
          "lastName"
        ],
        additionalProperties: false
      },
      prescriber: {
        type: "string",
        description: "Full name of the prescriber/doctor. May start with Dr, Docteur or similar."
      },
      prescription: {
        type: "object",
        description: "Details of the prescription.",
        properties: {
          prescribedAt: {
            type: "string",
            description: "Date when prescription was issued in YYYY-MM-DD format."
          },
          right: {
            type: "object",
            description: "Prescription for right eye (OD - \u0152il droit).",
            properties: {
              visionType: {
                type: "string",
                enum: [
                  "VL",
                  "VP"
                ],
                description: "Type of vision correction: VL (far vision), VP (near vision)."
              },
              sphere: {
                type: "number",
                description: "Spherical correction, range from -20 to 20."
              },
              cylinder: {
                type: "number",
                description: "Cylindrical correction, range from -10 to 0."
              },
              axis: {
                type: "number",
                description: "Axis value, range from 0 to 180."
              }
            },
            required: [
              "visionType",
              "sphere",
              "cylinder",
              "axis"
            ],
            additionalProperties: false
          },
          left: {
            type: "object",
            description: "Prescription for left eye (OG - \u0152il gauche).",
            properties: {
              visionType: {
                type: "string",
                enum: [
                  "VL",
                  "VP"
                ],
                description: "Type of vision correction: VL (far vision), VP (near vision)."
              },
              sphere: {
                type: "number",
                description: "Spherical correction, range from -20 to +20."
              },
              cylinder: {
                type: "number",
                description: "Cylindrical correction, range from -10 to 0."
              },
              axis: {
                type: "number",
                description: "Axis value, range from 0 to 180."
              }
            },
            required: [
              "visionType",
              "sphere",
              "cylinder",
              "axis"
            ],
            additionalProperties: false
          }
        },
        required: [
          "prescribedAt"
        ],
        additionalProperties: false
      }
    },
    required: [
      "patient",
      "prescription"
    ],
    additionalProperties: false
  }
};

// src/domains/prescription/understanding.ts
var PrescriptionUnderstandingService = class {
  constructor(config) {
    this.understandingService = DocumentUnderstandingServiceFactory(config);
  }
  async understand(prescriptionOCRInput) {
    return this.understandingService.understand(prescriptionOCRInput, {
      prompt: prompt_default,
      outputSchema: schema_default
    });
  }
};

// src/domains/prescription/mistral-understanding.ts
function MistralPrescriptionUnderstanding(options) {
  return new PrescriptionUnderstandingService({
    ocr: {
      provider: Providers.Mistral,
      config: {
        apiKey: options.apiKey,
        model: options.OCRModel
      }
    },
    textStructuring: {
      provider: Providers.Mistral,
      config: {
        apiKey: options.apiKey,
        model: options.textStructuringModel
      }
    }
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MistralPrescriptionUnderstanding,
  PrescriptionUnderstandingService
});
//# sourceMappingURL=index.cjs.map
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
import { Mistral } from "@mistralai/mistralai";
var getMistralSingletonClient = /* @__PURE__ */ (() => {
  const cache = /* @__PURE__ */ new Map();
  return ({ apiKey }) => {
    if (!apiKey) throw new Error("Mistral requires an API key.");
    if (cache.has(apiKey)) return cache.get(apiKey);
    const client = new Mistral({ apiKey });
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
      "base64:pdf": {
        type: "document_url",
        documentUrl: file
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
        document: this.convertDocumentToContentChunk(input),
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
  const client = getMistralSingletonClient({ apiKey: config.apiKey });
  return new MistralVisualStructuring(client, {
    model: config.model ?? "mistral-medium-latest"
  });
}

// src/infrastructure/providers/visual-structuring.ts
var VisualStructuringProvidersRegistry = {
  [Providers.Mistral]: MistralVisualStructuringFactory
};

// src/engine/visual-understanding.ts
var VisualUnderstanding = class {
  constructor(adapter) {
    this.adapter = adapter;
  }
  understand(document, factors) {
    return this.adapter.parse(document, factors);
  }
};

// src/domains/prescription/prompt.ts
var prompt_default = `# Role

You are an experienced optometrist responsible for transcribing glasses prescriptions into structured JSON format.

# Objective

Analyze the content of a scanned or handwritten prescription and extract all relevant information into a JSON array of prescription objects.

# Language Priority

Prescriptions may appear in multiple languages. Use the following priority to interpret content:
1. French (primary)
2. English (secondary)
3. Latin (fallback if relevant)
4. Any other (fallback)

# Output Rules

- Only output a valid JSON array of prescription objects according to the JSON Schema.
- Leave missing or unknown fields as empty strings "".

# Extraction Instructions

# Patient Data

- patient.title:
  - Optional
  - Extract from salutations like Madame, Monsieur, M., Mme
  - Map to values like "Mr", "Mrs", "Ms"
  - Leave as "" if not found
- patient.firstName:
  - Extract from salutations like Madame, Monsieur
  - May contain multiple parts (e.g., "Erich Maria")
  - If one word is in uppercase (e.g., "DUPONT"), assume the remaining words form the first name
  - Example: "Madame Jeanne Dupont" \u2192 firstName: "Jeanne"
  - Example complex: "Monsieur Erich Maria REMARQUE" \u2192 firstName: "Erich Maria"
  - Example reversed: "Madame DUPONT Jeanne" \u2192 firstName: "Jeanne"
- patient.lastName:
  - If one name is in full uppercase, treat it as the last name
  - Otherwise, use the last word as fallback if casing doesn't help
  - Example: "Madame Jeanne Dupont" \u2192 lastName: "Dupont"
  - Example complex: "Monsieur Erich Maria REMARQUE" \u2192 lastName: "REMARQUE"
  - Example reversed: "Madame DUPONT Jeanne" \u2192 lastName: "DUPONT"
- patient.birthdate:
  - Optional
  - Format: YYYY-MM-DD
  - Often near the name

# Prescriber Data

- prescriber: Extract doctor's name if available. May start with Dr, Docteur, etc.

# Prescription Date

- prescription.prescribedAt:
  - Labels: Date de prescription, Date, valable
  - Format: YYYY-MM-DD

# Eye Identification

Identify which side of the prescription the values belong to by looking for labels. Do not guess or infer the eye \u2014 only assign values when one of these labels is explicitly found near the data.

- Right eye (prescription.right)
  - Labels: OD, \u0152il droit, (E)il droit, oculus dexter
- Left eye (prescription.left)
  - Labels: OG, \u0152il gauche, (E)il gauche, oculus sinister
- Both eyes (OU)
  - Labels: OU, \u0152il Utile, (E)il Utile, oculus uterque
  - If found, copy the same values into both left and right

## Data Field Mapping

For each labeled eye section (prescription.right or prescription.left), look for and extract the following fields:

- cylinder:
  - Often written in parentheses, e.g. (-0.50)
  - Labels: CYL, C, cylindre, cylinder (optional)
  - Range: -10 to 0
  - Always preserve the minus sign if present
- axis:
  - Labels: AXE, Ax, axis
  - Range: 0-180
  - Often includes \xB0 or * after the number
  - Axis usually only appears when cylinder is present
- sphere:
  - Labels: SPH, S, Sph\xE8re (optional)
  - Range: -20 to +20
  - "plan" may be used for 0
  - Always preserve the minus sign if present
- visionType:
  - Inferred from context:
    - VL: de loin, vision de loin, far vision, distance vision, myopia, astigmatisme, hyperm\xE9tropie
    - VP: de pr\xE8s, vision de pr\xE8s, near vision, presbytie

# Parsing Sphere, Cylinder, Axis

## Common Notation Patterns

Below are standard formats used to express prescriptions. Focus on structure:

- (axis\xB0 cylinder) sphere  
- sphere (cylinder) axis  
- sphere / cylinder Ax axis  
- (cylinder) axis \u2192 sphere = 0  
- sphere = "plan" \u2192 sphere = 0  
- axis may be indicated as AXE, Ax, or followed by \xB0

These may be mixed with labels like OD/OG/OU, or appear inline, stacked, or in tables.

# Pattern Matching Examples

You may encounter various layouts and notations for sphere/cylinder/axis.

a. +1.00 (-0.50) 180\xB0 \u2192 sphere = +1.00, cylinder = -0.50, axis = 180  
b. +2.00 (-0.75 90\xB0) Add +2.50 \u2192 sphere = +2.00, cylinder = -0.75, axis = 90  
c. +1.25 / -0.50 Ax 135 \u2192 sphere = +1.25, cylinder = -0.50, axis = 135  
d. (angle\xB0 cyl) sph \u2192 axis = angle, cylinder = cyl, sphere = sph  
   - Example: (10\xB0 -1.00) -0.75 \u2192 axis = 10, cylinder = -1.00, sphere = -0.75  
   - Always treat the parenthesized value as cylinder if it contains a degree (\xB0), and the value after as sphere  
e. (165\xB0 -1.00) -3.00 \u2192 axis = 165, cylinder = -1.00, sphere = -3.00  
f. (-1.50) 180\xB0 \u2192 cylinder = -1.50, sphere = 0, axis = 180  
   - If a single value is in parentheses and followed by an axis, treat it as cylinder, and sphere is 0

## Explained Parsing Rules (with more examples)

- These values often appear together in patterns like:  
  - +1.00 (-0.50) 180\xB0
  - +1.25 / -0.50 Ax 135
  - (165\xB0 -1.00) -3.00
- Parentheses typically indicate cylinder and axis, especially if they contain a degree.
- Always preserve + or - signs. "plan" or "pl" means sphere = 0.

## Inference Rules

- If only one value is in parentheses, followed by a number with \xB0:
  - Treat parentheses as cylinder, number with \xB0 as axis, and sphere = 0  
  - Example: (-1.50) 180\xB0 \u2192 cylinder: -1.50, axis: 180, sphere: 0

- If parentheses contain a degree and a signed number:
  - The value with \xB0 is the axis
  - The other value inside parentheses is the cylinder
  - The value after the parentheses is the sphere
  - Example: (165\xB0 -1.00) -3.00 \u2192 axis: 165, cylinder: -1.00, sphere: -3.00
  - Do NOT reverse cylinder and sphere, even if sphere is more negative

- If 3 values appear, like +2.00 (-0.75 90\xB0) or +1.25 / -0.50 Ax 135:
  - sphere = first number, cylinder = second, axis = third
  - Recognize "Ax" or "axis" as axis label

## Special Pattern: (angle\xB0 cylinder) sphere

If a value is written in the form (angle\xB0 cylinder) sphere:
- Treat the degree value inside parentheses as axis
- The number after the degree as cylinder
- The value outside the parentheses as sphere

Examples:
- (160\xB0 -0.75) -0.5 \u2192 axis: 160, cylinder: -0.75, sphere: -0.5
- (10\xB0 -1.00) -0.75 \u2192 axis: 10, cylinder: -1.00, sphere: -0.75

Do NOT confuse cylinder and sphere, even if both are negative or look similar.
- The second value is always the sphere.

## Additional Inference Rule: (cylinder) \xE0 axis\xB0

If a single negative number is enclosed in parentheses, and followed by \xE0 or @ + degree (e.g. \xE0 180\xB0):
- Treat the value inside parentheses as cylinder
- The number after \xE0 as axis
- Set sphere = 0
Example:
- (-1.50) \xE0 180\xB0 \u2192 cylinder: -1.50, axis: 180, sphere: 0

If a value appears before the parentheses, treat that as sphere
Example:
- -0.75 (-1.25) \xE0 180\xB0 \u2192 sphere: -0.75, cylinder: -1.25, axis: 180

# Layout Hints

- Values may appear to the right, below, or above their corresponding labels.
- Can be inline (OD +2.00 (-1.00) 180\xB0), columnar, tabular, or stacked.
- Always associate values with the nearest valid label.
- Never assign values from one eye to another unless marked explicitly as OU.

# Multiple Prescriptions

If the document contains multiple prescriptions, corrections blocks or visits:
- Return a JSON array with multiple objects`;

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
          title: {
            type: "string",
            description: "Optional honorific such as 'Mr', 'Mrs', or 'Ms', extracted from salutations like 'Madame', 'Monsieur', 'M.', 'Mme'. Leave as empty string if not found."
          },
          firstName: {
            type: "string",
            description: "Patient's first name. May be composed of multiple parts. Salutations like 'Madame', 'Monsieur' must be excluded."
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

// src/domains/prescription/mistral.ts
function MistralPrescriptionUnderstanding(options) {
  try {
    const mistralAdapter = VisualStructuringProvidersRegistry[Providers.Mistral]({
      apiKey: options.apiKey,
      model: options.model ?? "mistral-medium-latest"
    });
    const engine = new VisualUnderstanding(mistralAdapter);
    const service = new DocumentUnderstandingService(engine, prompt_default, schema_default);
    return { service, isInitialized: true };
  } catch (error) {
    return { error, isInitialized: false };
  }
}
export {
  MistralPrescriptionUnderstanding
};
//# sourceMappingURL=index.js.map
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
    const text = await this.ocr.recognizeText(document);
    if (!text) {
      throw new Error("OCR returned no text");
    }
    return this.textStructuring.parse(text, context);
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
    const client = new Mistral({ apiKey, timeoutMs: 2e4 });
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
        includeImageBase64: false
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
    const messages = [
      {
        role: "system",
        content: [
          { type: "text", text: prompt }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `### File content in Markdown: ${text}`
          }
        ]
      }
    ];
    try {
      const chatResponse = await this.client.chat.parse({
        model: this.modelName,
        messages,
        responseFormat: outputSchema
      });
      const parsedOutput = chatResponse?.choices?.[0]?.message?.parsed;
      if (!parsedOutput) {
        throw new TextStructuringError("Expected Mistral LLM output to be fulfilled.");
      }
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
    const messages = [
      {
        role: "system",
        content: [
          { type: "text", text: prompt }
        ]
      },
      {
        role: "user",
        content: [contentChunk]
      }
    ];
    try {
      const response = await this.client.chat.complete({
        model: this.modelName,
        messages,
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

// src/domains/prescription/zod-schema.ts
import { z } from "zod";
var EyePrescriptionSchema = () => z.object({
  visionType: z.enum(["VL", "VP"]).describe(
    "Type of vision correction: VL (vision de loin, myopia), VP (vision de pr\xE8s, presbytie)."
  ),
  sphere: z.number().describe(
    'Spherical correction, labeled as SPH, S, or Sph\xE8re. Value typically ranges from -20 to +20. "plan" means 0.'
  ),
  cylinder: z.number().describe(
    "Cylindrical correction, labeled as CYL, C, or cylindre. Value typically ranges from -10 to 0. May appear in parentheses."
  ),
  axis: z.number().describe(
    "Axis value, labeled as AXE, Ax, or axis. Value typically ranges from 0 to 180. Usually appears if cylinder is present."
  )
});
var Patient = z.object({
  title: z.enum(["Mr", "Mrs", "Ms", ""]).optional().default("").describe(
    "Allowed values are 'Mr' (Monsieur, M.), 'Mrs' (Madame), or 'Ms' (Mme). Leave empty if not found."
  ),
  firstName: z.string().describe(
    "Patient\u2019s first name. May appear near honorifics like Madame, Monsieur."
  ),
  lastName: z.string().describe(
    "Patient\u2019s last name. Often appears after first name or in uppercase."
  ),
  birthdate: z.string().optional().default("").describe(
    "Optional. Patient\u2019s birthdate in 'YYYY-MM-DD' format."
  )
});
var PrescriptionDocumentSchema = z.object({
  patient: Patient,
  prescriber: z.string().optional().default("").describe(
    "Doctor\u2019s name. May start with 'Dr' or 'Docteur'. Usually at the top."
  ),
  prescription: z.object({
    prescribedAt: z.string().optional().describe(
      "Date when prescription was issued, labeled as 'Date', format 'YYYY-MM-DD'."
    ),
    right: EyePrescriptionSchema().describe("Prescription for right eye (OD, \u0152il droit)."),
    left: EyePrescriptionSchema().describe("Prescription for left eye (OG, \u0152il gauche).")
  }).describe("Prescription values split by eye. Use only explicitly labeled values.")
});
var PrescriptionDocumentListSchema = z.array(PrescriptionDocumentSchema).describe(
  "A list of structured prescription objects extracted from scanned or handwritten input."
);

// src/domains/prescription/mistral.ts
function MistralPrescriptionUnderstandingFactory(options) {
  try {
    const mistralOCRAdapter = OCRProvidersRegistry[Providers.Mistral]({
      apiKey: options.apiKey,
      model: options.model
    });
    const mistralTextStructuringAdapter = TextStructuringProvidersRegistry[Providers.Mistral]({
      apiKey: options.apiKey,
      model: options.model ?? "mistral-medium-latest"
    });
    const engine = new OCRTextUnderstanding(mistralOCRAdapter, mistralTextStructuringAdapter);
    const engineContext = {
      prompt: prompt_default,
      outputSchema: PrescriptionDocumentListSchema
    };
    const service = new DocumentUnderstandingService(engine, engineContext);
    return { service, isInitialized: true };
  } catch (error) {
    return { error, isInitialized: false };
  }
}
export {
  MistralPrescriptionUnderstandingFactory
};
//# sourceMappingURL=index.js.map
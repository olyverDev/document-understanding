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
        document: this.convertOCRInputToDocumentContentChunk(input)
        // includeImageBase64: true,
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
    model: config.model ?? "mistral-small-latest"
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
    await new Promise((resolve) => setTimeout(resolve, 1e3));
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
var prompt_default = `# Role and Objective

You're an experienced optometrician who has to has to type a prescription into an application following a specific format. After finding a pattern and understanding values in the prescriptions, please, put the proper values into a JSON-file accodrding to a given JSON-schema. 

Available langauges:
1. French (primary)
2. English (secondary)
3. Latin (secondary)
4. Any other (fallback)
  
# Instructions

## Sub-categories for more detaile instructions 
1. Synonym is a way to name a parameter in prescription. I.e. 'right eye' can be named \`\u0152il droit\`, \`OD\`, but only one way per parameter.

### Obligatory

| parameter                          | synonym                                                                                                                                           | value_hints                                                                                                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| right eye                          | \u0152il droit, OD, oculus dexter                                                                                                                      | put values after this into \`right\` parameters of the JSON.                                                                                                             |
| left eye                           | \u0152il gauche, OG, oculus sinister                                                                                                                   | put values after this into \`left\` parameters of the JSON.                                                                                                              |
| both eyes                          | \u0152il Utile, OU, oculus uterque                                                                                                                     | If found, put same value into left and right parts of JSON.                                                                                                            |
| rightSphere, leftSphere            | SPH, S, Sph\xE8re                                                                                                                                    | from -20 to +20, if 0 can be missing or identified as 'plan'                                                                                                           |
| rightCylinder, leftCylinder        | CYL, C, cylindre, cylinder                                                                                                                        | from -10 to 0                                                                                                                                                          |
| leftAxis,<br>rightAxis             | AXE, Ax, axis                                                                                                                                     | 0 to 180. May be followed with \xB0 or * sign. If not present, then put zero.                                                                                             |
| leftVisionType,<br>rightVisionType | VL, hyperm\xE9tropie, de loin, vision de loin, far vision, distance vision; VP, myopia, de pres, vision de pres, near vision;                        | Put values \`VL\`, \`VP\`<br>                                                                                                                                              |
| prescriberFullName                 | Nom du prescripteur, Prescriber Name, Prescriber Full Name, Doctor, Prescribed by, Ophthalmologist, ophtalmologiste, Dr en ophtalmologie, Docteur | May start with "madame", 'monsieur' or other similar words. skip the "starting word". most likey is located on top. Most likely will be placed on the top of the page. |
| prescriberEmail                    | Prescriber email, email                                                                                                                           | Will be placed near \`prescriber name\`.                                                                                                                                 |
| prescriberAddress                  | Adresse du cabinet, Address                                                                                                                       | Contains city, Street, building number, and zip-code. Will be placed near \`prescriber name\`.                                                                           |
| prescribedAt                       | Date de prescription, Date, valable                                                                                                               | output format \`YYYY-MM-DD\`                                                                                                                                             |
| patientFirstName                   |                                                                                                                                                   | Patient's first name                                                                                                                                                   |
| patientLastName                    |                                                                                                                                                   | Patient's last name                                                                                                                                                    |


### Optional

| parameter           | synonym                                         | value_hints                                                                                                                                                                               |
| ------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| rightAdd, leftAdd   | ADD, add, addition                              | From 0 to 4. IF not present, put zero.                                                                                                                                                    |
| expirationDate      | valid to                                        | output format YYYY-MM-DD                                                                                                                                                                  |
| treatment           | amincis entireflets, filtre lumiere, sunsensors | may name filters on the lenses (sun sensors, blue light) or other.                                                                                                                        |
| leftDeg, rightDeg   | DEG, degression                                 | Deg can be from 0 to 360. The degree symbol (\xB0) is sometimes shown next to the degression, sometimes omitted.                                                                             |
| leftBase, rightBase | base, Direction de la base, base direction      | If deg is missing there may be present base with values (IN or BASE NASALE, OUT or BASE TEMPORALE, UP or BASE SUP\xC9RIEURE, DOWN or BASE INF\xC9RIEURE)                                        |
| tint                | tint, teinte, colour                            | Just colour indentification. I.e. "teinte", "Sunsensors", "solaire", "Cat\xE9gorie solaire"                                                                                                  |
| pd                  | PD, \xE9cart pupillaire, EP, pupillary distance    | Simple number may be followed by "mm" or " mm". Pupillary Distance (PD) or \xE9cart pupillaire is added in mm. If values for left/right eyes are different, then add proper numbers in JSON. |
| VA                  | VA, Acuit\xE9 Visuelle                             |                                                                                                                                                                                           |
| patientBirthdate    |                                                 | output format \`YYYY-MM-DD\`                                                                                                                                                                |
| adeliNumber         | Syst\xE8me d\u2019Automatisation Des Listes             | follow \`^$|^0?\\d{9}$\`; example value: \`0759876543\`                                                                                                                                      |
| eip                 |                                                 |                                                                                                                                                                                           |

# Reasoning Steps

1. If a field is not available, just put 0 in it.
2. Handle ambiguities or unreadable text by making reasonable assumptions or noting the uncertainty.
3. Sometimes we can have a few prescriptions on the image, you should put all these prescriptions in the result array
# Output Format

1. Use  JSON schema provided to 'client.chat.complete API' as an output format.
# Examples  
| pattern                     | example                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Sphere (Cylinder) Axis\xB0     | OD +1.00 (-0.50) 180\xB0; <br>Sphere can be empty or marked as plan, eg. (-0.75) 45\xB0                             |
| Sphere (Cylinder Axis\xB0) Add | OG +2.00 (-0.75 90\xB0) Add +2.50<br>Sphere can be empty or marked as plan, eg. Plan (-0.50) 90\xB0 OR (-1.00 180\xB0) |
| Sphere / Cylinder Ax Add    | Left Eye +1.25 / -0.50 Ax 135 Add +2.00<br>Sphere can be empty or marked as plan.                             |
| (Axis\xB0 Cylinder) Sphere Add | (90\xB0 -1.00) +1.50 Add +2.00                                                                                   |
  
# Context  
  
# Final instructions and prompt to think step by step

1. Read the prescription.
2. Get prescription text from the prescription.
3. Match prescription to a pattern in example.
4. Put values from pattern into JSON file according to a schema.
5. Respond only with a valid JSON array with objects conforming to the provided format.`;

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
            description: "Patient's first name."
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
        type: "object",
        description: "Information about the prescriber.",
        properties: {
          fullName: {
            type: "string",
            description: "Full name of the prescriber/doctor."
          },
          email: {
            type: "string",
            description: "Prescriber's email address."
          },
          address: {
            type: "string",
            description: "Address of the prescriber's office."
          },
          adeliNumber: {
            type: "string",
            description: "ADELI identification number, format: 0-9 digits."
          }
        },
        required: [
          "fullName"
        ],
        additionalProperties: false
      },
      prescription: {
        type: "object",
        description: "Details of the prescription.",
        properties: {
          prescribedAt: {
            type: "string",
            description: "Date when prescription was issued in YYYY-MM-DD format."
          },
          expirationDate: {
            type: "string",
            description: "End date of validity period in YYYY-MM-DD format."
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
              },
              add: {
                type: "number",
                description: "Addition value, range from 0 to 4."
              },
              deg: {
                type: "number",
                description: "Degression value, range from 0 to 360."
              },
              base: {
                type: "string",
                enum: [
                  "IN",
                  "OUT",
                  "UP",
                  "DOWN"
                ],
                description: "Direction of the base."
              },
              pd: {
                type: "number",
                description: "Pupillary distance in mm for right eye."
              },
              va: {
                type: "string",
                description: "Visual acuity for right eye."
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
              },
              add: {
                type: "number",
                description: "Addition value, range from 0 to 4."
              },
              deg: {
                type: "number",
                description: "Degression value, range from 0 to 360."
              },
              base: {
                type: "string",
                enum: [
                  "IN",
                  "OUT",
                  "UP",
                  "DOWN"
                ],
                description: "Direction of the base."
              },
              pd: {
                type: "number",
                description: "Pupillary distance in mm for left eye."
              },
              va: {
                type: "string",
                description: "Visual acuity for left eye."
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
          treatment: {
            type: "string",
            description: "Special treatments or filters for lenses."
          },
          tint: {
            type: "string",
            description: "Color or tint applied to lenses."
          }
        },
        required: [
          "prescribedAt",
          "right",
          "left"
        ],
        additionalProperties: false
      }
    },
    required: [
      "patient",
      "prescriber",
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
export {
  MistralPrescriptionUnderstanding,
  PrescriptionUnderstandingService
};
//# sourceMappingURL=index.js.map
import { D as DocumentUnderstandingService } from '../../service-B8KzHMnR.js';
export { V as ProcessPrescriptionInput } from '../../service-B8KzHMnR.js';

interface EyePrescription {
    visionType: "VL" | "VP";
    sphere: number;
    cylinder: number;
    axis: number;
}
interface PrescriptionDocument {
    patient: {
        title?: string;
        firstName: string;
        lastName: string;
        birthdate?: string;
    };
    prescriber?: string;
    prescription: {
        prescribedAt: string;
        right: EyePrescription;
        left: EyePrescription;
    };
}
type PrescriptionDocuments = PrescriptionDocument[];

var $schema = "http://json-schema.org/draft-07/schema#";
var title = "PrescriptionList";
var description = "A list of glasses prescriptions.";
var type = "array";
var items = {
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
					description: "Patient's first name. May start with salutations like Madam, Monsieur or similar"
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
					description: "Prescription for right eye (OD - Œil droit).",
					properties: {
						visionType: {
							type: "string",
							"enum": [
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
					description: "Prescription for left eye (OG - Œil gauche).",
					properties: {
						visionType: {
							type: "string",
							"enum": [
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
};
var schema = {
	$schema: $schema,
	title: title,
	description: description,
	type: type,
	items: items
};

type PrescriptionUnderstandingContext = {
    prompt: string;
    outputSchema: typeof schema;
};
interface MistralOptions {
    apiKey: string;
    model?: string;
}
type MistralResult = {
    isInitialized: true;
    service: DocumentUnderstandingService<PrescriptionDocuments, PrescriptionUnderstandingContext>;
} | {
    isInitialized: false;
    error?: Error;
};
/**
 * @docs Prescription Understanding – Mistral OCR + Text Understanding  Pipeline
 *
 * This implementation leverages the Mistral OCR and Completion APIs to perform
 * two-step **Image-To-Markdown** + **Markdown-To-Json** structuring by providing:
 * - A static prescription-specific `prompt`
 * - A corresponding JSON `schema`
 *
 * Engine is made of adapters and injected into the core `DocumentUnderstandingService`,
 * allowing downstream consumers to extract structured data from
 * images or PDFs of optical prescriptions.
 *
 * Internally, this uses the Mistral providers defined in the corresponding registries
 */
declare function MistralPrescriptionUnderstandingFactory(options: MistralOptions): MistralResult;

export { type MistralOptions, MistralPrescriptionUnderstandingFactory, type PrescriptionDocument, type PrescriptionDocuments };

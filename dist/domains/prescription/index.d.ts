import { D as DocumentUnderstandingService } from '../../service-B8KzHMnR.js';
export { V as ProcessPrescriptionInput } from '../../service-B8KzHMnR.js';
import { z } from 'zod';

declare const PrescriptionDocumentSchema: z.ZodObject<{
    patient: z.ZodObject<{
        title: z.ZodDefault<z.ZodOptional<z.ZodEnum<["Mr", "Mrs", "Ms", ""]>>>;
        firstName: z.ZodString;
        lastName: z.ZodString;
        birthdate: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        title: "" | "Mr" | "Mrs" | "Ms";
        firstName: string;
        lastName: string;
        birthdate: string;
    }, {
        firstName: string;
        lastName: string;
        title?: "" | "Mr" | "Mrs" | "Ms" | undefined;
        birthdate?: string | undefined;
    }>;
    prescriber: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    prescription: z.ZodObject<{
        prescribedAt: z.ZodOptional<z.ZodString>;
        right: z.ZodObject<{
            visionType: z.ZodEnum<["VL", "VP"]>;
            sphere: z.ZodNumber;
            cylinder: z.ZodNumber;
            axis: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            visionType: "VL" | "VP";
            sphere: number;
            cylinder: number;
            axis: number;
        }, {
            visionType: "VL" | "VP";
            sphere: number;
            cylinder: number;
            axis: number;
        }>;
        left: z.ZodObject<{
            visionType: z.ZodEnum<["VL", "VP"]>;
            sphere: z.ZodNumber;
            cylinder: z.ZodNumber;
            axis: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            visionType: "VL" | "VP";
            sphere: number;
            cylinder: number;
            axis: number;
        }, {
            visionType: "VL" | "VP";
            sphere: number;
            cylinder: number;
            axis: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        right: {
            visionType: "VL" | "VP";
            sphere: number;
            cylinder: number;
            axis: number;
        };
        left: {
            visionType: "VL" | "VP";
            sphere: number;
            cylinder: number;
            axis: number;
        };
        prescribedAt?: string | undefined;
    }, {
        right: {
            visionType: "VL" | "VP";
            sphere: number;
            cylinder: number;
            axis: number;
        };
        left: {
            visionType: "VL" | "VP";
            sphere: number;
            cylinder: number;
            axis: number;
        };
        prescribedAt?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    patient: {
        title: "" | "Mr" | "Mrs" | "Ms";
        firstName: string;
        lastName: string;
        birthdate: string;
    };
    prescriber: string;
    prescription: {
        right: {
            visionType: "VL" | "VP";
            sphere: number;
            cylinder: number;
            axis: number;
        };
        left: {
            visionType: "VL" | "VP";
            sphere: number;
            cylinder: number;
            axis: number;
        };
        prescribedAt?: string | undefined;
    };
}, {
    patient: {
        firstName: string;
        lastName: string;
        title?: "" | "Mr" | "Mrs" | "Ms" | undefined;
        birthdate?: string | undefined;
    };
    prescription: {
        right: {
            visionType: "VL" | "VP";
            sphere: number;
            cylinder: number;
            axis: number;
        };
        left: {
            visionType: "VL" | "VP";
            sphere: number;
            cylinder: number;
            axis: number;
        };
        prescribedAt?: string | undefined;
    };
    prescriber?: string | undefined;
}>;
declare const PrescriptionDocumentListSchema: z.ZodArray<z.ZodObject<{
    patient: z.ZodObject<{
        title: z.ZodDefault<z.ZodOptional<z.ZodEnum<["Mr", "Mrs", "Ms", ""]>>>;
        firstName: z.ZodString;
        lastName: z.ZodString;
        birthdate: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        title: "" | "Mr" | "Mrs" | "Ms";
        firstName: string;
        lastName: string;
        birthdate: string;
    }, {
        firstName: string;
        lastName: string;
        title?: "" | "Mr" | "Mrs" | "Ms" | undefined;
        birthdate?: string | undefined;
    }>;
    prescriber: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    prescription: z.ZodObject<{
        prescribedAt: z.ZodOptional<z.ZodString>;
        right: z.ZodObject<{
            visionType: z.ZodEnum<["VL", "VP"]>;
            sphere: z.ZodNumber;
            cylinder: z.ZodNumber;
            axis: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            visionType: "VL" | "VP";
            sphere: number;
            cylinder: number;
            axis: number;
        }, {
            visionType: "VL" | "VP";
            sphere: number;
            cylinder: number;
            axis: number;
        }>;
        left: z.ZodObject<{
            visionType: z.ZodEnum<["VL", "VP"]>;
            sphere: z.ZodNumber;
            cylinder: z.ZodNumber;
            axis: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            visionType: "VL" | "VP";
            sphere: number;
            cylinder: number;
            axis: number;
        }, {
            visionType: "VL" | "VP";
            sphere: number;
            cylinder: number;
            axis: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        right: {
            visionType: "VL" | "VP";
            sphere: number;
            cylinder: number;
            axis: number;
        };
        left: {
            visionType: "VL" | "VP";
            sphere: number;
            cylinder: number;
            axis: number;
        };
        prescribedAt?: string | undefined;
    }, {
        right: {
            visionType: "VL" | "VP";
            sphere: number;
            cylinder: number;
            axis: number;
        };
        left: {
            visionType: "VL" | "VP";
            sphere: number;
            cylinder: number;
            axis: number;
        };
        prescribedAt?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    patient: {
        title: "" | "Mr" | "Mrs" | "Ms";
        firstName: string;
        lastName: string;
        birthdate: string;
    };
    prescriber: string;
    prescription: {
        right: {
            visionType: "VL" | "VP";
            sphere: number;
            cylinder: number;
            axis: number;
        };
        left: {
            visionType: "VL" | "VP";
            sphere: number;
            cylinder: number;
            axis: number;
        };
        prescribedAt?: string | undefined;
    };
}, {
    patient: {
        firstName: string;
        lastName: string;
        title?: "" | "Mr" | "Mrs" | "Ms" | undefined;
        birthdate?: string | undefined;
    };
    prescription: {
        right: {
            visionType: "VL" | "VP";
            sphere: number;
            cylinder: number;
            axis: number;
        };
        left: {
            visionType: "VL" | "VP";
            sphere: number;
            cylinder: number;
            axis: number;
        };
        prescribedAt?: string | undefined;
    };
    prescriber?: string | undefined;
}>, "many">;

type PrescriptionDocument = z.infer<typeof PrescriptionDocumentSchema>;
type PrescriptionDocuments = z.infer<typeof PrescriptionDocumentListSchema>;

type PrescriptionUnderstandingContext = {
    prompt: string;
    outputSchema: typeof PrescriptionDocumentListSchema;
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

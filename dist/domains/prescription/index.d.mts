import { D as DocumentUnderstandingService } from '../../service-wDlDx4Rs.mjs';
export { V as ProcessPrescriptionInput } from '../../service-wDlDx4Rs.mjs';

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

interface MistralOptions {
    apiKey: string;
    model?: string;
}
type MistralResult = {
    isInitialized: true;
    service: DocumentUnderstandingService<PrescriptionDocuments>;
} | {
    isInitialized: false;
    error?: Error;
};
/**
 * @docs Prescription Understanding – Mistral Visual Strategy
 *
 * For the Prescription domain, the most effective understanding strategy
 * has proven to be **visual understanding** using Mistral AI.
 *
 * This implementation leverages the Mistral Completion API to perform
 * direct **Image-To-Json** structuring by providing:
 * - A static prescription-specific `prompt`
 * - A corresponding JSON `schema`
 *
 * The strategy is injected into a reusable `DocumentUnderstandingService`,
 * allowing downstream consumers to extract structured data from
 * images or PDFs of optical prescriptions.
 *
 * Internally, this uses the Mistral provider registered in the
 * `VisualStructuringProvidersRegistry`.
 */
declare function MistralPrescriptionUnderstanding(options: MistralOptions): MistralResult;

export { type MistralOptions, MistralPrescriptionUnderstanding, type PrescriptionDocument, type PrescriptionDocuments };

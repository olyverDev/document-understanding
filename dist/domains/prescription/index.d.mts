import { b as OCRProvidersConfigs, g as TextStructuringProvidersConfigs, a as OCRInput } from '../../text-structuring-BvvHEyDO.mjs';

interface EyePrescription {
    visionType: "VL" | "VP";
    sphere: number;
    cylinder: number;
    axis: number;
    add?: number;
    deg?: number;
    base?: "IN" | "OUT" | "UP" | "DOWN";
    pd?: number;
    va?: string;
}
interface PrescriptionDocument {
    patient: {
        firstName: string;
        lastName: string;
        birthdate?: string;
    };
    prescriber: {
        fullName: string;
        email?: string;
        address?: string;
        adeliNumber?: string;
    };
    prescription: {
        prescribedAt: string;
        expirationDate?: string;
        right: EyePrescription;
        left: EyePrescription;
        treatment?: string;
        tint?: string;
    };
}

type PrescriptionUnderstandingConfig<OCR extends keyof OCRProvidersConfigs = 'mistral', TextStructuring extends keyof TextStructuringProvidersConfigs = 'mistral'> = {
    ocr: {
        provider: OCR;
        config: OCRProvidersConfigs[OCR];
    };
    textStructuring: {
        provider: TextStructuring;
        config: TextStructuringProvidersConfigs[TextStructuring];
    };
};
declare class PrescriptionUnderstandingService {
    private readonly understandingService;
    constructor(config: PrescriptionUnderstandingConfig);
    understand(prescriptionOCRInput: OCRInput): Promise<PrescriptionDocument>;
}

interface MistralOptions {
    apiKey: string;
    OCRModel?: string;
    textStructuringModel?: string;
}
declare function MistralPrescriptionUnderstanding(options: MistralOptions): PrescriptionUnderstandingService;

export { type MistralOptions, MistralPrescriptionUnderstanding, type PrescriptionDocument, type PrescriptionUnderstandingConfig, PrescriptionUnderstandingService, OCRInput as ProcessPrescriptionInput };

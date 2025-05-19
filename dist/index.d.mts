import { O as OCR, T as TextStructuring, a as OCRInput, b as OCRProvidersConfigs, c as TextStructuringProvidersRegistryType } from './text-structuring-BvvHEyDO.mjs';
export { d as OCRProvidersRegistry, f as OCRProvidersRegistryType, e as TextStructuringProvidersRegistry } from './text-structuring-BvvHEyDO.mjs';

declare class DocumentUnderstandingService<T> {
    private readonly ocr;
    private readonly textStructuring;
    constructor(ocr: OCR, textStructuring: TextStructuring<T>);
    understand(input: OCRInput, options: {
        prompt: string;
        outputSchema?: object;
    }): Promise<T>;
}

declare const Providers: {
    readonly Mistral: "mistral";
};
type ProviderName = (typeof Providers)[keyof typeof Providers];

declare function DocumentUnderstandingServiceFactory<T, OCR extends keyof OCRProvidersConfigs = 'mistral', TextStructuring extends keyof TextStructuringProvidersRegistryType = 'mistral'>(config: {
    ocr: {
        provider: OCR;
        config: OCRProvidersConfigs[OCR];
    };
    textStructuring: {
        provider: TextStructuring;
        config: Parameters<TextStructuringProvidersRegistryType[TextStructuring]>[0];
    };
}): DocumentUnderstandingService<T>;

export { DocumentUnderstandingService, DocumentUnderstandingServiceFactory, OCRInput, type ProviderName, Providers, TextStructuringProvidersRegistryType };

interface StructuringFactors<SchemaT = Record<string, unknown>> {
    prompt: string;
    outputSchema?: SchemaT;
}

type VisualDocument = {
    source: 'base64';
    file: string;
    documentType: 'image' | 'pdf';
} | {
    source: 'url';
    file: string;
    documentType: 'image' | 'pdf';
};

interface UnderstandingEngine<T> {
    understand(document: VisualDocument, factors: StructuringFactors): Promise<T>;
}

declare class DocumentUnderstandingService<T> {
    private readonly engine;
    private readonly prompt;
    private readonly outputSchema?;
    constructor(engine: UnderstandingEngine<T>, prompt: string, outputSchema?: Record<string, unknown> | undefined);
    understand(document: VisualDocument): Promise<T>;
}

export { DocumentUnderstandingService as D, type StructuringFactors as S, type UnderstandingEngine as U, type VisualDocument as V };

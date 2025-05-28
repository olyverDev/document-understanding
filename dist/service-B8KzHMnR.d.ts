type VisualDocument = {
    source: 'base64';
    file: string;
    documentType: 'image' | 'pdf';
} | {
    source: 'url';
    file: string;
    documentType: 'image' | 'pdf';
};

interface UnderstandingEngine<T, C = unknown> {
    understand(document: VisualDocument, engineContext?: C): Promise<T>;
}

declare class DocumentUnderstandingService<T, C = unknown> {
    private readonly engine;
    private readonly engineContext?;
    constructor(engine: UnderstandingEngine<T, C>, engineContext?: C | undefined);
    understand(document: VisualDocument): Promise<T>;
}

export { DocumentUnderstandingService as D, type UnderstandingEngine as U, type VisualDocument as V };

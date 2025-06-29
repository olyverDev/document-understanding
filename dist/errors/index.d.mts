declare class OCRProcessingError extends Error {
    cause?: unknown | undefined;
    constructor(message: string, cause?: unknown | undefined);
}

declare class TextStructuringError extends Error {
    cause?: unknown | undefined;
    constructor(message: string, cause?: unknown | undefined);
}

declare class VisualStructuringError extends Error {
    cause?: unknown | undefined;
    constructor(message: string, cause?: unknown | undefined);
}

export { OCRProcessingError, TextStructuringError, VisualStructuringError };

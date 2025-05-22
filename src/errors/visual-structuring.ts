export class VisualStructuringError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'VisualStructuringError';
  }
}

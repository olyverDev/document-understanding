export class TextStructuringError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'TextStructuringError';
  }
}

export type VisualDocument =
  | { source: 'base64'; file: string; documentType: 'image' | 'pdf' }
  | { source: 'url'; file: string; documentType: 'image' | 'pdf' };
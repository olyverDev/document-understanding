import fs from 'fs';
import path from 'path';

import { MistralPrescriptionUnderstanding } from '../../../src/domains/prescription';

describe('Library real-world integration', () => {
  it(
    'parses a real base64 image input using Mistral OCR and structuring',
    async () => {
      const imagePath = path.resolve(__dirname, './assets/sample.jpg');
      const base64 = fs.readFileSync(imagePath, 'base64');

      const input = {
        source: 'base64',
        file: base64,
        documentType: 'image',
      } as const;

      if (!process.env.MISTRAL_API_KEY) {
        throw new Error('MISTRAL_API_KEY is required for integration tests');
      }

      const mistral = MistralPrescriptionUnderstanding({
        apiKey: process.env.MISTRAL_API_KEY,
      });

      if (!mistral.isInitialized) {
        throw new Error('Mistral service is not initialized');
      }

      const start = Date.now();

      try {
        const result = await mistral.service.understand(input);

        const elapsed = Date.now() - start;
        console.log(`OCR + structuring completed in ${elapsed}ms`);

        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
      } catch (err) {
        console.error('Failed to understand prescription:', err);
        throw err;
      }
    },
    20000 // allow up to 20s for full OCR + LLM roundtrip
  );
});

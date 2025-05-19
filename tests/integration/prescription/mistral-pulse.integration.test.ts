import fs from 'fs';
import path from 'path';

import type { OCRInput } from '../../../src';
import { MistralPrescriptionUnderstanding } from '../../../src/domains/prescription';

const FIXTURES_ROOT = path.resolve(__dirname, './fixtures');

const testCases = fs
  .readdirSync(FIXTURES_ROOT, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => {
    const name = dirent.name;
    const dir = path.join(FIXTURES_ROOT, name);

    const imagePath = path.join(dir, 'input.jpg');
    const expectedPath = path.join(dir, 'expected.json');

    if (!fs.existsSync(imagePath)) throw new Error(`Missing input.jpg in ${dir}`);
    if (!fs.existsSync(expectedPath)) throw new Error(`Missing expected.json in ${dir}`);

    return {
      name,
      base64: fs.readFileSync(imagePath, 'base64'),
      expected: JSON.parse(fs.readFileSync(expectedPath, 'utf-8')),
    };
  });

describe('Mistral OCR + Structuring — Integration Suite', () => {
  if (!process.env.MISTRAL_API_KEY) {
    throw new Error('MISTRAL_API_KEY is required for integration tests');
  }

  const service = MistralPrescriptionUnderstanding({
    apiKey: process.env.MISTRAL_API_KEY,
  });

  testCases.forEach(({ name, base64, expected }) => {
    it(
      `${name}`,
      async () => {
        const input: OCRInput = {
          source: 'base64',
          file: base64,
          documentType: 'image',
        };
        const result = await service.understand(input);

        expect(result).toEqual(expected);
      },
      20000
    );
  });
});

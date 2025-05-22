import fs from 'fs';
import path from 'path';

import type { VisualDocument } from '../../../src';
import { MistralPrescriptionUnderstanding } from '../../../src/domains/prescription';
import type { PrescriptionDocument } from '../../../src/domains/prescription';

const prescriptionVerificationMode = process.env.PRESCRIPTION_VERIFICATION_MODE;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

const FIXTURES_ROOT = path.resolve(__dirname, process.env.FIXTURES_ROOT || './fixtures');

const testCases = fs
  .readdirSync(FIXTURES_ROOT, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => {
    const name = dirent.name;
    const dir = path.join(FIXTURES_ROOT, name);

    let imagePath = path.join(dir, 'input.jpg');
    const expectedPath = path.join(dir, 'expected.json');

    // FIXME: add table tests or just not use png or just smth more clever
    if (!fs.existsSync(imagePath)) {
      imagePath = path.join(dir, 'input.png');
    }

    if (!fs.existsSync(imagePath)) throw new Error(`Missing input image in ${dir}`);
    if (!fs.existsSync(expectedPath)) throw new Error(`Missing expected.json in ${dir}`);

    return {
      name,
      base64: fs.readFileSync(imagePath, 'base64'),
      expected: JSON.parse(fs.readFileSync(expectedPath, 'utf-8')),
    };
  });

const pickPrescriptionCriticalFields = (prescriptionDocument: PrescriptionDocument) => ({
  patient: {
    firstName: prescriptionDocument?.patient?.firstName,
    lastName: prescriptionDocument?.patient?.lastName,
    // FIXME: birthdate sometimes 0000-00-00 or 1990
  },
  prescription: {
    right: prescriptionDocument?.prescription?.right,
    left: prescriptionDocument?.prescription?.left,
  },
});

describe('Mistral OCR + Structuring — Integration Suite', () => {
  if (!MISTRAL_API_KEY) {
    throw new Error('MISTRAL_API_KEY is required for integration tests');
  }

  const service = MistralPrescriptionUnderstanding({
    apiKey: MISTRAL_API_KEY,
  });

  testCases.forEach(({ name, base64, expected }) => {
    it(
      `${name}`,
      async () => {
        const input: VisualDocument = {
          source: 'base64',
          file: base64,
          documentType: 'image',
        };
        const result = await service.understand(input);

        switch (prescriptionVerificationMode) {
          case 'strict': {
            expect(result).toEqual(expected);
            break;
          }
          default: {
            expect(result.length).toBe(expected.length);

            result.forEach((actual, index) => {
              expect(
                pickPrescriptionCriticalFields(actual)
              ).toEqual(
                pickPrescriptionCriticalFields(expected[index])
              );

              // NOTE: verify  that prescriber at least similar
              expect(
                actual?.prescriber?.includes(expected[index]?.prescriber) ||
                expected[index]?.prescriber?.includes(actual.prescriber)
              ).toBe(true);
            });
          }
        }
      },
      20000
    );
  });
});

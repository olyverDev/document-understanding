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

    const pdfPath = path.join(dir, 'input.pdf');
    const expectedPath = path.join(dir, 'expected.json');

    if (!fs.existsSync(pdfPath)) throw new Error(`Missing input PDF in ${dir}`);
    if (!fs.existsSync(expectedPath)) throw new Error(`Missing expected.json in ${dir}`);

    const base64Raw = fs.readFileSync(pdfPath, 'base64');
    const base64 = `data:application/pdf;base64,${base64Raw}`;


    return {
      name,
      base64,
      expected: JSON.parse(fs.readFileSync(expectedPath, 'utf-8')),
    };
  });

const pickPrescriptionCriticalFields = (prescriptionDocument: PrescriptionDocument) => ({
  patient: {
    firstName: prescriptionDocument?.patient?.firstName,
    lastName: prescriptionDocument?.patient?.lastName,
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

  const mistral = MistralPrescriptionUnderstanding({
    apiKey: MISTRAL_API_KEY,
  });

  if (!mistral.isInitialized) {
    throw new Error('Mistral service is not initialized');
  }


  testCases.forEach(({ name, base64, expected }) => {
    it(
      `${name}`,
      async () => {
        const input: VisualDocument = {
          source: 'url',
          file: base64,
          documentType: 'pdf',
        };
        const result = await mistral.service.understand(input);

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

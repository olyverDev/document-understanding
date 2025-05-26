import { MistralPrescriptionUnderstanding } from '../../../src/domains/prescription';

describe('Library real-world integration (URL-based)', () => {
  const mistral = MistralPrescriptionUnderstanding({
    apiKey: process.env.MISTRAL_API_KEY!,
  });

  if (!mistral.isInitialized) {
    throw new Error('Mistral service is not initialized');
  }

  const runTest = async (label: string, input: { source: 'url'; file: string; documentType: 'image' | 'pdf' }) => {
    it(
      `parses ${label}`,
      async () => {
        const start = Date.now();
        try {
          const result = await mistral.service.understand(input);
          const elapsed = Date.now() - start;
          console.log(`${label} completed in ${elapsed}ms`);

          result.forEach((resultItem) => {
            console.info(`${label} Right Eye: `, resultItem.prescription.right);
            console.info(`${label} Left Eye: `, resultItem.prescription.left);
          });

          expect(result).toBeDefined();
          expect(typeof result).toBe('object');
        } catch (err) {
          console.error(`Failed to parse ${label}:`, err);
          throw err;
        }
      },
      20000
    );
  };

  runTest('PDF over URL', {
    source: 'url',
    file: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    documentType: 'pdf',
  });

  runTest('Image over URL', {
    source: 'url',
    file: 'https://opticalworld.wordpress.com/wp-content/uploads/2007/01/sampleprescription.jpg?w=584',
    documentType: 'image',
  });
});

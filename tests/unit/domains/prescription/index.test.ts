import * as Prescription from '../../../../src/domains/prescription';

describe('Prescription domain API', () => {
  it('exports PrescriptionUnderstandingService as a class', () => {
    expect(typeof Prescription.PrescriptionUnderstandingService).toBe('function');
    const instance = new Prescription.PrescriptionUnderstandingService({
      ocr: {
        provider: 'mistral',
        config: { apiKey: 'test' },
      },
      textStructuring: {
        provider: 'mistral',
        config: { apiKey: 'test' },
      },
    });
    expect(instance).toBeInstanceOf(Prescription.PrescriptionUnderstandingService);
  });

  it('exports MistralPrescriptionUnderstanding as a factory function', () => {
    expect(typeof Prescription.MistralPrescriptionUnderstanding).toBe('function');
    const result = Prescription.MistralPrescriptionUnderstanding({ apiKey: 'test' });
    expect(result).toBeInstanceOf(Prescription.PrescriptionUnderstandingService);
  });
});

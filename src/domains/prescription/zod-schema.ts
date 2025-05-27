import { z } from 'zod';

const EyePrescriptionSchema = () =>
  z.object({
    visionType: z.enum(['VL', 'VP']).describe(
      'Type of vision correction: VL (vision de loin, myopia), VP (vision de près, presbytie).'
    ),
    sphere: z.number().describe(
      'Spherical correction, labeled as SPH, S, or Sphère. Value typically ranges from -20 to +20. "plan" means 0.'
    ),
    cylinder: z.number().describe(
      'Cylindrical correction, labeled as CYL, C, or cylindre. Value typically ranges from -10 to 0. May appear in parentheses.'
    ),
    axis: z.number().describe(
      'Axis value, labeled as AXE, Ax, or axis. Value typically ranges from 0 to 180. Usually appears if cylinder is present.'
    ),
  });

const Patient = z.object({
  title: z.enum(['Mr', 'Mrs', 'Ms', '']).optional().default('').describe(
    "Allowed values are 'Mr' (Monsieur, M.), 'Mrs' (Madame), or 'Ms' (Mme). Leave empty if not found."
  ),
  firstName: z.string().describe(
    'Patient’s first name. May appear near honorifics like Madame, Monsieur.'
  ),
  lastName: z.string().describe(
    'Patient’s last name. Often appears after first name or in uppercase.'
  ),
  birthdate: z.string().optional().default('').describe(
    "Optional. Patient’s birthdate in 'YYYY-MM-DD' format."
  ),
});

export const PrescriptionDocumentSchema = z.object({
  patient: Patient,
  prescriber: z.string().optional().default('').describe(
    "Doctor’s name. May start with 'Dr' or 'Docteur'. Usually at the top."
  ),
  prescription: z
    .object({
      prescribedAt: z.string().optional().describe(
        "Date when prescription was issued, labeled as 'Date', format 'YYYY-MM-DD'."
      ),
      right: EyePrescriptionSchema().describe('Prescription for right eye (OD, Œil droit).'),
      left: EyePrescriptionSchema().describe('Prescription for left eye (OG, Œil gauche).'),
    })
    .describe('Prescription values split by eye. Use only explicitly labeled values.'),
});

export const PrescriptionDocumentListSchema = z
  .array(PrescriptionDocumentSchema)
  .describe(
    'A list of structured prescription objects extracted from scanned or handwritten input.'
  );

// NOTE: example of generating JSON Schema from Zod schema

// const result = PrescriptionDocumentListSchema.safeParse(response.message.parsed);
// const jsonSchema = zodToJsonSchema(PrescriptionDocumentListSchema, {
//   name: 'PrescriptionList',
//   target: 'jsonSchema7',
//   $schema: 'http://json-schema.org/draft-07/schema#',
// });

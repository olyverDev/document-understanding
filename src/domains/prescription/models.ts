import { z } from 'zod';

import { PrescriptionDocumentSchema, PrescriptionDocumentListSchema } from './zod-schema'

export type PrescriptionDocument = z.infer<typeof PrescriptionDocumentSchema>;
export type PrescriptionDocuments = z.infer<typeof PrescriptionDocumentListSchema>;

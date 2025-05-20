interface EyePrescription {
  visionType: "VL" | "VP";
  sphere: number;
  cylinder: number;
  axis: number;
  // add?: number;
  // deg?: number;
  // base?: "IN" | "OUT" | "UP" | "DOWN";
  // pd?: number;
  // va?: string;
}

export interface PrescriptionDocument {
  patient: {
    firstName: string;
    lastName: string;
    birthdate?: string;
  };
  prescriber: string;
  prescription: {
    prescribedAt: string;
    right: EyePrescription;
    left: EyePrescription;
    // expirationDate?: string;
    // treatment?: string;
    // tint?: string;
  };
}

export type PrescriptionDocuments = PrescriptionDocument[];

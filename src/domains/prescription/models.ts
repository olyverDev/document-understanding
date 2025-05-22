interface EyePrescription {
  visionType: "VL" | "VP";
  sphere: number;
  cylinder: number;
  axis: number;
  // NOTE: left for possbile future extension
  // add?: number;
  // deg?: number;
  // base?: "IN" | "OUT" | "UP" | "DOWN";
  // pd?: number;
  // va?: string;
}

export interface PrescriptionDocument {
  patient: {
    title?: string;
    firstName: string;
    lastName: string;
    birthdate?: string;
  };
  prescriber?: string;
  prescription: {
    prescribedAt: string;
    right: EyePrescription;
    left: EyePrescription;
    // NOTE: left for possbile future extension
    // expirationDate?: string;
    // treatment?: string;
    // tint?: string;
  };
}

export type PrescriptionDocuments = PrescriptionDocument[];

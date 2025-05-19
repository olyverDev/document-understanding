interface EyePrescription {
  visionType: "VL" | "VP";
  sphere: number;
  cylinder: number;
  axis: number;
  add?: number;
  deg?: number;
  base?: "IN" | "OUT" | "UP" | "DOWN";
  pd?: number;
  va?: string;
}

export interface PrescriptionDocument {
  patient: {
    firstName: string;
    lastName: string;
    birthdate?: string;
  };
  prescriber: {
    fullName: string;
    email?: string;
    address?: string;
    adeliNumber?: string; // Format: optional or 0-9 digits
  };
  prescription: {
    prescribedAt: string;
    expirationDate?: string;
    right: EyePrescription;
    left: EyePrescription;
    treatment?: string;
    tint?: string;
  };
}

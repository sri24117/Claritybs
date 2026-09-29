/**
 * Row types mirroring schema.sql. The data layer returns plain rows, so these
 * are the only "models" the app knows about.
 */

export interface Patient {
  id: string;
  phone: string;
  name: string | null;
  age: number | null;
  sex: string | null;
  weightKg: number | null;
  state: string;
  tier: string;
  consentAt: Date | null;
  consentVersion: string | null;
  lastInboundAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
}

export interface Report {
  id: string;
  patientId: string;
  filePath: string | null;
  mime: string | null;
  hba1c: number | null;
  fbs: number | null;
  ppbs: number | null;
  reportDate: Date | null;
  confidence: number | null;
  status: string;
  simulated: boolean;
  raw: unknown;
  explainedAt: Date | null;
  verifiedById: string | null;
  createdAt: Date;
}

export interface Plan {
  id: string;
  patientId: string;
  tier: string;
  draftText: string | null;
  finalText: string | null;
  status: string;
  approvedById: string | null;
  approvedAt: Date | null;
  sentAt: Date | null;
  createdAt: Date;
}

export interface Checkin {
  id: string;
  patientId: string;
  dueAt: Date;
  status: string;
  sentAt: Date | null;
  respondedAt: Date | null;
  note: string | null;
}

export interface Flag {
  id: string;
  patientId: string;
  ruleId: string;
  severity: string;
  detail: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
  resolvedById: string | null;
}

export interface Message {
  id: string;
  patientId: string;
  direction: string;
  body: string | null;
  waMessageId: string | null;
  ts: Date;
}

export interface Payment {
  id: string;
  patientId: string | null;
  razorpayPaymentId: string | null;
  razorpayLinkId: string | null;
  amount: number;
  currency: string;
  tier: string | null;
  status: string;
  simulated: boolean;
  createdAt: Date;
}

export interface Dietician {
  id: string;
  email: string;
  name: string;
  qualification: string | null;
  registrationNo: string | null;
  passwordHash: string;
  createdAt: Date;
}

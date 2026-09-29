-- ClarityBS schema. Plain SQL so it runs anywhere with a Postgres connection:
--   npm run db:init          (applies this file)
--   docker compose exec db psql -U claritybs claritybs < schema.sql
-- Safe to re-run (idempotent).

CREATE TABLE IF NOT EXISTS "User" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email"      TEXT NOT NULL UNIQUE,
  "password"   TEXT NOT NULL,
  "name"       TEXT,
  "phone"      TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Dietician" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email"           TEXT NOT NULL UNIQUE,
  "name"            TEXT NOT NULL,
  "qualification"   TEXT,
  "registrationNo"  TEXT,
  "passwordHash"    TEXT NOT NULL,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Patient" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "phone"           TEXT NOT NULL UNIQUE,
  "name"            TEXT,
  "age"             INTEGER,
  "sex"             TEXT,
  "weightKg"        DOUBLE PRECISION,
  "state"           TEXT NOT NULL DEFAULT 'new',
  "tier"            TEXT NOT NULL DEFAULT 'free',
  "consentAt"       TIMESTAMP(3),
  "consentVersion"  TEXT,
  "lastInboundAt"   TIMESTAMP(3),
  "deletedAt"       TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Patient_state_idx" ON "Patient" ("state");

CREATE TABLE IF NOT EXISTS "Report" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "patientId"     UUID NOT NULL REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "filePath"      TEXT,
  "mime"          TEXT,
  "hba1c"         DOUBLE PRECISION,
  "fbs"           DOUBLE PRECISION,
  "ppbs"          DOUBLE PRECISION,
  "reportDate"    TIMESTAMP(3),
  "confidence"    DOUBLE PRECISION,
  "status"        TEXT NOT NULL DEFAULT 'processing',
  "simulated"     BOOLEAN NOT NULL DEFAULT false,
  "raw"           JSONB,
  "explainedAt"   TIMESTAMP(3),
  "verifiedById"  UUID REFERENCES "Dietician"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Report_patientId_idx" ON "Report" ("patientId");
CREATE INDEX IF NOT EXISTS "Report_status_idx" ON "Report" ("status");

CREATE TABLE IF NOT EXISTS "Plan" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "patientId"     UUID NOT NULL REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "tier"          TEXT NOT NULL,
  "draftText"     TEXT,
  "finalText"     TEXT,
  "status"        TEXT NOT NULL DEFAULT 'drafting',
  "approvedById"  UUID REFERENCES "Dietician"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "approvedAt"    TIMESTAMP(3),
  "sentAt"        TIMESTAMP(3),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Plan_patientId_idx" ON "Plan" ("patientId");
CREATE INDEX IF NOT EXISTS "Plan_status_idx" ON "Plan" ("status");

CREATE TABLE IF NOT EXISTS "Checkin" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "patientId"     UUID NOT NULL REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "dueAt"         TIMESTAMP(3) NOT NULL,
  "status"        TEXT NOT NULL DEFAULT 'scheduled',
  "sentAt"        TIMESTAMP(3),
  "respondedAt"   TIMESTAMP(3),
  "note"          TEXT
);
CREATE INDEX IF NOT EXISTS "Checkin_patientId_idx" ON "Checkin" ("patientId");
CREATE INDEX IF NOT EXISTS "Checkin_status_dueAt_idx" ON "Checkin" ("status", "dueAt");

CREATE TABLE IF NOT EXISTS "Flag" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "patientId"     UUID NOT NULL REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "ruleId"        TEXT NOT NULL,
  "severity"      TEXT NOT NULL,
  "detail"        TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt"    TIMESTAMP(3),
  "resolvedById"  UUID REFERENCES "Dietician"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Flag_patientId_idx" ON "Flag" ("patientId");
CREATE INDEX IF NOT EXISTS "Flag_resolvedAt_idx" ON "Flag" ("resolvedAt");

CREATE TABLE IF NOT EXISTS "Message" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "patientId"     UUID NOT NULL REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "direction"     TEXT NOT NULL,
  "body"          TEXT,
  "waMessageId"   TEXT UNIQUE,
  "ts"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Message_patientId_idx" ON "Message" ("patientId");

CREATE TABLE IF NOT EXISTS "Payment" (
  "id"                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "patientId"          UUID REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "razorpayPaymentId"  TEXT UNIQUE,
  "razorpayLinkId"     TEXT,
  "amount"             INTEGER NOT NULL,
  "currency"           TEXT NOT NULL DEFAULT 'INR',
  "tier"               TEXT,
  "status"             TEXT NOT NULL DEFAULT 'PENDING',
  "simulated"          BOOLEAN NOT NULL DEFAULT false,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Payment_patientId_idx" ON "Payment" ("patientId");

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "actor"      TEXT NOT NULL,
  "action"     TEXT NOT NULL,
  "entity"     TEXT NOT NULL,
  "entityId"   TEXT,
  "meta"       JSONB,
  "ts"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "AuditLog_ts_idx" ON "AuditLog" ("ts");

-- Frozen consumer models, kept so old rows still resolve.
CREATE TABLE IF NOT EXISTS "ExtractedValue" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "reportId"       UUID NOT NULL UNIQUE REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "hba1c"          DOUBLE PRECISION,
  "fbs"            DOUBLE PRECISION,
  "ppbs"           DOUBLE PRECISION,
  "bloodPressure"  TEXT,
  "bmi"            DOUBLE PRECISION,
  "cholesterol"    DOUBLE PRECISION,
  "triglycerides"  DOUBLE PRECISION,
  "age"            INTEGER,
  "weight"         DOUBLE PRECISION,
  "height"         DOUBLE PRECISION,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "LabReportDataset" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "labName"         TEXT,
  "originalPdfUrl"  TEXT,
  "ocrRawText"      TEXT,
  "canonicalJson"   JSONB,
  "confidenceScore" DOUBLE PRECISION,
  "isHumanVerified" BOOLEAN NOT NULL DEFAULT false,
  "verifiedBy"      TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

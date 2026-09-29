import { db } from "../store";
import type { Patient } from "../types";

/** In-memory login rate limiting (single-instance MVP; move to Redis at scale). */
const attempts = new Map<string, { n: number; until: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_TRIES = 8;

export function loginBlocked(key: string): boolean {
  const e = attempts.get(key);
  if (!e) return false;
  if (Date.now() > e.until) {
    attempts.delete(key);
    return false;
  }
  return e.n > MAX_TRIES;
}

export function loginFailed(key: string): void {
  const e = attempts.get(key) || { n: 0, until: Date.now() + WINDOW_MS };
  e.n += 1;
  e.until = Date.now() + WINDOW_MS;
  attempts.set(key, e);
}

export function loginSucceeded(key: string): void {
  attempts.delete(key);
}

/** Find or create the patient behind a WhatsApp number. */
export async function upsertPatient(phone: string): Promise<Patient> {
  const existing = await db.patient.findUnique({ where: { phone } });
  if (existing) return existing;
  return db.patient.create({ data: { phone, state: "new" } });
}

export async function logMessage(patientId: string, direction: "in" | "out", body: string | null, waMessageId?: string) {
  await db.message.create({ data: { patientId, direction, body, waMessageId } });
}

export function isInsideWindow(p: Patient): boolean {
  if (!p.lastInboundAt) return false;
  return Date.now() - new Date(p.lastInboundAt).getTime() < 24 * 3600 * 1000;
}

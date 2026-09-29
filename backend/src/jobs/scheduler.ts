/**
 * Scheduler: sends due check-ins and marks silent ones as missed.
 * Runs as its own container (`worker`).
 */
import { db } from "../store";
import { cfg } from "../config";
import { logMessage } from "../lib/db";
import * as wa from "../services/whatsapp.service";

export const CHECKIN_TEXT =
  "Quick check-in 🌿 How have the last few days gone with your plan?\n" +
  "1 = followed it well\n2 = partly\n3 = struggled\n" +
  "Or tell us in your own words.";

const DAY = 86400000;

export async function tick(): Promise<void> {
  const now = new Date();

  for (const c of await db.checkin.findMany({ where: { status: "scheduled", dueAt: { lte: now } } })) {
    const p = await db.patient.findUnique({ where: { id: c.patientId } });
    if (!p) continue;
    if (p.deletedAt) {
      await db.checkin.update({ where: { id: c.id }, data: { status: "cancelled" } });
      continue;
    }
    const res = await wa.sendSmart((d, b) => logMessage(p.id, d, b), p, CHECKIN_TEXT);
    if (res !== "failed") {
      await db.checkin.update({ where: { id: c.id }, data: { status: "sent", sentAt: now } });
    }
  }

  // Anything sent more than 3 days ago with no reply is a miss.
  const cutoff = new Date(now.getTime() - 3 * DAY);
  const stale = await db.checkin.findMany({ where: { status: "sent", sentAt: { lte: cutoff } } });
  for (const c of stale) {
    await db.checkin.update({ where: { id: c.id }, data: { status: "missed" } });
  }
}

async function main() {
  console.log(`[scheduler] starting (${cfg.sim.whatsapp ? "SIMULATION" : "LIVE"})`);
  // Run immediately so a fresh deploy isn't silent for 60s.
  for (;;) {
    try {
      await tick();
    } catch (e) {
      console.error("[scheduler] tick failed:", (e as Error).message);
    }
    await new Promise((r) => setTimeout(r, 60_000));
  }
}

if (require.main === module) void main();
export { main as runForever };

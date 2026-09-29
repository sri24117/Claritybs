/**
 * Patient conversation state machine.
 * new -> await_consent -> await_profile -> active
 */
import { db } from "../store";
import type { Patient } from "../types";
import { cfg, PRICES } from "../config";
import { audit } from "../lib/audit";
import { isInsideWindow, logMessage, upsertPatient } from "../lib/db";
import * as rules from "../services/rules";
import * as wa from "../services/whatsapp.service";
import { ingestTypedValues, ingestMedia } from "./report.flow";
import { createLink } from "../services/payments.service";

const YES = new Set(["yes", "y", "i agree", "agree", "ok", "yes i agree"]);

export const WELCOME =
  "Hi! 👋 This is ClarityBS. We explain your sugar report in simple language and help you build " +
  "food habits that fit your life.\n" +
  "This is educational support, not diagnosis or treatment.\n" +
  "We store your details and report only to help you. You can ask us to delete them any time.\n" +
  "Reply YES to agree and continue.";

export const FALLBACK =
  "Thanks, we've got your message and our dietician will see it.\n" +
  "To share a report, send a photo or PDF. Or reply PLAN (14-day reset, ₹299) or GUIDED (30-day, ₹999).";

export interface Inbound {
  type: string; // text | image | document
  text?: string;
  mediaId?: string;
  mime?: string;
  waMessageId?: string;
}

/** Idempotency: Meta retries webhooks. */
export async function alreadySeen(waMessageId?: string): Promise<boolean> {
  if (!waMessageId) return false;
  const m = await db.message.findUnique({ where: { waMessageId } });
  return !!m;
}

export async function reply(p: Patient, body: string) {
  return wa.sendSmart((d, b) => logMessage(p.id, d, b), p, body);
}

export async function flag(patientId: string, rule: string, severity: "red" | "orange", detail = "") {
  const ex = await db.flag.findFirst({ where: { patientId, ruleId: rule, resolvedAt: null } });
  if (ex) return null;
  const f = await db.flag.create({ data: { patientId, ruleId: rule, severity, detail: detail.slice(0, 500) } });
  if (severity === "red") {
    await wa.alert(`ClarityBS RED flag: ${rule} (patient ${patientId}). Open the console.`);
  }
  return f;
}

export async function scheduleCheckins(patientId: string, tier: string) {
  const days = tier === "reset" ? [3, 7, 14] : [7, 14, 21, 28];
  const now = Date.now();
  await db.checkin.createMany({
    data: days.map((d) => ({ patientId, dueAt: new Date(now + d * 86400000) })),
  });
}

/** Send any approved-but-unsent plan (e.g. approved while patient was outside the 24h window). */
export async function deliverPending(p: Patient) {
  const pending = await db.plan.findMany({ where: { patientId: p.id, status: "approved" } });
  for (const pl of pending) await sendPlan(pl.id);
}

export async function sendPlan(planId: string) {
  const plan = await db.plan.findUnique({ where: { id: planId } });
  if (!plan || plan.status !== "approved") return "skipped";
  const p = await db.patient.findUnique({ where: { id: plan.patientId } });
  if (!p) return "no-patient";
  const res = await reply(p, "Your plan is ready 🌿\n\n" + (plan.finalText || plan.draftText || ""));
  if (res === "sent" || res === "simulated") {
    await db.plan.update({ where: { id: plan.id }, data: { status: "sent", sentAt: new Date() } });
    await scheduleCheckins(p.id, plan.tier);
  }
  return res;
}

export async function markCheckinResponse(p: Patient, text: string): Promise<boolean> {
  const c = await db.checkin.findFirst({
    where: { patientId: p.id, status: "sent" },
    orderBy: { dueAt: "desc" },
  });
  if (!c) return false;
  await db.checkin.update({
    where: { id: c.id },
    data: { status: "responded", respondedAt: new Date(), note: (text || "").slice(0, 500) },
  });
  const t = (text || "").trim();
  if (t === "3" || /struggl/i.test(t)) {
    await flag(p.id, "struggling", "orange", t.slice(0, 200));
  }
  return true;
}

/** The state machine. Returns the reply status for logging/tests. */
export async function handleInbound(p: Patient, m: Inbound): Promise<string> {
  const text = (m.text || "").trim();
  const low = text.toLowerCase();

  // Safety first, always, in every state.
  if (rules.selfHarm(text)) {
    await flag(p.id, "self_harm", "red", text.slice(0, 200));
    await reply(
      p,
      "I'm really sorry you're feeling this way. You deserve support right now.\n" +
        "Please call Tele-MANAS on 14416 (free, 24x7) or 112 if you are in danger.\n" +
        "Our dietician has been alerted.",
    );
    return "self_harm";
  }
  if (/delete my data/.test(low)) {
    await flag(p.id, "delete_request", "orange", "patient asked to erase data");
    await reply(p, "Understood. Our team will delete your data and confirm here.");
    return "delete_request";
  }
  if (rules.symptomRed(text)) {
    await flag(p.id, "symptom_red", "red", text.slice(0, 200));
    await reply(p, rules.RED_MSG);
    return "symptom_red";
  }

  await deliverPending(p);
  if (await markCheckinResponse(p, text)) {
    await reply(p, "Thanks for the update 🙏 Your dietician will see it.");
    return "checkin_response";
  }

  switch (p.state) {
    case "new":
      await db.patient.update({ where: { id: p.id }, data: { state: "await_consent" } });
      await reply(p, WELCOME);
      return "welcome";

    case "await_consent":
      if (YES.has(low)) {
        await db.patient.update({
          where: { id: p.id },
          data: { consentAt: new Date(), consentVersion: cfg.consentVersion, state: "await_profile" },
        });
        await reply(p, "Thank you. Send your age, sex and weight in one message, like: 45 M 72");
      } else {
        await reply(p, "Please reply YES to continue, or ignore this message.");
      }
      return "consent";

    case "await_profile": {
      const prof = rules.parseProfile(text);
      if (!prof || prof[0] < 12 || prof[0] > 100 || prof[2] < 25 || prof[2] > 250) {
        await reply(p, "Couldn't read that. Example: 45 M 72 (age, M or F, weight in kg)");
        return "bad_profile";
      }
      if (prof[0] < 18) {
        await reply(p, "ClarityBS is for adults (18+). Please ask a parent or guardian to message us.");
        return "minor";
      }
      await db.patient.update({
        where: { id: p.id },
        data: { age: prof[0], sex: prof[1], weightKg: prof[2], state: "active" },
      });
      await reply(p, "Got it. Now send a photo or PDF of your latest sugar report, or type the numbers (e.g. HbA1c 6.4, FBS 118, PPBS 165).");
      return "profile";
    }

    default: {
      // active (or erased -> we never reach here)
      if (m.type === "image" || m.type === "document") return ingestMedia(p, m);
      const vals = rules.parseValues(text);
      if (Object.keys(vals).length) return ingestTypedValues(p, vals);
      if (["plan", "reset", "14 day reset"].includes(low)) return sendPaylink(p, "reset");
      if (["guided", "guided plan", "30 day"].includes(low)) return sendPaylink(p, "guided");
      await reply(p, FALLBACK);
      return "fallback";
    }
  }
}

export async function sendPaylink(p: Patient, tier: string) {
  try {
    const link = await createLink(p, tier);
    await db.payment.create({
      data: { patientId: p.id, razorpayLinkId: link.linkId, amount: PRICES[tier], tier, simulated: link.simulated },
    });
    await reply(p, `Here is your secure payment link for the ${tier === "reset" ? "14-Day Sugar Reset (₹299)" : "30-Day Dietician Program (₹999)"}:\n${link.url}`);
    return "paylink";
  } catch (e) {
    console.error("[pay] link failed:", (e as Error).message);
    await flag(p.id, "paylink_failed", "orange", tier);
    await reply(p, "Sorry, we couldn't create the payment link. Our team will follow up here.");
    return "paylink_failed";
  }
}

/** Entry point shared by the real webhook and the simulator. */
export async function receiveInbound(phone: string, m: Inbound): Promise<{ patientId: string; status: string }> {
  const p = await upsertPatient(phone);
  if (p.deletedAt) return { patientId: p.id, status: "erased" };
  if (await alreadySeen(m.waMessageId)) return { patientId: p.id, status: "duplicate" };

  await logMessage(p.id, "in", m.text || `[${m.type}]`, m.waMessageId);
  await db.patient.update({ where: { id: p.id }, data: { lastInboundAt: new Date() } });

  const status = await handleInbound({ ...p, lastInboundAt: new Date() }, m);
  return { patientId: p.id, status };
}

export { isInsideWindow, upsertPatient, logMessage, audit, PRICES };

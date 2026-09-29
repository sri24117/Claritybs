/**
 * Plan drafting, approval and delivery.
 */
import { db } from "../store";
import * as rules from "../services/rules";
import { draftPlan as llmDraft } from "../services/llm.service";
import { scheduleCheckins, sendPlan } from "./patient.flow";

export async function draftPlan(planId: string) {
  const plan = await db.plan.findUnique({ where: { id: planId } });
  if (!plan || plan.status === "sent") return;
  const p = await db.patient.findUnique({ where: { id: plan.patientId } });
  if (!p) return;

  const latest = await db.report.findFirst({
    where: { patientId: p.id, status: { in: ["verified", "auto_explained", "needs_verification"] } },
    orderBy: { createdAt: "desc" },
  });
  const values = latest
    ? { hba1c: latest.hba1c, fbs: latest.fbs, ppbs: latest.ppbs }
    : { hba1c: null, fbs: null, ppbs: null };

  let text: string;
  try {
    const d = await llmDraft(plan.tier, { age: p.age, sex: p.sex, weightKg: p.weightKg }, values);
    text = d.text;
  } catch (e) {
    console.error("[plan] draft failed:", (e as Error).message);
    text = "[DRAFT FAILED - write this plan yourself]";
  }
  if (rules.hasMedAdvice(text)) {
    text =
      "[REVIEW: draft mentions medication/dose terms. Remove before sending.]\n\n" + text;
  }
  await db.plan.update({ where: { id: plan.id }, data: { draftText: text, finalText: text, status: "draft" } });
}

export async function approvePlan(planId: string, dieticianId: string) {
  const plan = await db.plan.findUnique({ where: { id: planId } });
  if (!plan || plan.status === "sent") throw new Error("Cannot edit");
  if (!plan.finalText) throw new Error("Nothing to approve");
  if (rules.hasMedAdvice(plan.finalText)) {
    throw new Error("Plan contains medication/dose terms. Remove them before approving.");
  }
  await db.plan.update({
    where: { id: plan.id },
    data: { status: "approved", approvedById: dieticianId, approvedAt: new Date() },
  });
  return sendPlan(plan.id);
}

export { scheduleCheckins };

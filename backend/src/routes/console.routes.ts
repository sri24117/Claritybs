/**
 * Dietician console API. Everything here is authenticated and audited.
 */
import { Router, Request, Response } from "express";
import { db } from "../store";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { audit } from "../lib/audit";
import { readFile, deleteFile } from "../lib/crypto";
import { logMessage } from "../lib/db";
import * as rules from "../services/rules";
import * as wa from "../services/whatsapp.service";
import { finalizeReport } from "../flows/report.flow";
import { approvePlan, draftPlan } from "../flows/plan.flow";
import { reply, sendPaylink } from "../flows/patient.flow";
import { PRICES } from "../config";

const router = Router();
router.use(requireAuth);

function body1(v: unknown): string {
  return String(Array.isArray(v) ? v[0] : v ?? "");
}

function who(name: string | null, phone: string): string {
  return name || phone;
}

// ---------------- today's queue ----------------
router.get("/queue", async (_req: AuthRequest, res: Response): Promise<void> => {
  const [flags, verify, plans, missed, good] = await Promise.all([
    db.flag.findMany({ where: { resolvedAt: null }, orderBy: { createdAt: "desc" } }),
    db.report.findMany({ where: { status: "needs_verification" }, orderBy: { createdAt: "desc" } }),
    db.plan.findMany({ where: { status: { in: ["drafting", "draft", "approved"] } }, orderBy: { createdAt: "desc" } }),
    db.checkin.findMany({ where: { status: "missed" }, orderBy: { dueAt: "desc" } }),
    db.checkin.findMany({ where: { status: "responded" }, orderBy: { respondedAt: "desc" } }),
  ]) as any[][];

  const patients = new Map<string, any>((await db.patient.findMany()).map((p: any) => [p.id, p]));
  const label = (pid: string) => {
    const p = patients.get(pid);
    return p ? who(p.name, p.phone) : pid;
  };

  const flagged = new Set(flags.map((f) => f.patientId));
  const missedIds = new Set(missed.map((c) => c.patientId));

  const out: Record<string, any> = {
    flags: flags.map((f) => ({
      id: f.id,
      patient_id: f.patientId,
      label: label(f.patientId),
      rule_id: f.ruleId,
      severity: f.severity,
      detail: f.detail,
      created_at: f.createdAt,
    })),
    verify: verify.map((r) => ({
      id: r.id,
      patient_id: r.patientId,
      label: label(r.patientId),
      hba1c: r.hba1c,
      fbs: r.fbs,
      ppbs: r.ppbs,
      confidence: r.confidence,
      simulated: r.simulated,
      created_at: r.createdAt,
    })),
    plans: plans.map((p) => ({
      id: p.id,
      patient_id: p.patientId,
      label: label(p.patientId),
      tier: p.tier,
      status: p.status,
      created_at: p.createdAt,
    })),
    noreply: [...missedIds].map((pid) => ({
      patient_id: pid,
      label: label(pid),
      detail: "No reply to check-in",
    })),
    ontrack: [...new Set(good.map((c) => c.patientId))]
      .filter((pid) => !flagged.has(pid) && !missedIds.has(pid))
      .map((pid) => ({ patient_id: pid, label: label(pid), detail: "Responded to check-in" })),
  };
  out.counts = Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.length]));
  res.json(out);
});

// ---------------- patient detail ----------------
router.get("/patients/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const p = await db.patient.findUnique({ where: { id: req.params.id } });
  if (!p || p.deletedAt) {
    res.status(404).json({ detail: "Not found" });
    return;
  }
  await audit(req.dietician!.email, "view", "patient", p.id);

  const [reports, plans, checkins, flags, messages, payments] = await Promise.all([
    db.report.findMany({ where: { patientId: p.id }, orderBy: { createdAt: "desc" } }),
    db.plan.findMany({ where: { patientId: p.id }, orderBy: { createdAt: "desc" } }),
    db.checkin.findMany({ where: { patientId: p.id }, orderBy: { dueAt: "desc" } }),
    db.flag.findMany({ where: { patientId: p.id, resolvedAt: null }, orderBy: { createdAt: "desc" } }),
    db.message.findMany({ where: { patientId: p.id }, orderBy: { ts: "asc" } }),
    db.payment.findMany({ where: { patientId: p.id }, orderBy: { createdAt: "desc" } }),
  ]);

  res.json({
    patient: {
      id: p.id,
      phone: p.phone,
      name: p.name,
      age: p.age,
      sex: p.sex,
      weight_kg: p.weightKg,
      state: p.state,
      tier: p.tier,
      consent_at: p.consentAt,
      consent_version: p.consentVersion,
      last_inbound_at: p.lastInboundAt,
      created_at: p.createdAt,
    },
    reports: reports.map((r) => ({
      id: r.id,
      status: r.status,
      hba1c: r.hba1c,
      fbs: r.fbs,
      ppbs: r.ppbs,
      report_date: r.reportDate,
      confidence: r.confidence,
      simulated: r.simulated,
      mime: r.mime,
      has_file: !!r.filePath,
      explained_at: r.explainedAt,
      created_at: r.createdAt,
    })),
    plans: plans.map((x) => ({
      id: x.id,
      tier: x.tier,
      status: x.status,
      draft_text: x.draftText,
      final_text: x.finalText,
      approved_at: x.approvedAt,
      sent_at: x.sentAt,
      created_at: x.createdAt,
    })),
    checkins: checkins.map((c) => ({ id: c.id, due_at: c.dueAt, status: c.status, note: c.note, sent_at: c.sentAt })),
    flags: flags.map((f) => ({
      id: f.id,
      rule_id: f.ruleId,
      severity: f.severity,
      detail: f.detail,
      created_at: f.createdAt,
    })),
    payments: payments.map((y) => ({
      id: y.id,
      amount: y.amount,
      tier: y.tier,
      status: y.status,
      simulated: y.simulated,
      created_at: y.createdAt,
    })),
    messages: messages.map((m) => ({ direction: m.direction, body: m.body, ts: m.ts })),
  });
});

router.patch("/patients/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const p = await db.patient.findUnique({ where: { id: req.params.id } });
  if (!p || p.deletedAt) {
    res.status(404).json({ detail: "Not found" });
    return;
  }
  const name = req.body?.name;
  await db.patient.update({
    where: { id: p.id },
    data: { name: name === undefined ? p.name : name === null ? null : String(name) },
  });
  await audit(req.dietician!.email, "edit", "patient", p.id, { name });
  res.json({ ok: true });
});

// ---------------- messaging ----------------
router.post("/patients/:id/message", async (req: AuthRequest, res: Response): Promise<void> => {
  const p = await db.patient.findUnique({ where: { id: req.params.id } });
  if (!p || p.deletedAt) {
    res.status(404).json({ detail: "Not found" });
    return;
  }
  const body = String(req.body?.body || "").trim();
  if (!body) {
    res.status(400).json({ detail: "empty message" });
    return;
  }
  if (rules.hasMedAdvice(body)) {
    res.status(400).json({ detail: "Message contains medication/dose terms. Remove them first." });
    return;
  }
  await audit(req.dietician!.email, "message", "patient", p.id);
  const status = await wa.sendSmart((d, b) => logMessage(p.id, d, b), p, body);
  res.json({ status });
});

router.post("/patients/:id/paylink", async (req: AuthRequest, res: Response): Promise<void> => {
  const p = await db.patient.findUnique({ where: { id: req.params.id } });
  if (!p || p.deletedAt) {
    res.status(404).json({ detail: "Not found" });
    return;
  }
  const tier = body1(req.body?.tier);
  if (!PRICES[tier]) {
    res.status(400).json({ detail: "bad tier" });
    return;
  }
  await sendPaylink(p, tier);
  await audit(req.dietician!.email, "paylink", "patient", p.id, { tier });
  res.json({ ok: true });
});

// ---------------- erasure (DPDP) ----------------
router.post("/patients/:id/erase", async (req: AuthRequest, res: Response): Promise<void> => {
  const p = await db.patient.findUnique({ where: { id: req.params.id } });
  if (!p || p.deletedAt) {
    res.status(404).json({ detail: "Not found" });
    return;
  }
  const reports = await db.report.findMany({ where: { patientId: p.id } });
  for (const r of reports) deleteFile(r.filePath);
  for (const model of ["report", "plan", "checkin", "flag", "message"] as const) {
    await (db as any)[model].deleteMany({ where: { patientId: p.id } });
  }
  await db.patient.update({
    where: { id: p.id },
    data: {
      phone: "erased-" + require("crypto").createHash("sha256").update(p.phone).digest("hex").slice(0, 20),
      name: null,
      age: null,
      sex: null,
      weightKg: null,
      state: "erased",
      deletedAt: new Date(),
    },
  });
  await audit(req.dietician!.email, "erase", "patient", p.id);
  res.json({ ok: true });
});

// ---------------- reports ----------------
router.patch("/reports/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const r = await db.report.findUnique({ where: { id: req.params.id } });
  if (!r) {
    res.status(404).json({ detail: "Not found" });
    return;
  }
  const n = (v: unknown): number | null => {
    if (v === "" || v === null || v === undefined) return null;
    const x = Number(v);
    return Number.isFinite(x) ? x : null;
  };
  const d = req.body?.report_date;
  await db.report.update({
    where: { id: r.id },
    data: {
      hba1c: "hba1c" in (req.body || {}) ? n(req.body.hba1c) : r.hba1c,
      fbs: "fbs" in (req.body || {}) ? n(req.body.fbs) : r.fbs,
      ppbs: "ppbs" in (req.body || {}) ? n(req.body.ppbs) : r.ppbs,
      reportDate: d ? new Date(d) : r.reportDate,
    },
  });
  await finalizeReport(r.id, req.dietician!.id);
  await audit(req.dietician!.email, "verify", "report", r.id);
  res.json({ ok: true });
});

router.get("/reports/:id/file", async (req: AuthRequest, res: Response): Promise<void> => {
  const r = await db.report.findUnique({ where: { id: req.params.id } });
  if (!r || !r.filePath) {
    res.status(404).json({ detail: "Not found" });
    return;
  }
  const buf = readFile(r.filePath);
  if (!buf) {
    res.status(410).json({ detail: "File no longer on disk" });
    return;
  }
  await audit(req.dietician!.email, "view_file", "report", r.id);
  res.type(r.mime || "application/octet-stream").send(buf);
});

// ---------------- plans ----------------
router.post("/patients/:id/plans", async (req: AuthRequest, res: Response): Promise<void> => {
  const p = await db.patient.findUnique({ where: { id: req.params.id } });
  if (!p || p.deletedAt) {
    res.status(404).json({ detail: "Not found" });
    return;
  }
  const tier = body1(req.body?.tier);
  if (!PRICES[tier]) {
    res.status(400).json({ detail: "bad tier" });
    return;
  }
  const plan = await db.plan.create({ data: { patientId: p.id, tier, status: "drafting" } });
  await draftPlan(plan.id);
  await audit(req.dietician!.email, "new_plan", "plan", plan.id, { tier });
  res.json({ id: plan.id });
});

router.patch("/plans/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const pl = await db.plan.findUnique({ where: { id: req.params.id } });
  if (!pl || pl.status === "sent") {
    res.status(400).json({ detail: "Cannot edit" });
    return;
  }
  const finalText = String(req.body?.final_text ?? "");
  if (rules.hasMedAdvice(finalText)) {
    res.status(400).json({ detail: "Plan contains medication/dose terms. Remove them first." });
    return;
  }
  await db.plan.update({
    where: { id: pl.id },
    data: { finalText, status: pl.status === "drafting" ? "draft" : pl.status },
  });
  await audit(req.dietician!.email, "edit", "plan", pl.id);
  res.json({ ok: true });
});

router.post("/plans/:id/approve", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const delivery = await approvePlan(String(req.params.id), req.dietician!.id);
    await audit(req.dietician!.email, "approve", "plan", String(req.params.id));
    res.json({ delivery });
  } catch (e) {
    res.status(400).json({ detail: (e as Error).message });
  }
});

// ---------------- flags ----------------
router.post("/flags/:id/resolve", async (req: AuthRequest, res: Response): Promise<void> => {
  const f = await db.flag.findUnique({ where: { id: req.params.id } });
  if (!f) {
    res.status(404).json({ detail: "Not found" });
    return;
  }
  await db.flag.update({
    where: { id: f.id },
    data: { resolvedAt: new Date(), resolvedById: req.dietician!.id },
  });
  await audit(req.dietician!.email, "resolve_flag", "flag", f.id);
  res.json({ ok: true });
});

export { reply };
export default router;

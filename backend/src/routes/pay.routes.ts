/**
 * Payments: create a link, receive the Razorpay webhook, and a simulator
 * settlement endpoint for pre-launch testing.
 */
import { Router, Request, Response } from "express";
import { db } from "../store";
import { cfg, PRICES } from "../config";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { audit } from "../lib/audit";
import { createLink, verifyWebhook } from "../services/payments.service";
import { draftPlan } from "../flows/plan.flow";
import * as wa from "../services/whatsapp.service";
import { flag, reply } from "../flows/patient.flow";
import { logMessage } from "../lib/db";

const router = Router();

/** Idempotent settlement shared by the real webhook and the simulator. */
export async function settlePayment(input: {
  patientId?: string | null;
  razorpayPaymentId: string;
  razorpayLinkId?: string | null;
  amount: number;
  tier?: string | null;
  simulated?: boolean;
}): Promise<{ ok: boolean; reason?: string }> {
  const ex = await db.payment.findUnique({ where: { razorpayPaymentId: input.razorpayPaymentId } });
  if (ex) return { ok: true, reason: "duplicate" };

  const patient = input.patientId ? await db.patient.findUnique({ where: { id: input.patientId } }) : null;
  const tier = input.tier || null;
  const valid =
    !!patient && !!tier && !!PRICES[tier] && input.amount === PRICES[tier];

  await db.payment.create({
    data: {
      patientId: patient?.id ?? null,
      razorpayPaymentId: input.razorpayPaymentId,
      razorpayLinkId: input.razorpayLinkId ?? null,
      amount: input.amount,
      tier,
      status: valid ? "SUCCESS" : "FAILED",
      simulated: !!input.simulated,
    },
  });

  if (!valid || !patient || !tier) {
    console.error("[pay] unmatched/mismatched payment", input.razorpayPaymentId);
    if (patient) await flag(patient.id, "payment_mismatch", "red", input.razorpayPaymentId);
    return { ok: false, reason: "mismatch" };
  }

  await db.patient.update({ where: { id: patient.id }, data: { tier } });
  const plan = await db.plan.create({ data: { patientId: patient.id, tier, status: "drafting" } });
  await draftPlan(plan.id);
  await reply(patient, "Payment received ✅ Your plan is being prepared and our dietician will send it shortly.");
  return { ok: true };
}

// ---- dietician-initiated payment link ----
router.post("/link/:patientId", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const tier = String(req.body?.tier || "");
  if (!PRICES[tier]) {
    res.status(400).json({ detail: "bad tier" });
    return;
  }
  const p = await db.patient.findUnique({ where: { id: req.params.patientId } });
  if (!p || p.deletedAt) {
    res.status(404).json({ detail: "no such patient" });
    return;
  }
  const link = await createLink(p, tier);
  await db.payment.create({
    data: { patientId: p.id, razorpayLinkId: link.linkId, amount: PRICES[tier], tier, simulated: link.simulated },
  });
  await audit(req.dietician!.email, "paylink", "patient", p.id, { tier });
  await reply(p, `Here is your secure payment link for the ${tier === "reset" ? "14-Day Sugar Reset (₹299)" : "30-Day Dietician Program (₹999)"}:\n${link.url}`);
  res.json({ url: link.url, simulated: link.simulated });
});

// ---- Razorpay webhook ----
router.post("/razorpay", async (req: Request, res: Response): Promise<void> => {
  const raw = (req as any).rawBody as Buffer | undefined;
  const header = req.headers["x-razorpay-signature"] as string | undefined;

  if (cfg.razorpay.webhookSecret) {
    if (!raw || !verifyWebhook(raw, header)) {
      res.status(403).json({ detail: "bad signature" });
      return;
    }
  } else if (!cfg.sim.open) {
    res.status(403).json({ detail: "webhook secret not configured" });
    return;
  }

  const ev = req.body;
  if (ev?.event !== "payment_link.paid") {
    res.json({ ok: true, ignored: ev?.event });
    return;
  }
  const pl = ev.payload?.payment_link?.entity || {};
  const pay = ev.payload?.payment?.entity || {};
  const notes = pl.notes || {};
  const r = await settlePayment({
    patientId: notes.patient_id || null,
    razorpayPaymentId: pay.id || `pay_${Date.now()}`,
    razorpayLinkId: pl.id || null,
    amount: Number(pay.amount || 0),
    tier: notes.tier || null,
    simulated: false,
  });
  res.json({ ok: true, ...r });
});

// ---- simulator settlement: mark a simulated link paid ----
router.post("/sim/settle", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!cfg.sim.open) {
    res.status(403).json({ detail: "simulator disabled" });
    return;
  }
  const patientId = String(req.body?.patientId || "");
  const tier = String(req.body?.tier || "");
  if (!PRICES[tier]) {
    res.status(400).json({ detail: "bad tier" });
    return;
  }
  const p = await db.patient.findUnique({ where: { id: patientId } });
  if (!p) {
    res.status(404).json({ detail: "no such patient" });
    return;
  }
  const r = await settlePayment({
    patientId: p.id,
    razorpayPaymentId: `sim_pay_${Date.now().toString(36)}`,
    amount: PRICES[tier],
    tier,
    simulated: true,
  });
  await audit(req.dietician!.email, "sim_settle", "patient", p.id, { tier });
  res.json(r);
});

// ---- patient-facing landing for simulated links ----
// Only reachable while Razorpay is unconfigured (sim mode): no real money exists,
// so "paying" here just exercises the same settlement path the webhook uses.
router.get("/sim/pay/:linkId", async (req: Request, res: Response): Promise<void> => {
  if (!cfg.sim.open) {
    res.status(404).json({ detail: "Not found" });
    return;
  }
  const payment = await db.payment.findFirst({ where: { razorpayLinkId: req.params.linkId } });
  const amount = payment ? `₹${payment.amount / 100}` : "unknown";
  const tier = payment?.tier || "";
  res.type("html").send(`<!doctype html>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ClarityBS (simulated payment)</title>
<body style="font-family:system-ui;background:#0b0d10;color:#e6edf3;display:grid;place-items:center;min-height:100vh;margin:0">
<div style="max-width:440px;padding:24px;text-align:center">
  <h2 style="margin:0 0 8px">ClarityBS — simulated payment</h2>
  <p style="color:#8b98a5;margin:0 0 4px">${tier ? tier + " plan" : "Unknown link"} · ${amount}</p>
  <p style="color:#8b98a5;font-size:14px">No Razorpay key is configured, so this link does not move money.
  Clicking below runs the same settlement path the real <code>payment_link.paid</code> webhook uses.</p>
  <button id="pay" style="margin-top:16px;border:0;border-radius:8px;background:#10b981;color:#04130d;padding:12px 22px;font-weight:600;font-size:15px;cursor:pointer">
    Simulate payment
  </button>
  <p id="msg" style="color:#34d399;font-size:14px;min-height:20px"></p>
</div>
<script>
document.getElementById('pay').onclick = async () => {
  const r = await fetch('/api/pay/sim/settle-public', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ linkId: ${JSON.stringify(req.params.linkId)} })
  });
  const j = await r.json().catch(() => ({}));
  document.getElementById('msg').textContent = r.ok
    ? 'Payment recorded ✅ Your plan is being prepared — check WhatsApp.'
    : ('Could not record payment: ' + (j.detail || r.status));
  if (r.ok) document.getElementById('pay').remove();
};
</script>`);
});

router.post("/sim/settle-public", async (req: Request, res: Response): Promise<void> => {
  if (!cfg.sim.open) {
    res.status(403).json({ detail: "simulator disabled" });
    return;
  }
  const linkId = String(req.body?.linkId || "");
  const payment = await db.payment.findFirst({ where: { razorpayLinkId: linkId } });
  if (!payment || !payment.patientId || !payment.tier) {
    res.status(404).json({ detail: "unknown link" });
    return;
  }
  const r = await settlePayment({
    patientId: payment.patientId,
    razorpayPaymentId: `sim_pay_${Date.now().toString(36)}`,
    amount: PRICES[payment.tier] ?? payment.amount,
    tier: payment.tier,
    simulated: true,
  });
  res.json(r);
});

export { logMessage, wa };
export default router;

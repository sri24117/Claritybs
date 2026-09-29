/**
 * Razorpay payment links, with a simulator fallback so the paid flow works
 * before any Razorpay key exists.
 */
import { cfg, PRICES, TIER_LABEL } from "../config";
import type { Patient } from "../types";

export interface PayLink {
  url: string;
  linkId: string;
  simulated: boolean;
}

export async function createLink(patient: Patient, tier: string): Promise<PayLink> {
  if (!PRICES[tier]) throw new Error(`unknown tier ${tier}`);
  const amount = PRICES[tier];

  if (cfg.sim.pay) {
    const id = `sim_${patient.id.slice(0, 8)}_${tier}_${Date.now().toString(36)}`;
    return { url: `${cfg.publicUrl}/sim/pay/${id}`, linkId: id, simulated: true };
  }

  const auth = Buffer.from(`${cfg.razorpay.keyId}:${cfg.razorpay.keySecret}`).toString("base64");
  const r = await fetch("https://api.razorpay.com/v1/payment_links", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount,
      currency: "INR",
      description: `ClarityBS ${TIER_LABEL[tier]}`,
      customer: { contact: `+${patient.phone}` },
      notify: { sms: false, email: false },
      reference_id: `p${patient.id}-${tier}-${Math.floor(Date.now() / 1000)}`,
      notes: { patient_id: patient.id, tier },
      callback_url: `${cfg.publicUrl}/pay/razorpay/return`,
      callback_method: "get",
    }),
  });
  if (!r.ok) throw new Error(`razorpay create failed: ${r.status} ${await r.text()}`);
  const j = (await r.json()) as any;
  return { url: j.short_url, linkId: j.id, simulated: false };
}

/** Razorpay signs webhooks with HMAC-SHA256 of the raw body. */
export function verifyWebhook(raw: Buffer, header: string | undefined): boolean {
  if (!cfg.razorpay.webhookSecret) return false;
  const crypto = require("crypto") as typeof import("crypto");
  const mac = crypto.createHmac("sha256", cfg.razorpay.webhookSecret).update(raw).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(header || ""));
}

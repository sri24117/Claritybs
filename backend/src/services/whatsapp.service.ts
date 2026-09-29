/**
 * WhatsApp Cloud API client with a full simulator fallback.
 * With WA_TOKEN set, messages really go to Meta. Without it, every send is
 * written to the message log and surfaced in the console + /sim page.
 */
import { cfg } from "../config";
import type { Patient } from "../types";

const G = () => `https://graph.facebook.com/${cfg.wa.graphVersion}`;

function headers() {
  return { Authorization: `Bearer ${cfg.wa.token}`, "Content-Type": "application/json" };
}

export function verifySignature(raw: Buffer, header: string | undefined): boolean {
  if (!cfg.wa.appSecret) return false;
  const crypto = require("crypto") as typeof import("crypto");
  const mac = crypto.createHmac("sha256", cfg.wa.appSecret).update(raw).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(`sha256=${mac}`), Buffer.from(header || ""));
}

async function post(payload: unknown): Promise<any> {
  const r = await fetch(`${G()}/${cfg.wa.phoneId}/messages`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`WhatsApp send failed: ${r.status} ${await r.text()}`);
  return r.json();
}

export async function sendText(phone: string, body: string) {
  return post({ messaging_product: "whatsapp", to: phone, type: "text", text: { body } });
}

export async function sendTemplate(phone: string, name: string, params: string[], lang = "en") {
  return post({
    messaging_product: "whatsapp",
    to: phone,
    type: "template",
    template: {
      name,
      language: { code: lang },
      components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }],
    },
  });
}

export async function downloadMedia(mediaId: string): Promise<{ data: Buffer; mime: string }> {
  const m = await fetch(`${G()}/${mediaId}`, { headers: headers() });
  if (!m.ok) throw new Error(`media meta failed: ${m.status}`);
  const j = (await m.json()) as any;
  const f = await fetch(j.url, { headers: headers() });
  if (!f.ok) throw new Error(`media download failed: ${f.status}`);
  return { data: Buffer.from(await f.arrayBuffer()), mime: j.mime_type || "application/octet-stream" };
}

export type SendStatus = "sent" | "template" | "simulated" | "failed";

/**
 * Inside the 24h customer-service window we can send free text. Outside it we
 * must use an approved template. In simulation mode everything is "simulated".
 */
export async function sendSmart(
  log: (direction: "in" | "out", body: string) => Promise<void> | void,
  p: Patient,
  body: string,
): Promise<SendStatus> {
  if (cfg.sim.whatsapp) {
    await log("out", body);
    return "simulated";
  }
  const inside = p.lastInboundAt && Date.now() - new Date(p.lastInboundAt).getTime() < 24 * 3600 * 1000;
  try {
    if (inside) {
      for (let i = 0; i < body.length; i += 3500) await sendText(p.phone, body.slice(i, i + 3500));
      await log("out", body);
      return "sent";
    }
    await sendTemplate(p.phone, cfg.wa.checkinTemplate, [p.name || "there"]);
    await log("out", `[template:${cfg.wa.checkinTemplate}] ${body.slice(0, 120)}`);
    return "template";
  } catch (e) {
    console.error("[wa] send failed:", (e as Error).message);
    await log("out", `[FAILED] ${body.slice(0, 200)}`);
    return "failed";
  }
}

/** Best-effort ping to the dietician's own phone for red flags. */
export async function alert(text: string): Promise<void> {
  if (!cfg.wa.alertPhone || cfg.sim.whatsapp) {
    console.log(`[ALERT${cfg.sim.whatsapp ? " (sim)" : ""}] ${text}`);
    return;
  }
  try {
    await sendText(cfg.wa.alertPhone, text);
  } catch (e) {
    console.error("[wa] alert failed:", (e as Error).message);
  }
}

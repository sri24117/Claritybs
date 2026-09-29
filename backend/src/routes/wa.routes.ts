/**
 * WhatsApp inbound webhook + the simulator that lets you drive the whole flow
 * from a browser before any Meta credential exists.
 */
import { Router, Request, Response } from "express";
import crypto from "crypto";
import { db } from "../store";
import { cfg } from "../config";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { logMessage } from "../lib/db";
import { receiveInbound } from "../flows/patient.flow";
import { simulatorStore } from "../flows/report.flow";

const router = Router();

// ---------------- real Meta webhook ----------------

router.get("/webhook", (req: Request, res: Response): void => {
  const q = req.query as Record<string, string>;
  if (q["hub.mode"] === "subscribe" && cfg.wa.verifyToken && q["hub.verify_token"] === cfg.wa.verifyToken) {
    res.type("text/plain").send(q["hub.challenge"] || "");
    return;
  }
  res.status(403).send("Forbidden");
});

router.post("/webhook", async (req: Request, res: Response): Promise<void> => {
  const raw = (req as any).rawBody as Buffer | undefined;
  const header = req.headers["x-hub-signature-256"] as string | undefined;

  if (cfg.wa.appSecret && raw) {
    const { verifySignature } = require("../services/whatsapp.service") as typeof import("../services/whatsapp.service");
    if (!verifySignature(raw, header)) {
      res.status(403).json({ detail: "bad signature" });
      return;
    }
  }

  const body = req.body;
  const results: unknown[] = [];
  for (const entry of body?.entry || []) {
    for (const change of entry?.changes || []) {
      for (const m of change?.value?.messages || []) {
        results.push(await receiveInbound(m.from, {
          type: m.type,
          text: m.text?.body,
          mediaId: m.image?.id || m.document?.id,
          mime: m.image?.mime_type || m.document?.mime_type,
          waMessageId: m.id,
        }));
      }
    }
  }
  res.json({ ok: true, results });
});

// ---------------- simulator (only while WhatsApp is unconfigured) ----------------

function simGuard(req: AuthRequest, res: Response, next: () => void) {
  if (!cfg.sim.open) {
    res.status(403).json({ detail: "Simulator disabled (WhatsApp is configured). Set SIM_OPEN=1 to force it on." });
    return;
  }
  next();
}

/** Upload a fake "media" file: stores it encrypted, returns a media id. */
router.post("/sim/media", requireAuth, simGuard, async (req: AuthRequest, res: Response): Promise<void> => {
  const data = Buffer.from(String(req.body?.data || ""), "base64");
  const mime = String(req.body?.mime || "image/png");
  if (!data.length || data.length > 10 * 1024 * 1024) {
    res.status(400).json({ detail: "missing or too-large data (max 10MB base64)" });
    return;
  }
  const mediaId = `sim_${crypto.randomBytes(8).toString("hex")}`;
  simulatorStore.set(mediaId, { data, mime });
  res.json({ mediaId, bytes: data.length, mime });
});

/** Send a message as if it came from a patient's phone. */
router.post("/sim/inbound", requireAuth, simGuard, async (req: AuthRequest, res: Response): Promise<void> => {
  const phone = String(req.body?.phone || "").replace(/[^\d]/g, "");
  if (phone.length < 10) {
    res.status(400).json({ detail: "phone required (digits, with country code)" });
    return;
  }
  const type = String(req.body?.type || "text");
  const result = await receiveInbound(phone, {
    type,
    text: req.body?.text,
    mediaId: req.body?.mediaId,
    mime: req.body?.mime,
    waMessageId: `sim_${crypto.randomBytes(6).toString("hex")}`,
  });
  res.json(result);
});

/** Every patient the simulator has talked to, for the dropdown. */
router.get("/sim/threads", requireAuth, simGuard, async (_req: AuthRequest, res: Response): Promise<void> => {
  const patients = await db.patient.findMany({ orderBy: { updatedAt: "desc" } });
  res.json({ patients });
});

router.get("/sim/thread/:phone", requireAuth, simGuard, async (req: Request, res: Response): Promise<void> => {
  const p = await db.patient.findUnique({ where: { phone: req.params.phone } });
  if (!p) {
    res.status(404).json({ detail: "no such patient" });
    return;
  }
  const messages = await db.message.findMany({ where: { patientId: p.id }, orderBy: { ts: "asc" } });
  res.json({ patient: p, messages });
});

export { logMessage };
export default router;

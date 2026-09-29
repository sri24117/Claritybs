/**
 * Report ingestion + verification flow.
 * media/typed values -> extraction -> rules -> (auto explain | needs verification)
 * -> dietician verifies in console -> explain.
 */
import { db } from "../store";
import type { Patient } from "../types";
import * as rules from "../services/rules";
import { extractReport } from "../services/llm.service";
import { readFile, saveFile } from "../lib/crypto";
import { downloadMedia } from "../services/whatsapp.service";
import { flag, reply } from "./patient.flow";

const MEDIA_OK: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

export async function ingestMedia(p: Patient, m: { mediaId?: string; mime?: string }) {
  if (!m.mediaId) {
    await reply(p, "Please send a photo (JPG/PNG) or a PDF of your report.");
    return "no-media";
  }
  let data: Buffer;
  let mime: string;
  try {
    const dl = await downloadMedia(m.mediaId);
    data = dl.data;
    mime = dl.mime;
  } catch {
    // Simulator mode: the client already stored the file for us.
    const stored = simulatorStore.get(m.mediaId);
    if (!stored) {
      await reply(p, "Couldn't download that file. Please try sending it again.");
      return "download-failed";
    }
    data = stored.data;
    mime = stored.mime;
  }
  mime = (m.mime || mime).split(";")[0];
  if (!MEDIA_OK[mime]) {
    await reply(p, "Please send a photo (JPG/PNG) or a PDF of your report.");
    return "bad-mime";
  }

  const report = await db.report.create({
    data: { patientId: p.id, filePath: saveFile(data, MEDIA_OK[mime]), mime, status: "processing" },
  });
  await reply(p, "Received ✅ Reading your report now. This takes about a minute.");
  // Inline processing: single-instance MVP. Swap for a queue when volume grows.
  await processReport(report.id);
  return "ingested";
}

export async function ingestTypedValues(p: Patient, vals: Record<string, number>) {
  const report = await db.report.create({
    data: {
      patientId: p.id,
      mime: "text/plain",
      confidence: 1.0,
      status: "processing",
      hba1c: vals.hba1c ?? null,
      fbs: vals.fbs ?? null,
      ppbs: vals.ppbs ?? null,
      reportDate: new Date(),
      raw: vals as any,
    },
  });
  await finalizeReport(report.id);
  return "ingested-typed";
}

export async function processReport(reportId: string) {
  const r = await db.report.findUnique({ where: { id: reportId } });
  if (!r) return;
  const p = await db.patient.findUnique({ where: { id: r.patientId } });
  if (!p) return;

  try {
    const buf = readFile(r.filePath);
    if (!buf) throw new Error("file missing");
    const j = await extractReport(buf, r.mime || "image/jpeg", r.id);
    await db.report.update({
      where: { id: r.id },
      data: {
        hba1c: j.hba1c,
        fbs: j.fbs,
        ppbs: j.ppbs,
        reportDate: j.report_date ? new Date(j.report_date) : null,
        confidence: j.confidence,
        simulated: !!j.simulated,
        raw: j as any,
        status: "processing",
      },
    });
  } catch (e) {
    console.error("[report] extraction failed:", (e as Error).message);
    await db.report.update({ where: { id: r.id }, data: { status: "failed" } });
    await reply(p, "Sorry, we couldn't read that file. Please send a clearer photo, or type the numbers out.");
    return;
  }
  await finalizeReport(r.id);
}

/** Shared by extraction, typed entry and dietician verification. */
export async function finalizeReport(reportId: string, verifiedBy?: string) {
  const r = await db.report.findUnique({ where: { id: reportId } });
  if (!r) return;
  const p = await db.patient.findUnique({ where: { id: r.patientId } });
  if (!p) return;

  const rids = rules.reportFlags(r);
  for (const rid of rids) await flag(p.id, rid, "red", `report ${r.id}`);

  let status: string;
  if (verifiedBy) {
    status = "verified";
  } else if (!rules.plausible(r) || (r.confidence ?? 0) < 0.9 || rids.length) {
    status = "needs_verification";
  } else {
    status = "auto_explained";
  }
  await db.report.update({ where: { id: r.id }, data: { status, verifiedById: verifiedBy ?? null } });

  if (rids.length) return; // dietician handles from here
  if (status === "needs_verification") {
    await reply(p, "Thanks! Our dietician is double-checking your numbers and will send the explanation shortly.");
    return;
  }
  if (!r.explainedAt) {
    await reply(p, rules.explain(r));
    await db.report.update({ where: { id: r.id }, data: { explainedAt: new Date() } });
  }
}

/** Files uploaded through the simulator (no Meta media id to download). */
export const simulatorStore = new Map<string, { data: Buffer; mime: string }>();

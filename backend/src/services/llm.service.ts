/**
 * LLM layer. Gemini when a key exists, deterministic fallback when it doesn't.
 * Extraction NEVER drives safety decisions: rules.ts does that.
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { cfg, TIER_DAYS } from "../config";

export const TEMPLATE_PATH = path.join(__dirname, "..", "..", "templates", "base.md");

export interface Extraction {
  hba1c: number | null;
  fbs: number | null;
  ppbs: number | null;
  report_date: string | null;
  confidence: number;
  simulated?: boolean;
}

const EXTRACT_PROMPT = `You read Indian lab reports. Extract:
- hba1c (percent)
- fbs (fasting blood glucose, mg/dL)
- ppbs (post-prandial / 2-hour post-meal glucose, mg/dL)
- report_date (YYYY-MM-DD)
Use null for anything not clearly present. Never guess.
Return JSON: {"hba1c":num|null,"fbs":num|null,"ppbs":num|null,"report_date":"YYYY-MM-DD"|null,"confidence":0.0-1.0}
where confidence is how sure you are the numbers were read correctly.`;

function num(x: unknown): number | null {
  const n = typeof x === "string" ? parseFloat(x) : typeof x === "number" ? x : NaN;
  return Number.isFinite(n) ? n : null;
}

let genAI: GoogleGenerativeAI | null = null;
function client(): GoogleGenerativeAI | null {
  if (!cfg.gemini.apiKey) return null;
  if (!genAI) genAI = new GoogleGenerativeAI(cfg.gemini.apiKey);
  return genAI;
}

/**
 * Deterministic stand-in used when no Gemini key is configured, so the whole
 * report -> verify -> explain -> plan flow is testable end to end.
 * Always low confidence: it must land in the dietician's verify queue.
 */
function simulatedExtraction(seed: string): Extraction {
  const h = crypto.createHash("sha256").update(seed).digest();
  const hba1c = 5.4 + (h[0] / 255) * 3.4; // 5.4 - 8.8
  const fbs = 92 + (h[1] / 255) * 120; // 92 - 212
  const ppbs = 130 + (h[2] / 255) * 190; // 130 - 320
  return {
    hba1c: Math.round(hba1c * 10) / 10,
    fbs: Math.round(fbs),
    ppbs: Math.round(ppbs),
    report_date: new Date().toISOString().slice(0, 10),
    confidence: 0.55,
    simulated: true,
  };
}

export async function extractReport(data: Buffer, mime: string, seed = ""): Promise<Extraction> {
  const ai = client();
  if (!ai) return simulatedExtraction(seed || crypto.randomBytes(8).toString("hex"));

  try {
    const model = ai.getGenerativeModel({
      model: cfg.gemini.model,
      generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
    });
    const res = await model.generateContent([
      { text: EXTRACT_PROMPT },
      { inlineData: { data: data.toString("base64"), mimeType: mime } },
    ]);
    const j = JSON.parse(res.response.text() || "{}");
    return {
      hba1c: num(j.hba1c),
      fbs: num(j.fbs),
      ppbs: num(j.ppbs),
      report_date: typeof j.report_date === "string" ? j.report_date : null,
      confidence: num(j.confidence) ?? 0.5,
    };
  } catch (e) {
    console.error("[llm] extraction failed:", (e as Error).message);
    throw new Error("Failed to extract data from report");
  }
}

export function templateText(): string {
  try {
    return fs.readFileSync(TEMPLATE_PATH, "utf8");
  } catch {
    return "(No template file found at templates/base.md)";
  }
}

/**
 * Draft a plan. With a Gemini key the template is turned into a personalised
 * plan; without one we ship the template verbatim, clearly marked for editing.
 */
export async function draftPlan(
  tier: string,
  profile: { age?: number | null; sex?: string | null; weightKg?: number | null },
  values: Record<string, number | null>,
): Promise<{ text: string; simulated: boolean }> {
  const days = TIER_DAYS[tier] || 14;
  const base = templateText();
  const ai = client();

  if (!ai) {
    return {
      simulated: true,
      text:
        `[TEMPLATE DRAFT - add a Gemini key for personalised text, or edit this yourself]\n\n` +
        `${days}-day food guidance\n\n` +
        `Patient profile: age ${profile.age ?? "?"}, ${profile.sex ?? "?"}, ${profile.weightKg ?? "?"} kg\n` +
        `Latest numbers: ${JSON.stringify(values)}\n\n` +
        base +
        `\n\nPlease discuss this with your doctor before making changes.`,
    };
  }

  const prompt = `Write a practical ${days}-day food guidance plan for a dietician to review and send.
Patient (no name on purpose): age ${profile.age}, sex ${profile.sex}, weight ${profile.weightKg} kg.
Latest numbers: ${JSON.stringify(values)}
Base it on the dietician's templates below. Use everyday Hyderabad/Indian foods the patient already eats.
HARD RULES: no diagnosis; no medication, insulin, supplement or dosage advice; short WhatsApp-friendly
sections; end with "Please discuss this with your doctor before making changes."

TEMPLATES:
${base}`;

  try {
    const model = ai.getGenerativeModel({
      model: cfg.gemini.model,
      generationConfig: { temperature: 0.4 },
    });
    const res = await model.generateContent(prompt);
    return { text: res.response.text(), simulated: false };
  } catch (e) {
    console.error("[llm] plan draft failed:", (e as Error).message);
    return { simulated: true, text: `[LLM FAILED - edit from template]\n\n${base}` };
  }
}

/**
 * DETERMINISTIC SAFETY RULES. The LLM never decides anything in this file.
 *
 * !!! THRESHOLDS BELOW ARE PLACEHOLDERS PENDING DIETICIAN SIGN-OFF (see
 * docs/clinical-signoff-checklist.md). Do not serve real patients until the
 * dietician has reviewed and initialled every band and keyword list.
 */
import type { Report } from "../types";

// ---- bands used only to explain numbers in plain words (not diagnosis) ----
export const CUTS: Record<string, [number, number]> = {
  hba1c: [5.7, 6.5], // %
  fbs: [100, 126], // mg/dL fasting
  ppbs: [140, 200], // mg/dL 2h post meal
};

export const WORDS = [
  "in the usual normal range",
  "in the range doctors call prediabetes",
  "above the range doctors call diabetes",
] as const;

export const RANGES: Record<string, [number, number]> = {
  hba1c: [3, 20],
  fbs: [30, 600],
  ppbs: [30, 800],
};

export function band(kind: string, v: number): string {
  const [lo, hi] = CUTS[kind];
  return v < lo ? WORDS[0] : v < hi ? WORDS[1] : WORDS[2];
}

export function plausible(r: Pick<Report, "hba1c" | "fbs" | "ppbs">): boolean {
  const vals: Array<[string, number | null]> = [
    ["hba1c", r.hba1c],
    ["fbs", r.fbs],
    ["ppbs", r.ppbs],
  ].filter(([, v]) => v !== null && v !== undefined) as Array<[string, number]>;
  if (!vals.length) return false;
  return vals.every(([k, v]) => v >= RANGES[k][0] && v <= RANGES[k][1]);
}

// ---- red flags on values: sign-off required ----
export function reportFlags(r: Pick<Report, "hba1c" | "fbs" | "ppbs">): string[] {
  const out: string[] = [];
  if (r.hba1c !== null && r.hba1c >= 10) out.push("hba1c_very_high");
  if (r.fbs !== null && r.fbs >= 300) out.push("fbs_very_high");
  if (r.ppbs !== null && r.ppbs >= 400) out.push("ppbs_very_high");
  for (const v of [r.fbs, r.ppbs]) if (v !== null && v < 70) out.push("glucose_low");
  return out;
}

const SYMPTOM_RE = /chest pain|breathless|short of breath|vomit|unconscious|faint|bleeding|numbness|blurred vision/i;
const SELF_HARM_RE = /suicide|kill myself|end my life|want to die|hurt myself/i;
const MED_RE =
  /\b(metformin|insulin|glimepiride|gliclazide|sitagliptin|vildagliptin|empagliflozin|dapagliflozin|dose|dosage|tablets?|mg|stop taking|skip (?:your )?(?:medicine|medication)|increase (?:your )?(?:dose|insulin))\b/i;

export function symptomRed(t: string): boolean {
  return SYMPTOM_RE.test(t || "");
}
export function selfHarm(t: string): boolean {
  return SELF_HARM_RE.test(t || "");
}
export function hasMedAdvice(t: string): boolean {
  return MED_RE.test(t || "");
}

// ---- parsing typed values ----
export function parseValues(t: string): Record<string, number> {
  const s = (t || "").toLowerCase();
  const pats: Record<string, RegExp> = {
    hba1c: /(?:hba1c|a1c)\D{0,12}(\d{1,2}(?:\.\d+)?)/,
    fbs: /(?:fbs|fasting)\D{0,12}(\d{2,3}(?:\.\d+)?)/,
    ppbs: /(?:ppbs|ppg|\bpp\b|post\s*(?:meal|prandial))\D{0,12}(\d{2,3}(?:\.\d+)?)/,
  };
  const out: Record<string, number> = {};
  for (const k of Object.keys(pats)) {
    const m = s.match(pats[k]);
    if (m) out[k] = parseFloat(m[1]);
  }
  return out;
}

/** "45 M 72" -> [45, "M", 72] */
export function parseProfile(t: string): [number, string, number] | null {
  const m = (t || "").match(/(\d{2})\D+?([mf])\w*\D+?(\d{2,3}(?:\.\d+)?)/i);
  if (!m) return null;
  return [parseInt(m[1], 10), m[2].toUpperCase(), parseFloat(m[3])];
}

// ---- patient-facing text: dietician signs off ----
export const RED_MSG =
  "Some of your numbers or symptoms may need a doctor's attention soon. " +
  "Please contact your doctor today, or go to the nearest hospital if you feel very unwell. " +
  "Our dietician has been alerted and will follow up here.";

export const BASIC_GUIDE =
  "A simple start while you wait:\n" +
  "• Fill half your plate with vegetables, keep rice smaller, add dal, curd or eggs.\n" +
  "• Cut down sugary chai and drinks.\n" +
  "• A 10-15 minute walk after meals, if your doctor says it is fine for you.";

export const DOCTOR_Q =
  "Questions to ask your doctor:\n" +
  "1. Are these numbers on target for me?\n" +
  "2. How often should I re-test?\n" +
  "3. Do I need any other tests?";

export const UPSELL =
  "Want a plan built around what you really eat (rice, idli, dosa, chai)?\n" +
  "Reply PLAN for the 14-day reset (₹299) or GUIDED for the 30-day dietician program (₹999).";

export function explain(r: Pick<Report, "hba1c" | "fbs" | "ppbs">): string {
  const lines: string[] = [];
  if (r.hba1c !== null && r.hba1c !== undefined)
    lines.push(`• HbA1c ${r.hba1c}%: ${band("hba1c", r.hba1c)}. (Your average sugar over ~3 months.)`);
  if (r.fbs !== null && r.fbs !== undefined)
    lines.push(`• Fasting sugar ${r.fbs} mg/dL: ${band("fbs", r.fbs)}.`);
  if (r.ppbs !== null && r.ppbs !== undefined)
    lines.push(`• Post-meal sugar ${r.ppbs} mg/dL: ${band("ppbs", r.ppbs)}.`);
  if (!lines.length) return "I couldn't find any numbers in that. Please send a clearer photo or type them out.";
  return (
    "Here is what your numbers mean in simple words:\n\n" +
    lines.join("\n") +
    "\n\nOnly a doctor can diagnose. This is educational information, not medical advice.\n\n" +
    BASIC_GUIDE +
    "\n\n" +
    DOCTOR_Q +
    "\n\n" +
    UPSELL
  );
}

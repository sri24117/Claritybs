/**
 * Central config. Everything the app needs from the environment, with safe
 * dev defaults so the prototype runs before any real key exists.
 *
 * Simulation flags (the point of the prototype):
 *   sim.whatsapp  - no WA_TOKEN        -> messages are logged, never sent to Meta
 *   sim.llm       - no GEMINI_API_KEY  -> extraction returns a clearly-marked simulated result
 *   sim.pay       - no RAZORPAY_KEY_ID -> payment links are simulated and settle locally
 */
import "dotenv/config";

function env(k: string, d = ""): string {
  const v = process.env[k];
  return v === undefined || v === "" ? d : v;
}

function bool(k: string, d: boolean): boolean {
  const v = process.env[k];
  if (v === undefined || v === "") return d;
  return v === "1" || v.toLowerCase() === "true";
}

export const cfg = {
  env: env("NODE_ENV", "development"),
  port: Number(env("PORT", "5000")),
  isProd: env("NODE_ENV", "development") === "production",

  databaseUrl: env("DATABASE_URL", ""),

  jwtSecret: env("JWT_SECRET", "dev-only-insecure-secret-change-me"),
  jwtExpMinutes: Number(env("JWT_EXP_MINUTES", "720")),

  fileKey: env("FILE_KEY", "dev-only-insecure-file-key-change-me"),
  reportDir: env("REPORT_DIR", "./data/reports"),

  consentVersion: env("CONSENT_VERSION", "v1"),
  publicUrl: env("PUBLIC_URL", "http://localhost:5000"),

  wa: {
    token: env("WA_TOKEN"),
    phoneId: env("WA_PHONE_ID"),
    verifyToken: env("WA_VERIFY_TOKEN", "claritybs_local_verify"),
    appSecret: env("WA_APP_SECRET"),
    checkinTemplate: env("WA_CHECKIN_TEMPLATE", "checkin_reminder"),
    alertPhone: env("DIETICIAN_ALERT_PHONE"),
    graphVersion: env("WA_GRAPH_VERSION", "v21.0"),
  },

  gemini: {
    apiKey: env("GEMINI_API_KEY"),
    model: env("GEMINI_MODEL", "gemini-2.5-flash"),
  },

  razorpay: {
    keyId: env("RAZORPAY_KEY_ID"),
    keySecret: env("RAZORPAY_KEY_SECRET"),
    webhookSecret: env("RAZORPAY_WEBHOOK_SECRET"),
  },

  dietician: {
    name: env("DIETICIAN_NAME", "our dietician"),
  },

  sim: {
    whatsapp: !env("WA_TOKEN"),
    llm: !env("GEMINI_API_KEY"),
    pay: !env("RAZORPAY_KEY_ID"),
    // Simulator endpoints are open when WhatsApp is not configured (i.e. not live yet).
    open: bool("SIM_OPEN", !env("WA_TOKEN")),
  },
};

export const PRICES: Record<string, number> = { reset: 29900, guided: 99900 }; // paise
export const TIER_LABEL: Record<string, string> = {
  reset: "14-Day Sugar Reset",
  guided: "30-Day Dietician Program",
};
export const TIER_DAYS: Record<string, number> = { reset: 14, guided: 30 };

export function simBanner(): string {
  const on: string[] = [];
  if (cfg.sim.whatsapp) on.push("WhatsApp");
  if (cfg.sim.llm) on.push("Gemini");
  if (cfg.sim.pay) on.push("Razorpay");
  return on.length ? `SIMULATION MODE: ${on.join(", ")}` : "";
}

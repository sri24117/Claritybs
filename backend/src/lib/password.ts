/** Password hashing (scrypt) + stateless HMAC session tokens. No external deps. */
import crypto from "crypto";
import { cfg } from "../config";

export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pw, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  try {
    const [scheme, salt, hash] = stored.split("$");
    if (scheme !== "scrypt" || !salt || !hash) return false;
    const candidate = crypto.scryptSync(pw, salt, 64);
    const real = Buffer.from(hash, "hex");
    return candidate.length === real.length && crypto.timingSafeEqual(candidate, real);
  } catch {
    return false;
  }
}

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

export function makeToken(sub: string, expMinutes = cfg.jwtExpMinutes): string {
  const header = b64url(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const exp = Math.floor(Date.now() / 1000) + expMinutes * 60;
  const payload = b64url(Buffer.from(JSON.stringify({ sub, exp })));
  const sig = crypto.createHmac("sha256", cfg.jwtSecret).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${sig}`;
}

export function readToken(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  const expected = crypto.createHmac("sha256", cfg.jwtSecret).update(`${header}.${payload}`).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const body = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!body.exp || body.exp < Math.floor(Date.now() / 1000)) return null;
    return String(body.sub);
  } catch {
    return null;
  }
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header || "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

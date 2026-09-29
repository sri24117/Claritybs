/**
 * Report files are encrypted at rest (AES-256-GCM) before they touch disk.
 * Key is derived from FILE_KEY so a missing/weak key fails loudly, not silently.
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { cfg } from "../config";

const KEY = crypto.createHash("sha256").update(cfg.fileKey).digest();

export function encrypt(data: Buffer): Buffer {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const body = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, body]);
}

export function decrypt(blob: Buffer): Buffer {
  const iv = blob.subarray(0, 12);
  const tag = blob.subarray(12, 28);
  const body = blob.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]);
}

/** Saves an encrypted report file, returns its path on disk. */
export function saveFile(data: Buffer, ext: string): string {
  fs.mkdirSync(cfg.reportDir, { recursive: true });
  const name = `${crypto.randomBytes(16).toString("hex")}${ext}.enc`;
  const p = path.join(cfg.reportDir, name);
  fs.writeFileSync(p, encrypt(data), { mode: 0o600 });
  return p;
}

export function readFile(p: string | null | undefined): Buffer | null {
  if (!p || !fs.existsSync(p)) return null;
  return decrypt(fs.readFileSync(p));
}

export function deleteFile(p: string | null | undefined): void {
  if (!p) return;
  try {
    fs.unlinkSync(p);
  } catch {
    /* already gone */
  }
}

import { Router, Request, Response } from "express";
import { db } from "../store";
import { cfg, simBanner } from "../config";
import { hashPassword, makeToken, parseCookies, verifyPassword } from "../lib/password";
import { audit } from "../lib/audit";
import { loginBlocked, loginFailed, loginSucceeded } from "../lib/db";

const router = Router();

function ipOf(req: Request): string {
  const xf = (req.headers["x-forwarded-for"] as string) || "";
  return xf.split(",")[0].trim() || req.socket.remoteAddress || "unknown";
}

router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const email = String(req.body?.email || "").toLowerCase().trim();
  const password = String(req.body?.password || "");
  const key = `${ipOf(req)}:${email}`;

  if (loginBlocked(key)) {
    res.status(429).json({ detail: "Too many attempts. Try again in 15 minutes." });
    return;
  }

  const u = await db.dietician.findUnique({ where: { email } });
  if (!u || !verifyPassword(password, u.passwordHash)) {
    loginFailed(key);
    res.status(401).json({ detail: "Invalid credentials" });
    return;
  }
  loginSucceeded(key);

  res.cookie("cb_token", makeToken(u.id), {
    httpOnly: true,
    secure: req.headers["x-forwarded-proto"] === "https" || cfg.isProd,
    sameSite: "lax",
    maxAge: cfg.jwtExpMinutes * 60 * 1000,
    path: "/",
  });
  await audit(u.email, "login", "dietician", u.id);
  res.json({ name: u.name, email: u.email, simulation: simBanner() });
});

router.post("/logout", (_req: Request, res: Response): void => {
  res.clearCookie("cb_token", { path: "/" });
  res.json({ ok: true });
});

router.get("/me", async (req: Request, res: Response): Promise<void> => {
  const tok = parseCookies(req.headers.cookie).cb_token;
  const { readToken } = require("../lib/password") as typeof import("../lib/password");
  const sub = readToken(tok);
  if (!sub) {
    res.status(401).json({ detail: "Not logged in" });
    return;
  }
  const u = await db.dietician.findUnique({ where: { id: sub } });
  if (!u) {
    res.status(401).json({ detail: "Invalid session" });
    return;
  }
  res.json({ name: u.name, email: u.email, simulation: simBanner() });
});

export { hashPassword };
export default router;

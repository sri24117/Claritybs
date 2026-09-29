import { Request, Response, NextFunction } from "express";
import { db } from "../store";
import { parseCookies, readToken } from "../lib/password";

export interface AuthRequest extends Request {
  dietician?: { id: string; email: string; name: string };
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const sub = readToken(parseCookies(req.headers.cookie).cb_token);
  if (!sub) {
    res.status(401).json({ detail: "Not logged in" });
    return;
  }
  const u = await db.dietician.findUnique({ where: { id: sub } });
  if (!u) {
    res.status(401).json({ detail: "Invalid session" });
    return;
  }
  req.dietician = { id: u.id, email: u.email, name: u.name };
  next();
}

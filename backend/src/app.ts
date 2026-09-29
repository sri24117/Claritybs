import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import waRoutes from "./routes/wa.routes";
import payRoutes from "./routes/pay.routes";
import consoleRoutes from "./routes/console.routes";
import { cfg, simBanner } from "./config";
import { dbPing } from "./store";

dotenv.config();

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));

// Raw bodies only where signatures are verified; everything else is JSON.
app.use("/wa/webhook", express.raw({ type: "*/*", limit: "10mb" }), (req, _res, next) => {
  (req as any).rawBody = req.body;
  try {
    req.body = JSON.parse((req.body as Buffer).toString() || "{}");
  } catch {
    req.body = {};
  }
  next();
});
app.use("/pay/razorpay", express.raw({ type: "*/*", limit: "1mb" }), (req, _res, next) => {
  (req as any).rawBody = req.body;
  try {
    req.body = JSON.parse((req.body as Buffer).toString() || "{}");
  } catch {
    req.body = {};
  }
  next();
});

app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", async (_req, res) => {
  let db = "ok";
  try {
    await dbPing();
  } catch (e) {
    db = (e as Error).message;
  }
  res.json({
    ok: db === "ok",
    db,
    simulation: simBanner(),
    sim: { whatsapp: cfg.sim.whatsapp, llm: cfg.sim.llm, pay: cfg.sim.pay, open: cfg.sim.open },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/whatsapp", waRoutes);
app.use("/wa", waRoutes); // public webhook path: /wa/webhook
app.use("/api/pay", payRoutes);
app.use("/", payRoutes); // public simulated payment-link pages at /sim/pay/:linkId
app.use("/api/console", consoleRoutes);

// Express 5 error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // Malformed ids (22P02 = invalid_text_representation, e.g. "" for a uuid column)
  // are caller mistakes, not server faults.
  if (err?.code === "22P02") {
    res.status(404).json({ detail: "Not found" });
    return;
  }
  console.error("[api] unhandled:", err?.stack || err);
  res.status(500).json({ detail: "Something went wrong" });
});

export default app;

import app from "./app";
import { cfg, simBanner } from "./config";
import { dbPing } from "./store";

const PORT = cfg.port;

async function main() {
  try {
    await dbPing();
    console.log("[api] database connected");
  } catch (e) {
    console.error("[api] database connection failed:", (e as Error).message);
    console.error("[api] set DATABASE_URL and run: npm run db:init");
  }
  app.listen(PORT, () => {
    console.log(`[api] ClarityBS backend on http://0.0.0.0:${PORT}`);
    if (simBanner()) console.log(`[api] ${simBanner()}`);
  });
}

void main();

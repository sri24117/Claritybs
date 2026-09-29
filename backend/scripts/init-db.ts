/**
 * Applies schema.sql. Works against any Postgres (local, Supabase, docker).
 * Usage: npm run db:init
 */
import fs from "fs";
import path from "path";
import { pool, dbPing, dbClose } from "../src/store";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
    process.exit(1);
  }
  await dbPing();
  const sql = fs.readFileSync(path.join(__dirname, "..", "schema.sql"), "utf8");
  await pool.query(sql);
  console.log("schema applied ✔");
  await dbClose();
}

main().catch((e) => {
  console.error("db:init failed:", (e as Error).message);
  process.exit(1);
});

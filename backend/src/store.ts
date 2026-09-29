/**
 * Tiny typed data layer over node-postgres.
 *
 * Why not Prisma here: the client generator needs to download a native engine
 * from binaries.prisma.sh, which is unreachable on some networks (and this
 * prototype had to be verified end-to-end). This module implements exactly the
 * subset of the Prisma API the app uses - findUnique/findFirst/findMany/create/
 * createMany/update/updateMany/deleteMany/upsert/count - with parameterised
 * SQL only. Column names match schema.sql exactly.
 */
import { Pool, PoolClient } from "pg";
import { cfg } from "./config";

const useSsl =
  !/(localhost|127\.0\.0\.1)/.test(cfg.databaseUrl) && !/sslmode=disable/.test(cfg.databaseUrl);

export const pool = new Pool({
  connectionString: cfg.databaseUrl || undefined,
  max: 10,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

export type Where = Record<string, any>;
export type Args = { where?: Where; orderBy?: Record<string, "asc" | "desc">; take?: number };

const OPS: Record<string, string> = { lt: "<", lte: "<=", gt: ">", gte: ">=" };

export function buildWhere(where?: Where, offset = 0): { sql: string; params: any[] } {
  if (!where) return { sql: "", params: [] };
  const clauses: string[] = [];
  const params: any[] = [];
  const n = () => params.length + offset;
  for (const [key, v] of Object.entries(where)) {
    if (v === undefined) continue;
    const col = `"${key}"`;
    if (v === null) {
      clauses.push(`${col} IS NULL`);
    } else if (Array.isArray(v)) {
      params.push(v);
      clauses.push(`${col} = ANY($${n()})`);
    } else if (typeof v === "object") {
      for (const [op, ov] of Object.entries(v)) {
        if (ov === undefined) continue;
        if (op === "in") {
          params.push(ov as any[]);
          clauses.push(`${col} = ANY($${n()})`);
        } else if (op === "notIn") {
          params.push(ov as any[]);
          clauses.push(`${col} <> ALL($${n()})`);
        } else if (op === "is" || op === "equals") {
          if (ov === null) clauses.push(`${col} IS NULL`);
          else {
            params.push(ov);
            clauses.push(`${col} = $${n()}`);
          }
        } else if (op === "isNot" || op === "not") {
          if (ov === null) clauses.push(`${col} IS NOT NULL`);
          else {
            params.push(ov);
            clauses.push(`${col} <> $${n()}`);
          }
        } else if (OPS[op]) {
          params.push(ov);
          clauses.push(`${col} ${OPS[op]} $${n()}`);
        } else {
          throw new Error(`store: unsupported operator "${op}"`);
        }
      }
    } else {
      params.push(v);
      clauses.push(`${col} = $${n()}`);
    }
  }
  return { sql: clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "", params };
}

function orderSql(orderBy?: Record<string, "asc" | "desc">): string {
  if (!orderBy) return "";
  const parts = Object.entries(orderBy).map(([k, dir]) => `"${k}" ${dir === "desc" ? "DESC" : "ASC"}`);
  return parts.length ? ` ORDER BY ${parts.join(", ")}` : "";
}

function insertSql(table: string, data: Record<string, any>) {
  const keys = Object.keys(data).filter((k) => data[k] !== undefined);
  const cols = keys.map((k) => `"${k}"`).join(", ");
  const vals = keys.map((_, i) => `$${i + 1}`).join(", ");
  return {
    sql: `INSERT INTO "${table}" (${cols}) VALUES (${vals}) RETURNING *`,
    params: keys.map((k) => data[k]),
  };
}

class Model {
  constructor(private readonly table: string) {}

  private async one(args: Args): Promise<any | null> {
    const w = buildWhere(args.where);
    const r = await pool.query(
      `SELECT * FROM "${this.table}"${w.sql}${orderSql(args.orderBy)} LIMIT 1`,
      w.params,
    );
    return r.rows[0] ?? null;
  }

  async findUnique(args: Args): Promise<any | null> {
    return this.one(args);
  }
  async findFirst(args: Args): Promise<any | null> {
    return this.one(args);
  }
  async findMany(args: Args = {}): Promise<any[]> {
    const w = buildWhere(args.where);
    const r = await pool.query(
      `SELECT * FROM "${this.table}"${w.sql}${orderSql(args.orderBy)}${args.take ? ` LIMIT ${Number(args.take)}` : ""}`,
      w.params,
    );
    return r.rows;
  }
  async create({ data }: { data: Record<string, any> }): Promise<any> {
    const { sql, params } = insertSql(this.table, data);
    const r = await pool.query(sql, params);
    return r.rows[0];
  }
  async createMany({ data }: { data: Record<string, any>[] }): Promise<{ count: number }> {
    if (!data.length) return { count: 0 };
    const client: PoolClient = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const row of data) {
        const { sql, params } = insertSql(this.table, row);
        await client.query(sql, params);
      }
      await client.query("COMMIT");
      return { count: data.length };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
  async update({ where, data }: { where?: Where; data: Record<string, any> }): Promise<any | null> {
    const keys = Object.keys(data).filter((k) => data[k] !== undefined);
    if (!keys.length) return this.one({ where });
    const sets = keys.map((k, i) => `"${k}" = $${i + 1}`);
    const w = buildWhere(where, keys.length);
    const params = [...keys.map((k) => data[k]), ...w.params];
    const r = await pool.query(
      `UPDATE "${this.table}" SET ${sets.join(", ")}${w.sql} RETURNING *`,
      params,
    );
    return r.rows[0] ?? null;
  }
  async updateMany({ where, data }: { where?: Where; data: Record<string, any> }): Promise<{ count: number }> {
    const keys = Object.keys(data).filter((k) => data[k] !== undefined);
    if (!keys.length) return { count: 0 };
    const sets = keys.map((k, i) => `"${k}" = $${i + 1}`);
    const w = buildWhere(where, keys.length);
    const r = await pool.query(
      `UPDATE "${this.table}" SET ${sets.join(", ")}${w.sql}`,
      [...keys.map((k) => data[k]), ...w.params],
    );
    return { count: r.rowCount ?? 0 };
  }
  async deleteMany({ where }: { where?: Where } = {}): Promise<{ count: number }> {
    const w = buildWhere(where);
    const r = await pool.query(`DELETE FROM "${this.table}"${w.sql}`, w.params);
    return { count: r.rowCount ?? 0 };
  }
  async count({ where }: { where?: Where } = {}): Promise<number> {
    const w = buildWhere(where);
    const r = await pool.query(`SELECT count(*)::int AS n FROM "${this.table}"${w.sql}`, w.params);
    return Number(r.rows[0]?.n ?? 0);
  }
  async upsert({ where, create, update }: { where?: Where; create: Record<string, any>; update: Record<string, any> }) {
    const ex = await this.one({ where });
    if (ex) return this.update({ where: { id: ex.id }, data: update });
    return this.create({ data: create });
  }
}

const cache = new Map<string, Model>();

/** camelCase model name -> table name in schema.sql */
const TABLES: Record<string, string> = {
  user: "User",
  dietician: "Dietician",
  patient: "Patient",
  report: "Report",
  plan: "Plan",
  checkin: "Checkin",
  flag: "Flag",
  message: "Message",
  payment: "Payment",
  auditLog: "AuditLog",
  extractedValue: "ExtractedValue",
  labReportDataset: "LabReportDataset",
};

function tableFor(name: string): string {
  return TABLES[name] || name;
}

export const db = new Proxy(
  {},
  {
    get: (_t, name: string) => {
      if (typeof name !== "string") return undefined;
      if (!cache.has(name)) cache.set(name, new Model(tableFor(name)));
      return cache.get(name);
    },
  },
) as any;

export async function dbPing(): Promise<void> {
  await pool.query("SELECT 1");
}

export async function dbClose(): Promise<void> {
  await pool.end();
}

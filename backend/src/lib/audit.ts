import { db } from "../store";

/** Every console action is recorded. Failures to log are loud but never fatal. */
export async function audit(
  actor: string,
  action: string,
  entity: string,
  entityId?: string | null,
  meta?: unknown,
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        actor,
        action,
        entity,
        entityId: entityId ?? null,
        meta: meta === undefined ? undefined : (meta as any),
      },
    });
  } catch (e) {
    console.error("[audit] failed:", (e as Error).message);
  }
}

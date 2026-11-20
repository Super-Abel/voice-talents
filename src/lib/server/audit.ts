import "server-only";
import { db } from "./db";

type AuditEntry = {
  actor?: { id: string; email: string } | null;
  action: string;
  entity: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
};

export async function writeAudit(entry: AuditEntry): Promise<void> {
  const { error } = await db()
    .from("audit_log")
    .insert({
      actor_id: entry.actor?.id ?? null,
      actor_email: entry.actor?.email ?? null,
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entityId ?? null,
      before: entry.before ?? null,
      after: entry.after ?? null,
      ip: entry.ip ?? null,
    });
  if (error) throw error;
}

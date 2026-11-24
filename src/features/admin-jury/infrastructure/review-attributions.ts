import "server-only";
import { db } from "@/lib/server/db";

/**
 * Le backend ne connaît que le compte de service : l'auteur réel d'une note se
 * lit dans notre journal, en croisant l'identifiant de la review.
 */
export async function reviewAttributions(
  applicationId: string,
): Promise<Record<string, string>> {
  const { data, error } = await db()
    .from("audit_log")
    .select("actor_email, after")
    .eq("entity", "candidate")
    .eq("entity_id", applicationId)
    .eq("action", "application.reviewed");
  if (error) throw error;
  const attributions: Record<string, string> = {};
  for (const row of data ?? []) {
    const after = row.after as { reviewId?: string } | null;
    const email = row.actor_email as string | null;
    if (after?.reviewId && email) attributions[after.reviewId] = email;
  }
  return attributions;
}

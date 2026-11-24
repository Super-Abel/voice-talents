"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/features/admin-auth/access";
import { writeAudit } from "@/lib/server/audit";
import { addApplicationReview, BackendError } from "@/lib/server/backend";
import { currentClientIp } from "@/lib/server/request";
import { JURY_ROLES, reviewFormSchema } from "./domain/review";

export async function submitApplicationReview(
  formData: FormData,
): Promise<void> {
  const session = await requireAdmin(JURY_ROLES);
  const rawScore = String(formData.get("score") ?? "").trim();
  const parsed = reviewFormSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    /* Number("") fait 0 : un champ vide doit échouer, pas noter la pire note. */
    score: rawScore === "" ? Number.NaN : rawScore,
    notes: String(formData.get("notes") ?? ""),
  });
  if (!parsed.success) redirect("/admin/jury?erreur=note");

  const { id, score, notes } = parsed.data;
  let reviewId: string;
  try {
    const review = await addApplicationReview(id, {
      score,
      evaluationNotes: notes,
    });
    reviewId = review.id;
  } catch (error) {
    if (!(error instanceof BackendError)) throw error;
    redirect(
      `/admin/jury/${id}?erreur=${error.isClientError ? "note" : "service"}`,
    );
  }

  /* Le backend signe voice_admin : seul ce journal conserve l'auteur réel. */
  await writeAudit({
    actor: session.user,
    action: "application.reviewed",
    entity: "candidate",
    entityId: id,
    after: { reviewId, score, notes: notes ?? null },
    ip: await currentClientIp(),
  });
  redirect(`/admin/jury/${id}?note=1`);
}

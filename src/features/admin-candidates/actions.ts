"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/features/admin-auth/access";
import { CANDIDATE_STATUSES } from "@/features/registration/domain/candidate-status";
import { sendStatusNotification } from "@/features/registration/infrastructure/registration-emails";
import { BackendError } from "@/lib/server/backend";
import { currentClientIp } from "@/lib/server/request";
import type { StatusChangeResult } from "./infrastructure/candidates-admin-repository";
import { setCandidatesStatus } from "./infrastructure/candidates-admin-repository";

const statusChangeSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(500),
  status: z.enum(CANDIDATE_STATUSES),
  notify: z.boolean(),
  /* Le backend accepte 1000 caractères ; on réserve la place du e-mail de l'auteur. */
  comment: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => value || undefined),
  returnTo: z
    .string()
    .regex(/^\/admin\/inscrits(\/[0-9a-f-]{36})?(\?[^#]*)?$/)
    .catch("/admin/inscrits"),
});

export async function updateCandidatesStatus(
  formData: FormData,
): Promise<void> {
  const session = await requireAdmin();
  const parsed = statusChangeSchema.safeParse({
    ids: formData.getAll("ids").map(String),
    status: formData.get("status"),
    notify: formData.get("notify") === "on",
    comment: String(formData.get("comment") ?? ""),
    returnTo: String(formData.get("returnTo") ?? ""),
  });
  const returnTo = (parsed.success ? parsed.data.returnTo : "/admin/inscrits")
    .replace(/([?&])(maj|echecs|erreur)=[^&]*&?/g, "$1")
    .replace(/[?&]$/, "");
  const separator = returnTo.includes("?") ? "&" : "?";
  if (!parsed.success) redirect(`${returnTo}${separator}erreur=selection`);

  let result: StatusChangeResult;
  try {
    result = await setCandidatesStatus(
      parsed.data.ids,
      parsed.data.status,
      { id: session.user.id, email: session.user.email },
      await currentClientIp(),
      parsed.data.comment,
    );
  } catch (error) {
    if (!(error instanceof BackendError)) throw error;
    redirect(`${returnTo}${separator}erreur=service`);
  }

  const { changes, failures } = result;
  if (parsed.data.notify && changes.length > 0) {
    const status = parsed.data.status;
    after(async () => {
      for (const change of changes) {
        await sendStatusNotification(
          change.email,
          change.firstName,
          change.dossierNo,
          status,
        );
      }
    });
  }

  const feedback = new URLSearchParams();
  if (changes.length > 0) feedback.set("maj", String(changes.length));
  if (failures.length > 0) feedback.set("echecs", String(failures.length));
  redirect(`${returnTo}${feedback.size > 0 ? `${separator}${feedback}` : ""}`);
}

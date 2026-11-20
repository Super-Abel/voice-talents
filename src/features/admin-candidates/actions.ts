"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/features/admin-auth/access";
import { CANDIDATE_STATUSES } from "@/features/registration/domain/candidate-status";
import { sendStatusNotification } from "@/features/registration/infrastructure/registration-emails";
import { currentClientIp } from "@/lib/server/request";
import { setCandidatesStatus } from "./infrastructure/candidates-admin-repository";

const statusChangeSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(500),
  status: z.enum(CANDIDATE_STATUSES),
  notify: z.boolean(),
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
    returnTo: String(formData.get("returnTo") ?? ""),
  });
  const returnTo = (parsed.success ? parsed.data.returnTo : "/admin/inscrits")
    .replace(/([?&])(maj|erreur)=[^&]*&?/g, "$1")
    .replace(/[?&]$/, "");
  const separator = returnTo.includes("?") ? "&" : "?";
  if (!parsed.success) redirect(`${returnTo}${separator}erreur=selection`);

  const changes = await setCandidatesStatus(
    parsed.data.ids,
    parsed.data.status,
    session.user.id,
    await currentClientIp(),
  );
  if (parsed.data.notify && changes.length > 0) {
    const status = parsed.data.status;
    after(async () => {
      for (const change of changes) {
        await sendStatusNotification(
          change.email,
          change.first_name,
          change.dossier_no,
          status,
        );
      }
    });
  }
  redirect(`${returnTo}${separator}maj=${changes.length}`);
}

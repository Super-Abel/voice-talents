import { z } from "zod";
import {
  REGISTRATION_CLOSED_MESSAGES,
  registrationPhase,
} from "@/features/registration/domain/registration-window";
import {
  UPLOAD_RULES,
  validateUpload,
  validateUploadDuration,
} from "@/features/registration/domain/upload-rules";
import { getFreshSettings } from "@/features/settings/infrastructure/settings-repository";
import { BackendError, prepareUpload } from "@/lib/server/backend";
import { allowRequest } from "@/lib/server/rate-limit";
import { clientIpFrom } from "@/lib/server/request";

const requestSchema = z.object({
  kind: z.enum(["photo", "presentation"]),
  mime: z.string().max(100),
  size: z.number().int().positive(),
  durationSeconds: z.number().int().positive().max(600).optional(),
  originalName: z.string().trim().max(180).optional(),
});

export async function POST(request: Request) {
  const ip = clientIpFrom(request.headers);
  if (!(await allowRequest("upload", ip, 200, 600))) {
    return Response.json(
      { error: "Trop de tentatives. Réessayez dans quelques minutes." },
      { status: 429 },
    );
  }

  const settings = await getFreshSettings();
  const now = new Date();
  const phase = registrationPhase(
    now,
    new Date(settings.registration_opens_at),
    new Date(settings.registration_closes_at),
  );
  if (phase !== "open")
    return Response.json(
      { error: REGISTRATION_CLOSED_MESSAGES[phase] },
      { status: 403 },
    );

  const parsed = requestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  const { kind, mime, size, durationSeconds, originalName } = parsed.data;
  /* La durée est déclarée par l'appareil : non vérifiable ici, elle ferme juste
     la porte à un usage direct de l'API. Le contrôle qui compte reste celui du
     fichier, côté navigateur avant l'envoi puis à la soumission. */
  const problem =
    validateUpload(kind, mime, size) ??
    (UPLOAD_RULES[kind].maxDurationSeconds
      ? validateUploadDuration(kind, durationSeconds ?? null)
      : null);
  if (problem) return Response.json({ error: problem }, { status: 422 });

  try {
    const { uploadId, signedUrl } = await prepareUpload({
      kind,
      mime,
      size,
      durationSeconds,
      originalName,
    });
    return Response.json(
      { uploadId, signedUrl },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof BackendError && error.isClientError)
      return Response.json({ error: error.message }, { status: 422 });
    return Response.json(
      { error: "Le service d'envoi est indisponible. Réessayez." },
      { status: 503 },
    );
  }
}

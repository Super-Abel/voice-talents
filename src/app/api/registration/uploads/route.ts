import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  REGISTRATION_CLOSED_MESSAGES,
  registrationPhase,
} from "@/features/registration/domain/registration-window";
import {
  UPLOAD_RULES,
  validateUpload,
} from "@/features/registration/domain/upload-rules";
import { getFreshSettings } from "@/features/settings/infrastructure/settings-repository";
import { CANDIDATE_FILES_BUCKET, db } from "@/lib/server/db";
import { allowRequest } from "@/lib/server/rate-limit";
import { clientIpFrom, fingerprint } from "@/lib/server/request";
import { toDoualaDate } from "@/lib/time";

const requestSchema = z.object({
  kind: z.enum(["photo", "presentation", "id_scan"]),
  mime: z.string().max(100),
  size: z.number().int().positive(),
});

const UPLOAD_VALIDITY_MS = 24 * 60 * 60 * 1000;

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
  const { kind, mime, size } = parsed.data;
  const problem = validateUpload(kind, mime, size);
  if (problem) return Response.json({ error: problem }, { status: 422 });

  const extension = UPLOAD_RULES[kind].types[mime];
  const path = `pending/${toDoualaDate(now)}/${randomUUID()}.${extension}`;

  const { data: upload, error: insertError } = await db()
    .from("uploads")
    .insert({
      path,
      kind,
      mime,
      max_bytes: UPLOAD_RULES[kind].maxBytes,
      ip_hash: ip ? fingerprint(ip) : null,
      expires_at: new Date(now.getTime() + UPLOAD_VALIDITY_MS).toISOString(),
    })
    .select("id")
    .single();
  if (insertError) throw insertError;

  const { data: signed, error: signError } = await db()
    .storage.from(CANDIDATE_FILES_BUCKET)
    .createSignedUploadUrl(path);
  if (signError) throw signError;

  return Response.json(
    { uploadId: upload.id, signedUrl: signed.signedUrl },
    { headers: { "Cache-Control": "no-store" } },
  );
}

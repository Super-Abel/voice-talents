import { toDoualaDate } from "@/lib/time";
import { isAgeEligible } from "../domain/eligibility";
import {
  type FieldErrors,
  registrationSchema,
  toFieldErrors,
} from "../domain/registration-schema";
import {
  REGISTRATION_CLOSED_MESSAGES,
  registrationPhase,
} from "../domain/registration-window";
import { UPLOAD_RULES, type UploadKind } from "../domain/upload-rules";
import type { PendingUpload, RegistrationPorts } from "./ports";

export type SubmitRegistrationResult =
  | {
      status: "created";
      dossierNo: string;
      candidateId: string;
      email: string;
      firstName: string;
    }
  | { status: "window_closed"; message: string }
  | { status: "invalid"; fieldErrors: FieldErrors };

export async function submitRegistration(
  rawInput: unknown,
  ports: RegistrationPorts,
): Promise<SubmitRegistrationResult> {
  const policy = await ports.loadPolicy();
  const now = ports.now();
  const phase = registrationPhase(now, policy.opensAt, policy.closesAt);
  if (phase !== "open")
    return {
      status: "window_closed",
      message: REGISTRATION_CLOSED_MESSAGES[phase],
    };

  const parsed = registrationSchema.safeParse(rawInput);
  if (!parsed.success)
    return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
  const input = parsed.data;

  const referenceDate = toDoualaDate(policy.closesAt);
  if (
    !isAgeEligible(input.birthDate, referenceDate, policy.ageMin, policy.ageMax)
  ) {
    return {
      status: "invalid",
      fieldErrors: {
        birthDate: `Le concours est ouvert aux personnes de ${policy.ageMin} à ${policy.ageMax} ans révolus au ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Africa/Douala" }).format(policy.closesAt)}.`,
      },
    };
  }

  const requested: { field: string; id: string; kind: UploadKind }[] = [
    { field: "photoUploadId", id: input.photoUploadId, kind: "photo" },
  ];
  if (input.presentationUploadId) {
    requested.push({
      field: "presentationUploadId",
      id: input.presentationUploadId,
      kind: "presentation",
    });
  }
  if (input.idScanUploadId)
    requested.push({
      field: "idScanUploadId",
      id: input.idScanUploadId,
      kind: "id_scan",
    });

  const uploads = await ports.findUploads(requested.map((item) => item.id));
  const paths: Partial<Record<UploadKind, string>> = {};
  const uploadErrors: FieldErrors = {};

  for (const item of requested) {
    const upload = uploads.find((candidate) => candidate.id === item.id);
    const problem = await checkUpload(upload, item.kind, now, ports);
    if (problem) uploadErrors[item.field] = problem;
    else if (upload) paths[item.kind] = upload.path;
  }
  if (Object.keys(uploadErrors).length > 0)
    return { status: "invalid", fieldErrors: uploadErrors };

  const created = await ports.createCandidate({
    ...input,
    photoPath: paths.photo as string,
    presentationPath: paths.presentation,
    idScanPath: paths.id_scan,
    consentAt: now,
  });
  if (!created.ok) {
    return {
      status: "invalid",
      fieldErrors:
        created.duplicate === "phone"
          ? { phone: "Un dossier existe déjà avec ce numéro de téléphone." }
          : { email: "Un dossier existe déjà avec cette adresse e-mail." },
    };
  }

  await ports.markUploadsUsed(
    requested.map((item) => item.id),
    created.id,
  );
  return {
    status: "created",
    dossierNo: created.dossierNo,
    candidateId: created.id,
    email: input.email,
    firstName: input.firstName,
  };
}

async function checkUpload(
  upload: PendingUpload | undefined,
  kind: UploadKind,
  now: Date,
  ports: RegistrationPorts,
): Promise<string | null> {
  const retry = "Fichier introuvable ou expiré, merci de le renvoyer.";
  if (
    !upload ||
    upload.kind !== kind ||
    upload.usedAt ||
    new Date(upload.expiresAt) < now
  )
    return retry;
  const stored = await ports.statObject(upload.path);
  if (!stored) return retry;
  const rule = UPLOAD_RULES[kind];
  if (stored.size > rule.maxBytes || !(stored.mime in rule.types))
    return "Fichier non conforme, merci de le renvoyer.";
  return null;
}

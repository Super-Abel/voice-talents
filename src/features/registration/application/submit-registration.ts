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
import type { RegistrationPorts } from "./ports";

export type SubmitRegistrationResult =
  | { status: "created"; dossierNo: string; email: string; firstName: string }
  | { status: "window_closed"; message: string }
  | { status: "invalid"; message: string; fieldErrors: FieldErrors };

/**
 * Porte d'entrée du dépôt de dossier. Les règles liées au calendrier de
 * l'édition (ouverture, clôture, âges) vivent ici, dans le site ; le backend
 * est authoritaire sur les fichiers, les doublons et le numéro de dossier.
 */
export async function submitRegistration(
  rawInput: unknown,
  ports: RegistrationPorts,
): Promise<SubmitRegistrationResult> {
  const policy = await ports.loadPolicy();
  const phase = registrationPhase(ports.now(), policy.opensAt, policy.closesAt);
  if (phase !== "open")
    return {
      status: "window_closed",
      message: REGISTRATION_CLOSED_MESSAGES[phase],
    };

  const parsed = registrationSchema.safeParse(rawInput);
  if (!parsed.success)
    return {
      status: "invalid",
      message: "Certains champs sont à corriger.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  const input = parsed.data;

  const referenceDate = toDoualaDate(policy.closesAt);
  if (
    !isAgeEligible(input.birthDate, referenceDate, policy.ageMin, policy.ageMax)
  ) {
    return {
      status: "invalid",
      message: "Certains champs sont à corriger.",
      fieldErrors: {
        birthDate: `Le concours est ouvert aux personnes de ${policy.ageMin} à ${policy.ageMax} ans révolus au ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Africa/Douala" }).format(policy.closesAt)}.`,
      },
    };
  }

  const outcome = await ports.submit(input);
  if (!outcome.ok)
    return {
      status: "invalid",
      message: outcome.message,
      fieldErrors: outcome.fieldErrors,
    };

  return {
    status: "created",
    dossierNo: outcome.dossierNo,
    email: input.email,
    firstName: input.firstName,
  };
}

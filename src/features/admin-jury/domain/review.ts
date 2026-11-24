import { z } from "zod";
import type { AdminRole } from "@/features/admin-auth/domain/roles";

/** Le jury note les prestations ; le statut reste la main du back-office. */
export const JURY_ROLES: readonly AdminRole[] = [
  "jury",
  "super_admin",
  "admin",
];

/** Échelle imposée par le backend : entier de 0 à 100. */
export const REVIEW_SCORE = { min: 0, max: 100 } as const;
export const NOTES_MAX_LENGTH = 2000;

export const reviewFormSchema = z.object({
  id: z.uuid(),
  score: z.coerce.number().int().min(REVIEW_SCORE.min).max(REVIEW_SCORE.max),
  notes: z
    .string()
    .trim()
    .max(NOTES_MAX_LENGTH)
    .optional()
    .transform((value) => value || undefined),
});

import { z } from "zod";
import { normalizeCameroonMobile } from "./phone";

const requiredText = (label: string, max: number) =>
  z
    .string({ error: `${label} requis` })
    .trim()
    .min(1, `${label} requis`)
    .max(max, `${label} : ${max} caractères maximum`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max} caractères maximum`)
    .optional()
    .transform((value) => value || undefined);

const socialLink = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((value) => value || undefined)
  .refine(
    (value) => !value || /^https:\/\/\S+$/.test(value),
    "Lien invalide (doit commencer par https://)",
  );

export const PRESENTATION_URL_PATTERN =
  /^https:\/\/([a-z]+\.)?(youtube\.com|youtu\.be|tiktok\.com)\/\S+$/;

export const identityFields = z.object({
  lastName: requiredText("Nom", 80),
  firstName: requiredText("Prénom", 80),
  stageName: optionalText(80),
  birthDate: z.iso.date({ error: "Date de naissance invalide" }),
  gender: z.enum(["female", "male"], { error: "Indiquez votre sexe" }),
});

export const contactFields = z.object({
  phone: z.string({ error: "Téléphone requis" }).transform((value, ctx) => {
    const normalized = normalizeCameroonMobile(value);
    if (!normalized) {
      ctx.addIssue({
        code: "custom",
        message: "Numéro mobile camerounais attendu (ex. 6 71 23 45 67)",
      });
      return z.NEVER;
    }
    return normalized;
  }),
  email: z
    .string({ error: "E-mail requis" })
    .trim()
    .toLowerCase()
    .pipe(z.email("Adresse e-mail invalide").max(160)),
  city: requiredText("Ville", 80),
  district: requiredText("Quartier", 80),
  idNumber: z
    .string({ error: "Numéro de pièce d'identité requis" })
    .trim()
    .min(4, "Numéro de pièce d'identité invalide")
    .max(40, "Numéro de pièce d'identité invalide"),
  idScanUploadId: z.uuid().optional(),
});

export const musicFields = z.object({
  photoUploadId: z.uuid({ error: "Ajoutez votre photo" }),
  musicGenre: requiredText("Genre musical", 60),
  songTitle: requiredText("Chanson envisagée", 150),
  musicBackground: requiredText("Parcours musical", 1000),
  socialLinks: z
    .object({
      facebook: socialLink,
      instagram: socialLink,
      tiktok: socialLink,
      youtube: socialLink,
    })
    .prefault({}),
  presentationUploadId: z.uuid().optional(),
  presentationUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined)
    .refine(
      (value) => !value || PRESENTATION_URL_PATTERN.test(value),
      "Lien YouTube ou TikTok invalide",
    ),
});

export const consentFields = z.object({
  acceptRules: z.literal(true, {
    error:
      "Vous devez accepter le règlement et la politique de confidentialité",
  }),
});

export const registrationSchema = identityFields
  .extend(contactFields.shape)
  .extend(musicFields.shape)
  .extend(consentFields.shape)
  .refine((data) => data.presentationUploadId || data.presentationUrl, {
    path: ["presentationUrl"],
    message: "Ajoutez un fichier audio/vidéo ou un lien YouTube/TikTok",
  });

export type RegistrationInput = z.input<typeof registrationSchema>;
export type Registration = z.output<typeof registrationSchema>;

export type FieldErrors = Partial<Record<string, string>>;

export function toFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    errors[key] ??= issue.message;
  }
  return errors;
}

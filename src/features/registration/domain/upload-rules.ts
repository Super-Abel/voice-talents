export type UploadKind = "photo" | "presentation";

const MB = 1024 * 1024;

const IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

const VIDEO_TYPES = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "video/3gpp": "3gp",
} as const;

export const UPLOAD_RULES: Record<
  UploadKind,
  {
    maxBytes: number;
    types: Record<string, string>;
    label: string;
    minDurationSeconds?: number;
    maxDurationSeconds?: number;
  }
> = {
  photo: {
    maxBytes: 5 * MB,
    types: IMAGE_TYPES,
    label: "Photo de portrait (JPEG, PNG ou WebP, 5 Mo max.)",
  },
  presentation: {
    // 30 s en 1080p tient largement sous 40 Mo ; au-delà, c'est une autre vidéo.
    maxBytes: 40 * MB,
    types: VIDEO_TYPES,
    minDurationSeconds: 15,
    maxDurationSeconds: 30,
    label: "Vidéo de 15 à 30 secondes (MP4, MOV, WebM ou 3GP, 40 Mo max.)",
  },
};

export function validateUpload(
  kind: UploadKind,
  mime: string,
  size: number,
): string | null {
  const rule = UPLOAD_RULES[kind];
  if (!(mime in rule.types)) return "Format de fichier non accepté.";
  if (size <= 0) return "Fichier vide.";
  if (size > rule.maxBytes)
    return `Fichier trop volumineux (maximum ${Math.round(rule.maxBytes / MB)} Mo).`;
  return null;
}

/** 2 s de marge de chaque côté : l'encodage mobile arrondit la coupe à la hausse comme à la baisse. */
const DURATION_TOLERANCE_SECONDS = 2;

/**
 * `seconds` vaut null quand le navigateur n'a pas pu lire la durée (MP4 non
 * indexé, fichier exotique) : on refuse alors de bloquer un candidat pour un
 * défaut d'encodage, la taille et le format restent contrôlés.
 */
export function validateUploadDuration(
  kind: UploadKind,
  seconds: number | null,
): string | null {
  const { minDurationSeconds: min, maxDurationSeconds: max } =
    UPLOAD_RULES[kind];
  if (!max) return null;
  if (seconds === null || !Number.isFinite(seconds) || seconds <= 0)
    return null;
  if (seconds > max + DURATION_TOLERANCE_SECONDS)
    return `Vidéo trop longue (${Math.round(seconds)} s) : elle doit durer ${max} secondes maximum.`;
  if (min && seconds < min - DURATION_TOLERANCE_SECONDS)
    return `Vidéo trop courte (${Math.round(seconds)} s) : elle doit durer au moins ${min} secondes.`;
  return null;
}

export function acceptAttribute(kind: UploadKind): string {
  return Object.keys(UPLOAD_RULES[kind].types).join(",");
}

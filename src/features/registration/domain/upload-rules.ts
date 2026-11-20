export type UploadKind = "photo" | "presentation" | "id_scan";

const MB = 1024 * 1024;

const IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export const UPLOAD_RULES: Record<
  UploadKind,
  { maxBytes: number; types: Record<string, string>; label: string }
> = {
  photo: {
    maxBytes: 5 * MB,
    types: IMAGE_TYPES,
    label: "Photo (JPEG, PNG ou WebP, 5 Mo max.)",
  },
  id_scan: {
    maxBytes: 5 * MB,
    types: { ...IMAGE_TYPES, "application/pdf": "pdf" },
    label: "Scan de la pièce d'identité (image ou PDF, 5 Mo max.)",
  },
  presentation: {
    maxBytes: 50 * MB,
    types: {
      "audio/mpeg": "mp3",
      "audio/mp4": "m4a",
      "audio/x-m4a": "m4a",
      "audio/aac": "aac",
      "audio/wav": "wav",
      "audio/ogg": "ogg",
      "audio/webm": "weba",
      "video/mp4": "mp4",
      "video/quicktime": "mov",
      "video/webm": "webm",
      "video/3gpp": "3gp",
    },
    label: "Audio ou vidéo de votre prestation (50 Mo max.)",
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

export function acceptAttribute(kind: UploadKind): string {
  return Object.keys(UPLOAD_RULES[kind].types).join(",");
}

"use client";

import type { UploadKind } from "../domain/upload-rules";

export class UploadError extends Error {}

const PHOTO_MAX_EDGE = 1600;

/** Réduit la photo côté téléphone (moins de données en 3G). Retourne l'original si la compression n'aide pas. */
export async function compressPhoto(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      PHOTO_MAX_EDGE / Math.max(bitmap.width, bitmap.height),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas
      .getContext("2d")
      ?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.82),
    );
    if (!blob || blob.type !== "image/webp" || blob.size >= file.size)
      return file;
    return new File([blob], file.name.replace(/\.\w+$/, ".webp"), {
      type: "image/webp",
    });
  } catch {
    return file;
  }
}

export async function uploadRegistrationFile(
  kind: UploadKind,
  file: File,
  onProgress: (ratio: number) => void,
  durationSeconds?: number,
): Promise<string> {
  const response = await fetch("/api/registration/uploads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind,
      mime: file.type,
      size: file.size,
      durationSeconds,
    }),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    uploadId?: string;
    signedUrl?: string;
    error?: string;
  };
  if (!response.ok || !payload.uploadId || !payload.signedUrl) {
    throw new UploadError(
      payload.error ?? "Impossible de préparer l'envoi du fichier.",
    );
  }

  const form = new FormData();
  form.append("cacheControl", "3600");
  form.append("", file);

  await new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", payload.signedUrl as string);
    request.setRequestHeader("x-upsert", "false");
    request.upload.onprogress = (event) =>
      event.lengthComputable && onProgress(event.loaded / event.total);
    request.onload = () =>
      request.status >= 200 && request.status < 300
        ? resolve()
        : reject(
            new UploadError(
              "L'envoi du fichier a échoué. Vérifiez votre connexion et réessayez.",
            ),
          );
    request.onerror = () =>
      reject(
        new UploadError("Connexion interrompue pendant l'envoi. Réessayez."),
      );
    request.send(form);
  });

  return payload.uploadId;
}

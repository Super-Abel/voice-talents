"use client";

import type { UploadKind } from "../domain/upload-rules";

export class UploadError extends Error {}

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
      /* Le nom porte l'identifiant du candidat ; le backend l'ignore tant qu'il
         ne le stocke pas, il ne coûte rien et il est déjà là quand il le lira. */
      originalName: file.name,
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

  /* Corps brut : le backend range l'octet tel quel sous l'uploadId. Un envoi
     multipart stockerait l'enveloppe MIME à la place du fichier. */
  await new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", payload.signedUrl as string);
    request.setRequestHeader(
      "Content-Type",
      file.type || "application/octet-stream",
    );
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
    request.send(file);
  });

  return payload.uploadId;
}

"use client";

const PROBE_TIMEOUT_MS = 8_000;

/**
 * Durée lue dans l'en-tête du fichier, sans upload ni décodage.
 * `null` quand le conteneur ne la fournit pas ou que la lecture traîne :
 * l'appelant décide alors de ne pas bloquer le candidat.
 */
export function readVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;

    const finish = (seconds: number | null) => {
      window.clearTimeout(timer);
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
      resolve(seconds);
    };

    const timer = window.setTimeout(() => finish(null), PROBE_TIMEOUT_MS);
    video.onloadedmetadata = () =>
      finish(Number.isFinite(video.duration) ? video.duration : null);
    video.onerror = () => finish(null);
    video.src = url;
  });
}

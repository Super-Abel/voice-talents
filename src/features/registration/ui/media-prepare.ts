"use client";

import type { Input, InputAudioTrack } from "mediabunny";
import {
  AUDIO_BITS_PER_SECOND,
  declaredBitsPerSecond,
  PHOTO_MAX_EDGE,
  PHOTO_QUALITIES,
  planVideoEncoding,
  VIDEO_MAX_SECONDS,
} from "../domain/media-encoding";
import {
  type CandidateIdentity,
  mediaBadge,
  mediaFileName,
} from "../domain/media-identity";
import type { UploadKind } from "../domain/upload-rules";

/** En dessous, la piste audio est muette : une prestation sans voix n'est pas une copie fidèle. */
const AUDIO_MIN_RMS = 0.005;
/** Quelques secondes suffisent à prouver que la voix est passée dans le nouveau conteneur. */
const AUDIO_PROBE_SECONDS = 6;

export type MediaPreparation = {
  file: File;
  /** Le navigateur ne sait pas décoder ce fichier : un poste de jury ne saura pas mieux. */
  unreadable: boolean;
};

function canTranscodeVideo(): boolean {
  return (
    typeof VideoEncoder === "function" &&
    typeof AudioEncoder === "function" &&
    typeof OffscreenCanvas === "function"
  );
}

/** mediabunny lit la vidéo via WebCodecs : sans décodeur, rien n'est vérifiable sur cet appareil. */
function canReadVideo(): boolean {
  return typeof VideoDecoder === "function";
}

/** Bandeau discret en haut à gauche : lisible par un humain, jamais sur le visage. */
function paintBadge(
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  badge: string,
): void {
  const size = Math.max(15, Math.round(Math.min(width, height) * 0.042));
  const padX = Math.round(size * 0.55);
  const padY = Math.round(size * 0.3);
  const x = Math.round(width * 0.025);
  const y = Math.round(height * 0.025);

  context.font = `600 ${size}px system-ui, sans-serif`;
  context.textBaseline = "middle";
  const boxWidth = Math.ceil(context.measureText(badge).width) + padX * 2;
  const boxHeight = size + padY * 2;

  context.fillStyle = "rgba(9, 13, 27, 0.55)";
  if (typeof context.roundRect === "function") {
    context.beginPath();
    context.roundRect(x, y, boxWidth, boxHeight, Math.round(boxHeight / 2));
    context.fill();
  } else {
    context.fillRect(x, y, boxWidth, boxHeight);
  }
  context.fillStyle = "rgba(255, 255, 255, 0.94)";
  context.fillText(badge, x + padX, y + boxHeight / 2);
}

/**
 * Portrait réduit à 1600 px de grand côté puis repassé en WebP : moins de
 * données sur un réseau mobile, et une garantie de lecture — un HEIC d'iPhone
 * ne s'affiche pas dans le Chrome d'un jury.
 */
export async function preparePhoto(
  file: File,
  identity: CandidateIdentity,
  onProgress: (ratio: number) => void,
): Promise<MediaPreparation> {
  if (!file.type.startsWith("image/")) return { file, unreadable: false };

  const badge = mediaBadge(identity);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return { file, unreadable: true };
  }

  try {
    const scale = Math.min(
      1,
      PHOTO_MAX_EDGE / Math.max(bitmap.width, bitmap.height),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return { file, unreadable: false };

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    if (badge) paintBadge(context, canvas.width, canvas.height, badge);
    onProgress(0.5);

    /* Une photo déjà petite ressort parfois plus lourde ré-encodée : on ne
       garde que la version qui n'augmente pas le poids du dossier. */
    for (const quality of PHOTO_QUALITIES) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", quality),
      );
      if (!blob || blob.type !== "image/webp") continue;
      onProgress(1);
      if (blob.size <= file.size)
        return {
          file: new File([blob], mediaFileName(identity, "photo", "webp"), {
            type: "image/webp",
          }),
          unreadable: false,
        };
    }
    return { file, unreadable: false };
  } catch {
    return { file, unreadable: false };
  } finally {
    bitmap.close();
  }
}

/**
 * Transcodage WebCodecs dans l'appareil : l'octet part déjà du navigateur vers
 * le backend, et un serveur sans ffmpeg (ni 40 Mo en body) ne peut rien faire à
 * sa place. Sortir en H.264 + AAC n'est pas une préférence de poids : c'est le
 * seul couple que tout poste de jury décode. On ne remplace la pièce que par
 * une copie qui rejoue sa durée et sa voix ; sinon le candidat envoie son
 * fichier tel quel.
 */
export async function prepareVideo(
  file: File,
  identity: CandidateIdentity,
  onProgress: (ratio: number) => void,
): Promise<MediaPreparation> {
  if (!canReadVideo()) return { file, unreadable: false };

  const badge = mediaBadge(identity);
  let input: Input | undefined;
  try {
    /* Import à la demande : le poids du transcodeur ne pèse que sur qui envoie
       vraiment une vidéo, pas sur la page d'inscription. */
    const mediabunny = await import("mediabunny");
    input = new mediabunny.Input({
      source: new mediabunny.BlobSource(file),
      formats: mediabunny.ALL_FORMATS,
    });

    const videoTrack = await input.getPrimaryVideoTrack();
    const audioTrack = await input.getPrimaryAudioTrack();
    if (!videoTrack) return { file, unreadable: true };
    if (!(await videoTrack.canDecode())) return { file, unreadable: true };
    if (!canTranscodeVideo()) return { file, unreadable: false };
    /* Sans décodeur pour la voix, le transcodage rendrait la vidéo muette. */
    if (audioTrack && !(await audioTrack.canDecode()))
      return { file, unreadable: false };

    const duration = await input.computeDuration();
    if (!(duration > 0) || duration > VIDEO_MAX_SECONDS)
      return { file, unreadable: false };

    const metrics = await videoTrack.computeFrameRateMetrics();
    const plan = planVideoEncoding({
      displayWidth: await videoTrack.getDisplayWidth(),
      displayHeight: await videoTrack.getDisplayHeight(),
      declaredBitsPerSecond: declaredBitsPerSecond(file.size, duration),
      frameRate: metrics.bestGuessFrameRate,
    });
    if (!plan.transcode) return { file, unreadable: false };

    const { width, height } = plan;
    const output = new mediabunny.Output({
      /* fastStart : l'en-tête de décodage passe en tête de fichier, donc un
         seul aller-retour suffit au jury pour lire la durée et chercher. */
      format: new mediabunny.Mp4OutputFormat({ fastStart: "in-memory" }),
      target: new mediabunny.BufferTarget(),
    });
    const videoSource = new mediabunny.VideoSampleSource({
      codec: "avc",
      quality: new mediabunny.Quality({
        bitrate: plan.videoBitsPerSecond,
        bitrateMode: "variable",
      }),
      keyFrameInterval: plan.keyFrameIntervalSeconds,
      latencyMode: "quality",
      alpha: "discard",
    });
    output.addVideoTrack(videoSource);

    const audioSource = audioTrack
      ? new mediabunny.AudioSampleSource({
          codec: "aac",
          quality: new mediabunny.Quality({ bitrate: AUDIO_BITS_PER_SECOND }),
        })
      : null;
    if (audioTrack && audioSource) output.addAudioTrack(audioSource);

    /* Second canal d'identification : le nom reste dans le conteneur si le
       fichier est extrait seul du dossier. */
    if (badge) output.setMetadataTags({ title: badge, comment: badge });
    await output.start();

    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d");
    if (!context) {
      await output.cancel();
      return { file, unreadable: false };
    }

    /* Une frame sur quatre environ : la barre d'avancement est humaine, pas
       une notification par image, pour ne pas voler le temps de l'encodeur. */
    let nextReport = 0;
    const frames = new mediabunny.VideoSampleSink(videoTrack);
    for await (const sample of frames.samples()) {
      try {
        sample.draw(context, 0, 0, width, height);
        if (badge) paintBadge(context, width, height, badge);
        const marked = new mediabunny.VideoSample(canvas, {
          timestamp: sample.timestamp,
          duration: sample.duration,
        });
        await videoSource.add(marked);
        marked.close();
        const elapsed = performance.now();
        if (elapsed >= nextReport) {
          nextReport = elapsed + 250;
          onProgress(Math.min(1, sample.timestamp / duration));
        }
      } finally {
        sample.close();
      }
    }
    onProgress(1);

    if (audioTrack && audioSource) {
      const packets = new mediabunny.AudioSampleSink(audioTrack);
      for await (const sample of packets.samples()) {
        try {
          await audioSource.add(sample);
        } finally {
          sample.close();
        }
      }
    }

    await output.finalize();
    const buffer = output.target.buffer;
    if (!buffer) return { file, unreadable: false };
    const prepared = new File(
      [buffer],
      mediaFileName(identity, "presentation", "mp4"),
      { type: "video/mp4" },
    );

    const faithful = await isFaithfulCopy(
      prepared,
      duration,
      Boolean(audioTrack),
      mediabunny,
    );
    return { file: faithful ? prepared : file, unreadable: false };
  } catch {
    return { file, unreadable: false };
  } finally {
    input?.dispose();
  }
}

/** On ne remplace une pièce judiciaire que par une copie qui la reproduit. */
async function isFaithfulCopy(
  file: File,
  expectedDuration: number,
  expectedAudio: boolean,
  mediabunny: typeof import("mediabunny"),
): Promise<boolean> {
  if (file.size < 2048) return false;
  const check = new mediabunny.Input({
    source: new mediabunny.BlobSource(file),
    formats: mediabunny.ALL_FORMATS,
  });
  try {
    const video = await check.getPrimaryVideoTrack();
    const audio = await check.getPrimaryAudioTrack();
    const duration = await check.computeDuration();
    if (!video) return false;
    if (Math.abs(duration - expectedDuration) > 1) return false;
    if (!expectedAudio) return true;
    return Boolean(audio) && (await carriesVoice(audio, mediabunny));
  } catch {
    return false;
  } finally {
    check.dispose();
  }
}

/** Une piste muette passerait tous les contrôles de conteneur : on écoute un extrait. */
async function carriesVoice(
  audioTrack: InputAudioTrack | null,
  mediabunny: typeof import("mediabunny"),
): Promise<boolean> {
  if (!audioTrack) return false;
  let sum = 0;
  let count = 0;
  const buffers = new mediabunny.AudioBufferSink(audioTrack);
  for await (const wrapped of buffers.buffers(0, AUDIO_PROBE_SECONDS)) {
    const channel = wrapped.buffer.getChannelData(0);
    for (let i = 0; i < channel.length; i += 4) {
      sum += channel[i] * channel[i];
      count += 1;
    }
  }
  return count > 0 && Math.sqrt(sum / count) >= AUDIO_MIN_RMS;
}

export async function prepareMedia(
  kind: UploadKind,
  file: File,
  identity: CandidateIdentity,
  onProgress: (ratio: number) => void,
): Promise<MediaPreparation> {
  return kind === "photo"
    ? preparePhoto(file, identity, onProgress)
    : prepareVideo(file, identity, onProgress);
}

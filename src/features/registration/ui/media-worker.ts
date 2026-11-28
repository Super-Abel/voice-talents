import * as mediabunny from "mediabunny";
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

const BADGE_FONT = "600 SIZEpx system-ui, sans-serif";

type Request = {
  id: number;
  kind: UploadKind;
  file: File;
  identity: CandidateIdentity;
};

type Prepared = {
  file: File;
  durationSeconds: number | null;
  unreadable: boolean;
};

type Reply =
  | { id: number; type: "progress"; ratio: number }
  | ({ id: number; type: "done" } & Prepared);

/** Le worker n'a pas de `document` : tout passe par OffscreenCanvas. */
const scope = self as unknown as {
  onmessage: ((event: MessageEvent<Request>) => void) | null;
  postMessage(message: Reply): void;
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

type BadgeOverlay = { image: ImageBitmap; x: number; y: number };

/**
 * Bandeau gravé une seule fois, puis collé à chaque image : mesurer et Composer
 * le texte 900 fois coûterait plus cher que l'encodage lui-même.
 */
async function renderBadge(
  width: number,
  height: number,
  badge: string,
): Promise<BadgeOverlay | null> {
  const size = Math.max(15, Math.round(Math.min(width, height) * 0.042));
  const padX = Math.round(size * 0.55);
  const padY = Math.round(size * 0.3);
  const font = BADGE_FONT.replace("SIZE", String(size));

  const measure = new OffscreenCanvas(1, 1).getContext("2d");
  if (!measure) return null;
  measure.font = font;
  const boxWidth = Math.ceil(measure.measureText(badge).width) + padX * 2;
  const boxHeight = size + padY * 2;

  const canvas = new OffscreenCanvas(boxWidth, boxHeight);
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.font = font;
  context.textBaseline = "middle";

  context.fillStyle = "rgba(9, 13, 27, 0.55)";
  if (typeof context.roundRect === "function") {
    context.beginPath();
    context.roundRect(0, 0, boxWidth, boxHeight, Math.round(boxHeight / 2));
    context.fill();
  } else {
    context.fillRect(0, 0, boxWidth, boxHeight);
  }
  context.fillStyle = "rgba(255, 255, 255, 0.94)";
  context.fillText(badge, padX, boxHeight / 2);

  return {
    image: await createImageBitmap(canvas),
    x: Math.round(width * 0.025),
    y: Math.round(height * 0.025),
  };
}

function paintBadge(
  context: OffscreenCanvasRenderingContext2D,
  overlay: BadgeOverlay,
): void {
  context.drawImage(overlay.image, overlay.x, overlay.y);
}

/**
 * Portrait réduit à 1600 px de grand côté puis repassé en WebP : moins de
 * données sur un réseau mobile, et une garantie de lecture — un HEIC d'iPhone
 * ne s'affiche pas dans le Chrome d'un jury.
 */
async function preparePhoto(
  file: File,
  identity: CandidateIdentity,
  report: (ratio: number) => void,
): Promise<Prepared> {
  if (!file.type.startsWith("image/"))
    return { file, durationSeconds: null, unreadable: false };

  const badge = mediaBadge(identity);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return { file, durationSeconds: null, unreadable: true };
  }

  try {
    const scale = Math.min(
      1,
      PHOTO_MAX_EDGE / Math.max(bitmap.width, bitmap.height),
    );
    const canvas = new OffscreenCanvas(
      Math.max(1, Math.round(bitmap.width * scale)),
      Math.max(1, Math.round(bitmap.height * scale)),
    );
    const context = canvas.getContext("2d");
    if (!context) return { file, durationSeconds: null, unreadable: false };

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    if (badge) {
      const overlay = await renderBadge(canvas.width, canvas.height, badge);
      if (overlay) paintBadge(context, overlay);
    }
    report(0.5);

    /* Une photo déjà petite ressort parfois plus lourde ré-encodée : on ne
       garde que la version qui n'augmente pas le poids du dossier. */
    for (const quality of PHOTO_QUALITIES) {
      const blob = await canvas.convertToBlob({
        type: "image/webp",
        quality,
      });
      if (!blob || blob.type !== "image/webp") continue;
      report(1);
      if (blob.size <= file.size)
        return {
          file: new File([blob], mediaFileName(identity, "photo", "webp"), {
            type: "image/webp",
          }),
          durationSeconds: null,
          unreadable: false,
        };
    }
    return { file, durationSeconds: null, unreadable: false };
  } catch {
    return { file, durationSeconds: null, unreadable: false };
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
async function prepareVideo(
  file: File,
  identity: CandidateIdentity,
  report: (ratio: number) => void,
): Promise<Prepared> {
  const unchanged = { durationSeconds: null, unreadable: false };
  if (!canReadVideo()) return { file, ...unchanged };

  const badge = mediaBadge(identity);
  let input: mediabunny.Input | undefined;
  try {
    input = new mediabunny.Input({
      source: new mediabunny.BlobSource(file),
      formats: mediabunny.ALL_FORMATS,
    });

    const videoTrack = await input.getPrimaryVideoTrack();
    const audioTrack = await input.getPrimaryAudioTrack();
    if (!videoTrack) return { file, durationSeconds: null, unreadable: true };
    if (!(await videoTrack.canDecode()))
      return { file, durationSeconds: null, unreadable: true };
    if (!canTranscodeVideo()) return { file, ...unchanged };
    /* Sans décodeur pour la voix, le transcodage rendrait la vidéo muette. */
    if (audioTrack && !(await audioTrack.canDecode()))
      return { file, ...unchanged };

    const duration = await input.computeDuration();
    if (!(duration > 0) || duration > VIDEO_MAX_SECONDS)
      return { file, durationSeconds: duration || null, unreadable: false };

    const metrics = await videoTrack.computeFrameRateMetrics();
    const plan = planVideoEncoding({
      displayWidth: await videoTrack.getDisplayWidth(),
      displayHeight: await videoTrack.getDisplayHeight(),
      declaredBitsPerSecond: declaredBitsPerSecond(file.size, duration),
      frameRate: metrics.bestGuessFrameRate,
    });
    if (!plan.transcode)
      return { file, durationSeconds: duration, unreadable: false };

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
      return { file, ...unchanged };
    }
    const overlay = badge ? await renderBadge(width, height, badge) : null;

    let nextReport = 0;
    const frames = new mediabunny.VideoSampleSink(videoTrack);
    for await (const sample of frames.samples()) {
      try {
        sample.draw(context, 0, 0, width, height);
        if (overlay) paintBadge(context, overlay);
        const marked = new mediabunny.VideoSample(canvas, {
          timestamp: sample.timestamp,
          duration: sample.duration,
        });
        await videoSource.add(marked);
        marked.close();
        const elapsed = performance.now();
        if (elapsed >= nextReport) {
          nextReport = elapsed + 250;
          report(Math.min(1, sample.timestamp / duration));
        }
      } finally {
        sample.close();
      }
    }
    report(1);

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
    if (!buffer) return { file, durationSeconds: duration, unreadable: false };
    const prepared = new File(
      [buffer],
      mediaFileName(identity, "presentation", "mp4"),
      { type: "video/mp4" },
    );

    const faithful = await isFaithfulCopy(
      prepared,
      duration,
      Boolean(audioTrack),
    );
    return {
      file: faithful ? prepared : file,
      durationSeconds: duration,
      unreadable: false,
    };
  } catch {
    return { file, ...unchanged };
  } finally {
    input?.dispose();
  }
}

/** On ne remplace une pièce judiciaire que par une copie qui la reproduit. */
async function isFaithfulCopy(
  candidate: File,
  expectedDuration: number,
  expectedAudio: boolean,
): Promise<boolean> {
  if (candidate.size < 2048) return false;
  const check = new mediabunny.Input({
    source: new mediabunny.BlobSource(candidate),
    formats: mediabunny.ALL_FORMATS,
  });
  try {
    const video = await check.getPrimaryVideoTrack();
    const audio = await check.getPrimaryAudioTrack();
    const duration = await check.computeDuration();
    if (!video) return false;
    if (Math.abs(duration - expectedDuration) > 1) return false;
    if (!expectedAudio) return true;
    return Boolean(audio) && (await carriesVoice(audio));
  } catch {
    return false;
  } finally {
    check.dispose();
  }
}

/** Une piste muette passerait tous les contrôles de conteneur : on écoute un extrait. */
async function carriesVoice(
  audioTrack: mediabunny.InputAudioTrack | null,
): Promise<boolean> {
  if (!audioTrack) return false;
  let sum = 0;
  let count = 0;
  /* `AudioBuffer` n'existe pas dans un worker : on lit le PCM brut du WebCodecs. */
  const samples = new mediabunny.AudioSampleSink(audioTrack);
  for await (const sample of samples.samples(0, AUDIO_PROBE_SECONDS)) {
    try {
      const bytes = sample.allocationSize({
        planeIndex: 0,
        format: "f32-planar",
      });
      const channel = new Float32Array(bytes / 4);
      sample.copyTo(channel, { planeIndex: 0, format: "f32-planar" });
      for (let i = 0; i < channel.length; i += 4) {
        sum += channel[i] * channel[i];
        count += 1;
      }
    } finally {
      sample.close();
    }
  }
  return count > 0 && Math.sqrt(sum / count) >= AUDIO_MIN_RMS;
}

scope.onmessage = (event) => {
  const { id, kind, file, identity } = event.data;
  const report = (ratio: number) =>
    scope.postMessage({ id, type: "progress", ratio });
  void (async () => {
    let prepared: Prepared;
    try {
      prepared =
        kind === "photo"
          ? await preparePhoto(file, identity, report)
          : await prepareVideo(file, identity, report);
    } catch {
      prepared = { file, durationSeconds: null, unreadable: false };
    }
    scope.postMessage({ id, type: "done", ...prepared });
  })();
};

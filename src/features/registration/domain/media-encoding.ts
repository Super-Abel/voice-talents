/**
 * Règles de compression, séparées du navigateur : ce fichier décide des chiffres,
 * media-prepare.ts applique les chiffres à l'image.
 */

export const PHOTO_MAX_EDGE = 1600;
export const PHOTO_QUALITIES = [0.82, 0.72, 0.62];

export const VIDEO_MAX_EDGE = 1280;
export const VIDEO_BITS_PER_SECOND_MIN = 400_000;
export const VIDEO_BITS_PER_SECOND_MAX = 2_400_000;
/** La prestation est une voix : l'audio reste en AAC 128 kb/s, transparent en parole. */
export const AUDIO_BITS_PER_SECOND = 128_000;
/** En dessous de ce débit, compresser coûterait plus qu'il ne rend : on garde le fichier. */
export const VIDEO_TRANCODE_MIN_BITS_PER_SECOND =
  VIDEO_BITS_PER_SECOND_MIN + AUDIO_BITS_PER_SECOND;
/** Au-delà de deux minutes, ce n'est plus une prestation : on n'ouvre pas le transcodage. */
export const VIDEO_MAX_SECONDS = 120;

/** Débit AVC par pixel et par image : réglé sur une tête qui parle, pas sur un film. */
const VIDEO_BITS_PER_PIXEL_FRAME = 0.06;
/** Un GOP long dégrade peu la recherche sur 30 s et rend plusieurs pour cents d'octets. */
const VIDEO_KEY_FRAME_INTERVAL_SECONDS = 4;
const FALLBACK_FRAME_RATE = 30;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** H.264 exige des dimensions paires ; arrondir à l'inférieur évite de créer des pixels. */
export function evenDimension(value: number): number {
  const rounded = Math.max(2, Math.floor(value));
  return rounded % 2 === 0 ? rounded : rounded - 1;
}

export type VideoEncodingPlan = {
  width: number;
  height: number;
  videoBitsPerSecond: number;
  keyFrameIntervalSeconds: number;
  /** Faux quand le fichier d'origine est déjà si léger que le transcodage l'alourdirait. */
  transcode: boolean;
};

/**
 * Le débit visé ne dépasse jamais ce que la source transportait déjà : on ne
 * peut promettre qu'une copie plus légère, jamais une copie plus lourde.
 */
export function planVideoEncoding(input: {
  displayWidth: number;
  displayHeight: number;
  declaredBitsPerSecond: number;
  frameRate?: number | null;
}): VideoEncodingPlan {
  const scale = Math.min(
    1,
    VIDEO_MAX_EDGE / Math.max(input.displayWidth, input.displayHeight),
  );
  const width = evenDimension(input.displayWidth * scale);
  const height = evenDimension(input.displayHeight * scale);
  const frameRate = clamp(
    input.frameRate && Number.isFinite(input.frameRate)
      ? input.frameRate
      : FALLBACK_FRAME_RATE,
    12,
    60,
  );
  const pixelsPerSecond = width * height * frameRate;

  return {
    width,
    height,
    videoBitsPerSecond: clamp(
      Math.min(
        pixelsPerSecond * VIDEO_BITS_PER_PIXEL_FRAME,
        input.declaredBitsPerSecond,
      ),
      VIDEO_BITS_PER_SECOND_MIN,
      VIDEO_BITS_PER_SECOND_MAX,
    ),
    keyFrameIntervalSeconds: VIDEO_KEY_FRAME_INTERVAL_SECONDS,
    transcode:
      input.declaredBitsPerSecond >= VIDEO_TRANCODE_MIN_BITS_PER_SECOND,
  };
}

/** Débit déclaré = poids annoncé sur la durée ; le seul chiffre dont on dispose avant de décoder. */
export function declaredBitsPerSecond(
  sizeBytes: number,
  durationSeconds: number,
): number {
  if (!(sizeBytes > 0) || !(durationSeconds > 0)) return 0;
  return (sizeBytes * 8) / durationSeconds;
}

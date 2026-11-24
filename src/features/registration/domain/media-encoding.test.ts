import { describe, expect, it } from "vitest";
import {
  declaredBitsPerSecond,
  evenDimension,
  planVideoEncoding,
  VIDEO_BITS_PER_SECOND_MAX,
  VIDEO_BITS_PER_SECOND_MIN,
  VIDEO_MAX_EDGE,
} from "./media-encoding";

describe("declaredBitsPerSecond", () => {
  it("traduit un poids et une durée en débit", () => {
    expect(declaredBitsPerSecond(15_000_000, 30)).toBe(4_000_000);
  });

  it("rend 0 plutôt qu'un débit inventé sur un fichier ou une durée vide", () => {
    expect(declaredBitsPerSecond(0, 30)).toBe(0);
    expect(declaredBitsPerSecond(1000, 0)).toBe(0);
  });
});

describe("evenDimension", () => {
  it("rend toute dimension paire, H.264 l'exige", () => {
    expect(evenDimension(1281)).toBe(1280);
    expect(evenDimension(1280.6)).toBe(1280);
    expect(evenDimension(1)).toBe(2);
  });
});

describe("planVideoEncoding", () => {
  it("borne la 4K à 1280 px de grand côté en gardant le ratio", () => {
    const plan = planVideoEncoding({
      displayWidth: 3840,
      displayHeight: 2160,
      declaredBitsPerSecond: 40_000_000,
    });
    expect(Math.max(plan.width, plan.height)).toBe(VIDEO_MAX_EDGE);
    expect(plan.width % 2).toBe(0);
    expect(plan.height % 2).toBe(0);
    expect(plan.width / plan.height).toBeCloseTo(3840 / 2160, 2);
  });

  it("n'agrandit jamais une petite vidéo", () => {
    const plan = planVideoEncoding({
      displayWidth: 640,
      displayHeight: 480,
      declaredBitsPerSecond: 6_000_000,
    });
    expect([plan.width, plan.height]).toEqual([640, 480]);
  });

  it("reste sous le débit de la source : on ne promet qu'une copie plus légère", () => {
    const source = 900_000;
    const plan = planVideoEncoding({
      displayWidth: 1280,
      displayHeight: 720,
      declaredBitsPerSecond: source,
    });
    expect(plan.videoBitsPerSecond).toBeLessThanOrEqual(source);
    expect(plan.transcode).toBe(true);
  });

  it("plafonne le confort et plancher la lisibilité de la voix", () => {
    const huge = planVideoEncoding({
      displayWidth: 1920,
      displayHeight: 1080,
      declaredBitsPerSecond: 50_000_000,
      frameRate: 60,
    });
    expect(huge.videoBitsPerSecond).toBe(VIDEO_BITS_PER_SECOND_MAX);

    const tiny = planVideoEncoding({
      displayWidth: 426,
      displayHeight: 240,
      declaredBitsPerSecond: 5_000_000,
      frameRate: 1,
    });
    expect(tiny.videoBitsPerSecond).toBe(VIDEO_BITS_PER_SECOND_MIN);
  });

  it("refuse le transcodage d'un fichier déjà plus léger que la cible", () => {
    const plan = planVideoEncoding({
      displayWidth: 1280,
      displayHeight: 720,
      declaredBitsPerSecond: 450_000,
    });
    expect(plan.transcode).toBe(false);
  });

  it("se rabat sur 30 images par seconde quand la source n'en annonce pas", () => {
    const withFrames = planVideoEncoding({
      displayWidth: 1280,
      displayHeight: 720,
      declaredBitsPerSecond: 8_000_000,
      frameRate: 30,
    });
    const withoutFrames = planVideoEncoding({
      displayWidth: 1280,
      displayHeight: 720,
      declaredBitsPerSecond: 8_000_000,
      frameRate: null,
    });
    expect(withoutFrames).toEqual(withFrames);
  });
});

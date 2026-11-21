import { describe, expect, it } from "vitest";
import { validateUpload, validateUploadDuration } from "./upload-rules";

const MB = 1024 * 1024;

describe("validateUpload (prestation)", () => {
  it("refuse un enregistrement audio", () => {
    expect(validateUpload("presentation", "audio/mpeg", 8 * MB)).toBe(
      "Format de fichier non accepté.",
    );
  });
  it.each([
    "video/mp4",
    "video/quicktime",
    "video/webm",
    "video/3gpp",
  ])("accepte %s jusqu'à 40 Mo", (mime) =>
    expect(validateUpload("presentation", mime, 40 * MB)).toBeNull());
  it("refuse au-delà de 40 Mo", () => {
    expect(validateUpload("presentation", "video/mp4", 40 * MB + 1)).toBe(
      "Fichier trop volumineux (maximum 40 Mo).",
    );
  });
});

describe("validateUploadDuration (prestation : 15 à 30 s)", () => {
  it.each([15, 30, 32, 13])("accepte %s s", (seconds) =>
    expect(validateUploadDuration("presentation", seconds)).toBeNull());
  it("refuse une vidéo plus longue", () => {
    expect(validateUploadDuration("presentation", 33)).toMatch(
      /30 secondes maximum/,
    );
  });
  it("refuse une vidéo plus courte", () => {
    expect(validateUploadDuration("presentation", 12)).toMatch(
      /au moins 15 secondes/,
    );
  });
  it("ne bloque pas une durée que le navigateur n'a pas pu lire", () => {
    expect(validateUploadDuration("presentation", null)).toBeNull();
    expect(
      validateUploadDuration("presentation", Number.POSITIVE_INFINITY),
    ).toBeNull();
  });
  it("ignore la règle pour un type sans limite de durée", () => {
    expect(validateUploadDuration("photo", 600)).toBeNull();
    expect(validateUploadDuration("photo", 2)).toBeNull();
  });
});

import { describe, expect, it, vi } from "vitest";
import type { PendingUpload, RegistrationPorts } from "./ports";
import { submitRegistration } from "./submit-registration";

const PHOTO_ID = "8b6f1d1e-3c55-4c7c-9e43-0b3a2f1c9d10";
const PRESENTATION_ID = "1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f";

const validInput = {
  lastName: "Ngono",
  firstName: "Aïcha",
  birthDate: "2000-05-12",
  gender: "female",
  phone: "671234567",
  email: "aicha@example.cm",
  city: "Douala",
  district: "Akwa",
  contactName: "Maman Ngono",
  contactPhone: "690112233",
  photoUploadId: PHOTO_ID,
  musicGenre: "Afrobeat",
  songTitle: "Ma chanson",
  musicBackground: "Chorale",
  presentationUploadId: PRESENTATION_ID,
  acceptRules: true,
};

function makePorts(
  now: string,
  overrides: Partial<RegistrationPorts> = {},
): RegistrationPorts {
  const uploads: PendingUpload[] = [
    {
      id: PHOTO_ID,
      path: "pending/2026-11-21/photo.jpg",
      kind: "photo",
      mime: "image/jpeg",
      maxBytes: 5 * 1024 * 1024,
      durationSeconds: null,
      usedAt: null,
      expiresAt: "2026-12-31T00:00:00Z",
    },
    {
      id: PRESENTATION_ID,
      path: "pending/2026-11-21/prestation.mp4",
      kind: "presentation",
      mime: "video/mp4",
      maxBytes: 40 * 1024 * 1024,
      durationSeconds: 28,
      usedAt: null,
      expiresAt: "2026-12-31T00:00:00Z",
    },
  ];
  return {
    now: () => new Date(now),
    loadPolicy: async () => ({
      opensAt: new Date("2026-11-21T00:00:00+01:00"),
      closesAt: new Date("2026-11-27T23:59:59+01:00"),
      ageMin: 18,
      ageMax: 35,
    }),
    findUploads: async () => uploads,
    // La taille réelle en stock est contrôlée par type de fichier.
    statObject: async (path) =>
      path.endsWith(".mp4")
        ? { size: 8_000_000, mime: "video/mp4" }
        : { size: 200_000, mime: "image/jpeg" },
    createCandidate: vi.fn(async () => ({
      ok: true as const,
      id: "c1",
      dossierNo: "VT-2026-0001",
    })),
    markUploadsUsed: vi.fn(async () => {}),
    ...overrides,
  };
}

describe("submitRegistration", () => {
  it("refuse le 20/11/2026 à 23:59:59 (Douala) sans rien enregistrer", async () => {
    const ports = makePorts("2026-11-20T23:59:59+01:00");
    const result = await submitRegistration(validInput, ports);
    expect(result.status).toBe("window_closed");
    expect(ports.createCandidate).not.toHaveBeenCalled();
  });

  it("refuse le 28/11/2026 à 00:00:00 (Douala)", async () => {
    const result = await submitRegistration(
      validInput,
      makePorts("2026-11-28T00:00:00+01:00"),
    );
    expect(result).toEqual({
      status: "window_closed",
      message: "Les inscriptions sont closes.",
    });
  });

  it("accepte pendant la période et renvoie le n° de dossier", async () => {
    const ports = makePorts("2026-11-24T12:00:00+01:00");
    const result = await submitRegistration(validInput, ports);
    expect(result).toMatchObject({
      status: "created",
      dossierNo: "VT-2026-0001",
      email: "aicha@example.cm",
    });
    expect(ports.markUploadsUsed).toHaveBeenCalledWith(
      [PHOTO_ID, PRESENTATION_ID],
      "c1",
    );
  });

  it("refuse 17 ans et 364 jours à la clôture", async () => {
    const result = await submitRegistration(
      { ...validInput, birthDate: "2008-11-28" },
      makePorts("2026-11-24T12:00:00+01:00"),
    );
    expect(result.status).toBe("invalid");
    expect(
      result.status === "invalid" && result.fieldErrors.birthDate,
    ).toBeTruthy();
  });

  it("refuse 36 ans à la clôture", async () => {
    const result = await submitRegistration(
      { ...validInput, birthDate: "1990-11-27" },
      makePorts("2026-11-24T12:00:00+01:00"),
    );
    expect(result.status).toBe("invalid");
  });

  it("traduit un doublon de téléphone en message clair", async () => {
    const ports = makePorts("2026-11-24T12:00:00+01:00", {
      createCandidate: async () => ({ ok: false, duplicate: "phone" }),
    });
    const result = await submitRegistration(validInput, ports);
    expect(result).toEqual({
      status: "invalid",
      fieldErrors: {
        phone: "Un dossier existe déjà avec ce numéro de téléphone.",
      },
    });
  });

  it("refuse une photo déjà utilisée par un autre dossier", async () => {
    const ports = makePorts("2026-11-24T12:00:00+01:00", {
      findUploads: async (ids) => [
        {
          id: PHOTO_ID,
          path: "x",
          kind: "photo",
          mime: "image/jpeg",
          maxBytes: 1,
          durationSeconds: null,
          usedAt: "2026-11-22T00:00:00Z",
          expiresAt: "2026-12-31T00:00:00Z",
        },
        ...(ids.includes(PRESENTATION_ID)
          ? [
              {
                id: PRESENTATION_ID,
                path: "pending/2026-11-21/prestation.mp4",
                kind: "presentation" as const,
                mime: "video/mp4",
                maxBytes: 40 * 1024 * 1024,
                durationSeconds: 28,
                usedAt: null,
                expiresAt: "2026-12-31T00:00:00Z",
              },
            ]
          : []),
      ],
    });
    const result = await submitRegistration(validInput, ports);
    expect(
      result.status === "invalid" && result.fieldErrors.photoUploadId,
    ).toBeTruthy();
    expect(ports.createCandidate).not.toHaveBeenCalled();
  });

  it("refuse une prestation absente des fichiers en attente", async () => {
    const ports = makePorts("2026-11-24T12:00:00+01:00", {
      findUploads: async () => [
        {
          id: PHOTO_ID,
          path: "pending/2026-11-21/photo.jpg",
          kind: "photo",
          mime: "image/jpeg",
          maxBytes: 5 * 1024 * 1024,
          durationSeconds: null,
          usedAt: null,
          expiresAt: "2026-12-31T00:00:00Z",
        },
      ],
    });
    const result = await submitRegistration(validInput, ports);
    expect(
      result.status === "invalid" && result.fieldErrors.presentationUploadId,
    ).toBeTruthy();
    expect(ports.createCandidate).not.toHaveBeenCalled();
  });

  it("refuse un fichier stocké plus gros que la limite", async () => {
    const ports = makePorts("2026-11-24T12:00:00+01:00", {
      statObject: async () => ({ size: 6 * 1024 * 1024, mime: "image/jpeg" }),
    });
    const result = await submitRegistration(validInput, ports);
    expect(result.status).toBe("invalid");
  });

  it("refuse une prestation stockée au-delà de 40 Mo", async () => {
    const ports = makePorts("2026-11-24T12:00:00+01:00", {
      statObject: async (path) =>
        path.endsWith(".mp4")
          ? { size: 45 * 1024 * 1024, mime: "video/mp4" }
          : { size: 200_000, mime: "image/jpeg" },
    });
    const result = await submitRegistration(validInput, ports);
    expect(
      result.status === "invalid" && result.fieldErrors.presentationUploadId,
    ).toBeTruthy();
    expect(ports.createCandidate).not.toHaveBeenCalled();
  });

  it("refuse une prestation dont la durée annoncée dépasse la fenêtre", async () => {
    const base = makePorts("2026-11-24T12:00:00+01:00");
    const ports = makePorts("2026-11-24T12:00:00+01:00", {
      findUploads: async (ids) => {
        const uploads = await base.findUploads(ids);
        return uploads.map((upload) =>
          upload.kind === "presentation"
            ? { ...upload, durationSeconds: 51 }
            : upload,
        );
      },
    });
    const result = await submitRegistration(validInput, ports);
    expect(
      result.status === "invalid" && result.fieldErrors.presentationUploadId,
    ).toMatch(/30 secondes maximum/);
    expect(ports.createCandidate).not.toHaveBeenCalled();
  });

  it("refuse une prestation audio : seules les vidéos sont acceptées", async () => {
    const ports = makePorts("2026-11-24T12:00:00+01:00", {
      statObject: async (path) =>
        path.endsWith(".mp4")
          ? { size: 8_000_000, mime: "audio/mpeg" }
          : { size: 200_000, mime: "image/jpeg" },
    });
    const result = await submitRegistration(validInput, ports);
    expect(
      result.status === "invalid" && result.fieldErrors.presentationUploadId,
    ).toBeTruthy();
    expect(ports.createCandidate).not.toHaveBeenCalled();
  });
});

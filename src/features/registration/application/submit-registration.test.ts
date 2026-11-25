import { describe, expect, it, vi } from "vitest";
import type { RegistrationPorts } from "./ports";
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
  return {
    now: () => new Date(now),
    loadPolicy: async () => ({
      opensAt: new Date("2026-11-21T00:00:00+01:00"),
      closesAt: new Date("2026-11-27T23:59:59+01:00"),
      ageMin: 18,
      ageMax: 35,
    }),
    submit: vi.fn(async () => ({
      ok: true as const,
      dossierNo: "VT-2026-0001",
    })),
    ...overrides,
  };
}

describe("submitRegistration", () => {
  it("refuse le 20/11/2026 à 23:59:59 (Douala) sans rien envoyer au backend", async () => {
    const ports = makePorts("2026-11-20T23:59:59+01:00");
    const result = await submitRegistration(validInput, ports);
    expect(result.status).toBe("window_closed");
    expect(ports.submit).not.toHaveBeenCalled();
  });

  it("refuse le 28/11/2026 à 00:00:00 (Douala)", async () => {
    const ports = makePorts("2026-11-28T00:00:00+01:00");
    const result = await submitRegistration(validInput, ports);
    expect(result).toEqual({
      status: "window_closed",
      message: "Les inscriptions sont closes.",
    });
    expect(ports.submit).not.toHaveBeenCalled();
  });

  it("accepte pendant la période et renvoie le n° de dossier du backend", async () => {
    const ports = makePorts("2026-11-24T12:00:00+01:00");
    const result = await submitRegistration(validInput, ports);
    expect(result).toEqual({
      status: "created",
      dossierNo: "VT-2026-0001",
      email: "aicha@example.cm",
      firstName: "Aïcha",
    });
  });

  it("transmet le téléphone normalisé au format international", async () => {
    const ports = makePorts("2026-11-24T12:00:00+01:00");
    await submitRegistration(validInput, ports);
    const [registration] = vi.mocked(ports.submit).mock.calls[0];
    expect(registration.phone).toBe("+237671234567");
    expect(registration.contactPhone).toBe("+237690112233");
  });

  it("refuse 17 ans et 364 jours à la clôture", async () => {
    const ports = makePorts("2026-11-24T12:00:00+01:00");
    const result = await submitRegistration(
      { ...validInput, birthDate: "2008-11-28" },
      ports,
    );
    expect(result.status).toBe("invalid");
    expect(
      result.status === "invalid" && result.fieldErrors.birthDate,
    ).toBeTruthy();
    expect(ports.submit).not.toHaveBeenCalled();
  });

  it("refuse 36 ans à la clôture", async () => {
    const result = await submitRegistration(
      { ...validInput, birthDate: "1990-11-27" },
      makePorts("2026-11-24T12:00:00+01:00"),
    );
    expect(result.status).toBe("invalid");
  });

  it("arrête une saisie incomplète avant tout appel réseau", async () => {
    const ports = makePorts("2026-11-24T12:00:00+01:00");
    const withoutGender = { ...validInput };
    delete (withoutGender as Record<string, unknown>).gender;
    const result = await submitRegistration(withoutGender, ports);
    expect(result.status).toBe("invalid");
    expect(
      result.status === "invalid" && result.fieldErrors.gender,
    ).toBeTruthy();
    expect(ports.submit).not.toHaveBeenCalled();
  });

  it("refuse un dossier dont le consentement est décoché", async () => {
    const ports = makePorts("2026-11-24T12:00:00+01:00");
    const result = await submitRegistration(
      { ...validInput, acceptRules: false },
      ports,
    );
    expect(result.status).toBe("invalid");
    expect(
      result.status === "invalid" && result.fieldErrors.acceptRules,
    ).toContain("conditions d'utilisation");
    expect(ports.submit).not.toHaveBeenCalled();
  });

  it("refuse un dossier où le consentement est absent", async () => {
    const ports = makePorts("2026-11-24T12:00:00+01:00");
    const withoutConsent = { ...validInput };
    delete (withoutConsent as Record<string, unknown>).acceptRules;
    const result = await submitRegistration(withoutConsent, ports);
    expect(result.status).toBe("invalid");
    expect(ports.submit).not.toHaveBeenCalled();
  });

  it("traduit un lien social refusé par le backend en erreur de champ", async () => {
    const refusal = {
      ok: false as const,
      message: "Veuillez corriger les champs signalés.",
      fieldErrors: {
        "socialLinks.instagram": "Lien invalide (doit commencer par https://)",
      },
    };
    const result = await submitRegistration(
      validInput,
      makePorts("2026-11-24T12:00:00+01:00", { submit: async () => refusal }),
    );
    expect(result).toEqual({
      status: "invalid",
      message: refusal.message,
      fieldErrors: refusal.fieldErrors,
    });
  });

  it("conserve le message de doublon renvoyé par le backend", async () => {
    const ports = makePorts("2026-11-24T12:00:00+01:00", {
      submit: async () => ({
        ok: false as const,
        message: "Un seul dossier est admis par personne.",
        fieldErrors: {
          phone: "Un dossier existe déjà avec ce numéro de téléphone.",
          email: "Un dossier existe déjà avec cette adresse e-mail.",
        },
      }),
    });
    const result = await submitRegistration(validInput, ports);
    expect(result.status).toBe("invalid");
    expect(result.status === "invalid" && result.message).toBe(
      "Un seul dossier est admis par personne.",
    );
    expect(
      result.status === "invalid" && result.fieldErrors.phone,
    ).toBeTruthy();
  });

  it("remonte une panne du backend sans la masquer en erreur de saisie", async () => {
    const ports = makePorts("2026-11-24T12:00:00+01:00", {
      submit: async () => {
        throw new Error("backend indisponible");
      },
    });
    await expect(submitRegistration(validInput, ports)).rejects.toThrow();
  });
});

import { describe, expect, it } from "vitest";
import { ageOn, birthDateBounds, isAgeEligible } from "./eligibility";
import { normalizeCameroonMobile } from "./phone";
import { registrationSchema } from "./registration-schema";
import { registrationPhase } from "./registration-window";

const opensAt = new Date("2026-11-21T00:00:00+01:00");
const closesAt = new Date("2026-11-27T23:59:59+01:00");

describe("registrationPhase (heure de Douala)", () => {
  it("refuse la veille de l'ouverture à 23:59:59", () => {
    expect(
      registrationPhase(
        new Date("2026-11-20T23:59:59+01:00"),
        opensAt,
        closesAt,
      ),
    ).toBe("upcoming");
  });
  it("ouvre le 21/11 à 00:00:00", () => {
    expect(
      registrationPhase(
        new Date("2026-11-21T00:00:00+01:00"),
        opensAt,
        closesAt,
      ),
    ).toBe("open");
  });
  it("reste ouvert pendant la seconde 23:59:59 du 27/11", () => {
    expect(
      registrationPhase(
        new Date("2026-11-27T23:59:59.900+01:00"),
        opensAt,
        closesAt,
      ),
    ).toBe("open");
  });
  it("refuse le 28/11 à 00:00:00", () => {
    expect(
      registrationPhase(
        new Date("2026-11-28T00:00:00+01:00"),
        opensAt,
        closesAt,
      ),
    ).toBe("closed");
  });
  it("ne dépend pas du fuseau de l'appareil (instant UTC équivalent)", () => {
    expect(
      registrationPhase(new Date("2026-11-27T22:59:59Z"), opensAt, closesAt),
    ).toBe("open");
    expect(
      registrationPhase(new Date("2026-11-27T23:00:00Z"), opensAt, closesAt),
    ).toBe("closed");
  });
});

describe("âge à la date de clôture (2026-11-27)", () => {
  const ref = "2026-11-27";
  it("18 ans le jour de la clôture : accepté", () =>
    expect(isAgeEligible("2008-11-27", ref, 18, 35)).toBe(true));
  it("17 ans et 364 jours : refusé", () => {
    expect(ageOn("2008-11-28", ref)).toBe(17);
    expect(isAgeEligible("2008-11-28", ref, 18, 35)).toBe(false);
  });
  it("36 ans le jour de la clôture : refusé", () =>
    expect(isAgeEligible("1990-11-27", ref, 18, 35)).toBe(false));
  it("35 ans et 364 jours : accepté", () =>
    expect(isAgeEligible("1990-11-28", ref, 18, 35)).toBe(true));
  it("bornes du champ date", () =>
    expect(birthDateBounds(ref, 18, 35)).toEqual({
      min: "1990-11-28",
      max: "2008-11-27",
    }));
});

describe("normalizeCameroonMobile", () => {
  it.each([
    ["671234567", "+237671234567"],
    ["6 71 23 45 67", "+237671234567"],
    ["+237 671-23-45-67", "+237671234567"],
    ["00237671234567", "+237671234567"],
  ])("%s → %s", (input, expected) =>
    expect(normalizeCameroonMobile(input)).toBe(expected));
  it.each(["233456789", "67123456", "+33671234567", ""])("refuse %s", (input) =>
    expect(normalizeCameroonMobile(input)).toBeNull());
});

describe("registrationSchema", () => {
  const valid = {
    lastName: "Ngono",
    firstName: "Aïcha",
    birthDate: "2000-05-12",
    gender: "female",
    phone: "6 71 23 45 67",
    email: "Aicha@Example.CM ",
    city: "Douala",
    district: "Akwa",
    idNumber: "123456789",
    photoUploadId: "8b6f1d1e-3c55-4c7c-9e43-0b3a2f1c9d10",
    musicGenre: "Afrobeat",
    songTitle: "Ma chanson",
    musicBackground: "Chorale depuis 10 ans",
    presentationUrl: "https://www.youtube.com/watch?v=abc",
    acceptRules: true,
  };
  it("normalise téléphone et e-mail", () => {
    const parsed = registrationSchema.parse(valid);
    expect(parsed.phone).toBe("+237671234567");
    expect(parsed.email).toBe("aicha@example.cm");
  });
  it("exige une présentation (fichier ou lien)", () => {
    const result = registrationSchema.safeParse({
      ...valid,
      presentationUrl: "",
    });
    expect(result.success).toBe(false);
  });
  it("refuse un lien qui n'est ni YouTube ni TikTok", () => {
    expect(
      registrationSchema.safeParse({
        ...valid,
        presentationUrl: "https://evil.example/x",
      }).success,
    ).toBe(false);
  });
  it("exige l'acceptation du règlement", () => {
    expect(
      registrationSchema.safeParse({ ...valid, acceptRules: false }).success,
    ).toBe(false);
  });
});

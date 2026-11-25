import { describe, expect, it } from "vitest";
import {
  castingDateLabel,
  registrationWindowLabel,
  registrationWindowSentence,
} from "./date-labels";

const WINDOW = {
  registration_opens_at: "2026-11-25T00:00:00+01:00",
  registration_closes_at: "2026-12-02T23:59:59+01:00",
};

describe("registrationWindowLabel", () => {
  it("garde l'année une seule fois quand la fenêtre tient sur la même année", () => {
    expect(registrationWindowLabel(WINDOW)).toMatch(
      /^25 nov\. → 2 déc\. 2026$/,
    );
  });

  it("répète l'année quand la fenêtre franchit le 31 décembre", () => {
    expect(
      registrationWindowLabel({
        registration_opens_at: "2026-12-28T00:00:00+01:00",
        registration_closes_at: "2027-01-04T23:59:59+01:00",
      }),
    ).toMatch(/^28 déc\. 2026 → 4 janv\. 2027$/);
  });
});

describe("registrationWindowSentence", () => {
  it("donne les bornes à la seconde près, en heures de Douala", () => {
    expect(registrationWindowSentence(WINDOW)).toBe(
      "du 25/11/2026 à 00 h 00 au 02/12/2026 à 23 h 59",
    );
  });

  it("ne bascule pas à la veille quand la clôture est minuit moins une", () => {
    expect(
      registrationWindowSentence({
        registration_opens_at: "2026-11-25T00:00:00+01:00",
        registration_closes_at: "2026-12-02T22:59:59.000Z",
      }),
    ).toBe("du 25/11/2026 à 00 h 00 au 02/12/2026 à 23 h 59");
  });
});

describe("castingDateLabel", () => {
  it("lit une date calendaire sans heure au jour voulu", () => {
    expect(castingDateLabel("2026-12-03")).toMatch(/^3 déc\. 2026$/);
  });
});

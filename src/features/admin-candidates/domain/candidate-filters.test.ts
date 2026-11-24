import { describe, expect, it } from "vitest";
import type { FilterableApplication } from "./candidate-filters";
import {
  candidateFiltersSchema,
  matchesFilters,
  parseCandidateFilters,
  sortApplications,
} from "./candidate-filters";

/** Référence d'âge du calendrier de l'édition 2026. */
const REFERENCE = "2026-11-27";

function application(
  overrides: Partial<FilterableApplication> = {},
): FilterableApplication {
  return {
    dossierNo: "VT-2026-0001",
    firstName: "Clarisse",
    lastName: "Testeuse",
    stageName: null,
    birthDate: "2000-05-05",
    phone: "+237690000002",
    email: "clarisse@mail.cm",
    city: "Douala",
    musicGenre: "Rap",
    status: "received",
    submittedAt: "2026-11-24T07:56:37.365442Z",
    ...overrides,
  };
}

const filters = (query: Record<string, string> = {}) =>
  candidateFiltersSchema.parse(query);

describe("matchesFilters", () => {
  it("ne garde que le statut demandé", () => {
    const rows = [application(), application({ status: "selected" })];
    expect(
      rows.filter((row) =>
        matchesFilters(row, filters({ status: "selected" }), REFERENCE),
      ),
    ).toEqual([rows[1]]);
  });

  it("compare ville et genre sans casse ni accents", () => {
    const row = application({ city: "Ydé", musicGenre: "Mbolo" });
    expect(matchesFilters(row, filters({ city: "YDE" }), REFERENCE)).toBe(true);
    expect(matchesFilters(row, filters({ city: "Yaoundé" }), REFERENCE)).toBe(
      false,
    );
    expect(matchesFilters(row, filters({ genre: "mbolo" }), REFERENCE)).toBe(
      true,
    );
    expect(matchesFilters(row, filters({ genre: "rap" }), REFERENCE)).toBe(
      false,
    );
  });

  it("encadre l'âge à la date de clôture", () => {
    const row = application();
    expect(
      matchesFilters(row, filters({ ageMin: "25", ageMax: "30" }), REFERENCE),
    ).toBe(true);
    expect(matchesFilters(row, filters({ ageMin: "27" }), REFERENCE)).toBe(
      false,
    );
    expect(matchesFilters(row, filters({ ageMax: "26" }), REFERENCE)).toBe(
      true,
    );
  });

  it("borne la période d'inscription sur la journée de Douala", () => {
    const row = application();
    expect(
      matchesFilters(row, filters({ from: "2026-11-24" }), REFERENCE),
    ).toBe(true);
    expect(
      matchesFilters(row, filters({ from: "2026-11-25" }), REFERENCE),
    ).toBe(false);
    expect(matchesFilters(row, filters({ to: "2026-11-24" }), REFERENCE)).toBe(
      true,
    );
    expect(matchesFilters(row, filters({ to: "2026-11-23" }), REFERENCE)).toBe(
      false,
    );
  });

  it("cherche le texte libre sur l'identité, le dossier et les chiffres du téléphone", () => {
    const row = application({ stageName: "Clar T" });
    for (const q of [
      "clarisse testeuse",
      "Clar T",
      "vt-2026-0001",
      "clarisse@mail.cm",
      "6900000",
    ])
      expect(matchesFilters(row, filters({ q }), REFERENCE), q).toBe(true);
    expect(matchesFilters(row, filters({ q: "7777777" }), REFERENCE)).toBe(
      false,
    );
    expect(matchesFilters(row, filters({ q: "Bonapriso" }), REFERENCE)).toBe(
      false,
    );
  });
});

describe("sortApplications", () => {
  const rows = [
    application({
      dossierNo: "VT-2026-0003",
      status: "selected",
      lastName: "Zoa",
    }),
    application({
      dossierNo: "VT-2026-0001",
      status: "received",
      lastName: "Mballa",
    }),
    application({
      dossierNo: "VT-2026-0002",
      status: "shortlisted",
      lastName: "Abena",
    }),
  ];

  it("suit l'ordre du pipeline pour le statut, pas l'alphabet", () => {
    expect(
      sortApplications(rows, "status", "asc").map((row) => row.dossierNo),
    ).toEqual(["VT-2026-0001", "VT-2026-0002", "VT-2026-0003"]);
    expect(
      sortApplications(rows, "status", "desc").map((row) => row.dossierNo),
    ).toEqual(["VT-2026-0003", "VT-2026-0002", "VT-2026-0001"]);
  });

  it("trie les noms sans tenir compte de la casse", () => {
    expect(
      sortApplications(rows, "last_name", "asc").map((row) => row.lastName),
    ).toEqual(["Abena", "Mballa", "Zoa"]);
  });

  it("ne modifie jamais la liste d'origine", () => {
    const source = [...rows];
    sortApplications(source, "dossier_no", "desc");
    expect(source).toEqual(rows);
  });
});

describe("parseCandidateFilters", () => {
  it("retombe sur le tri par date d'inscription et la page 1", () => {
    const parsed = parseCandidateFilters({
      sort: "password",
      dir: "up",
      page: "0",
    });
    expect(parsed.sort).toBe("created_at");
    expect(parsed.dir).toBe("desc");
    expect(parsed.page).toBe(1);
  });

  it("ignore un âge non numérique plutôt que de filtrer sur 0", () => {
    expect(parseCandidateFilters({ ageMin: "abc" }).ageMin).toBeUndefined();
  });
});

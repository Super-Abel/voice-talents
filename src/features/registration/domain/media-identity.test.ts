import { describe, expect, it } from "vitest";
import { mediaBadge, mediaFileName } from "./media-identity";

const candidate = {
  firstName: "Aïcha",
  lastName: "Mballa Nkoa",
  phone: "+237 6 71 23 45 67",
};

describe("mediaBadge", () => {
  it("combine le nom complet et le téléphone formaté", () => {
    expect(mediaBadge(candidate)).toBe(
      "Aïcha Mballa Nkoa · +237 6 71 23 45 67",
    );
  });

  it("accepte un numéro sans indicatif", () => {
    expect(mediaBadge({ ...candidate, phone: "671234567" })).toBe(
      "Aïcha Mballa Nkoa · +237 6 71 23 45 67",
    );
  });

  it("omet le téléphone illisible plutôt que d'écrire un faux numéro", () => {
    expect(mediaBadge({ ...candidate, phone: "077712345" })).toBe(
      "Aïcha Mballa Nkoa",
    );
  });

  it("ne grave rien sans identité connue", () => {
    expect(
      mediaBadge({ firstName: "", lastName: "", phone: "pas-un-numero" }),
    ).toBe("");
  });

  it("plie les espaces et borne la longueur du nom", () => {
    expect(mediaBadge({ ...candidate, firstName: "  Jean   Claude" })).toBe(
      "Jean Claude Mballa Nkoa · +237 6 71 23 45 67",
    );
    expect(mediaBadge({ ...candidate, lastName: "N".repeat(80) })).toHaveLength(
      42 + " · ".length + "+237 6 71 23 45 67".length,
    );
  });
});

describe("mediaFileName", () => {
  it("produit un nom triable sans accents ni espaces", () => {
    expect(mediaFileName(candidate, "presentation", "mp4")).toBe(
      "aicha-mballa-nkoa-671234567-presentation.mp4",
    );
  });

  it("distingue la photo de la prestation", () => {
    expect(mediaFileName(candidate, "photo", "webp")).toBe(
      "aicha-mballa-nkoa-671234567-portrait.webp",
    );
  });

  it("reste utilisable sans prénom ni numéro", () => {
    expect(
      mediaFileName({ firstName: "", lastName: "", phone: "" }, "photo", "jpg"),
    ).toBe("candidat-portrait.jpg");
  });

  it("borne la longueur du slug", () => {
    const long = mediaFileName(
      { ...candidate, firstName: "a".repeat(60), phone: "" },
      "presentation",
      "mp4",
    );
    expect(long.split("-")[0]).toHaveLength(40);
    expect(long).toMatch(/^[a-z0-9.-]+\.mp4$/);
  });
});

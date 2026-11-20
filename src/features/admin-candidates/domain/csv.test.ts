import { describe, expect, it } from "vitest";
import { csvCell, csvLine } from "./csv";

describe("csv", () => {
  it("neutralise les formules Excel", () => {
    expect(csvCell('=HYPERLINK("http://x")')).toBe(
      '"\'=HYPERLINK(""http://x"")"',
    );
    expect(csvCell("+237671234567")).toBe("'+237671234567");
    expect(csvCell("@cmd")).toBe("'@cmd");
  });
  it("échappe séparateurs, guillemets et retours à la ligne", () => {
    expect(csvCell('Douala; "Akwa"')).toBe('"Douala; ""Akwa"""');
    expect(csvCell("ligne 1\nligne 2")).toBe('"ligne 1\nligne 2"');
  });
  it("assemble une ligne CRLF", () => {
    expect(csvLine(["a", null, 3])).toBe("a;;3\r\n");
  });
});

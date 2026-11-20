const SEPARATOR = ";";
export const UTF8_BOM = "﻿";

/** Cellule CSV sûre : guillemets échappés, et neutralisation des formules (=, +, -, @) pour Excel. */
export function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[";\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function csvLine(values: unknown[]): string {
  return `${values.map(csvCell).join(SEPARATOR)}\r\n`;
}

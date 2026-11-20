/** Mobile camerounais (6XXXXXXXX), avec ou sans indicatif → "+2376XXXXXXXX". */
export function normalizeCameroonMobile(input: string): string | null {
  const compact = input.replace(/[\s.\-()]/g, "");
  const match = compact.match(/^(?:\+237|00237|237)?(6\d{8})$/);
  return match ? `+237${match[1]}` : null;
}

export function formatCameroonMobile(normalized: string): string {
  const local = normalized.replace(/^\+237/, "");
  return `+237 ${local.slice(0, 1)} ${local.slice(1, 3)} ${local.slice(3, 5)} ${local.slice(5, 7)} ${local.slice(7)}`;
}

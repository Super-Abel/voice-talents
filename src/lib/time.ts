export const DOUALA_TIME_ZONE = "Africa/Douala";
// Le Cameroun n'applique pas d'heure d'été : UTC+1 toute l'année.
export const DOUALA_UTC_OFFSET = "+01:00";

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: DOUALA_TIME_ZONE,
  dateStyle: "long",
  timeStyle: "short",
});

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: DOUALA_TIME_ZONE,
  dateStyle: "long",
});

const shortDateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: DOUALA_TIME_ZONE,
  dateStyle: "short",
  timeStyle: "short",
});

const isoDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: DOUALA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function formatDateTime(value: Date | string): string {
  return dateTimeFormatter.format(new Date(value));
}

export function formatDate(value: Date | string): string {
  return dateFormatter.format(new Date(value));
}

export function formatShortDateTime(value: Date | string): string {
  return shortDateTimeFormatter.format(new Date(value));
}

/** Date calendaire (YYYY-MM-DD) à Douala. */
export function toDoualaDate(value: Date | string): string {
  return isoDateFormatter.format(new Date(value));
}

/** "2026-11-21T00:00" (saisie datetime-local, heure de Douala) → ISO avec fuseau. */
export function doualaLocalToIso(local: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(local)) return null;
  const withSeconds = local.length === 16 ? `${local}:00` : local;
  const date = new Date(`${withSeconds}${DOUALA_UTC_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** ISO → valeur pour un champ datetime-local en heure de Douala. */
export function isoToDoualaLocal(iso: string): string {
  const shifted = new Date(new Date(iso).getTime() + 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 19);
}

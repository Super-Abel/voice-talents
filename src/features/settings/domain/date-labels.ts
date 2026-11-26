import { DOUALA_TIME_ZONE, DOUALA_UTC_OFFSET } from "@/lib/time";
import type { SiteSettings } from "./site-settings";

type Window = Pick<
  SiteSettings,
  "registration_opens_at" | "registration_closes_at"
>;

const monthDay = new Intl.DateTimeFormat("fr-FR", {
  timeZone: DOUALA_TIME_ZONE,
  day: "numeric",
  month: "short",
});

const monthDayYear = new Intl.DateTimeFormat("fr-FR", {
  timeZone: DOUALA_TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
});

const numberedDate = new Intl.DateTimeFormat("fr-FR", {
  timeZone: DOUALA_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const monthDayLong = new Intl.DateTimeFormat("fr-FR", {
  timeZone: DOUALA_TIME_ZONE,
  day: "numeric",
  month: "long",
});

const clock = new Intl.DateTimeFormat("fr-FR", {
  timeZone: DOUALA_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "23:59" → "23 h 59", le format typographique employé dans le règlement. */
function clockLabel(value: Date | string): string {
  const [hour, minute] = clock.format(new Date(value)).split(":");
  return `${hour} h ${minute}`;
}

/** Une date calendaire (YYYY-MM-DD) se lit à midi pour éviter tout glissement de jour. */
function calendarDate(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00${DOUALA_UTC_OFFSET}`);
}

/** « 25 nov. → 2 déc. 2026 » : l'année n'apparaît qu'à la clôture si les deux sont les mêmes. */
export function registrationWindowLabel(settings: Window): string {
  const opens = new Date(settings.registration_opens_at);
  const closes = new Date(settings.registration_closes_at);
  const sameYear = opens.getUTCFullYear() === closes.getUTCFullYear();
  const left = sameYear ? monthDay.format(opens) : monthDayYear.format(opens);
  return `${left} → ${monthDayYear.format(closes)}`;
}

/** « du 25/11/2026 à 00 h 00 au 02/12/2026 à 23 h 59 ». */
export function registrationWindowSentence(settings: Window): string {
  const opens = new Date(settings.registration_opens_at);
  const closes = new Date(settings.registration_closes_at);
  return `du ${numberedDate.format(opens)} à ${clockLabel(opens)} au ${numberedDate.format(closes)} à ${clockLabel(closes)}`;
}

/** « 25 nov. 2026 » pour la date de casting saisie sans heure dans le back-office. */
export function castingDateLabel(isoDate: string): string {
  return monthDayYear.format(calendarDate(isoDate));
}

/** « 12 déc. 2026 » pour un événement stocké en ISO avec fuseau. */
export function eventDateLabel(value: Date | string): string {
  return monthDayYear.format(new Date(value));
}

/** « 5 décembre » : le bandeau défilant donne le jour sans l'année. */
export function eventMonthDayLabel(value: Date | string): string {
  return monthDayLong.format(new Date(value));
}

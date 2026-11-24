import { z } from "zod";
import {
  CANDIDATE_STATUSES,
  type CandidateStatus,
} from "@/features/registration/domain/candidate-status";
import { birthDateBounds } from "@/features/registration/domain/eligibility";

export const SORTABLE_COLUMNS = [
  "created_at",
  "dossier_no",
  "last_name",
  "city",
  "birth_date",
  "status",
  "music_genre",
] as const;
export const PAGE_SIZE = 25;

const optionalText = z
  .string()
  .trim()
  .max(100)
  .optional()
  .transform((value) => value || undefined);
const optionalInt = z.coerce
  .number()
  .int()
  .min(0)
  .max(120)
  .optional()
  .catch(undefined);
const optionalDate = z.iso.date().optional().catch(undefined);

export const candidateFiltersSchema = z.object({
  q: optionalText,
  status: z.enum(CANDIDATE_STATUSES).optional().catch(undefined),
  city: optionalText,
  genre: optionalText,
  ageMin: optionalInt,
  ageMax: optionalInt,
  from: optionalDate,
  to: optionalDate,
  sort: z.enum(SORTABLE_COLUMNS).catch("created_at"),
  dir: z.enum(["asc", "desc"]).catch("desc"),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
});

export type CandidateFilters = z.infer<typeof candidateFiltersSchema>;

export function parseCandidateFilters(
  searchParams: Record<string, string | string[] | undefined>,
): CandidateFilters {
  const flat = Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );
  return candidateFiltersSchema.parse(flat);
}

/**
 * Le backend ne filtre que par statut, sexe et texte libre : la ville, le
 * genre, les âges, la période d'inscription, le tri et la pagination sont
 * appliqués ici, sur la liste complète qu'il renvoie.
 */
export type FilterableApplication = {
  dossierNo: string;
  firstName: string;
  lastName: string;
  stageName: string | null;
  birthDate: string;
  phone: string;
  email: string;
  city: string;
  musicGenre: string;
  status: CandidateStatus;
  submittedAt: string;
};

/** Comparaison insensible à la casse et aux accents, comme l'ILIKE de SQL. */
const fold = (value: string): string =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Minuit, heure de Douala, d'un jour donné éventuellement décalé. */
const doualaMidnight = (date: string, addDays = 0): number =>
  Date.parse(`${date}T00:00:00+01:00`) + addDays * 86_400_000;

export function matchesFilters(
  row: FilterableApplication,
  filters: CandidateFilters,
  ageReferenceDate: string,
): boolean {
  if (filters.status && row.status !== filters.status) return false;
  /* Ville et genre sont des valeurs choisies dans la liste du tableau de bord :
     égalité insensible à la casse et aux accents, pas recherche partielle. */
  if (filters.city && fold(row.city) !== fold(filters.city)) return false;
  if (filters.genre && fold(row.musicGenre) !== fold(filters.genre))
    return false;

  if (filters.ageMin !== undefined || filters.ageMax !== undefined) {
    const bounds = birthDateBounds(
      ageReferenceDate,
      filters.ageMin ?? 0,
      filters.ageMax ?? 120,
    );
    if (row.birthDate < bounds.min || row.birthDate > bounds.max) return false;
  }

  const submitted = Date.parse(row.submittedAt);
  if (filters.from && submitted < doualaMidnight(filters.from)) return false;
  if (filters.to && submitted >= doualaMidnight(filters.to, 1)) return false;

  if (filters.q) {
    const needle = fold(filters.q);
    const digits = filters.q.replace(/\D/g, "");
    const haystack = [
      `${row.firstName} ${row.lastName}`,
      row.stageName ?? "",
      row.dossierNo,
      row.email,
      row.phone,
    ]
      .map(fold)
      .join(" ");
    const phoneDigits = row.phone.replace(/\D/g, "");
    if (
      !haystack.includes(needle) &&
      !(digits.length >= 6 && phoneDigits.includes(digits))
    )
      return false;
  }
  return true;
}

/** Tri par colonne, sens inverse inclus. Le statut suit l'ordre du Pipeline, pas l'alphabet. */
export function sortApplications<T extends FilterableApplication>(
  rows: T[],
  sort: (typeof SORTABLE_COLUMNS)[number],
  dir: "asc" | "desc",
): T[] {
  const sign = dir === "desc" ? -1 : 1;
  const value = (row: T): string | number => {
    switch (sort) {
      case "created_at":
        return Date.parse(row.submittedAt);
      case "status":
        return CANDIDATE_STATUSES.indexOf(row.status);
      case "last_name":
        return row.lastName.toLowerCase();
      case "dossier_no":
        return row.dossierNo;
      case "birth_date":
        return row.birthDate;
      case "city":
        return row.city.toLowerCase();
      case "music_genre":
        return row.musicGenre.toLowerCase();
    }
  };
  return [...rows].sort((a, b) => {
    const left = value(a);
    const right = value(b);
    if (typeof left === "number" && typeof right === "number")
      return sign * (left - right);
    return sign * String(left).localeCompare(String(right), "fr");
  });
}

export function filtersToQuery(filters: Partial<CandidateFilters>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue;
    if (key === "page" && value === 1) continue;
    if (key === "sort" && value === "created_at") continue;
    if (key === "dir" && value === "desc") continue;
    params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

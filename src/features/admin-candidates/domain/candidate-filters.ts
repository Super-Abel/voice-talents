import { z } from "zod";
import { CANDIDATE_STATUSES } from "@/features/registration/domain/candidate-status";
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

/** Paramètres de la fonction SQL admin_list_candidates. L'âge est calculé à la date de référence (clôture). */
export function toListParams(
  filters: CandidateFilters,
  ageReferenceDate: string,
  limit: number,
  offset: number,
) {
  const bounds =
    filters.ageMin !== undefined || filters.ageMax !== undefined
      ? birthDateBounds(
          ageReferenceDate,
          filters.ageMin ?? 0,
          filters.ageMax ?? 120,
        )
      : null;
  const dayAfter = (date: string) =>
    new Date(Date.parse(`${date}T00:00:00+01:00`) + 86_400_000).toISOString();
  return {
    p_q: filters.q ?? null,
    p_status: filters.status ?? null,
    p_city: filters.city ?? null,
    p_genre: filters.genre ?? null,
    p_birth_from: bounds?.min ?? null,
    p_birth_to: bounds?.max ?? null,
    p_created_from: filters.from
      ? new Date(`${filters.from}T00:00:00+01:00`).toISOString()
      : null,
    p_created_to: filters.to ? dayAfter(filters.to) : null,
    p_sort: filters.sort,
    p_desc: filters.dir === "desc",
    p_limit: limit,
    p_offset: offset,
  };
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

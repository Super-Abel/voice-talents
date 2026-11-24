import "server-only";
import type { CandidateFilters } from "@/features/admin-candidates/domain/candidate-filters";
import {
  matchesFilters,
  sortApplications,
} from "@/features/admin-candidates/domain/candidate-filters";
import type { CandidateStatus } from "@/features/registration/domain/candidate-status";
import { writeAudit } from "@/lib/server/audit";
import {
  type BackendApplicationDetail,
  type BackendApplicationSummary,
  BackendError,
  getApplication,
  listApplications,
  updateApplicationStatus,
} from "@/lib/server/backend";
import { toDoualaDate } from "@/lib/time";

export type CandidateListRow = BackendApplicationSummary;
export type CandidateDetail = BackendApplicationDetail;

/**
 * Le backend ne filtre que par statut, sexe et texte libre. Ville, genre, âges,
 * période, tri et pagination sont donc appliqués ici, sur la liste complète.
 */
export function fetchAllApplications(): Promise<CandidateListRow[]> {
  return listApplications({});
}

export async function listCandidates({
  filters,
  ageReferenceDate,
  limit,
  offset,
}: {
  filters: CandidateFilters;
  ageReferenceDate: string;
  limit: number;
  offset: number;
}): Promise<{ rows: CandidateListRow[]; total: number }> {
  const rows = await fetchAllApplications();
  const matched = rows.filter((row) =>
    matchesFilters(row, filters, ageReferenceDate),
  );
  return {
    rows: sortApplications(matched, filters.sort, filters.dir).slice(
      offset,
      offset + limit,
    ),
    total: matched.length,
  };
}

/** Un dossier inconnu du backend n'est pas une panne : la fiche répond 404. */
export async function getCandidate(
  id: string,
): Promise<CandidateDetail | null> {
  try {
    return await getApplication(id);
  } catch (error) {
    if (error instanceof BackendError && error.status === 404) return null;
    throw error;
  }
}

export type StatusChange = {
  id: string;
  dossierNo: string;
  email: string;
  firstName: string;
  previousStatus: CandidateStatus;
};

export type StatusChangeResult = {
  changes: StatusChange[];
  /** Un dossier refusé par le backend ne doit pas annuler les autres. */
  failures: { id: string; reason: string }[];
};

/**
 * Le PATCH du backend est unitaire : la multi-sélection devient une boucle.
 * Les dossiers déjà au statut demandé sont ignorés, ils ne méritent pas une
 * ligne d'historique vide.
 */
export async function setCandidatesStatus(
  ids: string[],
  status: CandidateStatus,
  actor: { id: string; email: string },
  ip: string | null,
  comment?: string,
): Promise<StatusChangeResult> {
  const rowsById = new Map(
    (await fetchAllApplications()).map((row) => [row.id, row]),
  );
  const changes: StatusChange[] = [];
  const failures: { id: string; reason: string }[] = [];
  for (const id of ids) {
    const before = rowsById.get(id);
    if (!before) {
      failures.push({ id, reason: "Dossier introuvable." });
      continue;
    }
    if (before.status === status) continue;
    try {
      await updateApplicationStatus(id, {
        status,
        comment: comment ? `${actor.email} — ${comment}` : undefined,
      });
    } catch (error) {
      failures.push({
        id,
        reason:
          error instanceof BackendError
            ? error.message
            : "Le service est momentanément indisponible.",
      });
      continue;
    }
    changes.push({
      id,
      dossierNo: before.dossierNo,
      email: before.email,
      firstName: before.firstName,
      previousStatus: before.status,
    });
    /* Le backend ne connaît que voice_admin : ce journal garde l'identité réelle. */
    await writeAudit({
      actor,
      action: "candidate.status_changed",
      entity: "candidate",
      entityId: id,
      before: { status: before.status },
      after: { status, comment: comment || null },
      ip,
    });
  }
  return { changes, failures };
}

export type RegistrationStats = {
  total: number;
  by_status: Partial<Record<CandidateStatus, number>>;
  by_day: { day: string; count: number }[];
  by_city: { label: string; count: number }[];
  by_genre: { label: string; count: number }[];
};

/** Première lettre de chaque mot en majuscule, le reste en minuscules, comme initcap. */
function initcap(value: string): string {
  return value
    .toLowerCase()
    .replace(
      /(^|[^\p{L}])(\p{L})/gu,
      (_all, sep: string, letter: string) => `${sep}${letter.toUpperCase()}`,
    );
}

function topLabels(counts: Map<string, number>): {
  label: string;
  count: number;
}[] {
  return [...counts.entries()]
    .map(([key, count]) => ({ label: initcap(key), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "fr"))
    .slice(0, 10);
}

/** Aucun endpoint de statistiques : les compteurs se déduisent de la liste complète. */
export async function registrationStats(): Promise<RegistrationStats> {
  const rows = await fetchAllApplications();
  const by_status: Partial<Record<CandidateStatus, number>> = {};
  const days = new Map<string, number>();
  const cities = new Map<string, number>();
  const genres = new Map<string, number>();
  const bump = (map: Map<string, number>, key: string) =>
    map.set(key, (map.get(key) ?? 0) + 1);
  for (const row of rows) {
    by_status[row.status] = (by_status[row.status] ?? 0) + 1;
    bump(days, toDoualaDate(row.submittedAt));
    bump(cities, row.city.trim().toLowerCase());
    bump(genres, row.musicGenre.trim().toLowerCase());
  }
  return {
    total: rows.length,
    by_status,
    by_day: [...days.entries()]
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => a.day.localeCompare(b.day)),
    by_city: topLabels(cities),
    by_genre: topLabels(genres),
  };
}

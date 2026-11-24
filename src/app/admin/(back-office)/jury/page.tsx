import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/features/admin-auth/access";
import {
  filtersToQuery,
  matchesFilters,
  PAGE_SIZE,
  parseCandidateFilters,
  sortApplications,
} from "@/features/admin-candidates/domain/candidate-filters";
import { fetchAllApplications } from "@/features/admin-candidates/infrastructure/candidates-admin-repository";
import { StatusBadge } from "@/features/admin-candidates/ui/status-badge";
import { JURY_ROLES } from "@/features/admin-jury/domain/review";
import {
  CANDIDATE_STATUS_LABELS,
  CANDIDATE_STATUSES,
} from "@/features/registration/domain/candidate-status";
import { getCachedSettings } from "@/features/settings/infrastructure/settings-repository";
import { formatShortDateTime, toDoualaDate } from "@/lib/time";

export const metadata: Metadata = { title: "Notes du jury" };

export default async function JuryQueuePage({
  searchParams,
}: PageProps<"/admin/jury">) {
  await requireAdmin(JURY_ROLES);
  const query = await searchParams;
  const filters = parseCandidateFilters(query);
  const settings = await getCachedSettings();
  const ageReference = toDoualaDate(settings.registration_closes_at);
  const rows = await fetchAllApplications();
  const matched = sortApplications(
    rows.filter((row) => matchesFilters(row, filters, ageReference)),
    filters.sort,
    filters.dir,
  );
  const total = matched.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageRows = matched.slice((filters.page - 1) * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="vt-kinetic text-4xl text-ink">
          <span>Notes du jury</span>
        </h1>
        <p className="text-muted">
          {total} dossier{total > 1 ? "s" : ""} à écouter. La note va de 0 à
          100.
        </p>
      </div>

      {query.erreur === "note" && (
        <p
          role="alert"
          className="rounded-md border border-danger/50 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          Note invalide : elle doit être un entier entre 0 et 100.
        </p>
      )}

      <form
        method="get"
        className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="sm:col-span-2">
          <label htmlFor="q" className="field-label">
            Recherche (nom, dossier, ville)
          </label>
          <input
            id="q"
            name="q"
            defaultValue={filters.q}
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor="status" className="field-label">
            Statut
          </label>
          <select
            id="status"
            name="status"
            defaultValue={filters.status ?? ""}
            className="field-input"
          >
            <option value="">Tous</option>
            {CANDIDATE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {CANDIDATE_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className="btn-flame flex-1">
            Filtrer
          </button>
          <Link href="/admin/jury" className="btn-ghost">
            Effacer
          </Link>
        </div>
      </form>

      {pageRows.length === 0 ? (
        <p className="card text-center text-muted">
          Aucun dossier ne correspond.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-night-800">
          <table className="w-full min-w-[720px] text-left text-sm">
            <caption className="sr-only">Dossiers à noter</caption>
            <thead className="bg-night-900 text-muted">
              <tr>
                <th scope="col" className="px-3 py-3 font-medium">
                  Dossier
                </th>
                <th scope="col" className="px-3 py-3 font-medium">
                  Candidat
                </th>
                <th scope="col" className="px-3 py-3 font-medium">
                  Ville
                </th>
                <th scope="col" className="px-3 py-3 font-medium">
                  Genre
                </th>
                <th scope="col" className="px-3 py-3 font-medium">
                  Statut
                </th>
                <th scope="col" className="px-3 py-3 font-medium">
                  Inscrit le
                </th>
                <th scope="col" className="px-3 py-3 font-medium">
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-night-800">
              {pageRows.map((row) => (
                <tr key={row.id} className="hover:bg-night-900/60">
                  <td className="px-3 py-2 font-mono">
                    <Link
                      href={`/admin/jury/${row.id}`}
                      className="text-flame-100 hover:underline"
                    >
                      {row.dossierNo}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    {row.firstName} {row.lastName}
                  </td>
                  <td className="px-3 py-2">{row.city}</td>
                  <td className="px-3 py-2">{row.musicGenre}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-muted">
                    {formatShortDateTime(row.submittedAt)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/admin/jury/${row.id}`}
                      className="btn-ghost whitespace-nowrap"
                    >
                      Écouter et noter
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 && (
        <nav
          aria-label="Pagination"
          className="flex items-center justify-between text-sm"
        >
          {filters.page > 1 ? (
            <Link
              href={`/admin/jury${filtersToQuery({ ...filters, page: filters.page - 1 })}`}
              className="btn-ghost"
            >
              Précédent
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted">
            Page {filters.page} / {pageCount}
          </span>
          {filters.page < pageCount ? (
            <Link
              href={`/admin/jury${filtersToQuery({ ...filters, page: filters.page + 1 })}`}
              className="btn-ghost"
            >
              Suivant
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}

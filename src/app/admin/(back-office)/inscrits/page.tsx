import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/features/admin-auth/access";
import { updateCandidatesStatus } from "@/features/admin-candidates/actions";
import {
  type CandidateFilters,
  filtersToQuery,
  PAGE_SIZE,
  parseCandidateFilters,
  type SORTABLE_COLUMNS,
  toListParams,
} from "@/features/admin-candidates/domain/candidate-filters";
import { listCandidates } from "@/features/admin-candidates/infrastructure/candidates-admin-repository";
import { StatusBadge } from "@/features/admin-candidates/ui/status-badge";
import { StatusChangeControls } from "@/features/admin-candidates/ui/status-change-controls";
import {
  CANDIDATE_STATUS_LABELS,
  CANDIDATE_STATUSES,
} from "@/features/registration/domain/candidate-status";
import { ageOn } from "@/features/registration/domain/eligibility";
import { formatCameroonMobile } from "@/features/registration/domain/phone";
import { getCachedSettings } from "@/features/settings/infrastructure/settings-repository";
import { formatShortDateTime, toDoualaDate } from "@/lib/time";

export const metadata: Metadata = { title: "Inscrits" };

const COLUMN_LABELS: Record<(typeof SORTABLE_COLUMNS)[number], string> = {
  created_at: "Inscrit le",
  dossier_no: "Dossier",
  last_name: "Nom",
  city: "Ville",
  birth_date: "Âge",
  status: "Statut",
  music_genre: "Genre",
};

export default async function CandidatesPage({
  searchParams,
}: PageProps<"/admin/inscrits">) {
  await requireAdmin();
  const query = await searchParams;
  const filters = parseCandidateFilters(query);
  const settings = await getCachedSettings();
  const ageReference = toDoualaDate(settings.registration_closes_at);
  const { rows, total } = await listCandidates(
    toListParams(
      filters,
      ageReference,
      PAGE_SIZE,
      (filters.page - 1) * PAGE_SIZE,
    ),
  );
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPath = `/admin/inscrits${filtersToQuery(filters)}`;
  const exportHref = `/admin/inscrits/export${filtersToQuery({ ...filters, page: 1 })}`;
  const hasFilters = [
    filters.q,
    filters.status,
    filters.city,
    filters.genre,
    filters.ageMin,
    filters.ageMax,
    filters.from,
    filters.to,
  ].some((value) => value !== undefined);
  const updated = typeof query.maj === "string" ? Number(query.maj) : null;
  const sortHref = (column: CandidateFilters["sort"]) =>
    `/admin/inscrits${filtersToQuery({ ...filters, sort: column, dir: filters.sort === column && filters.dir === "desc" ? "asc" : "desc", page: 1 })}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="vt-kinetic text-4xl text-ink">
            <span>Inscrits</span>
          </h1>
          <p className="text-muted">
            {total} dossier{total > 1 ? "s" : ""}{" "}
            {hasFilters ? "correspondant aux filtres" : ""}
          </p>
        </div>
        <a href={exportHref} className="btn-ghost">
          Exporter (CSV / Excel)
        </a>
      </div>

      {updated !== null && Number.isFinite(updated) && (
        <output className="block rounded-md border border-success/50 bg-success/10 px-4 py-3 text-sm text-success">
          {updated} dossier{updated > 1 ? "s" : ""} mis à jour.
        </output>
      )}
      {query.erreur === "selection" && (
        <p
          role="alert"
          className="rounded-md border border-danger/50 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          Sélectionnez au moins un dossier et un statut.
        </p>
      )}

      <form
        method="get"
        className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="sm:col-span-2">
          <label htmlFor="q" className="field-label">
            Recherche (nom, dossier, téléphone, e-mail)
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
        <div>
          <label htmlFor="city" className="field-label">
            Ville
          </label>
          <input
            id="city"
            name="city"
            defaultValue={filters.city}
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor="genre" className="field-label">
            Genre musical
          </label>
          <input
            id="genre"
            name="genre"
            defaultValue={filters.genre}
            className="field-input"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="ageMin" className="field-label">
              Âge min.
            </label>
            <input
              id="ageMin"
              name="ageMin"
              type="number"
              min={0}
              max={120}
              defaultValue={filters.ageMin}
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="ageMax" className="field-label">
              Âge max.
            </label>
            <input
              id="ageMax"
              name="ageMax"
              type="number"
              min={0}
              max={120}
              defaultValue={filters.ageMax}
              className="field-input"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 lg:col-span-1">
          <div>
            <label htmlFor="from" className="field-label">
              Du
            </label>
            <input
              id="from"
              name="from"
              type="date"
              defaultValue={filters.from}
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="to" className="field-label">
              Au
            </label>
            <input
              id="to"
              name="to"
              type="date"
              defaultValue={filters.to}
              className="field-input"
            />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className="btn-flame flex-1">
            Filtrer
          </button>
          <Link href="/admin/inscrits" className="btn-ghost">
            Effacer
          </Link>
        </div>
      </form>

      <form id="bulk" action={updateCandidatesStatus} className="card">
        <StatusChangeControls
          formId="bulk"
          returnTo={currentPath}
          label="Pour la sélection : nouveau statut"
        />
      </form>

      {rows.length === 0 ? (
        <p className="card text-center text-muted">
          Aucun dossier ne correspond.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-night-800">
          <table className="w-full min-w-[900px] text-left text-sm">
            <caption className="sr-only">Liste des inscrits</caption>
            <thead className="bg-night-900 text-muted">
              <tr>
                <th scope="col" className="w-10 px-3 py-3">
                  <span className="sr-only">Sélection</span>
                </th>
                {(
                  [
                    "dossier_no",
                    "last_name",
                    "birth_date",
                    "city",
                    "music_genre",
                    "status",
                    "created_at",
                  ] as const
                ).map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className="px-3 py-3 font-medium"
                    aria-sort={
                      filters.sort === column
                        ? filters.dir === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                  >
                    <Link href={sortHref(column)} className="hover:text-ink">
                      {COLUMN_LABELS[column]}
                      {filters.sort === column &&
                        (filters.dir === "asc" ? " ↑" : " ↓")}
                    </Link>
                  </th>
                ))}
                <th scope="col" className="px-3 py-3 font-medium">
                  Téléphone
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-night-800">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-night-900/60">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      name="ids"
                      value={row.id}
                      form="bulk"
                      aria-label={`Sélectionner ${row.dossier_no}`}
                      className="size-5 accent-[var(--flame-200)]"
                    />
                  </td>
                  <td className="px-3 py-2 font-mono">
                    <Link
                      href={`/admin/inscrits/${row.id}`}
                      className="text-flame-100 hover:underline"
                    >
                      {row.dossier_no}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    {row.last_name} {row.first_name}
                    {row.stage_name && (
                      <span className="block text-xs text-muted">
                        « {row.stage_name} »
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {ageOn(row.birth_date, ageReference)} ans
                  </td>
                  <td className="px-3 py-2">{row.city}</td>
                  <td className="px-3 py-2">{row.music_genre}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-muted">
                    {formatShortDateTime(row.created_at)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatCameroonMobile(row.phone)}
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
              href={`/admin/inscrits${filtersToQuery({ ...filters, page: filters.page - 1 })}`}
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
              href={`/admin/inscrits${filtersToQuery({ ...filters, page: filters.page + 1 })}`}
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

import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/features/admin-auth/access";
import { registrationStats } from "@/features/admin-candidates/infrastructure/candidates-admin-repository";
import {
  CANDIDATE_STATUS_LABELS,
  CANDIDATE_STATUSES,
} from "@/features/registration/domain/candidate-status";
import { formatDate } from "@/lib/time";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function DashboardPage() {
  await requireAdmin();
  const stats = await registrationStats();
  const maxDay = Math.max(1, ...stats.by_day.map((day) => day.count));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl tracking-wide">Tableau de bord</h1>
        <Link href="/admin/inscrits" className="btn-flame">
          Voir les inscrits
        </Link>
      </div>

      <section
        aria-label="Inscriptions par statut"
        className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6"
      >
        <div className="card">
          <p className="text-sm text-muted">Inscrits</p>
          <p className="font-display text-5xl text-flame-100 tabular-nums">
            {stats.total}
          </p>
        </div>
        {CANDIDATE_STATUSES.map((status) => (
          <Link
            key={status}
            href={`/admin/inscrits?status=${status}`}
            className="card hover:border-night-700"
          >
            <p className="text-sm text-muted">
              {CANDIDATE_STATUS_LABELS[status]}
            </p>
            <p className="font-display text-4xl tabular-nums">
              {stats.by_status[status] ?? 0}
            </p>
          </Link>
        ))}
      </section>

      <section className="card">
        <h2 className="mb-4 font-display text-2xl tracking-wide">
          Inscriptions par jour
        </h2>
        {stats.by_day.length === 0 ? (
          <p className="text-muted">Aucune inscription pour le moment.</p>
        ) : (
          <ul className="space-y-2">
            {stats.by_day.map((day) => (
              <li
                key={day.day}
                className="grid grid-cols-[8rem_1fr_3rem] items-center gap-3 text-sm"
              >
                <span className="text-muted">
                  {formatDate(`${day.day}T12:00:00+01:00`)}
                </span>
                <span className="h-3 rounded-full bg-night-800">
                  <span
                    className="block h-full rounded-full bg-flame-200"
                    style={{ width: `${(day.count / maxDay) * 100}%` }}
                  />
                </span>
                <span className="text-right tabular-nums">{day.count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Breakdown title="Villes" rows={stats.by_city} filterKey="city" />
        <Breakdown
          title="Genres musicaux"
          rows={stats.by_genre}
          filterKey="genre"
        />
      </div>
    </div>
  );
}

function Breakdown({
  title,
  rows,
  filterKey,
}: {
  title: string;
  rows: { label: string; count: number }[];
  filterKey: string;
}) {
  return (
    <section className="card">
      <h2 className="mb-4 font-display text-2xl tracking-wide">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-muted">Aucune donnée.</p>
      ) : (
        <ol className="divide-y divide-night-800">
          {rows.map((row) => (
            <li key={row.label} className="flex justify-between py-2 text-sm">
              <Link
                href={`/admin/inscrits?${filterKey}=${encodeURIComponent(row.label)}`}
                className="hover:text-flame-100"
              >
                {row.label}
              </Link>
              <span className="tabular-nums">{row.count}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

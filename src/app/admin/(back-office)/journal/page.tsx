import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/features/admin-auth/access";
import { db } from "@/lib/server/db";
import { formatShortDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Journal d'activité" };

const PAGE_SIZE = 50;

const ACTION_LABELS: Record<string, string> = {
  "auth.login": "Connexion",
  "auth.logout": "Déconnexion",
  "auth.login_failed": "Échec de connexion",
  "auth.account_locked": "Compte verrouillé",
  "auth.mfa_verified": "Code 2FA validé",
  "auth.mfa_enrolled": "2FA activée",
  "auth.password_changed": "Mot de passe modifié",
  "candidate.status_changed": "Statut de dossier modifié",
  "candidates.exported": "Export des inscrits",
  "setting.updated": "Paramètre modifié",
  "admin_user.created": "Compte créé",
  "admin_user.deactivated": "Compte désactivé",
  "admin_user.reactivated": "Compte réactivé",
  "admin_user.mfa_reset": "2FA réinitialisée",
  "admin_user.password_reset": "Mot de passe réinitialisé",
};

export default async function AuditLogPage({
  searchParams,
}: PageProps<"/admin/journal">) {
  await requireAdmin();
  const query = await searchParams;
  const page = Math.max(1, Math.min(10_000, Number(query.page) || 1));
  const entity =
    typeof query.entity === "string" && /^[a-z_]{1,40}$/.test(query.entity)
      ? query.entity
      : undefined;

  let request = db()
    .from("audit_log")
    .select(
      "id, at, actor_email, action, entity, entity_id, before, after, ip",
      { count: "exact" },
    )
    .order("at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (entity) request = request.eq("entity", entity);
  const { data, count, error } = await request;
  if (error) throw error;
  const pageCount = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const link = (target: number) =>
    `/admin/journal?${new URLSearchParams({ ...(entity ? { entity } : {}), page: String(target) })}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl tracking-wide">
          Journal d'activité
        </h1>
        <p className="text-sm text-muted">
          Qui a fait quoi et quand. Ce journal ne peut être ni modifié ni
          effacé.
        </p>
      </div>
      <nav aria-label="Filtrer" className="flex flex-wrap gap-2 text-sm">
        {[
          [undefined, "Tout"],
          ["candidate", "Dossiers"],
          ["setting", "Paramètres"],
          ["admin_user", "Comptes et connexions"],
        ].map(([value, label]) => (
          <Link
            key={label}
            href={value ? `/admin/journal?entity=${value}` : "/admin/journal"}
            className={`rounded-full border px-3 py-1 ${entity === value ? "border-flame-100 text-flame-100" : "border-night-700 text-muted"}`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="overflow-x-auto rounded-lg border border-night-800">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="bg-night-900 text-muted">
            <tr>
              <th scope="col" className="px-3 py-3 font-medium">
                Date
              </th>
              <th scope="col" className="px-3 py-3 font-medium">
                Auteur
              </th>
              <th scope="col" className="px-3 py-3 font-medium">
                Action
              </th>
              <th scope="col" className="px-3 py-3 font-medium">
                Élément
              </th>
              <th scope="col" className="px-3 py-3 font-medium">
                Avant → après
              </th>
              <th scope="col" className="px-3 py-3 font-medium">
                IP
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-night-800">
            {data.map((entry) => (
              <tr key={entry.id}>
                <td className="whitespace-nowrap px-3 py-2 text-muted">
                  {formatShortDateTime(entry.at)}
                </td>
                <td className="px-3 py-2">{entry.actor_email ?? "—"}</td>
                <td className="px-3 py-2">
                  {ACTION_LABELS[entry.action] ?? entry.action}
                </td>
                <td className="px-3 py-2">
                  {entry.entity === "candidate" && entry.entity_id ? (
                    <Link
                      href={`/admin/inscrits/${entry.entity_id}`}
                      className="text-flame-100 underline"
                    >
                      dossier
                    </Link>
                  ) : (
                    <span className="font-mono text-xs">
                      {entry.entity_id ?? entry.entity}
                    </span>
                  )}
                </td>
                <td className="max-w-md px-3 py-2 font-mono text-xs break-all text-muted">
                  {entry.before || entry.after
                    ? `${JSON.stringify(entry.before)} → ${JSON.stringify(entry.after)}`
                    : ""}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-muted">
                  {entry.ip ?? ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <nav
          aria-label="Pagination"
          className="flex items-center justify-between text-sm"
        >
          {page > 1 ? (
            <Link href={link(page - 1)} className="btn-ghost">
              Précédent
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted">
            Page {page} / {pageCount}
          </span>
          {page < pageCount ? (
            <Link href={link(page + 1)} className="btn-ghost">
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

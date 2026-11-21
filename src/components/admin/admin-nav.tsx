import Link from "next/link";
import { AdminNavLink } from "@/components/admin/admin-nav-link";
import { getAdminSession } from "@/features/admin-auth/access";
import { logout } from "@/features/admin-auth/actions";
import {
  ADMIN_ROLE_LABELS,
  type AdminRole,
} from "@/features/admin-auth/domain/roles";

const NAV_ITEMS: { href: string; label: string; roles: AdminRole[] }[] = [
  { href: "/admin", label: "Tableau de bord", roles: ["super_admin", "admin"] },
  {
    href: "/admin/inscrits",
    label: "Inscrits",
    roles: ["super_admin", "admin"],
  },
  { href: "/admin/journal", label: "Journal", roles: ["super_admin", "admin"] },
  { href: "/admin/parametres", label: "Paramètres", roles: ["super_admin"] },
  {
    href: "/admin/utilisateurs",
    label: "Utilisateurs",
    roles: ["super_admin"],
  },
  { href: "/admin/jury", label: "Notes du jury", roles: ["jury"] },
  {
    href: "/admin/controle",
    label: "Contrôle d'entrée",
    roles: ["controller"],
  },
];

export async function AdminNav() {
  const session = await getAdminSession();
  if (!session) return null;
  const items = NAV_ITEMS.filter((item) =>
    item.roles.includes(session.user.role),
  );
  return (
    <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
      <nav aria-label="Back-office">
        <ul className="flex flex-wrap gap-1 text-sm">
          {items.map((item) => (
            <li key={item.href}>
              <AdminNavLink href={item.href}>{item.label}</AdminNavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted">
          {session.user.displayName} · {ADMIN_ROLE_LABELS[session.user.role]}
        </span>
        <Link
          href="/admin/securite/mot-de-passe"
          className="text-muted underline hover:text-ink"
        >
          Mot de passe
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-md border border-night-700 px-3 py-1.5 hover:bg-night-800"
          >
            Déconnexion
          </button>
        </form>
      </div>
    </div>
  );
}

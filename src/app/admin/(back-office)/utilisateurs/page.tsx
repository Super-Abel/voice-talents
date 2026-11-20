import type { Metadata } from "next";
import { requireAdmin } from "@/features/admin-auth/access";
import {
  ADMIN_ROLE_LABELS,
  ADMIN_ROLES,
  type AdminRole,
  SUPER_ADMIN_ONLY,
} from "@/features/admin-auth/domain/roles";
import {
  createAdminUser,
  manageAdminUser,
} from "@/features/admin-users/actions";
import { UserActionForm } from "@/features/admin-users/ui/user-action-form";
import { db } from "@/lib/server/db";
import { formatShortDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Utilisateurs" };

type AdminUserRow = {
  id: string;
  email: string;
  display_name: string;
  role: AdminRole;
  is_active: boolean;
  totp_enabled_at: string | null;
  last_login_at: string | null;
  locked_until: string | null;
};

const OPERATIONS = [
  {
    operation: "reset_password",
    label: "Nouveau mot de passe",
    confirm: "Générer un nouveau mot de passe temporaire ?",
  },
  {
    operation: "reset_mfa",
    label: "Réinitialiser la 2FA",
    confirm: "Réinitialiser la double authentification de ce compte ?",
  },
] as const;

export default async function AdminUsersPage() {
  const session = await requireAdmin(SUPER_ADMIN_ONLY);
  const { data, error } = await db()
    .from("admin_users")
    .select(
      "id, email, display_name, role, is_active, totp_enabled_at, last_login_at, locked_until",
    )
    .order("created_at");
  if (error) throw error;
  const users = data as AdminUserRow[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl tracking-wide">
          Utilisateurs du back-office
        </h1>
        <p className="text-sm text-muted">
          Jury : saisie des notes uniquement · Contrôleur : scan des billets
          uniquement. La 2FA est obligatoire pour les administrateurs.
        </p>
      </div>

      <section className="card max-w-2xl">
        <h2 className="mb-4 font-display text-2xl tracking-wide">
          Créer un compte
        </h2>
        <UserActionForm
          action={createAdminUser}
          submitLabel="Créer le compte"
          className="grid gap-3 sm:grid-cols-2"
        >
          <div>
            <label htmlFor="displayName" className="field-label">
              Nom affiché
            </label>
            <input
              id="displayName"
              name="displayName"
              required
              maxLength={80}
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="email" className="field-label">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="field-input"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="role" className="field-label">
              Rôle
            </label>
            <select
              id="role"
              name="role"
              defaultValue="admin"
              className="field-input"
            >
              {ADMIN_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ADMIN_ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </div>
        </UserActionForm>
      </section>

      <section className="space-y-3">
        {users.map((user) => (
          <article key={user.id} className="card space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h3 className="font-semibold">
                  {user.display_name}{" "}
                  {user.id === session.user.id && (
                    <span className="text-sm text-muted">(vous)</span>
                  )}
                </h3>
                <p className="text-sm text-muted">
                  {user.email} · {ADMIN_ROLE_LABELS[user.role]}
                </p>
              </div>
              <p className="text-sm">
                {user.is_active ? (
                  <span className="text-success">Actif</span>
                ) : (
                  <span className="text-danger">Désactivé</span>
                )}
                {" · "}
                {user.totp_enabled_at ? "2FA activée" : "2FA non activée"}
                {" · "}
                {user.last_login_at
                  ? `Dernière connexion ${formatShortDateTime(user.last_login_at)}`
                  : "Jamais connecté"}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {OPERATIONS.map((item) => (
                <UserActionForm
                  key={item.operation}
                  action={manageAdminUser}
                  submitLabel={item.label}
                  confirmMessage={item.confirm}
                  submitClassName="btn-ghost min-h-10 text-sm"
                >
                  <input type="hidden" name="userId" value={user.id} />
                  <input
                    type="hidden"
                    name="operation"
                    value={item.operation}
                  />
                </UserActionForm>
              ))}
              {user.id !== session.user.id && (
                <UserActionForm
                  action={manageAdminUser}
                  submitLabel={user.is_active ? "Désactiver" : "Réactiver"}
                  confirmMessage={
                    user.is_active
                      ? "Désactiver ce compte ? Ses sessions seront fermées."
                      : undefined
                  }
                  submitClassName="btn-ghost min-h-10 text-sm"
                >
                  <input type="hidden" name="userId" value={user.id} />
                  <input
                    type="hidden"
                    name="operation"
                    value={user.is_active ? "deactivate" : "reactivate"}
                  />
                </UserActionForm>
              )}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

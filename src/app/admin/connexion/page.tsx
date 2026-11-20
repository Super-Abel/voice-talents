import type { Metadata } from "next";
import { ActionForm } from "@/components/admin/action-form";
import { AuthCard } from "@/components/admin/auth-card";
import { login } from "@/features/admin-auth/actions";

export const metadata: Metadata = { title: "Connexion" };

export default function LoginPage() {
  return (
    <AuthCard title="Connexion">
      <ActionForm
        action={login}
        submitLabel="Se connecter"
        pendingLabel="Connexion…"
      >
        <div>
          <label htmlFor="email" className="field-label">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor="password" className="field-label">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="field-input"
          />
        </div>
      </ActionForm>
    </AuthCard>
  );
}

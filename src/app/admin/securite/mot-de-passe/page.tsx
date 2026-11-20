import type { Metadata } from "next";
import { ActionForm } from "@/components/admin/action-form";
import { AuthCard } from "@/components/admin/auth-card";
import { changePassword } from "@/features/admin-auth/actions";
import { PASSWORD_MIN_LENGTH } from "@/features/admin-auth/domain/password-policy";

export const metadata: Metadata = { title: "Mot de passe" };

const FIELDS = [
  {
    name: "currentPassword",
    label: "Mot de passe actuel",
    autoComplete: "current-password",
  },
  {
    name: "newPassword",
    label: "Nouveau mot de passe",
    autoComplete: "new-password",
  },
  {
    name: "confirmPassword",
    label: "Confirmer le nouveau mot de passe",
    autoComplete: "new-password",
  },
] as const;

export default function ChangePasswordPage() {
  return (
    <AuthCard
      title="Changer le mot de passe"
      intro={`Au moins ${PASSWORD_MIN_LENGTH} caractères, avec des lettres et des chiffres. Vos autres sessions seront déconnectées.`}
    >
      <ActionForm
        action={changePassword}
        submitLabel="Enregistrer"
        pendingLabel="Enregistrement…"
      >
        {FIELDS.map((field) => (
          <div key={field.name}>
            <label htmlFor={field.name} className="field-label">
              {field.label}
            </label>
            <input
              id={field.name}
              name={field.name}
              type="password"
              autoComplete={field.autoComplete}
              minLength={
                field.name === "currentPassword"
                  ? undefined
                  : PASSWORD_MIN_LENGTH
              }
              required
              className="field-input"
            />
          </div>
        ))}
      </ActionForm>
    </AuthCard>
  );
}

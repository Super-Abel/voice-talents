import type { Metadata } from "next";
import { Suspense } from "react";
import { ActionForm } from "@/components/admin/action-form";
import { AuthCard } from "@/components/admin/auth-card";
import { TotpCodeInput } from "@/components/admin/totp-code-input";
import { requireAdmin } from "@/features/admin-auth/access";
import { logout, verifyTotpCode } from "@/features/admin-auth/actions";

export const metadata: Metadata = { title: "Vérification" };

export default function TotpVerificationPage() {
  return (
    <AuthCard
      title="Double authentification"
      intro="Saisissez le code affiché par votre application d'authentification."
    >
      <Suspense
        fallback={
          <div className="h-40 animate-pulse rounded-md bg-night-800" />
        }
      >
        <VerificationForm />
      </Suspense>
    </AuthCard>
  );
}

async function VerificationForm() {
  await requireAdmin(undefined, { during: "totp_verify" });
  return (
    <>
      <ActionForm
        action={verifyTotpCode}
        submitLabel="Valider"
        pendingLabel="Vérification…"
      >
        <TotpCodeInput />
      </ActionForm>
      <form action={logout}>
        <button type="submit" className="text-sm text-muted underline">
          Annuler et se déconnecter
        </button>
      </form>
    </>
  );
}

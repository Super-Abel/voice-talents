import type { Metadata } from "next";
import { Suspense } from "react";
import { ActionForm } from "@/components/admin/action-form";
import { AuthCard } from "@/components/admin/auth-card";
import { TotpCodeInput } from "@/components/admin/totp-code-input";
import { requireAdmin } from "@/features/admin-auth/access";
import { confirmTotpEnrollment } from "@/features/admin-auth/actions";
import { pendingTotpEnrollment } from "@/features/admin-auth/infrastructure/totp-enrollment";

export const metadata: Metadata = {
  title: "Activer la double authentification",
};

export default function TotpEnrollmentPage() {
  return (
    <AuthCard
      title="Activer la double authentification"
      intro="Obligatoire pour les administrateurs. Installez Google Authenticator, Microsoft Authenticator ou une application équivalente, puis scannez le QR code."
    >
      <Suspense
        fallback={
          <div className="h-72 animate-pulse rounded-md bg-night-800" />
        }
      >
        <Enrollment />
      </Suspense>
    </AuthCard>
  );
}

async function Enrollment() {
  const session = await requireAdmin(undefined, { during: "totp_enroll" });
  const { qrDataUrl, manualKey } = await pendingTotpEnrollment(
    session.user.id,
    session.user.email,
  );
  return (
    <div className="space-y-5">
      <div className="mx-auto w-fit rounded-md bg-white p-2">
        {/* biome-ignore lint/performance/noImgElement: QR code généré en data URL, pas d'optimisation possible */}
        <img
          src={qrDataUrl}
          alt="QR code à scanner avec votre application d'authentification"
          width={240}
          height={240}
        />
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-flame-100">
          Impossible de scanner ? Saisir la clé manuellement
        </summary>
        <p className="mt-2 break-all rounded-md bg-night-950 p-3 font-mono">
          {manualKey}
        </p>
      </details>
      <ActionForm
        action={confirmTotpEnrollment}
        submitLabel="Activer"
        pendingLabel="Vérification…"
      >
        <TotpCodeInput />
      </ActionForm>
    </div>
  );
}

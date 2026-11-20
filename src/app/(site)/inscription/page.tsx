import type { Metadata } from "next";
import { Suspense } from "react";
import { KineticTitle } from "@/components/site/motion/kinetics";
import { StageBeams, StageTexture } from "@/components/site/motion/stage";
import { birthDateBounds } from "@/features/registration/domain/eligibility";
import { RegistrationGate } from "@/features/registration/ui/registration-gate";
import { getCachedSettings } from "@/features/settings/infrastructure/settings-repository";
import { formatDateTime, toDoualaDate } from "@/lib/time";

export const metadata: Metadata = {
  title: "Inscription",
  description:
    "Inscrivez-vous gratuitement à Voice Talent – Édition spéciale Douala 2026 (18 à 35 ans).",
};

export default function RegistrationPage() {
  return (
    <div className="vt-stage border-b border-night-800">
      <StageBeams />
      <StageTexture />

      <div className="relative mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <p className="vt-chip">
          <span className="text-flame-100">●</span> Édition spéciale Douala 2026
        </p>

        <div className="mt-4">
          <KineticTitle
            lines={["Inscription", "gratuite"]}
            accentLine={1}
            className="text-[clamp(2.6rem,12vw,4.5rem)]"
          />
        </div>

        <p className="mt-4 text-lg text-muted">
          Ouverte aux chanteuses et chanteurs de 18 à 35 ans. Un seul dossier
          par personne. Prévoyez environ 10 minutes, une photo et un
          enregistrement de votre voix (fichier ou lien YouTube/TikTok).
        </p>

        <div className="mt-10">
          <Suspense
            fallback={
              <div
                className="h-64 animate-pulse rounded-lg bg-night-900"
                aria-hidden="true"
              />
            }
          >
            <RegistrationSection />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function RegistrationSection() {
  const settings = await getCachedSettings();
  const bounds = birthDateBounds(
    toDoualaDate(settings.registration_closes_at),
    settings.age_min,
    settings.age_max,
  );
  return (
    <RegistrationGate
      opensAt={settings.registration_opens_at}
      closesAt={settings.registration_closes_at}
      opensLabel={formatDateTime(settings.registration_opens_at)}
      closesLabel={formatDateTime(settings.registration_closes_at)}
      birthDateMin={bounds.min}
      birthDateMax={bounds.max}
    />
  );
}

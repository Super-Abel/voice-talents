import type { Metadata } from "next";
import { KineticTitle } from "@/components/site/motion/kinetics";
import { ApplicationTracker } from "@/features/registration/ui/application-tracker";

export const metadata: Metadata = {
  title: "Suivre mon dossier",
  description:
    "Consultez l'état de votre candidature Voice Talent avec votre numéro de dossier.",
};

export default function TrackApplicationPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <p className="vt-chip">Suivi de candidature</p>
      <KineticTitle
        className="mt-5 text-4xl sm:text-5xl"
        lines={["Suivre", "mon dossier"]}
        accentLine={1}
      />
      <span className="vt-rule mt-5 block w-32" aria-hidden="true" />
      <p className="mt-5 text-muted">
        Saisissez le numéro reçu à l'inscription (ex. VT-2026-0001) et le
        téléphone utilisé.
      </p>
      <div className="mt-8">
        <ApplicationTracker />
      </div>
    </div>
  );
}

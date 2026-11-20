import type { Metadata } from "next";
import { ApplicationTracker } from "@/features/registration/ui/application-tracker";

export const metadata: Metadata = {
  title: "Suivre mon dossier",
  description: "Consultez l'état de votre candidature Voice Talent avec votre numéro de dossier.",
};

export default function TrackApplicationPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="font-display text-5xl tracking-wide">Suivre mon dossier</h1>
      <p className="mt-3 text-muted">
        Saisissez le numéro reçu à l'inscription (ex. VT-2026-0001) et le téléphone utilisé.
      </p>
      <div className="mt-8">
        <ApplicationTracker />
      </div>
    </div>
  );
}

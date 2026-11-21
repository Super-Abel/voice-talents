"use client";

import Link from "next/link";
import { Countdown } from "@/components/countdown";
import { useServerClock } from "@/lib/use-server-clock";
import { registrationPhase } from "../domain/registration-window";
import { RegistrationForm } from "./registration-form";

/** Ce qu'il faut avoir sous la main avant de commencer : formats identiques à ceux vérifiés à l'envoi. */
const PREP_ITEMS = [
  { value: "≈ 10 min", label: "Quatre étapes" },
  { value: "JPEG · PNG", label: "Une photo de portrait (5 Mo max.)" },
  {
    value: "15–30 s",
    label: "Une vidéo de prestation (MP4 ou MOV, 40 Mo max.)",
  },
  { value: "1 contact", label: "Une personne à joindre en cas d'urgence" },
] as const;

type Props = {
  opensAt: string;
  closesAt: string;
  opensLabel: string;
  closesLabel: string;
  birthDateMin: string;
  birthDateMax: string;
};

export function RegistrationGate({
  opensAt,
  closesAt,
  opensLabel,
  closesLabel,
  birthDateMin,
  birthDateMax,
}: Props) {
  const { now, synced } = useServerClock();

  if (!synced)
    return (
      <div
        className="h-64 animate-pulse rounded-lg bg-night-900"
        aria-hidden="true"
      />
    );

  const phase = registrationPhase(
    new Date(now),
    new Date(opensAt),
    new Date(closesAt),
  );

  if (phase === "upcoming") {
    return (
      <section className="vt-panel space-y-6 p-6 sm:p-8">
        <p className="vt-chip">
          <span className="text-flame-100">●</span> Rideau encore fermé
        </p>
        <h2 className="vt-kinetic text-4xl text-ink sm:text-5xl">
          <span>Ça arrive</span>
          <span className="text-gradient-flame vt-flicker">sur scène</span>
        </h2>
        <p className="text-lg">
          Les inscriptions ouvrent le{" "}
          <strong className="text-flame-100">{opensLabel}</strong> (heure de
          Douala).
        </p>
        <Countdown
          deadlines={[
            { at: opensAt, label: "Ouverture des inscriptions dans" },
          ]}
        />
        <p className="text-sm text-muted">À préparer dès maintenant :</p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {PREP_ITEMS.map((item) => (
            <li
              key={item.label}
              className="flex items-baseline gap-3 rounded-md border border-night-800 bg-night-950/60 px-4 py-3"
            >
              <span className="font-display shrink-0 text-xl text-flame-100 uppercase">
                {item.value}
              </span>
              <span className="text-sm text-muted">{item.label}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted">
          Vos réponses seront enregistrées sur cet appareil tant que vous
          n'aurez pas envoyé le dossier.
        </p>
      </section>
    );
  }

  if (phase === "closed") {
    return (
      <section className="vt-panel space-y-5 p-6 text-center sm:p-10">
        <p className="vt-chip">
          <span className="text-flame-100">●</span> {closesLabel}
        </p>
        <h2 className="vt-kinetic text-4xl text-ink sm:text-5xl">
          <span>Inscriptions</span>
          <span className="text-gradient-flame">closes</span>
        </h2>
        <p className="text-muted">
          Merci pour votre enthousiasme ! Le casting retient 40 dossiers. Vous
          êtes déjà inscrit(e) ?
        </p>
        <Link href="/suivre-mon-dossier" className="btn-ghost">
          Suivre mon dossier
        </Link>
      </section>
    );
  }

  return (
    <RegistrationForm
      birthDateMin={birthDateMin}
      birthDateMax={birthDateMax}
      closesAt={closesAt}
      closesLabel={closesLabel}
    />
  );
}

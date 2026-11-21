import type { Metadata } from "next";
import Link from "next/link";
import { type CSSProperties, Suspense } from "react";
import { KineticTitle } from "@/components/site/motion/kinetics";
import { Reveal } from "@/components/site/motion/reveal";
import { getCachedSettings } from "@/features/settings/infrastructure/settings-repository";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez l'organisation de Voice Talent – Édition spéciale Douala 2026 : e-mail, téléphone, WhatsApp.",
};

type ContactItem = { label: string; value: string; href: string | null };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="vt-chip">Parlons-en</p>
      <KineticTitle
        className="mt-5 text-5xl sm:text-6xl"
        lines={["Contact"]}
        accentLine={0}
      />
      <span className="vt-rule mt-5 block w-40" aria-hidden="true" />
      <p className="mt-5 text-muted">
        Une question sur les inscriptions, le vote ou la billetterie ?
        L'organisation répond sur le canal de votre choix.
      </p>

      <div className="mt-8">
        <Suspense
          fallback={
            <div className="grid gap-3 sm:grid-cols-2" aria-hidden="true">
              <div className="h-24 animate-pulse rounded-lg bg-night-900" />
              <div className="h-24 animate-pulse rounded-lg bg-night-900" />
            </div>
          }
        >
          <ContactDetails />
        </Suspense>
      </div>

      <Reveal className="mt-8">
        <div className="vt-panel p-5 sm:p-6">
          <h2 className="vt-kinetic text-2xl text-ink">
            <span style={{ "--vt-delay": "0ms" } as CSSProperties}>
              Déjà candidat ?
            </span>
          </h2>
          <p className="mt-3 text-muted">
            Suivez l'état de votre dossier avec le numéro reçu à l'inscription.
          </p>
          <Link href="/suivre-mon-dossier" className="btn-ghost mt-4">
            Suivre mon dossier
          </Link>
        </div>
      </Reveal>
    </div>
  );
}

async function ContactDetails() {
  const { contact } = await getCachedSettings();
  const email = contact.email.trim();
  const phone = contact.phone.trim();
  const whatsapp = contact.whatsapp.trim();
  const whatsappDigits = whatsapp.replace(/\D/g, "");
  const address = contact.address.trim();

  const filled: (ContactItem | null)[] = [
    email ? { label: "E-mail", value: email, href: `mailto:${email}` } : null,
    phone
      ? {
          label: "Téléphone",
          value: phone,
          href: `tel:${phone.replace(/[^\d+]/g, "")}`,
        }
      : null,
    whatsappDigits
      ? {
          label: "WhatsApp",
          value: whatsapp,
          href: `https://wa.me/${whatsappDigits}`,
        }
      : null,
    address ? { label: "Adresse", value: address, href: null } : null,
  ];
  const items = filled.filter((item): item is ContactItem => item !== null);

  if (items.length === 0) {
    return (
      <div className="vt-panel p-5">
        <p className="text-muted">
          Les coordonnées de l'organisation seront publiées très prochainement.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item.label} className="vt-panel p-4">
          <p className="font-display text-xs tracking-[0.2em] text-flame-100 uppercase">
            {item.label}
          </p>
          {item.href ? (
            <a
              href={item.href}
              className="mt-1 block break-words text-ink underline decoration-night-600 decoration-2 underline-offset-4 transition-colors hover:text-flame-100 hover:decoration-flame-200"
            >
              {item.value}
            </a>
          ) : (
            <p className="mt-1 text-ink">{item.value}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

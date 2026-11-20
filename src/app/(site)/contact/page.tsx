import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
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
      <h1 className="font-display text-5xl tracking-wide sm:text-6xl">
        Contact
      </h1>
      <p className="mt-3 text-muted">
        Une question sur les inscriptions, le vote ou la billetterie ?
        L'organisation répond sur le canal de votre choix.
      </p>

      <div className="mt-8">
        <Suspense
          fallback={
            <div
              className="h-40 animate-pulse rounded-lg bg-night-900"
              aria-hidden="true"
            />
          }
        >
          <ContactDetails />
        </Suspense>
      </div>

      <div className="card mt-8">
        <h2 className="font-display text-2xl tracking-wide">Déjà candidat ?</h2>
        <p className="mt-2 text-muted">
          Suivez l'état de votre dossier avec le numéro reçu à l'inscription.
        </p>
        <Link href="/suivre-mon-dossier" className="btn-ghost mt-4">
          Suivre mon dossier
        </Link>
      </div>
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
      <p className="text-muted">
        Les coordonnées de l'organisation seront publiées très prochainement.
      </p>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item.label} className="card">
          <p className="text-sm font-medium uppercase tracking-wider text-muted">
            {item.label}
          </p>
          {item.href ? (
            <a
              href={item.href}
              className="mt-1 block font-medium text-flame-100 underline decoration-night-700 hover:decoration-flame-100"
            >
              {item.value}
            </a>
          ) : (
            <p className="mt-1 font-medium text-ink">{item.value}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

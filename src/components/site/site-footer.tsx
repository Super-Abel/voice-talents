import Link from "next/link";
import { Logo } from "./logo";
import { StageTexture } from "./motion/stage";

const COLUMNS = [
  {
    title: "Concours",
    links: [
      { href: "/concours", label: "Le concours" },
      { href: "/concours#phases", label: "Les phases" },
      { href: "/concours#vote", label: "Vote et notation" },
      { href: "/concours#reglement", label: "Le règlement" },
    ],
  },
  {
    title: "Candidats",
    links: [
      { href: "/inscription", label: "S'inscrire" },
      { href: "/suivre-mon-dossier", label: "Suivre mon dossier" },
    ],
  },
  {
    title: "Informations",
    links: [
      { href: "/contact", label: "Contact" },
      { href: "/mentions-legales", label: "Mentions légales" },
      { href: "/cgu", label: "Conditions générales" },
      { href: "/confidentialite", label: "Confidentialité" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="vt-stage relative mt-auto border-t border-night-800 bg-night-1000/80">
      <StageTexture />
      <div className="relative mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo className="h-14" />
            <p className="mt-3 text-sm text-muted">
              La compétition qui révèle les nouvelles voix du Cameroun. Édition
              spéciale Douala, de décembre 2026 à janvier 2027.
            </p>
            <Link href="/inscription" className="btn-flame mt-5">
              S'inscrire gratuitement
            </Link>
          </div>

          <nav
            aria-label="Navigation de pied de page"
            className="grid grid-cols-2 gap-x-10 gap-y-8 text-sm sm:grid-cols-3"
          >
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <h2 className="font-display text-lg tracking-wide text-flame-100 uppercase">
                  {column.title}
                </h2>
                <ul className="mt-3 space-y-2">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-muted transition-colors hover:text-ink"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="vt-rule mt-10" aria-hidden="true" />
        <p className="mt-6 text-sm text-muted">
          Voice Talent – Édition spéciale Douala 2026 · Une question ?{" "}
          <Link href="/contact" className="underline hover:text-ink">
            Contactez l'organisation
          </Link>
        </p>
      </div>
    </footer>
  );
}

import type { ReactNode } from "react";

const LAST_UPDATED = "13 novembre 2026";

export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <p className="vt-chip">Document contractuel</p>
      <h1 className="vt-kinetic mt-5 text-4xl text-ink sm:text-5xl">
        <span>{title}</span>
      </h1>
      <span className="vt-rule mt-5 block w-40" aria-hidden="true" />
      <p className="mt-5 text-sm text-muted">
        Dernière mise à jour : {LAST_UPDATED}
      </p>
      {intro ? (
        <div className="vt-panel mt-8 p-5 leading-relaxed text-muted sm:p-6">
          {intro}
        </div>
      ) : null}
      <div className="mt-12 space-y-12">{children}</div>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="vt-scene">
      <h2 className="vt-kinetic text-xl text-ink sm:text-2xl">
        <span>{title}</span>
      </h2>
      <span className="vt-rule mt-3 block w-24" aria-hidden="true" />
      <div className="mt-4 space-y-3 leading-relaxed [&_a]:text-flame-100 [&_a]:underline [&_a]:underline-offset-4 [&_li]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:text-ink [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

/** Marqueur visible des informations que l'organisation doit fournir. */
export function LegalPlaceholder() {
  return (
    <span className="rounded-sm border border-flame-500/45 bg-night-800 px-1.5 py-0.5 font-medium text-flame-100">
      [À compléter par l'organisation]
    </span>
  );
}

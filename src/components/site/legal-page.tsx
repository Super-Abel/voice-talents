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
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl tracking-wide sm:text-5xl">
        {title}
      </h1>
      <p className="mt-3 text-sm text-muted">
        Dernière mise à jour : {LAST_UPDATED}
      </p>
      {intro ? (
        <div className="mt-6 leading-relaxed text-muted">{intro}</div>
      ) : null}
      <div className="mt-10 space-y-10">{children}</div>
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
    <section>
      <h2 className="font-display text-2xl tracking-wide sm:text-3xl">
        {title}
      </h2>
      <div className="mt-3 space-y-3 leading-relaxed [&_li]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

/** Marqueur visible des informations que l'organisation doit fournir. */
export function LegalPlaceholder() {
  return (
    <span className="rounded-sm bg-night-800 px-1.5 py-0.5 font-medium text-flame-100">
      [À compléter par l'organisation]
    </span>
  );
}

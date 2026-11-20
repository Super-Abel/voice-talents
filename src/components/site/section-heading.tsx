import type { ReactNode } from "react";
import { Reveal } from "./motion/reveal";

export function SectionHeading({
  eyebrow,
  intro,
  children,
}: {
  eyebrow?: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Reveal className="mb-8">
      {eyebrow ? <p className="vt-chip mb-3">{eyebrow}</p> : null}
      <h2 className="vt-kinetic text-4xl text-ink sm:text-5xl">{children}</h2>
      <span className="vt-rule mt-4 block w-32" aria-hidden="true" />
      {intro ? <p className="mt-4 max-w-2xl text-muted">{intro}</p> : null}
    </Reveal>
  );
}

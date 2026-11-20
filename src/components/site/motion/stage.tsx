import type { CSSProperties } from "react";

/** Faisceaux de scène. Statiques côté serveur : aucun Math.random() dans le rendu, la page est pré-rendue. */
const BEAMS = [
  { left: "4%", rot: "-20deg", delay: "0s", width: "clamp(5rem,18vw,13rem)" },
  { left: "22%", rot: "-8deg", delay: "1.4s", width: "clamp(7rem,26vw,20rem)" },
  { left: "48%", rot: "3deg", delay: "0.6s", width: "clamp(8rem,30vw,24rem)" },
  { left: "70%", rot: "12deg", delay: "2.1s", width: "clamp(6rem,22vw,16rem)" },
  { left: "88%", rot: "22deg", delay: "1s", width: "clamp(5rem,17vw,12rem)" },
] as const;

export function StageBeams() {
  return (
    <div className="vt-beams" aria-hidden="true">
      {BEAMS.map((beam) => (
        <span
          key={beam.left}
          className="vt-beam"
          style={
            {
              left: beam.left,
              width: beam.width,
              animationDelay: beam.delay,
              "--vt-rot": beam.rot,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function StageTexture({ speedlines = false }: { speedlines?: boolean }) {
  return (
    <>
      <div className="vt-halftone" aria-hidden="true" />
      {speedlines ? <div className="vt-speedlines" aria-hidden="true" /> : null}
    </>
  );
}

/** Rythmes figés d'une barre à l'autre : l'affiche ne se désynchronise jamais d'un rendu à l'autre. */
const BAR_TIMINGS = [
  { id: "a", delay: 0, duration: 900 },
  { id: "b", delay: 110, duration: 1070 },
  { id: "c", delay: 220, duration: 1240 },
  { id: "d", delay: 330, duration: 1410 },
  { id: "e", delay: 440, duration: 1580 },
  { id: "f", delay: 550, duration: 750 },
  { id: "g", delay: 660, duration: 920 },
  { id: "h", delay: 770, duration: 1090 },
  { id: "i", delay: 880, duration: 1260 },
  { id: "j", delay: 0, duration: 1430 },
  { id: "k", delay: 110, duration: 1600 },
  { id: "l", delay: 220, duration: 800 },
  { id: "m", delay: 330, duration: 970 },
  { id: "n", delay: 440, duration: 1140 },
] as const;

export function Equalizer({
  bars = 14,
  className = "",
}: {
  bars?: number;
  className?: string;
}) {
  return (
    <div className={`vt-eq ${className}`} aria-hidden="true">
      {BAR_TIMINGS.slice(0, bars).map((bar) => (
        <i
          key={bar.id}
          style={
            {
              "--vt-delay": `${bar.delay}ms`,
              "--vt-dur": `${bar.duration}ms`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

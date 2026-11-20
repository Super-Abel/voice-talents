"use client";

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Suit le pointeur (et l'inertie de défilement) en écrivant des variables CSS : pas de re-render par frame. */
export function HeroTilt({
  children,
  depth = 16,
  className = "",
}: {
  children: ReactNode;
  depth?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || prefersReducedMotion()) return;
    if (!window.matchMedia("(hover: hover)").matches) return;

    let frame = 0;
    let targetX = 0;
    let targetY = 0;

    const apply = () => {
      frame = 0;
      element.style.setProperty("--vt-px", String(targetX));
      element.style.setProperty("--vt-py", String(targetY));
    };

    const onMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      targetX = (event.clientX - rect.left) / rect.width - 0.5;
      targetY = (event.clientY - rect.top) / rect.height - 0.5;
      if (!frame) frame = window.requestAnimationFrame(apply);
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
      if (!frame) frame = window.requestAnimationFrame(apply);
    };

    element.addEventListener("pointermove", onMove);
    element.addEventListener("pointerleave", onLeave);
    return () => {
      element.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerleave", onLeave);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`vt-tilt ${className}`.trim()}
      style={{ "--vt-depth": `${depth}px` } as CSSProperties}
    >
      {children}
    </div>
  );
}

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789✦/·—";

/** Titre cinétique : les lignes montent derrière leur masque, la ligne d'accent se décode caractère par caractère. */
export function KineticTitle({
  lines,
  accentLine,
  scramble,
  className = "",
}: {
  lines: readonly string[];
  accentLine?: number;
  scramble?: string;
  className?: string;
}) {
  const [text, setText] = useState(scramble ?? "");

  useEffect(() => {
    if (!scramble || prefersReducedMotion()) {
      setText(scramble ?? "");
      return;
    }
    const characters = [...scramble];
    let revealed = 0;
    const timer = window.setInterval(() => {
      revealed += 1;
      setText(
        characters
          .map((character, index) => {
            if (index < revealed || character === " ") return character;
            return GLYPHS[(index * 7 + revealed * 3) % GLYPHS.length];
          })
          .join(""),
      );
      if (revealed >= characters.length) window.clearInterval(timer);
    }, 34);
    return () => window.clearInterval(timer);
  }, [scramble]);

  return (
    <>
      <h1 className={`vt-kinetic ${className}`.trim()}>
        {lines.map((line, index) => (
          <span
            key={line}
            className={
              index === accentLine
                ? "text-gradient-flame vt-flicker"
                : "text-ink vt-glow-text"
            }
            style={{ "--vt-delay": `${120 + index * 140}ms` } as CSSProperties}
          >
            {line}
          </span>
        ))}
      </h1>
      {scramble ? (
        <p className="font-display text-lg tracking-[0.3em] text-flame-100 uppercase sm:text-2xl">
          <span aria-hidden="true">{text}</span>
          <span className="sr-only">{scramble}</span>
        </p>
      ) : null}
    </>
  );
}

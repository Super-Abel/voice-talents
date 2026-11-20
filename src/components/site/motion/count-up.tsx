"use client";

import { useEffect, useState } from "react";
import { useReveal } from "./reveal";

/** Valeur finale rendue côté serveur ; le décompte visuel ne se déclenche qu'à l'apparition. */
export function CountUp({
  value,
  duration = 1400,
  suffix = "",
  className = "",
}: {
  value: number;
  duration?: number;
  suffix?: string;
  className?: string;
}) {
  const { ref, shown } = useReveal<HTMLSpanElement>();
  const [displayed, setDisplayed] = useState(value);

  useEffect(() => {
    if (!shown) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayed(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayed(Math.round(value * eased));
      if (progress < 1) frame = window.requestAnimationFrame(step);
    };
    setDisplayed(0);
    frame = window.requestAnimationFrame(step);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [shown, value, duration]);

  return (
    <span ref={ref} className={className}>
      {new Intl.NumberFormat("fr-FR").format(displayed)}
      {suffix}
    </span>
  );
}

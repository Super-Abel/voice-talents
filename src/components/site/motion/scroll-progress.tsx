"use client";

import { useEffect } from "react";

/**
 * Barre de progression de lecture. Les navigateurs qui connaissent `animation-timeline`
 * s'en passent de JavaScript ; les autres reçoivent la valeur via une variable CSS.
 */
export function ScrollProgress() {
  useEffect(() => {
    if (CSS.supports("animation-timeline", "scroll()")) return;
    const bar = document.querySelector<HTMLElement>("[data-vt-progress]");
    if (!bar) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const range = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = range > 0 ? window.scrollY / range : 0;
      bar.style.setProperty("--vt-scroll", ratio.toFixed(4));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      className="vt-progress vt-progress-css"
      data-vt-progress=""
      aria-hidden="true"
    />
  );
}

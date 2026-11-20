"use client";

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

type Revealer = () => void;

let sharedObserver: IntersectionObserver | null = null;
const pending = new WeakMap<Element, Revealer>();

/** Un seul observeur pour toute la page : les sections nombreuses ne multiplient pas les listeners. */
function getObserver(): IntersectionObserver | null {
  if (typeof IntersectionObserver === "undefined") return null;
  sharedObserver ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        pending.get(entry.target)?.();
        pending.delete(entry.target);
        sharedObserver?.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
  );
  return sharedObserver;
}

export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = getObserver();
    if (!observer) {
      setShown(true);
      return;
    }
    pending.set(element, () => setShown(true));
    observer.observe(element);
    return () => {
      pending.delete(element);
      observer.unobserve(element);
    };
  }, []);

  return { ref, shown };
}

/** Enveloppe le contenu et le fait monter à la première apparition. */
export function Reveal({
  children,
  className = "",
  delay = 0,
  y = 28,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const { ref, shown } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      data-vt-in={shown ? "true" : "false"}
      className={`vt-reveal ${className}`.trim()}
      style={
        {
          "--vt-delay": `${delay}ms`,
          "--vt-y": `${y}px`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}

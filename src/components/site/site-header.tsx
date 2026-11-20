"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./logo";

export const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/concours", label: "Le concours" },
  { href: "/inscription", label: "Inscription" },
  { href: "/suivre-mon-dossier", label: "Suivre mon dossier" },
  { href: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  /* L'état « défilé » est écrit en attribut : le header ne se re-render pas à chaque frame. */
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      header.dataset.scrolled = String(window.scrollY > 24);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  /* Le menu se referme dès qu'on change de route. */
  const previousPath = useRef(pathname);
  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onClose = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onClose);
    return () => document.removeEventListener("keydown", onClose);
  }, [menuOpen]);

  return (
    <header
      ref={headerRef}
      data-scrolled="false"
      className="vt-header sticky top-0 z-30"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Logo />
        <nav aria-label="Navigation principale" className="hidden md:block">
          <ul className="flex items-center gap-7 text-sm font-medium">
            {NAV_LINKS.slice(1, -1).map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="vt-nav-link text-muted transition-colors hover:text-ink"
                  data-active={pathname === link.href}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/inscription"
            className="btn-flame hidden sm:inline-flex"
            aria-label="S'inscrire gratuitement au concours"
          >
            S'inscrire
          </Link>
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-md border border-night-700 px-3 text-sm font-medium text-ink md:hidden"
            aria-expanded={menuOpen}
            aria-controls="menu-mobile"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? "Fermer" : "Menu"}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav
          id="menu-mobile"
          aria-label="Navigation mobile"
          className="vt-drawer mx-4 mb-3 rounded-lg border border-night-700 bg-night-950/95 p-2 backdrop-blur"
        >
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-md px-3 py-3 font-medium text-ink hover:bg-night-900"
                  aria-current={pathname === link.href ? "page" : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/concours#reglement"
                className="block rounded-md px-3 py-3 text-sm text-muted hover:bg-night-900"
              >
                Le règlement
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

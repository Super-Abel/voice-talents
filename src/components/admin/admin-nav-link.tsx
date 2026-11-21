"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Lien d'onglet du back-office : le soulignement néon signale l'onglet courant. */
export function AdminNavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const active =
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      data-active={active}
      aria-current={active ? "page" : undefined}
      className="vt-nav-link block rounded-md px-3 py-2 text-muted transition-colors hover:bg-night-800 hover:text-ink"
    >
      {children}
    </Link>
  );
}

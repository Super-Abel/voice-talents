import { Suspense } from "react";
import { AdminNav } from "@/components/admin/admin-nav";

export default function BackOfficeLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <header className="border-b border-night-800 bg-night-900">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3">
          <span className="font-display text-2xl tracking-wide">
            Voice <span className="text-gradient-flame">Talent</span>
            <span className="ml-2 align-middle text-xs font-sans tracking-normal text-muted">
              back-office
            </span>
          </span>
          <Suspense fallback={<div className="h-9 flex-1" />}>
            <AdminNav />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        {children}
      </main>
    </>
  );
}

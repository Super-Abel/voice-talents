import { Suspense } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { Logo } from "@/components/site/logo";

export default function BackOfficeLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <span className="vt-rule block" aria-hidden="true" />
      <header className="border-b border-night-800 bg-night-900">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3">
          <Logo className="h-8" />
          <span className="vt-chip">Back-office</span>
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

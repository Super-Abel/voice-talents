import type { ReactNode } from "react";
import { Logo } from "@/components/site/logo";

export function AuthCard({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-10">
      <Logo className="h-10" />
      <div className="vt-panel w-full max-w-md space-y-5 p-5 sm:p-6">
        <div>
          <p className="vt-chip">Back-office Voice Talent</p>
          <h1 className="vt-kinetic mt-3 text-4xl text-ink">
            <span>{title}</span>
          </h1>
          {intro && <div className="mt-2 text-sm text-muted">{intro}</div>}
        </div>
        {children}
      </div>
    </main>
  );
}

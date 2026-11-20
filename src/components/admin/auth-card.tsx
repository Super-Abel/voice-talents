import type { ReactNode } from "react";

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
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="card w-full max-w-md space-y-5">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-flame-100">
            Back-office Voice Talent
          </p>
          <h1 className="mt-1 font-display text-4xl tracking-wide">{title}</h1>
          {intro && <div className="mt-2 text-sm text-muted">{intro}</div>}
        </div>
        {children}
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import { requireAdmin } from "@/features/admin-auth/access";

export const metadata: Metadata = { title: "Notes du jury" };

export default async function JuryPage() {
  await requireAdmin(["jury", "super_admin"]);
  return (
    <div className="card max-w-xl space-y-2">
      <h1 className="font-display text-4xl tracking-wide">Notes du jury</h1>
      <p className="text-muted">
        La saisie des notes sera disponible avant la première émission du 12
        décembre 2026.
      </p>
    </div>
  );
}

import type { Metadata } from "next";
import { requireAdmin } from "@/features/admin-auth/access";

export const metadata: Metadata = { title: "Contrôle d'entrée" };

export default async function EntryControlPage() {
  await requireAdmin(["controller", "super_admin", "admin"]);
  return (
    <div className="card max-w-xl space-y-2">
      <h1 className="font-display text-4xl tracking-wide">Contrôle d'entrée</h1>
      <p className="text-muted">
        Le scan des billets sera disponible avec l'ouverture de la billetterie
        le 5 décembre 2026.
      </p>
    </div>
  );
}

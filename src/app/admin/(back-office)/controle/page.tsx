import type { Metadata } from "next";
import { requireAdmin } from "@/features/admin-auth/access";
import { getCachedSettings } from "@/features/settings/infrastructure/settings-repository";
import { formatDate } from "@/lib/time";

export const metadata: Metadata = { title: "Contrôle d'entrée" };

export default async function EntryControlPage() {
  await requireAdmin(["controller", "super_admin", "admin"]);
  const settings = await getCachedSettings();
  return (
    <div className="card max-w-xl space-y-2">
      <h1 className="font-display text-4xl tracking-wide">Contrôle d'entrée</h1>
      <p className="text-muted">
        Le scan des billets sera disponible avec l'ouverture de la billetterie
        le {formatDate(settings.launch_ceremony_at)}.
      </p>
    </div>
  );
}

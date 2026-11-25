import { getCachedSettings } from "@/features/settings/infrastructure/settings-repository";
import { LegalPlaceholder } from "./legal-page";

/** Valeur juridique reprise des réglages du back-office ; le marqueur « à compléter » reste tant que le champ est vide. */
export async function LegalContactValue({
  field,
}: {
  field: "email" | "phone" | "address";
}) {
  const { contact } = await getCachedSettings();
  const value = contact[field].trim();
  if (!value) return <LegalPlaceholder />;
  if (field !== "email") return <>{value}</>;
  return (
    <a href={`mailto:${value}`} className="text-flame-100 underline">
      {value}
    </a>
  );
}

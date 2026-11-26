import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ActionForm } from "@/components/admin/action-form";
import { requireAdmin } from "@/features/admin-auth/access";
import { SUPER_ADMIN_ONLY } from "@/features/admin-auth/domain/roles";
import { saveSettings } from "@/features/settings/actions";
import { getFreshSettings } from "@/features/settings/infrastructure/settings-repository";
import { isoToDoualaLocal } from "@/lib/time";

export const metadata: Metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  await requireAdmin(SUPER_ADMIN_ONLY);
  const settings = await getFreshSettings();

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-display text-4xl tracking-wide">Paramètres</h1>
      <p className="text-sm text-muted">
        Toutes les heures sont celles de Douala (UTC+1). Chaque modification est
        tracée dans le journal.
      </p>
      <ActionForm
        action={saveSettings}
        submitLabel="Enregistrer les paramètres"
        pendingLabel="Enregistrement…"
        submitClassName="btn-flame"
        className="space-y-6"
      >
        <Section title="Inscriptions">
          <Field
            label="Ouverture"
            name="registration_opens_at"
            type="datetime-local"
            step={1}
            defaultValue={isoToDoualaLocal(settings.registration_opens_at)}
          />
          <Field
            label="Clôture"
            name="registration_closes_at"
            type="datetime-local"
            step={1}
            defaultValue={isoToDoualaLocal(settings.registration_closes_at)}
          />
          <Field
            label="Casting en ligne"
            name="casting_date"
            type="date"
            defaultValue={settings.casting_date}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Âge minimum"
              name="age_min"
              type="number"
              defaultValue={settings.age_min}
            />
            <Field
              label="Âge maximum"
              name="age_max"
              type="number"
              defaultValue={settings.age_max}
            />
          </div>
        </Section>

        <Section title="Émissions">
          <Field
            label="Cérémonie de lancement"
            name="launch_ceremony_at"
            type="datetime-local"
            step={1}
            defaultValue={isoToDoualaLocal(settings.launch_ceremony_at)}
          />
          <Field
            label="Première émission"
            name="first_episode_at"
            type="datetime-local"
            step={1}
            defaultValue={isoToDoualaLocal(settings.first_episode_at)}
          />
        </Section>

        <Section title="Votes et classements">
          <Field
            label="Prix d'un vote (FCFA)"
            name="vote_price_xaf"
            type="number"
            defaultValue={settings.vote_price_xaf}
          />
          <Select
            label="Affichage public des résultats"
            name="results_display"
            defaultValue={settings.results_display}
            options={[
              ["hidden", "Masqués jusqu'à l'annonce officielle"],
              ["votes", "Nombre de votes"],
              ["percent", "Pourcentage"],
            ]}
          />
          <Select
            label="Qualification (première phase)"
            name="qualification_rule"
            defaultValue={settings.qualification_rule}
            options={[
              ["overall", "Classement général"],
              ["per_event", "Par émission"],
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Qualifiés après la 1re phase"
              name="first_round_qualified"
              type="number"
              defaultValue={settings.first_round_qualified}
            />
            <Field
              label="Finalistes"
              name="finalists"
              type="number"
              defaultValue={settings.finalists}
            />
          </div>
          <label className="flex items-center gap-3 text-sm sm:col-span-2">
            <input
              type="checkbox"
              name="payment_sandbox"
              defaultChecked={settings.payment_sandbox}
              className="size-5 accent-[var(--flame-200)]"
            />
            Paiements en mode test (sandbox)
          </label>
        </Section>

        <Section title="Récompense">
          <Field
            label="Montant (FCFA)"
            name="prize_amount_xaf"
            type="number"
            defaultValue={settings.prize.amount_xaf}
          />
          <Field
            label="Autres lots"
            name="prize_other"
            defaultValue={settings.prize.other}
          />
        </Section>

        <Section title="Contact public">
          <Field
            label="E-mail"
            name="contact_email"
            type="email"
            defaultValue={settings.contact.email}
          />
          <Field
            label="Téléphone"
            name="contact_phone"
            defaultValue={settings.contact.phone}
          />
          <Field
            label="WhatsApp"
            name="contact_whatsapp"
            defaultValue={settings.contact.whatsapp}
          />
          <Field
            label="Adresse"
            name="contact_address"
            defaultValue={settings.contact.address}
          />
        </Section>
      </ActionForm>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="card grid gap-4 sm:grid-cols-2">
      <legend className="px-1 font-display text-2xl tracking-wide">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  name,
  ...rest
}: {
  label: string;
  name: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label}
      </label>
      <input id={name} name={name} className="field-input" {...rest} />
    </div>
  );
}

function Select({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: [string, string][];
}) {
  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="field-input"
      >
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );
}

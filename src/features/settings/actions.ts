"use server";

import { z } from "zod";
import { requireAdmin } from "@/features/admin-auth/access";
import { SUPER_ADMIN_ONLY } from "@/features/admin-auth/domain/roles";
import { currentClientIp } from "@/lib/server/request";
import { doualaLocalToIso } from "@/lib/time";
import type { SiteSettings } from "./domain/site-settings";
import { updateSettings } from "./infrastructure/settings-repository";

type FormState = { error?: string; success?: string };

const text = (max: number) => z.string().trim().max(max);
const int = (min: number, max: number) =>
  z.coerce.number().int().min(min).max(max);

const formSchema = z.object({
  registration_opens_at: z.string(),
  registration_closes_at: z.string(),
  casting_date: z.iso.date(),
  launch_ceremony_at: z.string(),
  first_episode_at: z.string(),
  age_min: int(10, 99),
  age_max: int(10, 99),
  vote_price_xaf: int(1, 100_000),
  results_display: z.enum(["votes", "percent", "hidden"]),
  qualification_rule: z.enum(["overall", "per_event"]),
  first_round_qualified: int(1, 40),
  finalists: int(1, 40),
  payment_sandbox: z.boolean(),
  prize_amount_xaf: int(0, 1_000_000_000),
  prize_other: text(300),
  contact_email: text(160),
  contact_phone: text(40),
  contact_whatsapp: text(40),
  contact_address: text(200),
});

export async function saveSettings(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireAdmin(SUPER_ADMIN_ONLY);
  const raw = Object.fromEntries(formData);
  const parsed = formSchema.safeParse({
    ...raw,
    payment_sandbox: formData.get("payment_sandbox") === "on",
  });
  if (!parsed.success)
    return {
      error: "Certains champs sont invalides. Vérifiez les valeurs saisies.",
    };
  const input = parsed.data;

  const opensAt = doualaLocalToIso(input.registration_opens_at);
  const closesAt = doualaLocalToIso(input.registration_closes_at);
  const launchAt = doualaLocalToIso(input.launch_ceremony_at);
  const firstEpisodeAt = doualaLocalToIso(input.first_episode_at);
  if (!opensAt || !closesAt || !launchAt || !firstEpisodeAt)
    return { error: "Dates d'inscription ou d'émission invalides." };
  if (opensAt >= closesAt)
    return { error: "La clôture doit être postérieure à l'ouverture." };
  if (launchAt >= firstEpisodeAt)
    return {
      error: "La première émission doit suivre la cérémonie de lancement.",
    };
  if (input.age_min > input.age_max)
    return { error: "L'âge minimum dépasse l'âge maximum." };

  const values: Partial<SiteSettings> = {
    registration_opens_at: opensAt,
    registration_closes_at: closesAt,
    casting_date: input.casting_date,
    launch_ceremony_at: launchAt,
    first_episode_at: firstEpisodeAt,
    age_min: input.age_min,
    age_max: input.age_max,
    vote_price_xaf: input.vote_price_xaf,
    results_display: input.results_display,
    qualification_rule: input.qualification_rule,
    first_round_qualified: input.first_round_qualified,
    finalists: input.finalists,
    payment_sandbox: input.payment_sandbox,
    prize: { amount_xaf: input.prize_amount_xaf, other: input.prize_other },
    contact: {
      email: input.contact_email,
      phone: input.contact_phone,
      whatsapp: input.contact_whatsapp,
      address: input.contact_address,
    },
  };

  const changed = await updateSettings(
    values,
    session.user.id,
    await currentClientIp(),
  );
  return {
    success:
      changed === 0
        ? "Aucune modification."
        : `${changed} paramètre${changed > 1 ? "s" : ""} enregistré${changed > 1 ? "s" : ""}.`,
  };
}

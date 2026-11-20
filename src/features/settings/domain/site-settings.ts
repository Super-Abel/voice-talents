import { z } from "zod";

const sponsorSchema = z.object({
  name: z.string(),
  logoUrl: z.string().optional(),
  url: z.string().optional(),
});

export const siteSettingsSchema = z.object({
  registration_opens_at: z.iso.datetime({ offset: true }),
  registration_closes_at: z.iso.datetime({ offset: true }),
  casting_date: z.iso.date(),
  age_min: z.number().int(),
  age_max: z.number().int(),
  vote_price_xaf: z.number().int().positive(),
  results_display: z.enum(["votes", "percent", "hidden"]),
  qualification_rule: z.enum(["overall", "per_event"]),
  first_round_qualified: z.number().int().positive(),
  finalists: z.number().int().positive(),
  payment_sandbox: z.boolean(),
  prize: z.object({
    amount_xaf: z.number().int().nonnegative(),
    other: z.string(),
  }),
  contact: z.object({
    email: z.string(),
    phone: z.string(),
    whatsapp: z.string(),
    address: z.string(),
  }),
  sponsors: z.array(sponsorSchema),
  site_texts: z.record(z.string(), z.string()),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;
export type SettingKey = keyof SiteSettings;

export function parseSiteSettings(
  rows: { key: string; value: unknown }[],
): SiteSettings {
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return siteSettingsSchema.parse(map);
}

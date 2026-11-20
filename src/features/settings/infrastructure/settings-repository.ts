import "server-only";
import { cacheLife, cacheTag, updateTag } from "next/cache";
import { db } from "@/lib/server/db";
import { parseSiteSettings, type SiteSettings } from "../domain/site-settings";

export const SETTINGS_CACHE_TAG = "settings";

async function loadSettings(): Promise<SiteSettings> {
  const { data, error } = await db().from("settings").select("key, value");
  if (error) throw error;
  return parseSiteSettings(data);
}

/** Pour l'affichage : en cache, invalidé à chaque modification. */
export async function getCachedSettings(): Promise<SiteSettings> {
  "use cache";
  cacheTag(SETTINGS_CACHE_TAG);
  cacheLife("minutes");
  return loadSettings();
}

/** Pour les contrôles (ouverture des inscriptions…) : toujours lu en base. */
export async function getFreshSettings(): Promise<SiteSettings> {
  return loadSettings();
}

export async function updateSettings(
  values: Partial<SiteSettings>,
  actorId: string,
  ip: string | null,
): Promise<number> {
  const { data, error } = await db().rpc("admin_update_settings", {
    p_values: values,
    p_actor: actorId,
    p_ip: ip,
  });
  if (error) throw error;
  updateTag(SETTINGS_CACHE_TAG);
  return data as number;
}

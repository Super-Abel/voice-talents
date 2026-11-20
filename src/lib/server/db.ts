import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "./env";

let client: SupabaseClient | undefined;

// Clé service role : contourne la RLS, ne doit jamais quitter le serveur.
export function db(): SupabaseClient {
  if (!client) {
    const env = serverEnv();
    client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export const CANDIDATE_FILES_BUCKET = "candidate-files";

export function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}

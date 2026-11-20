import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { serverEnv } from "./env";

export function clientIpFrom(requestHeaders: Headers): string | null {
  const forwarded = requestHeaders
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  return forwarded || requestHeaders.get("x-real-ip") || null;
}

export async function currentClientIp(): Promise<string | null> {
  return clientIpFrom(await headers());
}

/** Empreinte non réversible (IP, téléphone) pour les compteurs : aucune donnée personnelle en clair. */
export function fingerprint(value: string): string {
  return createHmac("sha256", serverEnv().APP_AUTH_SECRET)
    .update(value)
    .digest("base64url")
    .slice(0, 32);
}

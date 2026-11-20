import "server-only";
import { db } from "./db";
import { fingerprint } from "./request";

export async function allowRequest(
  scope: string,
  identifier: string | null,
  max: number,
  windowSeconds: number,
): Promise<boolean> {
  const bucket = `${scope}:${fingerprint(identifier ?? "unknown")}`;
  const { data, error } = await db().rpc("hit_rate_limit", {
    p_bucket: bucket,
    p_window_seconds: windowSeconds,
    p_max: max,
  });
  if (error) throw error;
  return data === true;
}

import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/server/db";
import type { AdminRole } from "../domain/roles";

const IS_PRODUCTION = process.env.NODE_ENV === "production";
// __Host- : cookie limité au domaine exact, en HTTPS, chemin /.
export const SESSION_COOKIE = IS_PRODUCTION ? "__Host-vt_admin" : "vt_admin";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000;
const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

export type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
  mustChangePassword: boolean;
  totpEnabled: boolean;
  isActive: boolean;
};

export type AdminSession = {
  id: string;
  mfaVerified: boolean;
  user: AdminUser;
};

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export async function createSession(
  userId: string,
  mfaVerified: boolean,
  ip: string | null,
  userAgent: string | null,
): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const { error } = await db()
    .from("sessions")
    .insert({
      id: hashToken(token),
      user_id: userId,
      mfa_verified: mfaVerified,
      ip,
      user_agent: userAgent?.slice(0, 300) ?? null,
      expires_at: expiresAt.toISOString(),
    });
  if (error) throw error;
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function readSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const { data, error } = await db()
    .from("sessions")
    .select(
      "id, mfa_verified, expires_at, last_seen_at, admin_users!inner(id, email, display_name, role, must_change_password, totp_enabled_at, is_active)",
    )
    .eq("id", hashToken(token))
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const now = Date.now();
  const lastSeen = new Date(data.last_seen_at).getTime();
  const user = data.admin_users as unknown as {
    id: string;
    email: string;
    display_name: string;
    role: AdminRole;
    must_change_password: boolean;
    totp_enabled_at: string | null;
    is_active: boolean;
  };
  if (
    new Date(data.expires_at).getTime() <= now ||
    now - lastSeen > IDLE_TIMEOUT_MS ||
    !user.is_active
  ) {
    await db().from("sessions").delete().eq("id", data.id);
    return null;
  }
  if (now - lastSeen > TOUCH_INTERVAL_MS) {
    await db()
      .from("sessions")
      .update({ last_seen_at: new Date(now).toISOString() })
      .eq("id", data.id);
  }
  return {
    id: data.id,
    mfaVerified: data.mfa_verified,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
      mustChangePassword: user.must_change_password,
      totpEnabled: Boolean(user.totp_enabled_at),
      isActive: user.is_active,
    },
  };
}

export async function markSessionMfaVerified(sessionId: string): Promise<void> {
  const { error } = await db()
    .from("sessions")
    .update({ mfa_verified: true })
    .eq("id", sessionId);
  if (error) throw error;
}

export async function destroyCurrentSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db().from("sessions").delete().eq("id", hashToken(token));
  store.delete(SESSION_COOKIE);
}

export async function destroyUserSessions(
  userId: string,
  exceptSessionId?: string,
): Promise<void> {
  let query = db().from("sessions").delete().eq("user_id", userId);
  if (exceptSessionId) query = query.neq("id", exceptSessionId);
  const { error } = await query;
  if (error) throw error;
}

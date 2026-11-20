import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import {
  type AdminRole,
  BACK_OFFICE_ROLES,
  homePathFor,
  ROLES_REQUIRING_TOTP,
} from "./domain/roles";
import { type AdminSession, readSession } from "./infrastructure/session-store";

export type PendingStep = "totp_verify" | "password" | "totp_enroll";

export const PENDING_STEP_PATHS: Record<PendingStep, string> = {
  totp_verify: "/admin/connexion/verification",
  password: "/admin/securite/mot-de-passe",
  totp_enroll: "/admin/securite/double-authentification",
};

export const getAdminSession = cache(readSession);

export function pendingStepOf(session: AdminSession): PendingStep | null {
  if (session.user.totpEnabled && !session.mfaVerified) return "totp_verify";
  if (session.user.mustChangePassword) return "password";
  if (
    !session.user.totpEnabled &&
    ROLES_REQUIRING_TOTP.includes(session.user.role)
  )
    return "totp_enroll";
  return null;
}

/**
 * À appeler dans CHAQUE page, server action et route du back-office :
 * le layout ne protège pas les actions.
 */
export async function requireAdmin(
  roles: readonly AdminRole[] = BACK_OFFICE_ROLES,
  options: { during?: PendingStep } = {},
): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/connexion");

  const pending = pendingStepOf(session);
  if (options.during) {
    if (pending !== options.during)
      redirect(
        pending ? PENDING_STEP_PATHS[pending] : homePathFor(session.user.role),
      );
    return session;
  }
  if (pending) redirect(PENDING_STEP_PATHS[pending]);
  if (!roles.includes(session.user.role))
    redirect(homePathFor(session.user.role));
  return session;
}

/** Variante pour les routes API : pas de redirection, null si refusé. */
export async function authorizeAdmin(
  roles: readonly AdminRole[] = BACK_OFFICE_ROLES,
): Promise<AdminSession | null> {
  const session = await getAdminSession();
  if (!session || pendingStepOf(session) || !roles.includes(session.user.role))
    return null;
  return session;
}

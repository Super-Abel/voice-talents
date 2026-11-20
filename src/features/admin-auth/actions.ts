"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAudit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";
import { allowRequest } from "@/lib/server/rate-limit";
import { currentClientIp } from "@/lib/server/request";
import { PENDING_STEP_PATHS, pendingStepOf, requireAdmin } from "./access";
import { passwordProblem } from "./domain/password-policy";
import { homePathFor } from "./domain/roles";
import {
  burnPasswordCheck,
  hashPassword,
  verifyPassword,
} from "./infrastructure/password-hasher";
import {
  createSession,
  destroyCurrentSession,
  destroyUserSessions,
  markSessionMfaVerified,
  readSession,
} from "./infrastructure/session-store";
import { decryptTotpSecret, matchTotp } from "./infrastructure/totp";

export type FormState = { error?: string; success?: string };

const INVALID_CREDENTIALS = "E-mail ou mot de passe incorrect.";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(200),
});

export async function login(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const ip = await currentClientIp();
  if (!(await allowRequest("admin-login", ip, 20, 900))) {
    return { error: "Trop de tentatives. Réessayez dans 15 minutes." };
  }
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: INVALID_CREDENTIALS };
  const { email, password } = parsed.data;

  const { data: user, error } = await db()
    .from("admin_users")
    .select("id, email, role, password_hash, is_active, locked_until")
    .eq("email", email)
    .maybeSingle();
  if (error) throw error;

  if (!user || !user.is_active) {
    await burnPasswordCheck(password);
    return { error: INVALID_CREDENTIALS };
  }
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    return {
      error:
        "Compte temporairement verrouillé après plusieurs échecs. Réessayez dans 15 minutes.",
    };
  }

  if (!(await verifyPassword(user.password_hash, password))) {
    const { data: locked } = await db().rpc("register_login_failure", {
      p_user: user.id,
    });
    await writeAudit({
      actor: null,
      action: locked ? "auth.account_locked" : "auth.login_failed",
      entity: "admin_user",
      entityId: user.id,
      ip,
    });
    return {
      error: locked
        ? "Trop d'échecs : compte verrouillé pendant 15 minutes."
        : INVALID_CREDENTIALS,
    };
  }

  await db()
    .from("admin_users")
    .update({
      failed_attempts: 0,
      locked_until: null,
      last_login_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  const requestHeaders = await headers();
  await createSession(user.id, false, ip, requestHeaders.get("user-agent"));
  await writeAudit({
    actor: { id: user.id, email: user.email },
    action: "auth.login",
    entity: "admin_user",
    entityId: user.id,
    ip,
  });

  const session = await readSession();
  const pending = session ? pendingStepOf(session) : null;
  redirect(pending ? PENDING_STEP_PATHS[pending] : homePathFor(user.role));
}

export async function verifyTotpCode(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireAdmin(undefined, { during: "totp_verify" });
  if (!(await allowRequest("admin-totp", session.user.id, 6, 300))) {
    return { error: "Trop de codes erronés. Patientez 5 minutes." };
  }
  const { data, error } = await db()
    .from("admin_users")
    .select("totp_secret_enc")
    .eq("id", session.user.id)
    .single();
  if (error) throw error;
  const step = data.totp_secret_enc
    ? matchTotp(
        decryptTotpSecret(data.totp_secret_enc),
        String(formData.get("code") ?? ""),
      )
    : null;
  if (step === null) return { error: "Code incorrect." };
  const { data: fresh } = await db().rpc("consume_totp_step", {
    p_user: session.user.id,
    p_step: step,
  });
  if (!fresh)
    return { error: "Ce code a déjà été utilisé. Attendez le suivant." };

  await markSessionMfaVerified(session.id);
  await writeAudit({
    actor: session.user,
    action: "auth.mfa_verified",
    entity: "admin_user",
    entityId: session.user.id,
    ip: await currentClientIp(),
  });
  redirect(
    session.user.mustChangePassword
      ? PENDING_STEP_PATHS.password
      : homePathFor(session.user.role),
  );
}

export async function confirmTotpEnrollment(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireAdmin(undefined, { during: "totp_enroll" });
  if (!(await allowRequest("admin-totp", session.user.id, 6, 300))) {
    return { error: "Trop de codes erronés. Patientez 5 minutes." };
  }
  const { data, error } = await db()
    .from("admin_users")
    .select("totp_secret_enc")
    .eq("id", session.user.id)
    .single();
  if (error) throw error;
  if (!data.totp_secret_enc)
    return { error: "Rechargez la page pour générer un nouveau QR code." };
  const step = matchTotp(
    decryptTotpSecret(data.totp_secret_enc),
    String(formData.get("code") ?? ""),
  );
  if (step === null)
    return { error: "Code incorrect. Vérifiez l'heure de votre téléphone." };

  const { error: updateError } = await db()
    .from("admin_users")
    .update({ totp_enabled_at: new Date().toISOString(), totp_last_step: step })
    .eq("id", session.user.id);
  if (updateError) throw updateError;
  await markSessionMfaVerified(session.id);
  await destroyUserSessions(session.user.id, session.id);
  await writeAudit({
    actor: session.user,
    action: "auth.mfa_enrolled",
    entity: "admin_user",
    entityId: session.user.id,
    ip: await currentClientIp(),
  });
  redirect(homePathFor(session.user.role));
}

export async function changePassword(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await getSessionForPasswordChange();
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  if (next !== String(formData.get("confirmPassword") ?? ""))
    return { error: "Les deux mots de passe ne correspondent pas." };
  const problem = passwordProblem(next, session.user.email);
  if (problem) return { error: problem };
  if (current === next)
    return { error: "Choisissez un mot de passe différent de l'actuel." };

  const { data, error } = await db()
    .from("admin_users")
    .select("password_hash")
    .eq("id", session.user.id)
    .single();
  if (error) throw error;
  if (!(await verifyPassword(data.password_hash, current)))
    return { error: "Mot de passe actuel incorrect." };

  const { error: updateError } = await db()
    .from("admin_users")
    .update({
      password_hash: await hashPassword(next),
      must_change_password: false,
    })
    .eq("id", session.user.id);
  if (updateError) throw updateError;
  await destroyUserSessions(session.user.id, session.id);
  await writeAudit({
    actor: session.user,
    action: "auth.password_changed",
    entity: "admin_user",
    entityId: session.user.id,
    ip: await currentClientIp(),
  });

  const refreshed = await readSession();
  const pending = refreshed ? pendingStepOf(refreshed) : null;
  if (pending) redirect(PENDING_STEP_PATHS[pending]);
  return { success: "Mot de passe modifié." };
}

async function getSessionForPasswordChange() {
  const session = await readSession();
  if (!session) redirect("/admin/connexion");
  const pending = pendingStepOf(session);
  if (pending === "password") return session;
  return requireAdmin(["super_admin", "admin", "jury", "controller"]);
}

export async function logout(): Promise<void> {
  const session = await readSession();
  await destroyCurrentSession();
  if (session) {
    await writeAudit({
      actor: session.user,
      action: "auth.logout",
      entity: "admin_user",
      entityId: session.user.id,
      ip: await currentClientIp(),
    });
  }
  redirect("/admin/connexion");
}

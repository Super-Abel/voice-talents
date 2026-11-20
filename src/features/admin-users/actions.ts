"use server";

import { z } from "zod";
import { requireAdmin } from "@/features/admin-auth/access";
import {
  ADMIN_ROLES,
  SUPER_ADMIN_ONLY,
} from "@/features/admin-auth/domain/roles";
import {
  generateTemporaryPassword,
  hashPassword,
} from "@/features/admin-auth/infrastructure/password-hasher";
import { destroyUserSessions } from "@/features/admin-auth/infrastructure/session-store";
import { writeAudit } from "@/lib/server/audit";
import { db, isUniqueViolation } from "@/lib/server/db";
import { currentClientIp } from "@/lib/server/request";

export type UserFormState = {
  error?: string;
  success?: string;
  temporaryPassword?: string;
};

const createSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  displayName: z.string().trim().min(1).max(80),
  role: z.enum(ADMIN_ROLES),
});

export async function createAdminUser(
  _state: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const session = await requireAdmin(SUPER_ADMIN_ONLY);
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "E-mail, nom et rôle sont requis." };

  const temporaryPassword = generateTemporaryPassword();
  const { data, error } = await db()
    .from("admin_users")
    .insert({
      email: parsed.data.email,
      display_name: parsed.data.displayName,
      role: parsed.data.role,
      password_hash: await hashPassword(temporaryPassword),
      must_change_password: true,
    })
    .select("id")
    .single();
  if (isUniqueViolation(error))
    return { error: "Un compte existe déjà avec cet e-mail." };
  if (error) throw error;

  await writeAudit({
    actor: session.user,
    action: "admin_user.created",
    entity: "admin_user",
    entityId: data.id,
    after: { email: parsed.data.email, role: parsed.data.role },
    ip: await currentClientIp(),
  });
  return {
    success: `Compte créé pour ${parsed.data.email}. Transmettez ce mot de passe temporaire par un canal sûr : il ne sera plus affiché.`,
    temporaryPassword,
  };
}

const targetSchema = z.object({
  userId: z.uuid(),
  operation: z.enum([
    "deactivate",
    "reactivate",
    "reset_mfa",
    "reset_password",
  ]),
});

export async function manageAdminUser(
  _state: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const session = await requireAdmin(SUPER_ADMIN_ONLY);
  const parsed = targetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Opération invalide." };
  const { userId, operation } = parsed.data;
  if (userId === session.user.id && operation !== "reset_password") {
    return {
      error:
        "Vous ne pouvez pas appliquer cette opération à votre propre compte.",
    };
  }

  let temporaryPassword: string | undefined;
  const update: Record<string, unknown> =
    operation === "deactivate"
      ? { is_active: false }
      : operation === "reactivate"
        ? { is_active: true, failed_attempts: 0, locked_until: null }
        : operation === "reset_mfa"
          ? {
              totp_secret_enc: null,
              totp_enabled_at: null,
              totp_last_step: null,
            }
          : {};
  if (operation === "reset_password") {
    temporaryPassword = generateTemporaryPassword();
    Object.assign(update, {
      password_hash: await hashPassword(temporaryPassword),
      must_change_password: true,
      failed_attempts: 0,
      locked_until: null,
    });
  }

  const { data, error } = await db()
    .from("admin_users")
    .update(update)
    .eq("id", userId)
    .select("email")
    .single();
  if (error) throw error;
  if (operation !== "reactivate") await destroyUserSessions(userId);

  const actions = {
    deactivate: "admin_user.deactivated",
    reactivate: "admin_user.reactivated",
    reset_mfa: "admin_user.mfa_reset",
    reset_password: "admin_user.password_reset",
  } as const;
  await writeAudit({
    actor: session.user,
    action: actions[operation],
    entity: "admin_user",
    entityId: userId,
    ip: await currentClientIp(),
  });

  const messages = {
    deactivate: `Compte ${data.email} désactivé.`,
    reactivate: `Compte ${data.email} réactivé.`,
    reset_mfa: `2FA réinitialisée pour ${data.email} : une nouvelle activation sera demandée à la prochaine connexion.`,
    reset_password: `Nouveau mot de passe temporaire pour ${data.email} (affiché une seule fois) :`,
  };
  return { success: messages[operation], temporaryPassword };
}

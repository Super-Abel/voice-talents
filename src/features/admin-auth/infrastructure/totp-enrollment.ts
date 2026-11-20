import "server-only";
import { db } from "@/lib/server/db";
import {
  decryptTotpSecret,
  encryptTotpSecret,
  generateTotpSecret,
  totpEnrollmentQr,
} from "./totp";

/** Secret en attente de confirmation : réutilisé tant que la 2FA n'est pas activée. */
export async function pendingTotpEnrollment(userId: string, email: string) {
  const { data, error } = await db()
    .from("admin_users")
    .select("totp_secret_enc, totp_enabled_at")
    .eq("id", userId)
    .single();
  if (error) throw error;
  if (data.totp_enabled_at) throw new Error("totp_already_enabled");

  let secret = data.totp_secret_enc
    ? decryptTotpSecret(data.totp_secret_enc)
    : null;
  if (!secret) {
    secret = generateTotpSecret();
    const { error: updateError } = await db()
      .from("admin_users")
      .update({
        totp_secret_enc: encryptTotpSecret(secret),
        totp_last_step: null,
      })
      .eq("id", userId)
      .is("totp_enabled_at", null);
    if (updateError) throw updateError;
  }
  const { qrDataUrl } = await totpEnrollmentQr(secret, email);
  return { qrDataUrl, manualKey: secret.replace(/(.{4})/g, "$1 ").trim() };
}

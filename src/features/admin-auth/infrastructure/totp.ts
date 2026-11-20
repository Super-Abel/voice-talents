import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from "node:crypto";
import { Secret, TOTP } from "otpauth";
import QRCode from "qrcode";
import { serverEnv } from "@/lib/server/env";

const ISSUER = "Voice Talent Admin";
const PERIOD_SECONDS = 30;

function encryptionKey(): Buffer {
  return Buffer.from(
    hkdfSync(
      "sha256",
      serverEnv().APP_AUTH_SECRET,
      "voice-talent",
      "totp-secret",
      32,
    ),
  );
}

export function encryptTotpSecret(base32: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(base32, "utf8"),
    cipher.final(),
  ]);
  return [iv, cipher.getAuthTag(), encrypted]
    .map((part) => part.toString("base64url"))
    .join(".");
}

export function decryptTotpSecret(payload: string): string {
  const [iv, tag, encrypted] = payload
    .split(".")
    .map((part) => Buffer.from(part, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    "utf8",
  );
}

function totpFor(base32: string, label: string): TOTP {
  return new TOTP({
    issuer: ISSUER,
    label,
    algorithm: "SHA1",
    digits: 6,
    period: PERIOD_SECONDS,
    secret: Secret.fromBase32(base32),
  });
}

export function generateTotpSecret(): string {
  return new Secret({ size: 20 }).base32;
}

export async function totpEnrollmentQr(
  base32: string,
  label: string,
): Promise<{ qrDataUrl: string; uri: string }> {
  const uri = totpFor(base32, label).toString();
  return {
    uri,
    qrDataUrl: await QRCode.toDataURL(uri, { margin: 1, width: 240 }),
  };
}

/** Retourne le pas de temps du code valide (pour l'anti-rejeu), ou null. */
export function matchTotp(
  base32: string,
  code: string,
  now = Date.now(),
): number | null {
  const token = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(token)) return null;
  const delta = totpFor(base32, "check").validate({
    token,
    timestamp: now,
    window: 1,
  });
  if (delta === null) return null;
  return Math.floor(now / 1000 / PERIOD_SECONDS) + delta;
}

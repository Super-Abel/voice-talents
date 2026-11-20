import "server-only";
import { randomBytes, randomInt } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";

// Argon2id, paramètres OWASP (19 Mio, 2 passes).
const OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS);
}

export async function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

let dummyHash: Promise<string> | undefined;

/** Vérification factice pour un e-mail inconnu : même durée de réponse qu'un compte existant. */
export async function burnPasswordCheck(password: string): Promise<void> {
  dummyHash ??= hashPassword(randomBytes(16).toString("hex"));
  await verifyPassword(await dummyHash, password);
}

/** Mot de passe temporaire lisible (sans caractères ambigus). */
export function generateTemporaryPassword(): string {
  const letters = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";
  const digits = "23456789";
  const pick = (alphabet: string) => alphabet[randomInt(alphabet.length)];
  const group = () =>
    Array.from({ length: 4 }, () => pick(letters + digits)).join("");
  return `${group()}-${group()}-${group()}-${pick(letters)}${pick(digits)}`;
}

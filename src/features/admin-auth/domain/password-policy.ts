export const PASSWORD_MIN_LENGTH = 12;

export function passwordProblem(
  password: string,
  email: string,
): string | null {
  if (password.length < PASSWORD_MIN_LENGTH)
    return `Au moins ${PASSWORD_MIN_LENGTH} caractères.`;
  if (password.length > 128) return "128 caractères maximum.";
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password))
    return "Mélangez lettres et chiffres.";
  const localPart = email.split("@")[0]?.toLowerCase();
  if (
    localPart &&
    localPart.length >= 4 &&
    password.toLowerCase().includes(localPart)
  ) {
    return "Le mot de passe ne doit pas contenir votre identifiant.";
  }
  if (
    /^(.)\1+$/.test(password) ||
    /^(?:0123456789|azertyuiop|qwertyuiop|motdepasse|password)/i.test(password)
  ) {
    return "Mot de passe trop prévisible.";
  }
  return null;
}

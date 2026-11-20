export type RegistrationPhase = "upcoming" | "open" | "closed";

const ONE_SECOND = 1000;

/** La clôture est inclusive : 23:59:59 reste ouvert jusqu'à la fin de cette seconde. */
export function registrationPhase(
  now: Date,
  opensAt: Date,
  closesAt: Date,
): RegistrationPhase {
  if (now.getTime() < opensAt.getTime()) return "upcoming";
  if (now.getTime() >= closesAt.getTime() + ONE_SECOND) return "closed";
  return "open";
}

export const REGISTRATION_CLOSED_MESSAGES: Record<
  Exclude<RegistrationPhase, "open">,
  string
> = {
  upcoming: "Les inscriptions ne sont pas encore ouvertes.",
  closed: "Les inscriptions sont closes.",
};

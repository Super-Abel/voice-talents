/** Âge en années révolues à une date de référence (dates YYYY-MM-DD). */
export function ageOn(birthDate: string, referenceDate: string): number {
  const [birthYear, birthMonth, birthDay] = birthDate.split("-").map(Number);
  const [refYear, refMonth, refDay] = referenceDate.split("-").map(Number);
  let age = refYear - birthYear;
  if (refMonth < birthMonth || (refMonth === birthMonth && refDay < birthDay))
    age -= 1;
  return age;
}

export function isAgeEligible(
  birthDate: string,
  referenceDate: string,
  minAge: number,
  maxAge: number,
): boolean {
  const age = ageOn(birthDate, referenceDate);
  return age >= minAge && age <= maxAge;
}

/** Bornes de dates de naissance admises, pour le champ date du formulaire. */
export function birthDateBounds(
  referenceDate: string,
  minAge: number,
  maxAge: number,
): { min: string; max: string } {
  const [year, month, day] = referenceDate.split("-").map(Number);
  const pad = (value: number) => String(value).padStart(2, "0");
  const max = `${year - minAge}-${pad(month)}-${pad(day)}`;
  const earliest = new Date(Date.UTC(year - maxAge - 1, month - 1, day + 1));
  return { min: earliest.toISOString().slice(0, 10), max };
}

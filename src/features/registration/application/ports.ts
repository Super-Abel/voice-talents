import type { Registration } from "../domain/registration-schema";

export type RegistrationPolicy = {
  opensAt: Date;
  closesAt: Date;
  ageMin: number;
  ageMax: number;
};

/**
 * Le backend garde la main sur les fichiers, l'unicité et l'enregistrement :
 * il rend soit un numéro de dossier, soit le motif à afficher au candidat.
 */
export type SubmitOutcome =
  | { ok: true; dossierNo: string }
  | { ok: false; message: string; fieldErrors: Record<string, string> };

export interface RegistrationPorts {
  now(): Date;
  loadPolicy(): Promise<RegistrationPolicy>;
  submit(registration: Registration): Promise<SubmitOutcome>;
}

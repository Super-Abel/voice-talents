import "server-only";
import { getFreshSettings } from "@/features/settings/infrastructure/settings-repository";
import {
  BackendError,
  submitRegistrationToBackend,
} from "@/lib/server/backend";
import type { RegistrationPorts, SubmitOutcome } from "../application/ports";

export const backendRegistrationPorts: RegistrationPorts = {
  now: () => new Date(),

  async loadPolicy() {
    const settings = await getFreshSettings();
    return {
      opensAt: new Date(settings.registration_opens_at),
      closesAt: new Date(settings.registration_closes_at),
      ageMin: settings.age_min,
      ageMax: settings.age_max,
    };
  },

  /**
   * Un refus 4xx du backend est une information pour le candidat : elle
   * revient en message global plus les champs à corriger. Une panne réseau ou
   * une 5xx remonte à la route.
   */
  async submit(registration): Promise<SubmitOutcome> {
    try {
      const { dossierNo } = await submitRegistrationToBackend(
        registration as unknown as Record<string, unknown>,
      );
      return { ok: true, dossierNo };
    } catch (error) {
      if (error instanceof BackendError && error.isClientError)
        return {
          ok: false,
          message: error.message,
          fieldErrors: error.fieldErrors,
        };
      throw error;
    }
  },
};

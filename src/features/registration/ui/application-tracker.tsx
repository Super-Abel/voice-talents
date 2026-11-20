"use client";

import { useState } from "react";
import {
  CANDIDATE_STATUS_DESCRIPTIONS,
  CANDIDATE_STATUS_LABELS,
  type CandidateStatus,
} from "../domain/candidate-status";

type TrackedApplication = {
  dossierNo: string;
  firstName: string;
  status: CandidateStatus;
  submittedAt: string;
};

export function ApplicationTracker() {
  const [result, setResult] = useState<TrackedApplication>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function lookup(formData: FormData) {
    setLoading(true);
    setError(undefined);
    setResult(undefined);
    try {
      const response = await fetch("/api/registration/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dossierNo: formData.get("dossierNo"),
          phone: formData.get("phone"),
        }),
      });
      const payload = await response.json();
      if (response.ok) setResult(payload as TrackedApplication);
      else
        setError(
          (payload as { error?: string }).error ?? "Recherche impossible.",
        );
    } catch {
      setError("Connexion interrompue. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form action={lookup} className="card space-y-4">
        <div>
          <label htmlFor="dossierNo" className="field-label">
            Numéro de dossier
          </label>
          <input
            id="dossierNo"
            name="dossierNo"
            required
            placeholder="VT-2026-0001"
            autoCapitalize="characters"
            className="field-input uppercase"
          />
        </div>
        <div>
          <label htmlFor="phone" className="field-label">
            Téléphone utilisé à l'inscription
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            required
            placeholder="6 71 23 45 67"
            className="field-input"
          />
        </div>
        <button type="submit" className="btn-flame w-full" disabled={loading}>
          {loading ? "Recherche…" : "Voir mon dossier"}
        </button>
      </form>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-danger/50 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      )}

      {result && (
        <section className="card space-y-2" aria-live="polite">
          <p className="text-sm text-muted">Dossier {result.dossierNo}</p>
          <p className="font-display text-3xl tracking-wide">
            {CANDIDATE_STATUS_LABELS[result.status]}
          </p>
          <p>
            {result.firstName},{" "}
            {CANDIDATE_STATUS_DESCRIPTIONS[result.status]
              .charAt(0)
              .toLowerCase()}
            {CANDIDATE_STATUS_DESCRIPTIONS[result.status].slice(1)}
          </p>
        </section>
      )}
    </div>
  );
}

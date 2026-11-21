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

/* Rail des 4 étapes ; « rejected » s'affiche hors rail, sans case. */
const TRACK: { status: CandidateStatus; label: string }[] = [
  { status: "received", label: "Reçu" },
  { status: "under_review", label: "Examen" },
  { status: "shortlisted", label: "Casting" },
  { status: "selected", label: "Retenu" },
];

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
      <form action={lookup} className="vt-panel space-y-4 p-5">
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

      {result ? <ResultCard result={result} /> : null}
    </div>
  );
}

function ResultCard({ result }: { result: TrackedApplication }) {
  const stage = TRACK.findIndex((step) => step.status === result.status);
  const submitted = new Date(result.submittedAt);
  const rejected = result.status === "rejected";

  return (
    <section className="space-y-4" aria-live="polite">
      {stage >= 0 && (
        <ol className="vt-steps" aria-label="Avancement du dossier">
          {TRACK.map((step, index) => (
            <li
              key={step.status}
              className="vt-step"
              data-state={
                index < stage ? "done" : index === stage ? "current" : "todo"
              }
            >
              <span className="vt-step-rail" aria-hidden="true" />
              <span className="vt-step-badge" aria-hidden="true">
                {index < stage ? "✓" : index + 1}
              </span>
              <span>{step.label}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="vt-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-display text-flame-100 text-xs tracking-[0.2em] uppercase">
            Dossier {result.dossierNo}
          </p>
          {!Number.isNaN(submitted.getTime()) && (
            <span className="vt-chip">
              Déposé le{" "}
              {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(
                submitted,
              )}
            </span>
          )}
        </div>
        <p
          className={`font-display mt-3 text-2xl leading-tight ${rejected ? "text-danger" : "text-ink"}`}
        >
          {CANDIDATE_STATUS_LABELS[result.status]}
        </p>
        <p className="mt-2 text-muted">
          {CANDIDATE_STATUS_DESCRIPTIONS[result.status]}
        </p>
        <p className="mt-3 text-sm text-muted">Candidat : {result.firstName}</p>
      </div>
    </section>
  );
}

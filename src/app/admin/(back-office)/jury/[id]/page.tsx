import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/features/admin-auth/access";
import { getCandidate } from "@/features/admin-candidates/infrastructure/candidates-admin-repository";
import {
  CandidatePhoto,
  CandidateVideo,
} from "@/features/admin-candidates/ui/candidate-media";
import { StatusBadge } from "@/features/admin-candidates/ui/status-badge";
import { submitApplicationReview } from "@/features/admin-jury/actions";
import {
  JURY_ROLES,
  NOTES_MAX_LENGTH,
  REVIEW_SCORE,
} from "@/features/admin-jury/domain/review";
import { reviewAttributions } from "@/features/admin-jury/infrastructure/review-attributions";
import { formatCameroonMobile } from "@/features/registration/domain/phone";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Fiche du jury" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export default async function JuryReviewPage({
  params,
  searchParams,
}: PageProps<"/admin/jury/[id]">) {
  await requireAdmin(JURY_ROLES);
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const candidate = await getCandidate(id);
  if (!candidate) notFound();

  const [query, attributions] = await Promise.all([
    searchParams,
    reviewAttributions(candidate.id),
  ]);
  const socialLinks = Object.entries<string | null | undefined>(
    candidate.socialLinks ?? {},
  ).filter((entry): entry is [string, string] => Boolean(entry[1]));

  return (
    <div className="space-y-6">
      <Link href="/admin/jury" className="text-sm text-muted underline">
        ← Retour à la file
      </Link>

      {query.note === "1" && (
        <output className="block rounded-md border border-success/50 bg-success/10 px-4 py-3 text-sm text-success">
          Note enregistrée.
        </output>
      )}
      {query.erreur === "note" && (
        <p
          role="alert"
          className="rounded-md border border-danger/50 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          Le service d'inscription a refusé cette note. Elle doit être un entier
          entre {REVIEW_SCORE.min} et {REVIEW_SCORE.max}.
        </p>
      )}
      {query.erreur === "service" && (
        <p
          role="alert"
          className="rounded-md border border-danger/50 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          Le service d'inscription est momentanément indisponible. La note n'a
          pas été enregistrée.
        </p>
      )}

      <div className="flex flex-wrap items-start gap-6">
        {candidate.photoUrl && (
          <CandidatePhoto
            src={candidate.photoUrl}
            alt={`${candidate.firstName} ${candidate.lastName}`}
            className="size-36 rounded-lg object-cover"
          />
        )}
        <div className="space-y-2">
          <p className="font-mono text-flame-100">{candidate.dossierNo}</p>
          <h1 className="vt-kinetic text-4xl text-ink">
            <span>
              {candidate.firstName} {candidate.lastName}
            </span>
          </h1>
          {candidate.stageName && (
            <p className="text-muted">
              Nom de scène : « {candidate.stageName} »
            </p>
          )}
          <StatusBadge status={candidate.status} />
          <p className="text-sm text-muted">
            {candidate.city}, {candidate.district} ·{" "}
            {formatCameroonMobile(candidate.phone)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="card space-y-4">
          <h2 className="font-display text-2xl tracking-wide">Prestation</h2>
          {candidate.presentationUrl ? (
            <CandidateVideo src={candidate.presentationUrl} />
          ) : (
            <p className="text-muted">Aucune prestation.</p>
          )}
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="field-label">Genre</dt>
              <dd>{candidate.musicGenre}</dd>
            </div>
            <div>
              <dt className="field-label">Chanson envisagée</dt>
              <dd>{candidate.songTitle}</dd>
            </div>
          </dl>
          <div>
            <h3 className="field-label">Parcours</h3>
            <p className="whitespace-pre-line text-sm">
              {candidate.musicBackground}
            </p>
          </div>
          {socialLinks.length > 0 && (
            <ul className="flex flex-wrap gap-3 text-sm">
              {socialLinks.map(([network, url]) => (
                <li key={network}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer nofollow"
                    className="text-flame-100 underline"
                  >
                    {network}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h2 className="mb-4 font-display text-2xl tracking-wide">Ma note</h2>
          <form action={submitApplicationReview} className="space-y-4">
            <input type="hidden" name="id" value={candidate.id} />
            <div>
              <label htmlFor="score" className="field-label">
                Note sur 100
              </label>
              <input
                id="score"
                name="score"
                type="number"
                min={REVIEW_SCORE.min}
                max={REVIEW_SCORE.max}
                step={1}
                required
                className="field-input"
              />
            </div>
            <div>
              <label htmlFor="notes" className="field-label">
                Appréciation (facultative)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={5}
                maxLength={NOTES_MAX_LENGTH}
                placeholder="Timbre, diction, présence scénique…"
                className="field-input"
              />
            </div>
            <button type="submit" className="btn-flame w-full">
              Enregistrer la note
            </button>
          </form>
        </section>
      </div>

      <section className="card">
        <h2 className="mb-3 font-display text-2xl tracking-wide">
          Notes déjà déposées
        </h2>
        {candidate.reviews.length === 0 ? (
          <p className="text-sm text-muted">Aucune note pour ce dossier.</p>
        ) : (
          <ul className="divide-y divide-night-800 text-sm">
            {candidate.reviews.map((review) => (
              <li key={review.id} className="grid gap-1 py-3">
                <p>
                  <strong className="tabular-nums">
                    {review.score}/{REVIEW_SCORE.max}
                  </strong>{" "}
                  · {attributions[review.id] ?? review.reviewerName} ·{" "}
                  <span className="text-muted">
                    {formatDateTime(review.createdAt)}
                  </span>
                </p>
                {review.evaluationNotes && (
                  <p className="whitespace-pre-line">
                    {review.evaluationNotes}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { requireAdmin } from "@/features/admin-auth/access";
import { updateCandidatesStatus } from "@/features/admin-candidates/actions";
import { getCandidate } from "@/features/admin-candidates/infrastructure/candidates-admin-repository";
import {
  CandidatePhoto,
  CandidateVideo,
} from "@/features/admin-candidates/ui/candidate-media";
import { StatusBadge } from "@/features/admin-candidates/ui/status-badge";
import { StatusChangeControls } from "@/features/admin-candidates/ui/status-change-controls";
import { CANDIDATE_STATUS_LABELS } from "@/features/registration/domain/candidate-status";
import { ageOn } from "@/features/registration/domain/eligibility";
import { formatCameroonMobile } from "@/features/registration/domain/phone";
import { getCachedSettings } from "@/features/settings/infrastructure/settings-repository";
import { formatDate, formatDateTime, toDoualaDate } from "@/lib/time";

export const metadata: Metadata = { title: "Fiche candidat" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export default async function CandidateDetailPage({
  params,
  searchParams,
}: PageProps<"/admin/inscrits/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const candidate = await getCandidate(id);
  if (!candidate) notFound();

  const [settings, query] = await Promise.all([
    getCachedSettings(),
    searchParams,
  ]);
  const ageReference = toDoualaDate(settings.registration_closes_at);
  const socialLinks = Object.entries<string | null | undefined>(
    candidate.socialLinks ?? {},
  ).filter((entry): entry is [string, string] => Boolean(entry[1]));

  return (
    <div className="space-y-6">
      <Link href="/admin/inscrits" className="text-sm text-muted underline">
        ← Retour à la liste
      </Link>

      <div className="flex flex-wrap items-start gap-6">
        {candidate.photoUrl && (
          <CandidatePhoto
            src={candidate.photoUrl}
            alt={`${candidate.firstName} ${candidate.lastName}`}
            className="size-40 rounded-lg object-cover"
          />
        )}
        <div className="space-y-2">
          <p className="font-mono text-flame-100">{candidate.dossierNo}</p>
          <h1 className="font-display text-4xl tracking-wide">
            {candidate.firstName} {candidate.lastName}
          </h1>
          {candidate.stageName && (
            <p className="text-muted">
              Nom de scène : « {candidate.stageName} »
            </p>
          )}
          <StatusBadge status={candidate.status} />
          {candidate.photoUrl && (
            <p>
              <a
                href={candidate.photoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-flame-100 underline"
              >
                Ouvrir la photo en grand
              </a>
            </p>
          )}
        </div>
      </div>

      {typeof query.maj === "string" && (
        <output className="block rounded-md border border-success/50 bg-success/10 px-4 py-3 text-sm text-success">
          Statut mis à jour.
        </output>
      )}
      {typeof query.echecs === "string" && (
        <p
          role="alert"
          className="rounded-md border border-danger/50 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {query.echecs} dossier(s) refusé(s) par le service d'inscription.
        </p>
      )}

      <form action={updateCandidatesStatus} className="card">
        <input type="hidden" name="ids" value={candidate.id} />
        <StatusChangeControls
          returnTo={`/admin/inscrits/${candidate.id}`}
          label="Changer le statut"
        />
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-3 font-display text-2xl tracking-wide">
            Informations
          </h2>
          <dl className="divide-y divide-night-800 text-sm">
            <Row label="Date de naissance">
              {formatDate(`${candidate.birthDate}T12:00:00+01:00`)} (
              {ageOn(candidate.birthDate, ageReference)} ans à la clôture)
            </Row>
            <Row label="Sexe">
              {candidate.gender === "female" ? "Femme" : "Homme"}
            </Row>
            <Row label="Téléphone">
              <a href={`tel:${candidate.phone}`} className="underline">
                {formatCameroonMobile(candidate.phone)}
              </a>{" "}
              ·{" "}
              <a
                href={`https://wa.me/${candidate.phone.replace("+", "")}`}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                WhatsApp
              </a>
            </Row>
            <Row label="E-mail">
              <a href={`mailto:${candidate.email}`} className="underline">
                {candidate.email}
              </a>
            </Row>
            <Row label="Ville / quartier">
              {candidate.city}, {candidate.district}
            </Row>
            <Row label="Personne à contacter">
              {candidate.contactName && candidate.contactPhone ? (
                <>
                  {candidate.contactName} ·{" "}
                  <a
                    href={`tel:${candidate.contactPhone}`}
                    className="underline"
                  >
                    {formatCameroonMobile(candidate.contactPhone)}
                  </a>
                </>
              ) : (
                <span className="text-muted">Non renseignée.</span>
              )}
            </Row>
            <Row label="Inscrit le">
              {formatDateTime(candidate.submittedAt)}
            </Row>
          </dl>
        </section>

        <section className="card space-y-4">
          <h2 className="font-display text-2xl tracking-wide">
            Profil musical
          </h2>
          <dl className="divide-y divide-night-800 text-sm">
            <Row label="Genre">{candidate.musicGenre}</Row>
            <Row label="Chanson envisagée">{candidate.songTitle}</Row>
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
          <div>
            <h3 className="field-label">Prestation</h3>
            {candidate.presentationUrl ? (
              <CandidateVideo src={candidate.presentationUrl} />
            ) : (
              <p className="text-muted">Aucune prestation.</p>
            )}
          </div>
        </section>
      </div>

      {candidate.reviews.length > 0 && (
        <section className="card">
          <h2 className="mb-3 font-display text-2xl tracking-wide">
            Notes du jury
          </h2>
          <ul className="divide-y divide-night-800 text-sm">
            {candidate.reviews.map((review) => (
              <li key={review.id} className="grid gap-1 py-3">
                <p>
                  <span className="text-muted">
                    {formatDateTime(review.createdAt)}
                  </span>{" "}
                  · {review.reviewerName} ·{" "}
                  <strong className="tabular-nums">{review.score}/100</strong>
                </p>
                {review.evaluationNotes && (
                  <p className="whitespace-pre-line">
                    {review.evaluationNotes}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h2 className="mb-3 font-display text-2xl tracking-wide">Historique</h2>
        {candidate.statusHistory.length === 0 ? (
          <p className="text-sm text-muted">Aucune modification.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {candidate.statusHistory.map((entry) => (
              <li key={entry.id}>
                <span className="text-muted">
                  {formatDateTime(entry.createdAt)}
                </span>{" "}
                · {entry.changedBy} :{" "}
                {entry.previousStatus
                  ? `${CANDIDATE_STATUS_LABELS[entry.previousStatus]} → ${CANDIDATE_STATUS_LABELS[entry.newStatus]}`
                  : CANDIDATE_STATUS_LABELS[entry.newStatus]}
                {entry.comment && (
                  <span className="block text-muted italic">
                    {entry.comment}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[10rem_1fr] gap-3 py-2">
      <dt className="text-muted">{label}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  );
}

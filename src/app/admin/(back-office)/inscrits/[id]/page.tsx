import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { requireAdmin } from "@/features/admin-auth/access";
import { updateCandidatesStatus } from "@/features/admin-candidates/actions";
import {
  candidateHistory,
  getCandidate,
  signedFileUrls,
} from "@/features/admin-candidates/infrastructure/candidates-admin-repository";
import { StatusBadge } from "@/features/admin-candidates/ui/status-badge";
import { StatusChangeControls } from "@/features/admin-candidates/ui/status-change-controls";
import {
  CANDIDATE_STATUS_LABELS,
  type CandidateStatus,
} from "@/features/registration/domain/candidate-status";
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

  const [urls, history, settings, query] = await Promise.all([
    signedFileUrls([
      candidate.photo_path,
      candidate.presentation_path,
      candidate.id_scan_path,
    ]),
    candidateHistory(candidate.id),
    getCachedSettings(),
    searchParams,
  ]);
  const photoUrl = urls[candidate.photo_path];
  const presentationUrl = candidate.presentation_path
    ? urls[candidate.presentation_path]
    : undefined;
  const idScanUrl = candidate.id_scan_path
    ? urls[candidate.id_scan_path]
    : undefined;
  const isVideo = /\.(mp4|mov|webm|3gp)$/i.test(
    candidate.presentation_path ?? "",
  );
  const socialLinks = Object.entries(candidate.social_links ?? {}).filter(
    ([, url]) => url,
  );

  return (
    <div className="space-y-6">
      <Link href="/admin/inscrits" className="text-sm text-muted underline">
        ← Retour à la liste
      </Link>

      <div className="flex flex-wrap items-start gap-6">
        {photoUrl && (
          // biome-ignore lint/performance/noImgElement: URL signée éphémère, non optimisable par next/image
          <img
            src={photoUrl}
            alt={`${candidate.first_name} ${candidate.last_name}`}
            className="size-40 rounded-lg object-cover"
          />
        )}
        <div className="space-y-2">
          <p className="font-mono text-flame-100">{candidate.dossier_no}</p>
          <h1 className="font-display text-4xl tracking-wide">
            {candidate.first_name} {candidate.last_name}
          </h1>
          {candidate.stage_name && (
            <p className="text-muted">
              Nom de scène : « {candidate.stage_name} »
            </p>
          )}
          <StatusBadge status={candidate.status} />
          {photoUrl && (
            <p>
              <a
                href={photoUrl}
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
              {formatDate(`${candidate.birth_date}T12:00:00+01:00`)} (
              {ageOn(
                candidate.birth_date,
                toDoualaDate(settings.registration_closes_at),
              )}{" "}
              ans à la clôture)
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
            <Row label="Pièce d'identité">
              {candidate.id_number}
              {idScanUrl && (
                <>
                  {" · "}
                  <a
                    href={idScanUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-flame-100 underline"
                  >
                    voir le scan
                  </a>
                </>
              )}
            </Row>
            <Row label="Inscrit le">{formatDateTime(candidate.created_at)}</Row>
            <Row label="Consentement">
              {formatDateTime(candidate.consent_at)}
            </Row>
          </dl>
        </section>

        <section className="card space-y-4">
          <h2 className="font-display text-2xl tracking-wide">
            Profil musical
          </h2>
          <dl className="divide-y divide-night-800 text-sm">
            <Row label="Genre">{candidate.music_genre}</Row>
            <Row label="Chanson envisagée">{candidate.song_title}</Row>
          </dl>
          <div>
            <h3 className="field-label">Parcours</h3>
            <p className="whitespace-pre-line text-sm">
              {candidate.music_background}
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
            {presentationUrl ? (
              isVideo ? (
                // biome-ignore lint/a11y/useMediaCaption: prestation brute envoyée par le candidat, sans sous-titres
                <video
                  src={presentationUrl}
                  controls
                  preload="metadata"
                  className="w-full rounded-md"
                />
              ) : (
                // biome-ignore lint/a11y/useMediaCaption: prestation brute envoyée par le candidat, sans sous-titres
                <audio
                  src={presentationUrl}
                  controls
                  preload="metadata"
                  className="w-full"
                />
              )
            ) : candidate.presentation_url ? (
              <a
                href={candidate.presentation_url}
                target="_blank"
                rel="noreferrer nofollow"
                className="break-all text-flame-100 underline"
              >
                {candidate.presentation_url}
              </a>
            ) : (
              <p className="text-muted">Aucune prestation.</p>
            )}
          </div>
        </section>
      </div>

      <section className="card">
        <h2 className="mb-3 font-display text-2xl tracking-wide">Historique</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted">Aucune modification.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {history.map((entry) => {
              const before = (
                entry.before as { status?: CandidateStatus } | null
              )?.status;
              const after = (entry.after as { status?: CandidateStatus } | null)
                ?.status;
              return (
                <li key={entry.id}>
                  <span className="text-muted">{formatDateTime(entry.at)}</span>{" "}
                  · {entry.actor_email ?? "système"} :{" "}
                  {before && after
                    ? `${CANDIDATE_STATUS_LABELS[before]} → ${CANDIDATE_STATUS_LABELS[after]}`
                    : entry.action}
                </li>
              );
            })}
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

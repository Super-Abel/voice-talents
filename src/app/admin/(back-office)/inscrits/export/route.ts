import { authorizeAdmin } from "@/features/admin-auth/access";
import {
  parseCandidateFilters,
  toListParams,
} from "@/features/admin-candidates/domain/candidate-filters";
import { csvLine, UTF8_BOM } from "@/features/admin-candidates/domain/csv";
import { listCandidates } from "@/features/admin-candidates/infrastructure/candidates-admin-repository";
import { CANDIDATE_STATUS_LABELS } from "@/features/registration/domain/candidate-status";
import { ageOn } from "@/features/registration/domain/eligibility";
import { getFreshSettings } from "@/features/settings/infrastructure/settings-repository";
import { writeAudit } from "@/lib/server/audit";
import { clientIpFrom } from "@/lib/server/request";
import { formatShortDateTime, toDoualaDate } from "@/lib/time";

const BATCH = 1000;

const HEADERS = [
  "Dossier",
  "Nom",
  "Prénom",
  "Nom de scène",
  "Date de naissance",
  "Âge à la clôture",
  "Sexe",
  "Téléphone",
  "E-mail",
  "Ville",
  "Quartier",
  "Genre musical",
  "Chanson",
  "Statut",
  "Inscrit le",
];

export async function GET(request: Request) {
  const session = await authorizeAdmin();
  if (!session) return new Response("Accès refusé", { status: 401 });

  const url = new URL(request.url);
  const filters = parseCandidateFilters(Object.fromEntries(url.searchParams));
  const ageReference = toDoualaDate(
    (await getFreshSettings()).registration_closes_at,
  );

  let csv = UTF8_BOM + csvLine(HEADERS);
  let exported = 0;
  for (let offset = 0; ; offset += BATCH) {
    const { rows } = await listCandidates(
      toListParams(filters, ageReference, BATCH, offset),
    );
    for (const row of rows) {
      csv += csvLine([
        row.dossier_no,
        row.last_name,
        row.first_name,
        row.stage_name,
        row.birth_date,
        ageOn(row.birth_date, ageReference),
        row.gender === "female" ? "F" : "M",
        row.phone,
        row.email,
        row.city,
        row.district,
        row.music_genre,
        row.song_title,
        CANDIDATE_STATUS_LABELS[row.status],
        formatShortDateTime(row.created_at),
      ]);
    }
    exported += rows.length;
    if (rows.length < BATCH) break;
  }

  await writeAudit({
    actor: session.user,
    action: "candidates.exported",
    entity: "candidate",
    after: { count: exported, filters },
    ip: clientIpFrom(request.headers),
  });

  const stamp = toDoualaDate(new Date());
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inscrits-voice-talent-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

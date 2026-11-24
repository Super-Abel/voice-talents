import { authorizeAdmin } from "@/features/admin-auth/access";
import {
  matchesFilters,
  parseCandidateFilters,
  sortApplications,
} from "@/features/admin-candidates/domain/candidate-filters";
import { csvLine, UTF8_BOM } from "@/features/admin-candidates/domain/csv";
import { fetchAllApplications } from "@/features/admin-candidates/infrastructure/candidates-admin-repository";
import { CANDIDATE_STATUS_LABELS } from "@/features/registration/domain/candidate-status";
import { ageOn } from "@/features/registration/domain/eligibility";
import { getFreshSettings } from "@/features/settings/infrastructure/settings-repository";
import { writeAudit } from "@/lib/server/audit";
import { clientIpFrom } from "@/lib/server/request";
import { formatShortDateTime, toDoualaDate } from "@/lib/time";

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

/** Le CSV du backend est séparé par des virgules et en anglais : Excel français relitait tout sur une colonne. */
export async function GET(request: Request) {
  const session = await authorizeAdmin();
  if (!session) return new Response("Accès refusé", { status: 401 });

  const url = new URL(request.url);
  const filters = parseCandidateFilters(Object.fromEntries(url.searchParams));
  const ageReference = toDoualaDate(
    (await getFreshSettings()).registration_closes_at,
  );
  const rows = await fetchAllApplications();
  const matched = sortApplications(
    rows.filter((row) => matchesFilters(row, filters, ageReference)),
    filters.sort,
    filters.dir,
  );

  let csv = UTF8_BOM + csvLine(HEADERS);
  for (const row of matched) {
    csv += csvLine([
      row.dossierNo,
      row.lastName,
      row.firstName,
      row.stageName,
      row.birthDate,
      ageOn(row.birthDate, ageReference),
      row.gender === "female" ? "F" : "M",
      row.phone,
      row.email,
      row.city,
      row.district,
      row.musicGenre,
      row.songTitle,
      CANDIDATE_STATUS_LABELS[row.status],
      formatShortDateTime(row.submittedAt),
    ]);
  }

  await writeAudit({
    actor: session.user,
    action: "candidates.exported",
    entity: "candidate",
    after: { count: matched.length, filters },
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

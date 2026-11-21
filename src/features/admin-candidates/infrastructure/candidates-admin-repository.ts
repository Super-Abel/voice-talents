import "server-only";
import type { CandidateStatus } from "@/features/registration/domain/candidate-status";
import { CANDIDATE_FILES_BUCKET, db } from "@/lib/server/db";

export type CandidateListRow = {
  id: string;
  dossier_no: string;
  last_name: string;
  first_name: string;
  stage_name: string | null;
  birth_date: string;
  gender: "female" | "male";
  phone: string;
  email: string;
  city: string;
  district: string;
  music_genre: string;
  song_title: string;
  status: CandidateStatus;
  created_at: string;
  total_count: number;
};

export async function listCandidates(
  params: Record<string, unknown>,
): Promise<{ rows: CandidateListRow[]; total: number }> {
  const { data, error } = await db().rpc("admin_list_candidates", params);
  if (error) throw error;
  const rows = (data ?? []) as CandidateListRow[];
  return { rows, total: rows.length > 0 ? Number(rows[0].total_count) : 0 };
}

export type CandidateDetail = {
  id: string;
  dossier_no: string;
  last_name: string;
  first_name: string;
  stage_name: string | null;
  birth_date: string;
  gender: "female" | "male";
  phone: string;
  email: string;
  city: string;
  district: string;
  contact_name: string | null;
  contact_phone: string | null;
  id_number: string | null;
  id_scan_path: string | null;
  photo_path: string;
  music_genre: string;
  song_title: string;
  music_background: string;
  social_links: Record<string, string | undefined>;
  presentation_path: string | null;
  presentation_url: string | null;
  consent_at: string;
  status: CandidateStatus;
  status_changed_at: string | null;
  created_at: string;
};

export async function getCandidate(
  id: string,
): Promise<CandidateDetail | null> {
  const { data, error } = await db()
    .from("candidates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as CandidateDetail | null;
}

const SIGNED_URL_TTL_SECONDS = 10 * 60;

/** URL de lecture privées et de courte durée, pour l'admin uniquement. */
export async function signedFileUrls(
  paths: (string | null)[],
): Promise<Record<string, string>> {
  const existing = paths.filter((path): path is string => Boolean(path));
  if (existing.length === 0) return {};
  const { data, error } = await db()
    .storage.from(CANDIDATE_FILES_BUCKET)
    .createSignedUrls(existing, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;
  const urls: Record<string, string> = {};
  for (const entry of data) {
    if (entry.path && entry.signedUrl) urls[entry.path] = entry.signedUrl;
  }
  return urls;
}

/** Durée déclarée à l'envoi de la vidéo de prestation ; null pour les dossiers plus anciens. */
export async function presentationDuration(
  candidateId: string,
): Promise<number | null> {
  const { data, error } = await db()
    .from("uploads")
    .select("duration_seconds")
    .eq("candidate_id", candidateId)
    .eq("kind", "presentation")
    .not("duration_seconds", "is", null)
    .order("issued_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? Number(data.duration_seconds) : null;
}

export type StatusChange = {
  id: string;
  dossier_no: string;
  email: string;
  first_name: string;
  previous_status: CandidateStatus;
};

export async function setCandidatesStatus(
  ids: string[],
  status: CandidateStatus,
  actorId: string,
  ip: string | null,
): Promise<StatusChange[]> {
  const { data, error } = await db().rpc("admin_set_candidates_status", {
    p_ids: ids,
    p_status: status,
    p_actor: actorId,
    p_ip: ip,
  });
  if (error) throw error;
  return (data ?? []) as StatusChange[];
}

export type RegistrationStats = {
  total: number;
  by_status: Partial<Record<CandidateStatus, number>>;
  by_day: { day: string; count: number }[];
  by_city: { label: string; count: number }[];
  by_genre: { label: string; count: number }[];
};

export async function registrationStats(): Promise<RegistrationStats> {
  const { data, error } = await db().rpc("admin_registration_stats");
  if (error) throw error;
  return data as RegistrationStats;
}

export type AuditEntryRow = {
  id: number;
  at: string;
  actor_email: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  before: unknown;
  after: unknown;
  ip: string | null;
};

export async function candidateHistory(
  candidateId: string,
): Promise<AuditEntryRow[]> {
  const { data, error } = await db()
    .from("audit_log")
    .select("id, at, actor_email, action, entity, entity_id, before, after, ip")
    .eq("entity", "candidate")
    .eq("entity_id", candidateId)
    .order("at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data as AuditEntryRow[];
}

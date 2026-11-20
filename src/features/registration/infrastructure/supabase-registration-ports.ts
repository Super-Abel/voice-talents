import "server-only";
import { getFreshSettings } from "@/features/settings/infrastructure/settings-repository";
import { CANDIDATE_FILES_BUCKET, db, isUniqueViolation } from "@/lib/server/db";
import type {
  CreateCandidateResult,
  NewCandidate,
  PendingUpload,
  RegistrationPorts,
  StoredObject,
} from "../application/ports";

export const supabaseRegistrationPorts: RegistrationPorts = {
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

  async findUploads(ids): Promise<PendingUpload[]> {
    const { data, error } = await db()
      .from("uploads")
      .select("id, path, kind, mime, max_bytes, used_at, expires_at")
      .in("id", ids);
    if (error) throw error;
    return data.map((row) => ({
      id: row.id,
      path: row.path,
      kind: row.kind,
      mime: row.mime,
      maxBytes: row.max_bytes,
      usedAt: row.used_at,
      expiresAt: row.expires_at,
    }));
  },

  async statObject(path): Promise<StoredObject | null> {
    const slash = path.lastIndexOf("/");
    const folder = path.slice(0, slash);
    const name = path.slice(slash + 1);
    const { data, error } = await db()
      .storage.from(CANDIDATE_FILES_BUCKET)
      .list(folder, { search: name, limit: 1 });
    if (error) throw error;
    const object = data.find((entry) => entry.name === name);
    if (!object?.metadata) return null;
    return {
      size: Number(object.metadata.size),
      mime: String(object.metadata.mimetype),
    };
  },

  async createCandidate(
    candidate: NewCandidate,
  ): Promise<CreateCandidateResult> {
    const { data, error } = await db()
      .from("candidates")
      .insert({
        last_name: candidate.lastName,
        first_name: candidate.firstName,
        stage_name: candidate.stageName ?? null,
        birth_date: candidate.birthDate,
        gender: candidate.gender,
        phone: candidate.phone,
        email: candidate.email,
        city: candidate.city,
        district: candidate.district,
        id_number: candidate.idNumber,
        id_scan_path: candidate.idScanPath ?? null,
        photo_path: candidate.photoPath,
        music_genre: candidate.musicGenre,
        song_title: candidate.songTitle,
        music_background: candidate.musicBackground,
        social_links: candidate.socialLinks,
        presentation_path: candidate.presentationPath ?? null,
        presentation_url: candidate.presentationUrl ?? null,
        consent_at: candidate.consentAt.toISOString(),
      })
      .select("id, dossier_no")
      .single();
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        duplicate: error?.message.includes("candidates_email_key")
          ? "email"
          : "phone",
      };
    }
    if (error) throw error;
    return { ok: true, id: data.id, dossierNo: data.dossier_no };
  },

  async markUploadsUsed(ids, candidateId) {
    const { error } = await db()
      .from("uploads")
      .update({ used_at: new Date().toISOString(), candidate_id: candidateId })
      .in("id", ids);
    if (error) throw error;
  },
};

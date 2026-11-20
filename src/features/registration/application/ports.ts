import type { Registration } from "../domain/registration-schema";
import type { UploadKind } from "../domain/upload-rules";

export type PendingUpload = {
  id: string;
  path: string;
  kind: UploadKind;
  mime: string;
  maxBytes: number;
  usedAt: string | null;
  expiresAt: string;
};

export type StoredObject = { size: number; mime: string };

export type RegistrationPolicy = {
  opensAt: Date;
  closesAt: Date;
  ageMin: number;
  ageMax: number;
};

export type NewCandidate = Registration & {
  photoPath: string;
  presentationPath?: string;
  idScanPath?: string;
  consentAt: Date;
};

export type CreateCandidateResult =
  | { ok: true; id: string; dossierNo: string }
  | { ok: false; duplicate: "phone" | "email" };

export interface RegistrationPorts {
  now(): Date;
  loadPolicy(): Promise<RegistrationPolicy>;
  findUploads(ids: string[]): Promise<PendingUpload[]>;
  statObject(path: string): Promise<StoredObject | null>;
  createCandidate(candidate: NewCandidate): Promise<CreateCandidateResult>;
  markUploadsUsed(ids: string[], candidateId: string): Promise<void>;
}

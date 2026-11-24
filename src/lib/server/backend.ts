import "server-only";
import { Buffer } from "node:buffer";
import type { CandidateStatus } from "@/features/registration/domain/candidate-status";
import { serverEnv } from "./env";

export type BackendGender = "female" | "male";

export type BackendSocialLinks = {
  facebook?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  youtube?: string | null;
};

export type BackendUploadTicket = { uploadId: string; signedUrl: string };

export type BackendApplicationSummary = {
  id: string;
  dossierNo: string;
  firstName: string;
  lastName: string;
  stageName: string | null;
  birthDate: string;
  gender: BackendGender;
  phone: string;
  email: string;
  city: string;
  district: string;
  musicGenre: string;
  songTitle: string;
  status: CandidateStatus;
  submittedAt: string;
};

export type BackendReview = {
  id: string;
  reviewerName: string;
  score: number;
  evaluationNotes: string | null;
  createdAt: string;
};

export type BackendStatusHistoryEntry = {
  id: string;
  previousStatus: CandidateStatus | null;
  newStatus: CandidateStatus;
  changedBy: string;
  comment: string | null;
  createdAt: string;
};

export type BackendComment = {
  id: string;
  authorName: string;
  commentText: string;
  privateToRecruiters: boolean;
  createdAt: string;
};

export type BackendApplicationDetail = Omit<
  BackendApplicationSummary,
  "songTitle"
> & {
  songTitle: string;
  contactName: string | null;
  contactPhone: string | null;
  musicBackground: string;
  socialLinks: BackendSocialLinks;
  photoUrl: string;
  presentationUrl: string;
  reviews: BackendReview[];
  comments: BackendComment[];
  statusHistory: BackendStatusHistoryEntry[];
};

/** Le backend répond mal quand il n'est pas joignable : on garde un message français court. */
const UNAVAILABLE =
  "Le service d'inscription est momentanément indisponible. Réessayez dans un instant.";

type ErrorPayload = {
  error?: unknown;
  fieldErrors?: unknown;
  message?: unknown;
};

export class BackendError extends Error {
  readonly fieldErrors: Record<string, string>;

  constructor(
    readonly status: number,
    message: string,
    fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "BackendError";
    this.fieldErrors = fieldErrors;
  }

  /** Erreurs attendues : elles décrivent la saisie du candidat, pas notre panne. */
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }
}

function toFieldErrors(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  const entries = Object.entries(value as Record<string, unknown>).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string",
  );
  return Object.fromEntries(entries);
}

function describe(status: number, payload: ErrorPayload): BackendError {
  const serverMessage =
    typeof payload.error === "string" && payload.error.length > 0
      ? payload.error
      : typeof payload.message === "string"
        ? payload.message
        : null;
  const fieldErrors = toFieldErrors(payload.fieldErrors);
  if (status >= 500) return new BackendError(status, UNAVAILABLE, fieldErrors);
  return new BackendError(
    status,
    serverMessage ?? "La demande n'a pas abouti. Réessayez.",
    fieldErrors,
  );
}

const DEFAULT_TIMEOUT_MS = 15_000;

type Call = {
  method?: "GET" | "POST" | "PATCH" | "PUT";
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  /** Basic Auth de service : à n'activer que pour les endpoints /api/admin. */
  admin?: boolean;
  timeoutMs?: number;
};

async function callBackend<T>(path: string, options: Call = {}): Promise<T> {
  const env = serverEnv();
  const url = new URL(path, env.BACKEND_API_URL);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && `${value}`.length > 0)
      url.searchParams.set(key, `${value}`);
  }

  const headers = new Headers();
  if (options.body !== undefined)
    headers.set("Content-Type", "application/json");
  if (options.admin) {
    const token = Buffer.from(
      `${env.BACKEND_ADMIN_USERNAME}:${env.BACKEND_ADMIN_PASSWORD}`,
      "utf8",
    ).toString("base64");
    headers.set("Authorization", `Basic ${token}`);
  }

  const signal = AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? (options.body === undefined ? "GET" : "POST"),
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
      signal,
    });
  } catch (cause) {
    throw unavailable(cause);
  }

  const text = await response.text();
  const payload = parseJson(text);
  if (!response.ok) throw describe(response.status, payload);
  return payload as T;
}

/** Une réponse illisible est une panne du backend, jamais une erreur de saisie. */
function parseJson(text: string): ErrorPayload {
  if (!text) return {};
  try {
    return JSON.parse(text) as ErrorPayload;
  } catch (cause) {
    throw unavailable(cause);
  }
}

function unavailable(cause: unknown): BackendError {
  const error = new BackendError(0, UNAVAILABLE);
  error.cause = cause;
  return error;
}

export function prepareUpload(input: {
  kind: "photo" | "presentation";
  mime: string;
  size: number;
  durationSeconds?: number;
  originalName?: string;
}): Promise<BackendUploadTicket> {
  return callBackend<BackendUploadTicket>("/api/registration/uploads", {
    body: input,
  });
}

export function submitRegistrationToBackend(
  payload: Record<string, unknown>,
): Promise<{ dossierNo: string }> {
  return callBackend<{ dossierNo: string }>("/api/registration", {
    body: payload,
  });
}

export type BackendStatusLookup = {
  dossierNo: string;
  firstName: string;
  status: CandidateStatus;
  submittedAt: string;
};

export function lookupStatusFromBackend(input: {
  dossierNo: string;
  phone: string;
}): Promise<BackendStatusLookup> {
  return callBackend<BackendStatusLookup>("/api/registration/status", {
    body: input,
  });
}

export function listApplications(query: {
  status?: CandidateStatus;
  gender?: BackendGender;
  q?: string;
}): Promise<BackendApplicationSummary[]> {
  return callBackend<BackendApplicationSummary[]>("/api/admin/applications", {
    query,
    admin: true,
  });
}

export function getApplication(id: string): Promise<BackendApplicationDetail> {
  return callBackend<BackendApplicationDetail>(
    `/api/admin/applications/${encodeURIComponent(id)}`,
    { admin: true },
  );
}

export function updateApplicationStatus(
  id: string,
  input: { status: CandidateStatus; comment?: string },
): Promise<BackendApplicationSummary> {
  return callBackend<BackendApplicationSummary>(
    `/api/admin/applications/${encodeURIComponent(id)}/status`,
    { method: "PATCH", body: input, admin: true },
  );
}

export function addApplicationReview(
  id: string,
  input: { score: number; evaluationNotes?: string },
): Promise<BackendReview> {
  return callBackend<BackendReview>(
    `/api/admin/applications/${encodeURIComponent(id)}/reviews`,
    { method: "POST", body: input, admin: true },
  );
}

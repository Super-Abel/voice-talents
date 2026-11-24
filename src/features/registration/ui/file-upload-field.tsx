"use client";

import { useId, useState } from "react";
import type { CandidateIdentity } from "../domain/media-identity";
import {
  acceptAttribute,
  UPLOAD_RULES,
  type UploadKind,
  validateUpload,
  validateUploadDuration,
} from "../domain/upload-rules";
import { prepareMedia } from "./media-prepare";
import { UploadError, uploadRegistrationFile } from "./upload-file";
import { readVideoDuration } from "./video-duration";

export type UploadedFile = { id: string; name: string };

type Props = {
  kind: UploadKind;
  label: string;
  value?: UploadedFile;
  onChange: (value: UploadedFile | undefined) => void;
  error?: string;
  optional?: boolean;
  capture?: "user" | "environment";
  /** Gravé sur le média avant envoi : le backend ne garde aucun nom de fichier. */
  identity: CandidateIdentity;
};

export function FileUploadField({
  kind,
  label,
  value,
  onChange,
  error,
  optional,
  capture,
  identity,
}: Props) {
  const inputId = useId();
  const [stage, setStage] = useState<"preparing" | "uploading" | null>(null);
  const [ratio, setRatio] = useState(0);
  const [pendingName, setPendingName] = useState("");
  const [localError, setLocalError] = useState<string>();

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setLocalError(undefined);
    setPendingName(file.name);
    /* La préparation (compression + identifiant) se fait dans l'appareil : elle
       occupe le même couloir visuel que l'envoi pour ne jamais laisser le
       candidat sans nouvelle. */
    setStage("preparing");
    setRatio(0);
    const { file: prepared, unreadable } = await prepareMedia(
      kind,
      file,
      identity,
      setRatio,
    );
    /* Un fichier que cet appareil ne décode pas ne sera pas jugé : mieux vaut
       le dire avant l'envoi qu'après, quand le dossier est déjà fermé. */
    if (unreadable) {
      setStage(null);
      setLocalError(UPLOAD_RULES[kind].unreadableHint);
      return;
    }
    const problem = validateUpload(kind, prepared.type, prepared.size);
    if (problem) {
      setStage(null);
      setLocalError(problem);
      return;
    }
    /* La durée est lue dans le fichier avant tout octet envoyé : un candidat
       en 3G ne paie pas l'upload d'une vidéo déjà hors critères. */
    let durationSeconds: number | null = null;
    if (UPLOAD_RULES[kind].maxDurationSeconds) {
      durationSeconds = await readVideoDuration(prepared);
      const durationProblem = validateUploadDuration(kind, durationSeconds);
      if (durationProblem) {
        setStage(null);
        setLocalError(durationProblem);
        return;
      }
    }
    setStage("uploading");
    setRatio(0);
    try {
      const id = await uploadRegistrationFile(
        kind,
        prepared,
        setRatio,
        durationSeconds ? Math.round(durationSeconds) : undefined,
      );
      onChange({ id, name: file.name });
    } catch (cause) {
      setLocalError(
        cause instanceof UploadError
          ? cause.message
          : "Envoi impossible. Réessayez.",
      );
    } finally {
      setStage(null);
    }
  }

  const shownError = localError ?? error;
  const busy = stage !== null;
  const preparing = stage === "preparing";
  const percent = Math.round(ratio * 100);

  return (
    <div>
      <label htmlFor={inputId} className="field-label">
        {label}{" "}
        {optional && (
          <span className="font-normal text-muted">(facultatif)</span>
        )}
      </label>
      <p className="field-hint mt-0 mb-2">{UPLOAD_RULES[kind].label}</p>

      <div
        className="vt-dropzone"
        data-filled={value ? "true" : "false"}
        data-busy={busy ? "true" : "false"}
      >
        {/* L'input natif reste posé sur toute la zone : le geste reste celui du système
            (caméra sur mobile, dossiers récents), et le champ reste annoncé. */}
        <input
          id={inputId}
          type="file"
          accept={acceptAttribute(kind)}
          capture={capture}
          disabled={busy}
          aria-invalid={Boolean(shownError)}
          aria-describedby={shownError ? `${inputId}-error` : undefined}
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />

        <span className="vt-dropzone-fake" aria-hidden="true">
          {busy
            ? preparing
              ? "Compression"
              : "Envoi"
            : value
              ? "Remplacer"
              : "Choisir"}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-ink">
            {value ? value.name : busy ? pendingName : "Aucun fichier"}
          </span>
          {busy ? (
            <span className="mt-2 block h-2 overflow-hidden rounded-full bg-night-800">
              <span
                className="block h-full bg-flame-200 transition-[width]"
                style={{ width: `${percent}%` }}
              />
            </span>
          ) : null}
        </span>

        {value && !busy ? (
          /* z-10 : le bouton doit passer au-dessus de l'input invisible qui couvre la zone. */
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="relative z-10 shrink-0 text-sm font-medium text-flame-100 underline"
          >
            Retirer
          </button>
        ) : null}
      </div>

      {busy ? (
        <p className="field-hint" aria-live="polite">
          {preparing
            ? "Préparation du fichier sur votre appareil… "
            : "Envoi en cours… "}
          {percent} %
        </p>
      ) : null}
      {shownError && (
        <p id={`${inputId}-error`} className="field-error">
          {shownError}
        </p>
      )}
    </div>
  );
}

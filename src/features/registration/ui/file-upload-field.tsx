"use client";

import { useId, useState } from "react";
import {
  acceptAttribute,
  UPLOAD_RULES,
  type UploadKind,
  validateUpload,
} from "../domain/upload-rules";
import {
  compressPhoto,
  UploadError,
  uploadRegistrationFile,
} from "./upload-file";

export type UploadedFile = { id: string; name: string };

type Props = {
  kind: UploadKind;
  label: string;
  value?: UploadedFile;
  onChange: (value: UploadedFile | undefined) => void;
  error?: string;
  optional?: boolean;
  capture?: "user" | "environment";
};

export function FileUploadField({
  kind,
  label,
  value,
  onChange,
  error,
  optional,
  capture,
}: Props) {
  const inputId = useId();
  const [progress, setProgress] = useState<number | null>(null);
  const [pendingName, setPendingName] = useState("");
  const [localError, setLocalError] = useState<string>();

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setLocalError(undefined);
    const prepared = kind === "photo" ? await compressPhoto(file) : file;
    const problem = validateUpload(kind, prepared.type, prepared.size);
    if (problem) {
      setLocalError(problem);
      return;
    }
    setPendingName(file.name);
    setProgress(0);
    try {
      const id = await uploadRegistrationFile(kind, prepared, setProgress);
      onChange({ id, name: file.name });
    } catch (cause) {
      setLocalError(
        cause instanceof UploadError
          ? cause.message
          : "Envoi impossible. Réessayez.",
      );
    } finally {
      setProgress(null);
    }
  }

  const shownError = localError ?? error;
  const uploading = progress !== null;
  const percent = uploading ? Math.round(progress * 100) : 0;

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
        data-busy={uploading ? "true" : "false"}
      >
        {/* L'input natif reste posé sur toute la zone : le geste reste celui du système
            (caméra sur mobile, dossiers récents), et le champ reste annoncé. */}
        <input
          id={inputId}
          type="file"
          accept={acceptAttribute(kind)}
          capture={capture}
          disabled={uploading}
          aria-invalid={Boolean(shownError)}
          aria-describedby={shownError ? `${inputId}-error` : undefined}
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />

        <span className="vt-dropzone-fake" aria-hidden="true">
          {uploading ? "Envoi" : value ? "Remplacer" : "Choisir"}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-ink">
            {value ? value.name : uploading ? pendingName : "Aucun fichier"}
          </span>
          {uploading ? (
            <span className="mt-2 block h-2 overflow-hidden rounded-full bg-night-800">
              <span
                className="block h-full bg-flame-200 transition-[width]"
                style={{ width: `${percent}%` }}
              />
            </span>
          ) : null}
        </span>

        {value && !uploading ? (
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

      {uploading ? (
        <p className="field-hint" aria-live="polite">
          Envoi en cours… {percent} %
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

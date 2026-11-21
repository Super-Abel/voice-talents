"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import type { z } from "zod";
import { Countdown } from "@/components/countdown";
import {
  consentFields,
  contactFields,
  type FieldErrors,
  identityFields,
  musicFields,
  toFieldErrors,
} from "../domain/registration-schema";
import { FileUploadField, type UploadedFile } from "./file-upload-field";
import { TurnstileWidget } from "./turnstile-widget";

const DRAFT_KEY = "vt-registration-draft-v2";

type Draft = {
  lastName: string;
  firstName: string;
  stageName: string;
  birthDate: string;
  gender: "" | "female" | "male";
  phone: string;
  email: string;
  city: string;
  district: string;
  contactName: string;
  contactPhone: string;
  photo?: UploadedFile;
  musicGenre: string;
  songTitle: string;
  musicBackground: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  presentation?: UploadedFile;
  acceptRules: boolean;
};

const EMPTY_DRAFT: Draft = {
  lastName: "",
  firstName: "",
  stageName: "",
  birthDate: "",
  gender: "",
  phone: "",
  email: "",
  city: "",
  district: "",
  contactName: "",
  contactPhone: "",
  musicGenre: "",
  songTitle: "",
  musicBackground: "",
  facebook: "",
  instagram: "",
  tiktok: "",
  youtube: "",
  acceptRules: false,
};

const MUSIC_GENRES = [
  "Afrobeat",
  "Makossa",
  "Bikutsi",
  "Gospel",
  "R&B",
  "Pop",
  "Soul",
  "Jazz",
  "Rap / Hip-hop",
  "Zouk",
  "Variété",
];

function toPayload(draft: Draft) {
  return {
    lastName: draft.lastName,
    firstName: draft.firstName,
    stageName: draft.stageName,
    birthDate: draft.birthDate,
    gender: draft.gender || undefined,
    phone: draft.phone,
    email: draft.email,
    city: draft.city,
    district: draft.district,
    contactName: draft.contactName,
    contactPhone: draft.contactPhone,
    photoUploadId: draft.photo?.id,
    musicGenre: draft.musicGenre,
    songTitle: draft.songTitle,
    musicBackground: draft.musicBackground,
    socialLinks: {
      facebook: draft.facebook,
      instagram: draft.instagram,
      tiktok: draft.tiktok,
      youtube: draft.youtube,
    },
    presentationUploadId: draft.presentation?.id,
    acceptRules: draft.acceptRules,
  };
}

type Step = { title: string; schema: z.ZodType; fields: string[] };

const STEPS: Step[] = [
  {
    title: "Identité",
    schema: identityFields,
    fields: ["lastName", "firstName", "stageName", "birthDate", "gender"],
  },
  {
    title: "Coordonnées",
    schema: contactFields,
    fields: [
      "phone",
      "email",
      "city",
      "district",
      "contactName",
      "contactPhone",
      "photoUploadId",
    ],
  },
  {
    title: "Profil musical",
    schema: musicFields,
    fields: [
      "musicGenre",
      "songTitle",
      "musicBackground",
      "socialLinks",
      "presentationUploadId",
    ],
  },
  { title: "Validation", schema: consentFields, fields: ["acceptRules"] },
];

function readDraft(): { draft: Draft; step: number } | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as { draft: Draft; step: number };
    return {
      draft: { ...EMPTY_DRAFT, ...saved.draft },
      step: Math.min(saved.step, STEPS.length - 1),
    };
  } catch {
    return null;
  }
}

function writeDraft(draft: Draft, step: number) {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ draft, step }));
  } catch {}
}

function clearDraft() {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {}
}

export function RegistrationForm({
  birthDateMin,
  birthDateMax,
  closesAt,
  closesLabel,
}: {
  birthDateMin: string;
  birthDateMax: string;
  closesAt: string;
  closesLabel: string;
}) {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [step, setStep] = useState(0);
  const [restored, setRestored] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [dossierNo, setDossierNo] = useState<string>();
  const [turnstileToken, setTurnstileToken] = useState<string>();
  const honeypot = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const saved = readDraft();
    if (saved) {
      setDraft(saved.draft);
      setStep(saved.step);
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (restored && !dossierNo) writeDraft(draft, step);
  }, [draft, step, restored, dossierNo]);

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  function validateStep(index: number): boolean {
    const result = STEPS[index].schema.safeParse(toPayload(draft));
    if (result.success) {
      setErrors({});
      return true;
    }
    setErrors(toFieldErrors(result.error));
    return false;
  }

  function goTo(index: number) {
    setStep(index);
    setFormError(undefined);
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  async function submit() {
    if (!validateStep(step)) return;
    setSubmitting(true);
    setFormError(undefined);
    try {
      const response = await fetch("/api/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...toPayload(draft),
          website: honeypot.current?.value ?? "",
          turnstileToken,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        dossierNo?: string;
        error?: string;
        fieldErrors?: FieldErrors;
      };
      if (response.ok && payload.dossierNo) {
        clearDraft();
        setDossierNo(payload.dossierNo);
        window.scrollTo({ top: 0 });
        return;
      }
      setFormError(payload.error ?? "L'envoi a échoué. Réessayez.");
      if (payload.fieldErrors) {
        const serverErrors = payload.fieldErrors;
        setErrors(serverErrors);
        const firstStep = STEPS.findIndex((candidate) =>
          candidate.fields.some((field) =>
            Object.keys(serverErrors).some((key) => key.startsWith(field)),
          ),
        );
        if (firstStep >= 0 && firstStep !== step) goTo(firstStep);
      }
    } catch {
      setFormError(
        "Connexion interrompue. Vos réponses sont conservées : réessayez dès que le réseau revient.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (dossierNo)
    return <Confirmation dossierNo={dossierNo} email={draft.email} />;
  if (!restored)
    return (
      <div
        className="h-96 animate-pulse rounded-lg bg-night-900"
        aria-hidden="true"
      />
    );

  const isLast = step === STEPS.length - 1;

  return (
    <div className="space-y-6">
      {/* Le compte à rebours vit avec le formulaire : l'écran de confirmation n'a plus
          rien d'administratif à afficher une fois le dossier envoyé. */}
      <div className="vt-panel p-5 sm:p-6">
        <Countdown
          deadlines={[{ at: closesAt, label: "Clôture des inscriptions dans" }]}
        />
        <p className="text-sm text-muted">
          Clôture le {closesLabel} (heure de Douala). Aucune inscription n'est
          acceptée après ce délai.
        </p>
      </div>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (isLast) void submit();
          else if (validateStep(step)) goTo(step + 1);
        }}
        className="card space-y-6"
      >
        <ol className="vt-steps" aria-label="Étapes">
          {STEPS.map((candidate, index) => (
            <li key={candidate.title}>
              <button
                type="button"
                className="vt-step"
                data-state={
                  index < step ? "done" : index === step ? "current" : "todo"
                }
                aria-current={index === step ? "step" : undefined}
                /* On ne recule que vers ce qui est déjà validé : avancer passe par « Continuer »,
                 seul endroit qui connaît la validation de l'étape en cours. */
                disabled={index >= step}
                onClick={() => goTo(index)}
              >
                <span className="vt-step-rail" aria-hidden="true" />
                <span className="vt-step-badge" aria-hidden="true">
                  {index < step ? "✓" : index + 1}
                </span>
                <span className="hidden sm:inline">{candidate.title}</span>
              </button>
            </li>
          ))}
        </ol>

        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-display -mx-1 rounded-md px-1 text-3xl leading-tight tracking-wide text-ink uppercase"
        >
          <span className="mb-1 block font-sans text-xs tracking-[0.24em] text-flame-100 normal-case">
            Étape {step + 1} / {STEPS.length}
          </span>
          {STEPS[step].title}
        </h2>

        <div
          aria-hidden="true"
          className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
        >
          <label>
            Site web
            <input
              ref={honeypot}
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
            />
          </label>
        </div>

        {/* key={step} : à chaque changement d'étape le panneau se remonte et rejoue son entrée. */}
        <div key={step} className="vt-step-panel">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Nom"
                name="lastName"
                value={draft.lastName}
                error={errors.lastName}
                onChange={(v) => update("lastName", v)}
                autoComplete="family-name"
              />
              <TextField
                label="Prénom"
                name="firstName"
                value={draft.firstName}
                error={errors.firstName}
                onChange={(v) => update("firstName", v)}
                autoComplete="given-name"
              />
              <TextField
                label="Nom de scène"
                name="stageName"
                optional
                value={draft.stageName}
                error={errors.stageName}
                onChange={(v) => update("stageName", v)}
              />
              <TextField
                label="Date de naissance"
                name="birthDate"
                type="date"
                min={birthDateMin}
                max={birthDateMax}
                hint="Le concours est ouvert aux 18–35 ans."
                value={draft.birthDate}
                error={errors.birthDate}
                onChange={(v) => update("birthDate", v)}
                autoComplete="bday"
              />
              <fieldset className="sm:col-span-2">
                <legend className="field-label">Sexe</legend>
                <div className="flex gap-3">
                  {(
                    [
                      ["female", "Femme"],
                      ["male", "Homme"],
                    ] as const
                  ).map(([value, label]) => (
                    <label
                      key={value}
                      className="flex min-h-12 flex-1 cursor-pointer items-center gap-3 rounded-md border border-night-700 px-4 has-[:checked]:border-flame-100 has-[:checked]:bg-night-800"
                    >
                      <input
                        type="radio"
                        name="gender"
                        value={value}
                        checked={draft.gender === value}
                        onChange={() => update("gender", value)}
                        className="accent-[var(--flame-200)]"
                      />
                      {label}
                    </label>
                  ))}
                </div>
                {errors.gender && (
                  <p className="field-error">{errors.gender}</p>
                )}
              </fieldset>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Téléphone (WhatsApp de préférence)"
                name="phone"
                type="tel"
                inputMode="tel"
                placeholder="6 71 23 45 67"
                value={draft.phone}
                error={errors.phone}
                onChange={(v) => update("phone", v)}
                autoComplete="tel-national"
              />
              <TextField
                label="E-mail"
                name="email"
                type="email"
                inputMode="email"
                value={draft.email}
                error={errors.email}
                onChange={(v) => update("email", v)}
                autoComplete="email"
              />
              <TextField
                label="Ville"
                name="city"
                value={draft.city}
                error={errors.city}
                onChange={(v) => update("city", v)}
                autoComplete="address-level2"
              />
              <TextField
                label="Quartier"
                name="district"
                value={draft.district}
                error={errors.district}
                onChange={(v) => update("district", v)}
              />
              <TextField
                label="Personne à contacter"
                name="contactName"
                hint="Une personne de confiance si nous ne parvenons pas à vous joindre."
                value={draft.contactName}
                error={errors.contactName}
                onChange={(v) => update("contactName", v)}
              />
              <TextField
                label="Téléphone de la personne à contacter"
                name="contactPhone"
                type="tel"
                inputMode="tel"
                placeholder="6 71 23 45 67"
                value={draft.contactPhone}
                error={errors.contactPhone}
                onChange={(v) => update("contactPhone", v)}
              />
              <div className="sm:col-span-2">
                <FileUploadField
                  kind="photo"
                  label="Photo de portrait"
                  capture="user"
                  value={draft.photo}
                  error={errors.photoUploadId}
                  onChange={(v) => update("photo", v)}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Genre musical"
                name="musicGenre"
                list="music-genres"
                value={draft.musicGenre}
                error={errors.musicGenre}
                onChange={(v) => update("musicGenre", v)}
              />
              <datalist id="music-genres">
                {MUSIC_GENRES.map((genre) => (
                  <option key={genre} value={genre} />
                ))}
              </datalist>
              <TextField
                label="Chanson envisagée pour la prestation"
                name="songTitle"
                value={draft.songTitle}
                error={errors.songTitle}
                onChange={(v) => update("songTitle", v)}
              />
              <div className="sm:col-span-2">
                <TextAreaField
                  label="Votre parcours musical"
                  name="musicBackground"
                  maxLength={1000}
                  value={draft.musicBackground}
                  error={errors.musicBackground}
                  onChange={(v) => update("musicBackground", v)}
                />
              </div>

              <div className="sm:col-span-2">
                <FileUploadField
                  kind="presentation"
                  label="Votre prestation (casting en ligne)"
                  value={draft.presentation}
                  error={errors.presentationUploadId}
                  onChange={(v) => update("presentation", v)}
                />
              </div>

              <details className="sm:col-span-2">
                <summary className="cursor-pointer py-2 text-sm font-medium text-flame-100">
                  Réseaux sociaux (facultatif)
                </summary>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {(
                    ["facebook", "instagram", "tiktok", "youtube"] as const
                  ).map((network) => (
                    <TextField
                      key={network}
                      label={network.charAt(0).toUpperCase() + network.slice(1)}
                      name={network}
                      type="url"
                      inputMode="url"
                      placeholder="https://"
                      optional
                      value={draft[network]}
                      error={errors[`socialLinks.${network}`]}
                      onChange={(v) => update(network, v)}
                    />
                  ))}
                </div>
              </details>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <Summary draft={draft} onEdit={goTo} />
              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-night-700 p-4">
                <input
                  type="checkbox"
                  checked={draft.acceptRules}
                  onChange={(event) =>
                    update("acceptRules", event.target.checked)
                  }
                  className="mt-1 size-5 shrink-0 accent-[var(--flame-200)]"
                />
                <span className="text-sm">
                  J'accepte le{" "}
                  <Link
                    href="/concours#reglement"
                    target="_blank"
                    className="text-flame-100 underline"
                  >
                    règlement du concours
                  </Link>{" "}
                  et la{" "}
                  <Link
                    href="/confidentialite"
                    target="_blank"
                    className="text-flame-100 underline"
                  >
                    politique de confidentialité
                  </Link>
                  , et je certifie l'exactitude des informations fournies.
                </span>
              </label>
              {errors.acceptRules && (
                <p className="field-error">{errors.acceptRules}</p>
              )}
              <TurnstileWidget onToken={setTurnstileToken} />
            </div>
          )}
        </div>

        {formError && (
          <p
            role="alert"
            className="rounded-md border border-danger/50 bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            {formError}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          {step > 0 ? (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => goTo(step - 1)}
            >
              Retour
            </button>
          ) : (
            <span />
          )}
          <button type="submit" className="btn-flame" disabled={submitting}>
            {isLast
              ? submitting
                ? "Envoi en cours…"
                : "Envoyer mon inscription"
              : "Continuer"}
          </button>
        </div>
        <p className="text-xs text-muted">
          Vos réponses sont enregistrées sur cet appareil jusqu'à l'envoi.
        </p>
      </form>
    </div>
  );
}

type TextFieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  optional?: boolean;
  type?: string;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value" | "name" | "type"
>;

function TextField({
  label,
  name,
  value,
  onChange,
  error,
  hint,
  optional,
  type = "text",
  ...rest
}: TextFieldProps) {
  const id = useId();
  const describedBy =
    [error ? `${id}-error` : null, hint ? `${id}-hint` : null]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}{" "}
        {optional && (
          <span className="font-normal text-muted">(facultatif)</span>
        )}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className="field-input"
        {...rest}
      />
      {hint && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

function TextAreaField({
  label,
  name,
  value,
  onChange,
  error,
  maxLength,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  maxLength: number;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        rows={5}
        maxLength={maxLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={`${id}-count${error ? ` ${id}-error` : ""}`}
        className="field-input"
      />
      <p id={`${id}-count`} className="field-hint text-right">
        {value.length} / {maxLength}
      </p>
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

function Summary({
  draft,
  onEdit,
}: {
  draft: Draft;
  onEdit: (step: number) => void;
}) {
  const rows: { step: number; label: string; value: ReactNode }[] = [
    {
      step: 0,
      label: "Nom complet",
      value: `${draft.firstName} ${draft.lastName}${draft.stageName ? ` (« ${draft.stageName} »)` : ""}`,
    },
    {
      step: 0,
      label: "Date de naissance",
      value: draft.birthDate
        ? new Date(`${draft.birthDate}T12:00:00`).toLocaleDateString("fr-FR")
        : "",
    },
    { step: 1, label: "Téléphone", value: draft.phone },
    { step: 1, label: "E-mail", value: draft.email },
    {
      step: 1,
      label: "Ville / quartier",
      value: `${draft.city}, ${draft.district}`,
    },
    {
      step: 1,
      label: "Personne à contacter",
      value: `${draft.contactName} · ${draft.contactPhone}`,
    },
    {
      step: 1,
      label: "Portrait",
      value: draft.photo?.name ?? "—",
    },
    {
      step: 2,
      label: "Genre / chanson",
      value: `${draft.musicGenre} · ${draft.songTitle}`,
    },
    {
      step: 2,
      label: "Prestation",
      value: draft.presentation?.name ?? "—",
    },
  ];
  return (
    <dl className="divide-y divide-night-800 rounded-md border border-night-800">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-start justify-between gap-3 px-4 py-3 text-sm"
        >
          <div className="min-w-0">
            <dt className="text-muted">{row.label}</dt>
            <dd className="break-words">{row.value}</dd>
          </div>
          <button
            type="button"
            onClick={() => onEdit(row.step)}
            className="shrink-0 text-flame-100 underline"
          >
            Modifier
          </button>
        </div>
      ))}
    </dl>
  );
}

function Confirmation({
  dossierNo,
  email,
}: {
  dossierNo: string;
  email: string;
}) {
  return (
    <section className="card space-y-5 text-center" aria-live="polite">
      <p className="vt-chip mx-auto w-fit">Dossier enregistré</p>
      <p className="vt-kinetic text-4xl text-ink sm:text-5xl">
        <span>Inscription envoyée</span>
      </p>
      <p className="text-muted">
        Conservez précieusement votre numéro de dossier :
      </p>
      <CodeTicket code={dossierNo} />
      <p className="text-sm text-muted">
        Un e-mail de confirmation a été envoyé à {email}.
      </p>
      <p className="text-sm text-muted">
        Le casting en ligne aura lieu le 28 novembre 2026. Vous serez informé(e)
        de la suite par e-mail.
      </p>
      <Link href="/suivre-mon-dossier" className="btn-ghost">
        Suivre mon dossier
      </Link>
    </section>
  );
}

/**
 * Le presse-papiers n'est pas garanti : hors HTTPS, ou après un refus
 * d'autorisation, l'API lève une NotAllowedError. On retombe alors sur une
 * simple sélection du texte, que l'utilisateur copie lui-même.
 */
function CodeTicket({ code }: { code: string }) {
  const codeRef = useRef<HTMLParagraphElement>(null);
  const [status, setStatus] = useState<"idle" | "copied" | "selected">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setStatus("copied");
    } catch {
      const node = codeRef.current;
      const selection = window.getSelection();
      if (!node || !selection) return;
      const range = document.createRange();
      range.selectNodeContents(node);
      selection.removeAllRanges();
      selection.addRange(range);
      setStatus("selected");
    }
  }

  return (
    <div className="space-y-3">
      <p ref={codeRef} className="vt-ticket">
        {code}
      </p>
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          className="btn-ghost min-h-11 px-5 text-sm"
          onClick={() => void copy()}
        >
          Copier le numéro
        </button>
        <output className="block text-xs text-muted">
          {status === "copied"
            ? "Numéro copié dans le presse-papiers."
            : status === "selected"
              ? "Numéro sélectionné : copiez-le avec Ctrl+C, ou appui long sur mobile."
              : "Notez-le ou copiez-le : il sert à suivre votre dossier."}
        </output>
      </div>
    </div>
  );
}

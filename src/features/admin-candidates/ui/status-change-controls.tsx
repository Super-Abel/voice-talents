import {
  CANDIDATE_STATUS_LABELS,
  CANDIDATE_STATUSES,
} from "@/features/registration/domain/candidate-status";

/** Champs du formulaire de changement de statut (individuel ou groupé). */
export function StatusChangeControls({
  formId,
  returnTo,
  label,
}: {
  formId?: string;
  returnTo: string;
  label: string;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="returnTo" value={returnTo} form={formId} />
      <div>
        <label htmlFor={`${formId ?? "single"}-status`} className="field-label">
          {label}
        </label>
        <select
          id={`${formId ?? "single"}-status`}
          name="status"
          form={formId}
          required
          className="field-input min-w-56"
        >
          {CANDIDATE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {CANDIDATE_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>
      <label className="flex min-h-12 items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="notify"
          form={formId}
          className="size-5 accent-[var(--flame-200)]"
        />
        Prévenir par e-mail
      </label>
      <button type="submit" form={formId} className="btn-flame">
        Appliquer
      </button>
    </div>
  );
}

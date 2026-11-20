"use client";

import { type ReactNode, useActionState } from "react";

export type ActionState = { error?: string; success?: string };
type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

export function ActionForm({
  action,
  children,
  submitLabel,
  pendingLabel = "Patientez…",
  className = "space-y-4",
  submitClassName = "btn-flame w-full",
}: {
  action: Action;
  children: ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  className?: string;
  submitClassName?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className={className}>
      {children}
      {state.error && (
        <p
          role="alert"
          className="rounded-md border border-danger/50 bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {state.error}
        </p>
      )}
      {state.success && (
        <output className="block rounded-md border border-success/50 bg-success/10 px-3 py-2 text-sm text-success">
          {state.success}
        </output>
      )}
      <button type="submit" className={submitClassName} disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}

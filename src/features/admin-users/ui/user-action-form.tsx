"use client";

import { type ReactNode, useActionState } from "react";
import type { UserFormState } from "../actions";

type Action = (
  state: UserFormState,
  formData: FormData,
) => Promise<UserFormState>;

export function UserActionForm({
  action,
  children,
  submitLabel,
  confirmMessage,
  className = "space-y-3",
  submitClassName = "btn-flame",
}: {
  action: Action;
  children?: ReactNode;
  submitLabel: string;
  confirmMessage?: string;
  className?: string;
  submitClassName?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form
      action={formAction}
      className={className}
      onSubmit={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage))
          event.preventDefault();
      }}
    >
      {children}
      <button type="submit" className={submitClassName} disabled={pending}>
        {pending ? "…" : submitLabel}
      </button>
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.success && (
        <output className="block rounded-md border border-success/50 bg-success/10 p-3 text-sm text-success">
          <span className="block">{state.success}</span>
          {state.temporaryPassword && (
            <span className="mt-2 block select-all font-mono text-lg text-ink">
              {state.temporaryPassword}
            </span>
          )}
        </output>
      )}
    </form>
  );
}

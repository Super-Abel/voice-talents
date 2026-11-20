import {
  CANDIDATE_STATUS_LABELS,
  type CandidateStatus,
} from "@/features/registration/domain/candidate-status";

const TONES: Record<CandidateStatus, string> = {
  received: "border-night-600 text-muted",
  under_review: "border-flame-100/60 text-flame-100",
  shortlisted: "border-night-600 bg-night-800 text-ink",
  selected: "border-success/60 text-success",
  rejected: "border-danger/60 text-danger",
};

export function StatusBadge({ status }: { status: CandidateStatus }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONES[status]}`}
    >
      {CANDIDATE_STATUS_LABELS[status]}
    </span>
  );
}

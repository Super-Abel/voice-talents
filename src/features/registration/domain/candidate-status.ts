export const CANDIDATE_STATUSES = [
  "received",
  "under_review",
  "shortlisted",
  "selected",
  "rejected",
] as const;
export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];

export const CANDIDATE_STATUS_LABELS: Record<CandidateStatus, string> = {
  received: "Reçu",
  under_review: "En cours d'examen",
  shortlisted: "Présélectionné pour le casting",
  selected: "Retenu (parmi les 40)",
  rejected: "Refusé",
};

export const CANDIDATE_STATUS_DESCRIPTIONS: Record<CandidateStatus, string> = {
  received:
    "Votre dossier est bien enregistré. Il sera examiné après la clôture des inscriptions.",
  under_review: "L'organisation examine actuellement votre dossier.",
  shortlisted:
    "Bravo ! Vous êtes présélectionné(e) pour le casting en ligne. Surveillez vos e-mails et WhatsApp.",
  selected:
    "Félicitations ! Vous faites partie des 40 candidats de l'édition spéciale Douala 2026.",
  rejected:
    "Votre candidature n'a pas été retenue pour cette édition. Merci pour votre participation !",
};

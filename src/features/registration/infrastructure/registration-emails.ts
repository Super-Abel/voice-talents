import "server-only";
import { escapeHtml, sendEmail } from "@/lib/server/email";
import { siteUrl } from "@/lib/server/env";

export async function sendRegistrationConfirmation(
  to: string,
  firstName: string,
  dossierNo: string,
): Promise<void> {
  const name = escapeHtml(firstName);
  const trackUrl = `${siteUrl}/suivre-mon-dossier`;
  await sendEmail({
    to,
    subject: `Voice Talent – Dossier ${dossierNo} bien reçu`,
    text: [
      `Bonjour ${firstName},`,
      "",
      `Votre inscription à Voice Talent – Édition spéciale Douala 2026 est bien enregistrée.`,
      `Numéro de dossier : ${dossierNo}`,
      "",
      `Suivez l'avancement de votre dossier : ${trackUrl}`,
      "(munissez-vous de votre numéro de dossier et de votre téléphone)",
      "",
      "Bonne chance !",
      "L'équipe Voice Talent",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#240046">
        <h1 style="color:#5A189A">Dossier bien reçu</h1>
        <p>Bonjour ${name},</p>
        <p>Votre inscription à <strong>Voice Talent – Édition spéciale Douala 2026</strong> est bien enregistrée.</p>
        <p style="font-size:20px;background:#FF9E00;padding:12px 16px;border-radius:8px;display:inline-block">
          Numéro de dossier : <strong>${dossierNo}</strong>
        </p>
        <p>Suivez l'avancement de votre dossier sur <a href="${trackUrl}">${trackUrl}</a>
           avec votre numéro de dossier et votre téléphone.</p>
        <p>Bonne chance !<br>L'équipe Voice Talent</p>
      </div>`,
  });
}

const STATUS_MESSAGES: Record<string, { subject: string; body: string }> = {
  under_review: {
    subject: "Votre dossier est en cours d'examen",
    body: "Votre dossier est en cours d'examen par l'organisation.",
  },
  shortlisted: {
    subject: "Vous êtes présélectionné(e) pour le casting",
    body: "Félicitations ! Vous êtes présélectionné(e) pour le casting en ligne. L'organisation vous contactera pour les modalités.",
  },
  selected: {
    subject: "Vous faites partie des 40 candidats retenus !",
    body: "Félicitations ! Vous faites partie des 40 candidats retenus pour Voice Talent – Édition spéciale Douala 2026.",
  },
  rejected: {
    subject: "Résultat de votre candidature",
    body: "Après examen, votre candidature n'a pas été retenue pour cette édition. Merci pour votre participation et à bientôt !",
  },
};

export async function sendStatusNotification(
  to: string,
  firstName: string,
  dossierNo: string,
  status: string,
): Promise<boolean> {
  const message = STATUS_MESSAGES[status];
  if (!message) return false;
  return sendEmail({
    to,
    subject: `Voice Talent – ${message.subject}`,
    text: `Bonjour ${firstName},\n\n${message.body}\n\nDossier : ${dossierNo}\n\nL'équipe Voice Talent`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#240046">
      <p>Bonjour ${escapeHtml(firstName)},</p><p>${message.body}</p>
      <p>Dossier : <strong>${dossierNo}</strong></p><p>L'équipe Voice Talent</p></div>`,
  });
}

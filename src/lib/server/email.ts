import "server-only";
import { serverEnv } from "./env";

type EmailMessage = { to: string; subject: string; html: string; text: string };

export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const env = serverEnv();
  if (!env.RESEND_API_KEY) {
    console.info(
      `[email] RESEND_API_KEY absent : « ${message.subject} » non envoyé`,
    );
    return false;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  });
  if (!response.ok) {
    console.error(`[email] échec d'envoi (${response.status})`);
    return false;
  }
  return true;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

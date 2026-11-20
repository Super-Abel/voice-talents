import { after } from "next/server";
import { submitRegistration } from "@/features/registration/application/submit-registration";
import { sendRegistrationConfirmation } from "@/features/registration/infrastructure/registration-emails";
import { supabaseRegistrationPorts } from "@/features/registration/infrastructure/supabase-registration-ports";
import { allowRequest } from "@/lib/server/rate-limit";
import { clientIpFrom } from "@/lib/server/request";
import { verifyTurnstile } from "@/lib/server/turnstile";

export async function POST(request: Request) {
  const ip = clientIpFrom(request.headers);
  // Limites larges par IP : les opérateurs mobiles partagent une IP entre de nombreux abonnés (CGNAT).
  if (!(await allowRequest("registration", ip, 60, 600))) {
    return Response.json(
      {
        error:
          "Trop de tentatives depuis cette connexion. Réessayez plus tard.",
      },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body || typeof body !== "object")
    return Response.json({ error: "Requête invalide." }, { status: 400 });

  const phoneKey =
    typeof body.phone === "string"
      ? body.phone.replace(/\D/g, "").slice(-9)
      : "";
  if (
    phoneKey &&
    !(await allowRequest("registration-phone", phoneKey, 8, 3600))
  ) {
    return Response.json(
      { error: "Trop de tentatives pour ce numéro. Réessayez plus tard." },
      { status: 429 },
    );
  }

  // Champ piège invisible : seul un robot le remplit.
  if (typeof body.website === "string" && body.website.length > 0) {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  if (
    !(await verifyTurnstile(
      typeof body.turnstileToken === "string" ? body.turnstileToken : undefined,
      ip,
    ))
  ) {
    return Response.json(
      { error: "Vérification anti-robot échouée. Rechargez la page." },
      { status: 400 },
    );
  }

  const result = await submitRegistration(body, supabaseRegistrationPorts);

  switch (result.status) {
    case "window_closed":
      return Response.json({ error: result.message }, { status: 403 });
    case "invalid":
      return Response.json(
        {
          error: "Certains champs sont à corriger.",
          fieldErrors: result.fieldErrors,
        },
        { status: 422 },
      );
    case "created":
      after(() =>
        sendRegistrationConfirmation(
          result.email,
          result.firstName,
          result.dossierNo,
        ),
      );
      return Response.json({ dossierNo: result.dossierNo }, { status: 201 });
  }
}

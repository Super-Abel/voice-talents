import { z } from "zod";
import { normalizeCameroonMobile } from "@/features/registration/domain/phone";
import { BackendError, lookupStatusFromBackend } from "@/lib/server/backend";
import { allowRequest } from "@/lib/server/rate-limit";
import { clientIpFrom } from "@/lib/server/request";

const lookupSchema = z.object({
  dossierNo: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^VT-\d{4}-\d{4,}$/),
  phone: z.string().max(30),
});

/* Toute réponse négative se ressemble : un tiers ne doit pas deviner si le
   numéro de dossier existe sans le téléphone associé. */
const NOT_FOUND = "Aucun dossier ne correspond à ce numéro et ce téléphone.";

export async function POST(request: Request) {
  const ip = clientIpFrom(request.headers);
  const tooMany = Response.json(
    { error: "Trop de tentatives. Réessayez dans quelques minutes." },
    { status: 429 },
  );
  if (!(await allowRequest("status-lookup", ip, 60, 600))) return tooMany;

  const parsed = lookupSchema.safeParse(await request.json().catch(() => null));
  const phone = parsed.success
    ? normalizeCameroonMobile(parsed.data.phone)
    : null;
  if (!parsed.success || !phone)
    return Response.json({ error: NOT_FOUND }, { status: 404 });
  if (
    !(await allowRequest(
      "status-lookup-dossier",
      parsed.data.dossierNo,
      10,
      600,
    ))
  )
    return tooMany;

  try {
    const application = await lookupStatusFromBackend({
      dossierNo: parsed.data.dossierNo,
      phone,
    });
    return Response.json(application, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof BackendError && error.isClientError)
      return Response.json({ error: NOT_FOUND }, { status: 404 });
    return Response.json(
      { error: "Recherche temporairement indisponible. Réessayez." },
      { status: 503 },
    );
  }
}

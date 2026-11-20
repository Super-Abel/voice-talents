import { z } from "zod";
import { normalizeCameroonMobile } from "@/features/registration/domain/phone";
import { db } from "@/lib/server/db";
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

  const { data, error } = await db()
    .from("candidates")
    .select("dossier_no, first_name, status, created_at, status_changed_at")
    .eq("dossier_no", parsed.data.dossierNo)
    .eq("phone", phone)
    .maybeSingle();
  if (error) throw error;
  if (!data) return Response.json({ error: NOT_FOUND }, { status: 404 });

  return Response.json(
    {
      dossierNo: data.dossier_no,
      firstName: data.first_name,
      status: data.status,
      submittedAt: data.created_at,
      updatedAt: data.status_changed_at,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

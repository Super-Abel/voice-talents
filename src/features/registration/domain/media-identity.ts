import { formatCameroonMobile, normalizeCameroonMobile } from "./phone";

export type CandidateIdentity = {
  firstName: string;
  lastName: string;
  phone: string;
};

const NAME_MAX_LENGTH = 42;
const SLUG_MAX_LENGTH = 40;

function fullName(identity: CandidateIdentity): string {
  return `${identity.firstName} ${identity.lastName}`
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Identifiant gravé dans les médias. Le backend ne conserve ni le nom du
 * fichier ni l'identité à côté de l'octet, donc la seule trace fiable est
 * celle que le candidat transporte lui-même dans l'image et le conteneur.
 */
export function mediaBadge(identity: CandidateIdentity): string {
  const name = fullName(identity).slice(0, NAME_MAX_LENGTH);
  const mobile = normalizeCameroonMobile(identity.phone);
  return [name, mobile ? formatCameroonMobile(mobile) : ""]
    .filter(Boolean)
    .join(" · ");
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX_LENGTH);
}

/**
 * Nom de fichier du média préparé : `prenom-nom-6XXXXXXXX-presentation.mp4`.
 * Il part déjà dans la demande de ticket, où le backend l'ignore aujourd'hui.
 */
export function mediaFileName(
  identity: CandidateIdentity,
  kind: "photo" | "presentation",
  extension: string,
): string {
  const mobile = normalizeCameroonMobile(identity.phone)?.replace(/^\+237/, "");
  const parts = [
    slug(fullName(identity)) || "candidat",
    mobile,
    kind === "photo" ? "portrait" : "presentation",
  ].filter(Boolean);
  return `${parts.join("-")}.${extension}`;
}

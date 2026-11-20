export const ADMIN_ROLES = [
  "super_admin",
  "admin",
  "jury",
  "controller",
] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super administrateur",
  admin: "Administrateur",
  jury: "Jury",
  controller: "Contrôleur",
};

export const ROLES_REQUIRING_TOTP: readonly AdminRole[] = [
  "super_admin",
  "admin",
];

export const BACK_OFFICE_ROLES: readonly AdminRole[] = ["super_admin", "admin"];
export const SUPER_ADMIN_ONLY: readonly AdminRole[] = ["super_admin"];

export function homePathFor(role: AdminRole): string {
  if (role === "jury") return "/admin/jury";
  if (role === "controller") return "/admin/controle";
  return "/admin";
}

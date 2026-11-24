// Usage : pnpm admin:create --email jury@voicetalent.cm --role jury --name "Juré 1"
import { randomInt } from "node:crypto";
import { parseArgs } from "node:util";
import { hash } from "@node-rs/argon2";
import { createClient } from "@supabase/supabase-js";
import {
  ADMIN_ROLE_LABELS,
  ADMIN_ROLES,
  type AdminRole,
} from "../src/features/admin-auth/domain/roles";

try {
  process.loadEnvFile(".env.local");
} catch {}

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    name: { type: "string" },
    role: { type: "string" },
  },
});
const email = values.email?.trim().toLowerCase();
const role = (values.role?.trim() || "super_admin") as AdminRole;
if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error(
    `Usage : pnpm admin:create --email <e-mail> [--role ${ADMIN_ROLES.join("|")}] [--name "Nom"]`,
  );
  process.exit(1);
}
if (!ADMIN_ROLES.includes(role)) {
  console.error(`Rôle inconnu : ${role}. Attendu : ${ADMIN_ROLES.join(", ")}.`);
  process.exit(1);
}
const name = values.name?.trim() || ADMIN_ROLE_LABELS[role];

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis (.env.local ou environnement).",
  );
  process.exit(1);
}

const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
const password = `${Array.from({ length: 16 }, () => alphabet[randomInt(alphabet.length)]).join("")}7a`;

const db = createClient(url, key, { auth: { persistSession: false } });
const { data, error } = await db
  .from("admin_users")
  .insert({
    email,
    display_name: name,
    role,
    password_hash: await hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    }),
    must_change_password: true,
  })
  .select("id")
  .single();

if (error) {
  console.error(
    error.code === "23505"
      ? "Un compte existe déjà avec cet e-mail."
      : error.message,
  );
  process.exit(1);
}

await db.from("audit_log").insert({
  action: "admin_user.created",
  entity: "admin_user",
  entity_id: data.id,
  after: { email, role, via: "seed" },
});

console.log(`${ADMIN_ROLE_LABELS[role]} créé : ${email}`);
console.log(
  `Mot de passe temporaire (à changer à la première connexion) : ${password}`,
);

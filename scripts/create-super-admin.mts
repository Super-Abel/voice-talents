// Usage : pnpm admin:create --email direction@exemple.cm --name "Direction"
import { randomInt } from "node:crypto";
import { parseArgs } from "node:util";
import { hash } from "@node-rs/argon2";
import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env.local");
} catch {}

const { values } = parseArgs({
  options: { email: { type: "string" }, name: { type: "string" } },
});
const email = values.email?.trim().toLowerCase();
const name = values.name?.trim() || "Super administrateur";
if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error('Usage : pnpm admin:create -- --email <e-mail> [--name "Nom"]');
  process.exit(1);
}

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
    role: "super_admin",
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
  after: { email, role: "super_admin", via: "seed" },
});

console.log(`Super administrateur créé : ${email}`);
console.log(
  `Mot de passe temporaire (à changer à la première connexion) : ${password}`,
);

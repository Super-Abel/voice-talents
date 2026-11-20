import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

const dir = process.argv[2];
const db = new PGlite({ extensions: { pgcrypto, pg_trgm } });
for (const f of readdirSync(dir).sort()) {
  await db.exec(readFileSync(join(dir, f), "utf8"));
  console.log("OK migration", f);
}

let fails = 0;
const check = (name, cond, extra = "") => {
  console.log(cond ? "PASS" : "FAIL", name, extra);
  if (!cond) fails++;
};
const one = async (sql, p = []) => (await db.query(sql, p)).rows[0];
const throws = async (sql, p = []) => {
  try {
    await db.query(sql, p);
    return null;
  } catch (e) {
    return e.message;
  }
};

check("8 émissions", (await one("select count(*)::int n from events")).n === 8);
check(
  "11 catégories de billets",
  (await one("select count(*)::int n from ticket_categories")).n === 11,
);
check(
  "22 paramètres",
  (await one("select count(*)::int n from settings")).n === 22,
);

const cand = (i, phone, email) =>
  db.query(
    `insert into candidates (last_name, first_name, birth_date, gender, phone, email, city, district, id_number,
     photo_path, music_genre, song_title, music_background, presentation_url, consent_at, status)
   values ($1, 'Test', '2000-01-01', 'female', $2, $3, 'Douala', 'Akwa', 'ID123456', 'p.jpg', 'Afro', 'Song', 'Bio',
     'https://www.youtube.com/watch?v=x', now(), 'selected') returning id, dossier_no`,
    [`Cand${i}`, phone, email],
  );

const a = (await cand(1, "+237690000001", "a@x.cm")).rows[0];
check("dossier VT-2026-0001", a.dossier_no === "VT-2026-0001", a.dossier_no);
const dupPhone = await cand(9, "+237690000001", "z@x.cm").then(
  () => null,
  (e) => e.message,
);
check(
  "doublon téléphone refusé",
  /candidates_phone_key/.test(dupPhone ?? ""),
  dupPhone,
);
const dupMail = await cand(9, "+237690000009", "a@x.cm").then(
  () => null,
  (e) => e.message,
);
check(
  "doublon e-mail refusé",
  /candidates_email_key/.test(dupMail ?? ""),
  dupMail,
);
const badPhone = await cand(9, "+237290000009", "q@x.cm").then(
  () => null,
  (e) => e.message,
);
check("téléphone non mobile refusé", !!badPhone);
const b = (await cand(2, "+237690000002", "b@x.cm")).rows[0];
const c = (await cand(3, "+237690000003", "c@x.cm")).rows[0];
check(
  "pas de trou après doublons (0002, 0003)",
  b.dossier_no === "VT-2026-0002" && c.dossier_no === "VT-2026-0003",
  `${b.dossier_no} ${c.dossier_no}`,
);

const ev1 = (
  await one(`update events set vote_opens_at = now() - interval '1 hour', vote_closes_at = now() + interval '1 hour'
  where slug = 'premiere-phase-1' returning id`)
).id;
check(
  "fenêtre de vote refusée sur battle",
  !!(await throws(
    `update events set vote_opens_at = now(), vote_closes_at = now() + interval '1h' where slug = 'battles-1'`,
  )),
);
for (const [i, x] of [a, b, c].entries())
  await db.query("insert into event_candidates values ($1, $2, $3)", [
    ev1,
    x.id,
    i + 1,
  ]);

const txn = (ref, cid, qty) =>
  db.query(
    `insert into transactions (reference, kind, provider, amount_xaf, event_id, candidate_id, quantity, phone, expires_at)
   values ($1, 'vote', 'notchpay', $2, $3, $4, $5, '+237670000000', now() + interval '30 min')`,
    [ref, qty * 100, ev1, cid, qty],
  );

await txn("V-A", a.id, 60);
await txn("V-B", b.id, 30);
await txn("V-C", c.id, 10);
const r1 = (await one(`select confirm_payment('V-A', 'np_1', '{}') r`)).r;
const r2 = (await one(`select confirm_payment('V-A', 'np_1', '{}') r`)).r;
check(
  "webhook 1 = crédité, rejoué = duplicate",
  r1 === "credited" && r2 === "duplicate",
  `${r1}/${r2}`,
);
await one(`select confirm_payment('V-B', 'np_2', '{}')`);
await one(`select confirm_payment('V-C', 'np_3', '{}')`);
check(
  "un seul crédit pour V-A",
  (
    await one(
      `select sum(quantity)::int n from votes where candidate_id = $1`,
      [a.id],
    )
  ).n === 60,
);
check(
  "webhook inconnu",
  (await one(`select confirm_payment('NOPE', null, '{}') r`)).r === "unknown",
);

const juror = async (e) =>
  (
    await one(
      `insert into admin_users (email, display_name, role, password_hash) values ($1, $1, 'jury', 'x') returning id`,
      [e],
    )
  ).id;
const j1 = await juror("j1@x.cm"),
  j2 = await juror("j2@x.cm");
for (const [x, s] of [
  [a, 10],
  [b, 18],
  [c, 20],
])
  for (const j of [j1, j2])
    await db.query(
      "insert into jury_scores (event_id, candidate_id, juror_id, score) values ($1,$2,$3,$4)",
      [ev1, x.id, j, s],
    );

// Attendu à la main : A = 0,6×60 + 0,4×50 = 56 ; B = 0,6×30 + 0,4×90 = 54 ; C = 0,6×10 + 0,4×100 = 46
const rows = (
  await db.query(
    `select candidate_id, final_score::float f, rank::int r from event_scores where event_id = $1 order by rank`,
    [ev1],
  )
).rows;
const got = rows
  .map(
    (r) =>
      `${r.candidate_id === a.id ? "A" : r.candidate_id === b.id ? "B" : "C"}=${r.f}#${r.r}`,
  )
  .join(" ");
check(
  "classement 60/40 (A=56, B=54, C=46)",
  got === "A=56#1 B=54#2 C=46#3",
  got,
);

await db.query(`update jury_scores set locked_at = now() where juror_id = $1`, [
  j1,
]);
check(
  "note verrouillée non modifiable",
  /jury_score_locked/.test(
    (await throws(`update jury_scores set score = 1 where juror_id = $1`, [
      j1,
    ])) ?? "",
  ),
);
check(
  "déverrouillage possible",
  !(await throws(
    `update jury_scores set score = 11, locked_at = null where juror_id = $1 and candidate_id = $2`,
    [j1, a.id],
  )),
);

await db.query(
  `update events set vote_closes_at = now() - interval '1 second', vote_opens_at = now() - interval '2 hour' where id = $1`,
  [ev1],
);
await txn("V-LATE", a.id, 5);
check(
  "webhook après clôture = non crédité",
  (await one(`select confirm_payment('V-LATE', 'np_9', '{}') r`)).r ===
    "rejected_late",
);

const cat = await one(
  `update ticket_categories set capacity = 2 where event_id = (select id from events where slug='premiere-phase-2') returning id, event_id`,
);
const tTxn = async (ref, qty) =>
  (
    await one(
      `insert into transactions (reference, kind, provider, amount_xaf, event_id, category_id, quantity, phone, payer_name, expires_at)
   values ($1, 'ticket', 'notchpay', $2, $3, $4, $5, '+237670000000', 'Jean', now() + interval '30 min') returning id`,
      [ref, qty * 1000, cat.event_id, cat.id, qty],
    )
  ).id;
const t1 = await tTxn("T-1", 2),
  t2 = await tTxn("T-2", 1);
const res1 = (await one("select reserve_tickets($1) r", [t1])).r;
const res2 = (await one("select reserve_tickets($1) r", [t2])).r;
check(
  "réservation puis complet (pas de survente)",
  res1 === "reserved" && res2 === "sold_out",
  `${res1}/${res2}`,
);
check(
  "billets confirmés",
  (await one(`select confirm_payment('T-1', 'np_t1', '{}') r`)).r ===
    "credited",
);

const ctrl = (
  await one(
    `insert into admin_users (email, display_name, role, password_hash) values ('ctl@x.cm', 'Contrôleur 1', 'controller', 'x') returning id`,
  )
).id;
const tk = await one(
  `select qr_token from tickets where transaction_id = $1 and status = 'valid' limit 1`,
  [t1],
);
const s1 = (
  await one("select result from scan_ticket($1, $2, $3)", [
    tk.qr_token,
    cat.event_id,
    ctrl,
  ])
).result;
const s2 = await one(
  "select result, used_by_name from scan_ticket($1, $2, $3)",
  [tk.qr_token, cat.event_id, ctrl],
);
const s3 = (
  await one("select result from scan_ticket($1, $2, $3)", [
    tk.qr_token,
    ev1,
    ctrl,
  ])
).result;
const s4 = (
  await one(`select result from scan_ticket('\\x00'::bytea, $1, $2)`, [
    cat.event_id,
    ctrl,
  ])
).result;
check(
  "scan : valide → déjà utilisé → mauvaise émission → invalide",
  s1 === "valid" &&
    s2.result === "already_used" &&
    s3 === "wrong_event" &&
    s4 === "invalid",
  `${s1}/${s2.result}(${s2.used_by_name})/${s3}/${s4}`,
);

check(
  "échec paiement marqué",
  (await one(`select fail_payment('T-2', 'failed', null) r`)).r === true,
);
check(
  "échec paiement non rejouable",
  (await one(`select fail_payment('T-2', 'failed', null) r`)).r === false,
);

await db.query(`insert into audit_log (action, entity) values ('test', 'x')`);
check(
  "journal non modifiable",
  /append_only/.test((await throws(`update audit_log set action = 'y'`)) ?? ""),
);
check(
  "journal non supprimable",
  /append_only/.test((await throws(`delete from audit_log`)) ?? ""),
);

const rl = [];
for (let i = 0; i < 3; i++)
  rl.push((await one(`select hit_rate_limit('ip:1', 60, 2) r`)).r);
check(
  "limitation de débit (2 max)",
  rl.join() === "true,true,false",
  rl.join(),
);

check(
  "RLS active partout",
  (
    await one(
      `select count(*)::int n from pg_tables where schemaname='public' and not rowsecurity`,
    )
  ).n === 0,
);

const list = async (args) =>
  (await db.query(`select * from admin_list_candidates(${args})`)).rows;
const all = await list(`p_limit => 2`);
check(
  "liste paginée + total",
  all.length === 2 && Number(all[0].total_count) === 3,
  `${all.length}/${all[0]?.total_count}`,
);
check("recherche par nom", (await list(`p_q => 'cand2'`)).length === 1);
check(
  "recherche par dossier",
  (await list(`p_q => 'vt-2026-0003'`)).length === 1,
);
check("joker % neutralisé", (await list(`p_q => '%'`)).length === 0);
check(
  "tri non autorisé ignoré",
  (await list(`p_sort => 'phone; drop table candidates'`)).length === 3,
);

const changed = (
  await db.query(
    `select * from admin_set_candidates_status(array[$1, $2]::uuid[], 'rejected', $3, '127.0.0.1')`,
    [a.id, b.id, j1],
  )
).rows;
check(
  "statut groupé",
  changed.length === 2 && changed[0].previous_status === "selected",
);
check(
  "statut groupé journalisé",
  (
    await one(
      `select count(*)::int n from audit_log where action = 'candidate.status_changed'`,
    )
  ).n === 2,
);
const stats = (await one("select admin_registration_stats() s")).s;
check(
  "stats",
  stats.total === 3 && stats.by_status.rejected === 2,
  JSON.stringify(stats.by_status),
);

check(
  "paramètre mis à jour + journal",
  (
    await one(
      `select admin_update_settings('{"vote_price_xaf": 150, "age_min": 18}', $1, null) n`,
      [j1],
    )
  ).n === 1,
);
check(
  "paramètre inconnu refusé",
  /unknown_setting/.test(
    (await throws(`select admin_update_settings('{"hack": 1}', $1, null)`, [
      j1,
    ])) ?? "",
  ),
);

console.log(fails ? `\n${fails} échec(s)` : "\nTous les tests passent");
process.exit(fails ? 1 : 0);

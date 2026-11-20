-- Voice Talent – Édition spéciale Douala 2026 : schéma initial.
-- Accès uniquement via la Function `app` (service role) : RLS activée sans policy sur toutes les tables.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- ───────────────────────── Types ─────────────────────────

create type candidate_status as enum ('received', 'under_review', 'shortlisted', 'selected', 'rejected');
create type gender as enum ('female', 'male');
create type admin_role as enum ('super_admin', 'admin', 'jury', 'controller');
create type event_phase as enum ('first_round', 'battle', 'semi_final', 'final');
create type upload_kind as enum ('photo', 'presentation', 'id_scan');
create type transaction_kind as enum ('vote', 'ticket');
create type transaction_status as enum ('pending', 'succeeded', 'failed', 'expired');
create type credit_status as enum ('pending', 'credited', 'rejected_late', 'not_applicable');
create type ticket_status as enum ('reserved', 'valid', 'used', 'released', 'cancelled');
create type ticket_channel as enum ('online', 'box_office');
create type vote_source as enum ('payment', 'manual_adjustment');

create function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create function phase_has_public_vote(p event_phase) returns boolean
language sql immutable as $$ select p in ('first_round', 'semi_final') $$;

-- ───────────────────────── Paramètres ─────────────────────────

create table settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid
);

-- ───────────────────────── Back-office ─────────────────────────

create table admin_users (
  id                    uuid primary key default gen_random_uuid(),
  email                 text not null unique check (email = lower(email)),
  display_name          text not null check (char_length(display_name) between 1 and 80),
  role                  admin_role not null,
  password_hash         text not null,
  must_change_password  boolean not null default true,
  totp_secret_enc       text,
  totp_enabled_at       timestamptz,
  totp_last_step        bigint,
  failed_attempts       smallint not null default 0,
  locked_until          timestamptz,
  is_active             boolean not null default true,
  last_login_at         timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create trigger admin_users_updated_at before update on admin_users
  for each row execute function set_updated_at();

alter table settings add constraint settings_updated_by_fk
  foreign key (updated_by) references admin_users(id) on delete set null;

-- id = SHA-256 du jeton du cookie (le jeton brut n'est jamais stocké).
create table sessions (
  id            text primary key,
  user_id       uuid not null references admin_users(id) on delete cascade,
  mfa_verified  boolean not null default false,
  ip            inet,
  user_agent    text,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  expires_at    timestamptz not null
);
create index sessions_user_idx on sessions (user_id);
create index sessions_expires_idx on sessions (expires_at);

-- ───────────────────────── Candidats ─────────────────────────

-- Compteur de dossiers : incrémenté dans la même transaction que l'insertion,
-- donc un doublon rejeté (rollback) ne laisse pas de trou.
create table dossier_counters (
  year        int primary key,
  last_value  int not null
);

create table candidates (
  id                  uuid primary key default gen_random_uuid(),
  dossier_no          text not null unique,
  last_name           text not null check (char_length(last_name) between 1 and 80),
  first_name          text not null check (char_length(first_name) between 1 and 80),
  stage_name          text check (char_length(stage_name) between 1 and 80),
  birth_date          date not null check (birth_date > date '1950-01-01'),
  gender              gender not null,
  phone               text not null unique check (phone ~ '^\+2376[0-9]{8}$'),
  email               text not null unique check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  city                text not null check (char_length(city) between 1 and 80),
  district            text not null check (char_length(district) between 1 and 80),
  id_number           text not null check (char_length(id_number) between 4 and 40),
  id_scan_path        text,
  photo_path          text not null,
  music_genre         text not null check (char_length(music_genre) between 1 and 60),
  song_title          text not null check (char_length(song_title) between 1 and 150),
  music_background    text not null check (char_length(music_background) between 1 and 1000),
  social_links        jsonb not null default '{}'::jsonb,
  presentation_path   text,
  presentation_url    text check (presentation_url ~ '^https://([a-z]+\.)?(youtube\.com|youtu\.be|tiktok\.com)/'),
  consent_at          timestamptz not null,
  status              candidate_status not null default 'received',
  status_changed_at   timestamptz,
  public_profile      boolean not null default false,
  public_slug         text unique check (public_slug ~ '^[a-z0-9-]{2,80}$'),
  public_bio          text check (char_length(public_bio) <= 1000),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint presentation_required check (presentation_path is not null or presentation_url is not null),
  constraint public_only_if_selected check (not public_profile or status = 'selected')
);
create index candidates_status_idx on candidates (status);
create index candidates_city_idx on candidates (city);
create index candidates_genre_idx on candidates (music_genre);
create index candidates_birth_idx on candidates (birth_date);
create index candidates_created_idx on candidates (created_at);
create index candidates_public_idx on candidates (public_profile) where public_profile;
create index candidates_search_idx on candidates using gin (
  (lower(last_name || ' ' || first_name || ' ' || coalesce(stage_name, ''))) extensions.gin_trgm_ops
);

create function candidates_assign_dossier() returns trigger language plpgsql as $$
declare
  y int := extract(year from now() at time zone 'Africa/Douala')::int;
  n int;
begin
  insert into dossier_counters (year, last_value) values (y, 1)
  on conflict (year) do update set last_value = dossier_counters.last_value + 1
  returning last_value into n;
  new.dossier_no := format('VT-%s-%s', y, lpad(n::text, 4, '0'));
  return new;
end $$;
create trigger candidates_dossier before insert on candidates
  for each row execute function candidates_assign_dossier();
create trigger candidates_updated_at before update on candidates
  for each row execute function set_updated_at();

create function candidates_public_limit() returns trigger language plpgsql as $$
begin
  if new.public_profile and not coalesce(old.public_profile, false) then
    perform pg_advisory_xact_lock(hashtext('candidates_public_limit'));
    if (select count(*) from candidates where public_profile and id <> new.id) >= 40 then
      raise exception 'public_profile_limit_reached' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
create trigger candidates_public_limit before insert or update of public_profile on candidates
  for each row execute function candidates_public_limit();

-- URL d'envoi signées émises par la Function ; un fichier n'est rattaché à un dossier
-- que s'il correspond à une ligne non utilisée et non expirée.
create table uploads (
  id            uuid primary key default gen_random_uuid(),
  path          text not null unique,
  kind          upload_kind not null,
  mime          text not null,
  max_bytes     int not null check (max_bytes > 0),
  ip_hash       text,
  issued_at     timestamptz not null default now(),
  expires_at    timestamptz not null,
  candidate_id  uuid references candidates(id) on delete set null,
  used_at       timestamptz
);
create index uploads_candidate_idx on uploads (candidate_id);
create index uploads_unused_idx on uploads (issued_at) where used_at is null;

-- ───────────────────────── Compétition ─────────────────────────

create table events (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null unique check (slug ~ '^[a-z0-9-]{2,80}$'),
  name                  text not null,
  phase                 event_phase not null,
  round_no              smallint not null default 1,
  starts_at             timestamptz not null,
  venue                 text,
  capacity              int check (capacity >= 0),
  vote_opens_at         timestamptz,
  vote_closes_at        timestamptz,
  imposed_songs         text[] not null default '{}',
  results_published_at  timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint vote_window_pair check ((vote_opens_at is null) = (vote_closes_at is null)),
  constraint vote_window_order check (vote_opens_at is null or vote_opens_at < vote_closes_at),
  constraint vote_only_public_phases check (vote_opens_at is null or phase_has_public_vote(phase))
);
create index events_starts_idx on events (starts_at);
create index events_phase_idx on events (phase);
create trigger events_updated_at before update on events
  for each row execute function set_updated_at();

create table event_candidates (
  event_id       uuid not null references events(id) on delete cascade,
  candidate_id   uuid not null references candidates(id) on delete restrict,
  running_order  smallint,
  primary key (event_id, candidate_id)
);
create index event_candidates_candidate_idx on event_candidates (candidate_id);

create table duels (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references events(id) on delete cascade,
  position      smallint not null,
  candidate_a   uuid not null references candidates(id),
  candidate_b   uuid not null references candidates(id),
  imposed_song  text,
  winner_id     uuid references candidates(id),
  unique (event_id, position),
  check (candidate_a <> candidate_b),
  check (winner_id is null or winner_id in (candidate_a, candidate_b))
);
create index duels_a_idx on duels (candidate_a);
create index duels_b_idx on duels (candidate_b);

create table ticket_categories (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  code        text not null check (code in ('standard', 'vip', 'vip_premium')),
  label       text not null,
  price_xaf   int not null check (price_xaf > 0),
  capacity    int not null default 0 check (capacity >= 0),
  unique (event_id, code)
);

-- ───────────────────────── Paiements ─────────────────────────

create table transactions (
  id             uuid primary key default gen_random_uuid(),
  reference      text not null unique,
  kind           transaction_kind not null,
  provider       text not null,
  provider_ref   text,
  amount_xaf     int not null check (amount_xaf > 0),
  currency       char(3) not null default 'XAF' check (currency = 'XAF'),
  status         transaction_status not null default 'pending',
  credit_status  credit_status not null default 'pending',
  event_id       uuid not null references events(id),
  candidate_id   uuid references candidates(id),
  category_id    uuid references ticket_categories(id),
  quantity       int not null,
  payer_name     text,
  phone          text not null check (phone ~ '^\+2376[0-9]{8}$'),
  email          text check (email = lower(email)),
  payload        jsonb,
  ip_hash        text,
  expires_at     timestamptz not null,
  confirmed_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (provider, provider_ref),
  constraint vote_shape check (kind <> 'vote' or (candidate_id is not null and category_id is null and quantity between 1 and 1000)),
  constraint ticket_shape check (kind <> 'ticket' or (category_id is not null and candidate_id is null and quantity between 1 and 10))
);
create index transactions_status_idx on transactions (status, created_at);
create index transactions_event_idx on transactions (event_id, kind);
create index transactions_phone_idx on transactions (phone);
create index transactions_ip_idx on transactions (ip_hash, created_at);
create trigger transactions_updated_at before update on transactions
  for each row execute function set_updated_at();

-- Un seul crédit par transaction (UNIQUE) : un webhook rejoué ne crédite jamais deux fois.
create table votes (
  id              uuid primary key default gen_random_uuid(),
  transaction_id  uuid unique references transactions(id),
  event_id        uuid not null references events(id),
  candidate_id    uuid not null references candidates(id),
  quantity        int not null check (quantity <> 0),
  source          vote_source not null,
  reason          text,
  created_by      uuid references admin_users(id),
  created_at      timestamptz not null default now(),
  constraint payment_vote check (source <> 'payment' or (transaction_id is not null and quantity > 0)),
  constraint manual_vote check (source <> 'manual_adjustment' or (transaction_id is null and reason is not null and created_by is not null))
);
create index votes_event_candidate_idx on votes (event_id, candidate_id);
create index votes_created_idx on votes (created_at);

create table tickets (
  id              uuid primary key default gen_random_uuid(),
  qr_token        bytea not null unique default extensions.gen_random_bytes(16),
  event_id        uuid not null references events(id),
  category_id     uuid not null references ticket_categories(id),
  transaction_id  uuid references transactions(id),
  channel         ticket_channel not null,
  status          ticket_status not null,
  reserved_until  timestamptz,
  price_xaf       int not null check (price_xaf >= 0),
  holder_name     text not null,
  phone           text check (phone ~ '^\+2376[0-9]{8}$'),
  email           text check (email = lower(email)),
  used_at         timestamptz,
  used_by         uuid references admin_users(id),
  created_by      uuid references admin_users(id),
  created_at      timestamptz not null default now(),
  constraint reserved_has_deadline check (status <> 'reserved' or reserved_until is not null),
  constraint used_has_trace check (status <> 'used' or (used_at is not null and used_by is not null))
);
create index tickets_category_status_idx on tickets (category_id, status);
create index tickets_event_status_idx on tickets (event_id, status);
create index tickets_transaction_idx on tickets (transaction_id);
create index tickets_phone_idx on tickets (phone);

-- ───────────────────────── Jury et résultats ─────────────────────────

create table jury_scores (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references events(id),
  candidate_id  uuid not null references candidates(id),
  juror_id      uuid not null references admin_users(id),
  score         numeric(5,2) not null,
  max_score     numeric(5,2) not null default 20 check (max_score > 0),
  locked_at     timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (event_id, candidate_id, juror_id),
  check (score >= 0 and score <= max_score)
);
create index jury_scores_candidate_idx on jury_scores (candidate_id);
create trigger jury_scores_updated_at before update on jury_scores
  for each row execute function set_updated_at();

-- Une note verrouillée ne change que si l'on déverrouille dans la même requête (super admin, tracé au journal).
create function jury_scores_lock_guard() returns trigger language plpgsql as $$
begin
  if old.locked_at is not null and new.locked_at is not null
     and (new.score, new.max_score) is distinct from (old.score, old.max_score) then
    raise exception 'jury_score_locked' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger jury_scores_lock before update on jury_scores
  for each row execute function jury_scores_lock_guard();

-- Instantané figé au moment de la publication par l'admin.
create table event_results (
  event_id      uuid not null references events(id) on delete cascade,
  candidate_id  uuid not null references candidates(id),
  votes         bigint not null,
  public_share  numeric(9,4) not null,
  jury_share    numeric(9,4) not null,
  final_score   numeric(9,4) not null,
  rank          int not null,
  qualified     boolean not null default false,
  published_at  timestamptz not null default now(),
  published_by  uuid references admin_users(id),
  primary key (event_id, candidate_id)
);

-- Classement calculé en direct : part publique = votes ÷ total × 100 ; part jury = moyenne des notes ramenées sur 100.
create view event_scores with (security_invoker = true) as
with v as (
  select event_id, candidate_id, sum(quantity)::bigint as votes
  from votes group by event_id, candidate_id
),
j as (
  select event_id, candidate_id, avg(score * 100 / max_score) as jury_share, count(*) as jurors
  from jury_scores group by event_id, candidate_id
),
base as (
  select ec.event_id, ec.candidate_id, e.phase,
         coalesce(v.votes, 0) as votes,
         coalesce(j.jury_share, 0) as jury_share,
         coalesce(j.jurors, 0) as jurors,
         sum(coalesce(v.votes, 0)) over (partition by ec.event_id) as total_votes
  from event_candidates ec
  join events e on e.id = ec.event_id
  left join v on v.event_id = ec.event_id and v.candidate_id = ec.candidate_id
  left join j on j.event_id = ec.event_id and j.candidate_id = ec.candidate_id
),
scored as (
  select *,
         case when total_votes > 0 then round(votes::numeric * 100 / total_votes, 4) else 0 end as public_share
  from base
),
final as (
  select *,
         case when phase_has_public_vote(phase)
              then round(0.6 * public_share + 0.4 * jury_share, 4)
              else round(jury_share, 4) end as final_score
  from scored
)
select event_id, candidate_id, phase, votes, total_votes, public_share,
       round(jury_share, 4) as jury_share, jurors, final_score,
       rank() over (partition by event_id order by final_score desc, jury_share desc, votes desc) as rank
from final;

-- ───────────────────────── Sécurité / traçabilité ─────────────────────────

create table verification_codes (
  id           uuid primary key default gen_random_uuid(),
  purpose      text not null check (purpose in ('ticket_lookup')),
  target       text not null,
  code_hash    text not null,
  attempts     smallint not null default 0,
  expires_at   timestamptz not null,
  consumed_at  timestamptz,
  created_at   timestamptz not null default now()
);
create index verification_codes_lookup_idx on verification_codes (purpose, target, created_at desc);

create table audit_log (
  id           bigint generated always as identity primary key,
  at           timestamptz not null default now(),
  actor_id     uuid references admin_users(id) on delete set null,
  actor_email  text,
  action       text not null,
  entity       text not null,
  entity_id    text,
  before       jsonb,
  after        jsonb,
  ip           inet
);
create index audit_log_at_idx on audit_log (at desc);
create index audit_log_entity_idx on audit_log (entity, entity_id);
create index audit_log_actor_idx on audit_log (actor_id, at desc);

create function audit_log_append_only() returns trigger language plpgsql as $$
begin
  raise exception 'audit_log_is_append_only' using errcode = 'P0001';
end $$;
create trigger audit_log_no_update before update or delete on audit_log
  for each row execute function audit_log_append_only();
create trigger audit_log_no_truncate before truncate on audit_log
  for each statement execute function audit_log_append_only();

create table rate_limits (
  bucket        text not null,
  window_start  timestamptz not null,
  hits          int not null,
  primary key (bucket, window_start)
);
create index rate_limits_window_idx on rate_limits (window_start);

-- Retourne true si la requête est autorisée (fenêtre fixe).
create function hit_rate_limit(p_bucket text, p_window_seconds int, p_max int)
returns boolean language plpgsql as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  n int;
begin
  insert into rate_limits (bucket, window_start, hits) values (p_bucket, w, 1)
  on conflict (bucket, window_start) do update set hits = rate_limits.hits + 1
  returning hits into n;
  return n <= p_max;
end $$;

-- ───────────────────────── Opérations atomiques ─────────────────────────

-- Places occupées : billets valides/utilisés + réservations encore actives.
create function category_taken(p_category uuid, p_exclude_txn uuid default null)
returns int language sql stable as $$
  select count(*)::int from tickets
  where category_id = p_category
    and (p_exclude_txn is null or transaction_id is distinct from p_exclude_txn)
    and (status in ('valid', 'used') or (status = 'reserved' and reserved_until > now()))
$$;

-- Réserve les places d'une transaction billet (verrou sur la catégorie : aucune survente).
create function reserve_tickets(p_transaction uuid, p_hold_minutes int default 15)
returns text language plpgsql as $$
declare
  t transactions%rowtype;
  c ticket_categories%rowtype;
  ev events%rowtype;
begin
  select * into t from transactions where id = p_transaction and kind = 'ticket' and status = 'pending';
  if not found then return 'invalid_transaction'; end if;
  select * into c from ticket_categories where id = t.category_id for update;
  select * into ev from events where id = c.event_id;
  if ev.starts_at <= now() then return 'sales_closed'; end if;
  if category_taken(c.id) + t.quantity > c.capacity then return 'sold_out'; end if;
  insert into tickets (event_id, category_id, transaction_id, channel, status, reserved_until, price_xaf, holder_name, phone, email)
  select c.event_id, c.id, t.id, 'online', 'reserved', now() + make_interval(mins => p_hold_minutes),
         c.price_xaf, coalesce(t.payer_name, ''), t.phone, t.email
  from generate_series(1, t.quantity);
  return 'reserved';
end $$;

-- Confirmation idempotente (webhook vérifié ou vérification manuelle du statut).
-- Retour : unknown | duplicate | credited | rejected_late | sold_out_after_hold
create function confirm_payment(p_reference text, p_provider_ref text, p_payload jsonb)
returns text language plpgsql as $$
declare
  t transactions%rowtype;
  ev events%rowtype;
  c ticket_categories%rowtype;
begin
  select * into t from transactions where reference = p_reference for update;
  if not found then return 'unknown'; end if;
  if t.status = 'succeeded' then return 'duplicate'; end if;

  update transactions
     set status = 'succeeded', provider_ref = coalesce(p_provider_ref, provider_ref),
         payload = p_payload, confirmed_at = now()
   where id = t.id;

  if t.kind = 'vote' then
    select * into ev from events where id = t.event_id;
    if ev.vote_closes_at is null or now() > ev.vote_closes_at then
      update transactions set credit_status = 'rejected_late' where id = t.id;
      return 'rejected_late';
    end if;
    insert into votes (transaction_id, event_id, candidate_id, quantity, source)
    values (t.id, t.event_id, t.candidate_id, t.quantity, 'payment');
  else
    select * into c from ticket_categories where id = t.category_id for update;
    if category_taken(c.id, t.id) + t.quantity > c.capacity then
      update tickets set status = 'released' where transaction_id = t.id and status = 'reserved';
      update transactions set credit_status = 'rejected_late' where id = t.id;
      return 'sold_out_after_hold';
    end if;
    update tickets set status = 'valid', reserved_until = null
     where transaction_id = t.id and status in ('reserved', 'released');
  end if;

  update transactions set credit_status = 'credited' where id = t.id;
  return 'credited';
end $$;

create function fail_payment(p_reference text, p_status transaction_status, p_payload jsonb)
returns boolean language plpgsql as $$
declare t_id uuid;
begin
  if p_status not in ('failed', 'expired') then
    raise exception 'invalid_failure_status';
  end if;
  update transactions set status = p_status, credit_status = 'not_applicable', payload = coalesce(p_payload, payload)
   where reference = p_reference and status = 'pending'
  returning id into t_id;
  if t_id is null then return false; end if;
  update tickets set status = 'released' where transaction_id = t_id and status = 'reserved';
  return true;
end $$;

-- Validation d'entrée atomique : un billet ne passe qu'une seule fois.
-- Retour : valid | already_used | wrong_event | invalid
create function scan_ticket(p_token bytea, p_event uuid, p_controller uuid)
returns table (result text, ticket_id uuid, holder_name text, category_code text, used_at timestamptz, used_by_name text)
language plpgsql as $$
declare tk tickets%rowtype;
begin
  update tickets set status = 'used', used_at = now(), used_by = p_controller
   where qr_token = p_token and event_id = p_event and status = 'valid'
  returning * into tk;
  if found then
    return query select 'valid', tk.id, tk.holder_name, c.code, tk.used_at, a.display_name
      from ticket_categories c, admin_users a where c.id = tk.category_id and a.id = p_controller;
    return;
  end if;

  select * into tk from tickets where qr_token = p_token;
  if not found or tk.status not in ('valid', 'used') then
    return query select 'invalid', null::uuid, null::text, null::text, null::timestamptz, null::text;
  elsif tk.event_id <> p_event then
    return query select 'wrong_event', tk.id, null::text, null::text, null::timestamptz, null::text;
  else
    return query select 'already_used', tk.id, tk.holder_name, c.code, tk.used_at, a.display_name
      from ticket_categories c left join admin_users a on a.id = tk.used_by where c.id = tk.category_id;
  end if;
end $$;

-- ───────────────────────── Verrouillage d'accès ─────────────────────────

do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', r.tablename);
  end loop;
  revoke execute on all functions in schema public from public;
  alter default privileges in schema public revoke execute on functions from public;
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on all tables in schema public from anon, authenticated;
    revoke all on all functions in schema public from anon, authenticated;
    alter default privileges in schema public revoke all on tables from anon, authenticated;
    alter default privileges in schema public revoke all on functions from anon, authenticated;
  end if;
end $$;

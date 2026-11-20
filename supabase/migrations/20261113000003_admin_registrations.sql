-- LOT 1 : back-office des inscrits, paramètres et stockage des fichiers candidats.

create function escape_like(p text) returns text language sql immutable as $$
  select replace(replace(replace(p, '\', '\\'), '%', '\%'), '_', '\_')
$$;

create function admin_list_candidates(
  p_q             text default null,
  p_status        candidate_status default null,
  p_city          text default null,
  p_genre         text default null,
  p_birth_from    date default null,
  p_birth_to      date default null,
  p_created_from  timestamptz default null,
  p_created_to    timestamptz default null,
  p_sort          text default 'created_at',
  p_desc          boolean default true,
  p_limit         int default 25,
  p_offset        int default 0
)
returns table (
  id uuid, dossier_no text, last_name text, first_name text, stage_name text, birth_date date,
  gender gender, phone text, email text, city text, district text, music_genre text, song_title text,
  status candidate_status, created_at timestamptz, total_count bigint
)
language plpgsql stable as $$
declare
  sort_col text := case p_sort
    when 'dossier_no' then 'dossier_no' when 'last_name' then 'last_name' when 'city' then 'city'
    when 'birth_date' then 'birth_date' when 'status' then 'status' when 'music_genre' then 'music_genre'
    else 'created_at' end;
  q text := nullif(escape_like(lower(trim(coalesce(p_q, '')))), '');
begin
  return query execute format($sql$
    select c.id, c.dossier_no, c.last_name, c.first_name, c.stage_name, c.birth_date, c.gender, c.phone,
           c.email, c.city, c.district, c.music_genre, c.song_title, c.status, c.created_at,
           count(*) over () as total_count
    from candidates c
    where ($1::text is null
           or lower(c.last_name || ' ' || c.first_name || ' ' || coalesce(c.stage_name, '')) like '%%' || $1 || '%%'
           or lower(c.dossier_no) like $1 || '%%'
           or c.phone like '%%' || $1 || '%%'
           or c.email like $1 || '%%')
      and ($2::candidate_status is null or c.status = $2)
      and ($3::text is null or lower(c.city) = lower($3))
      and ($4::text is null or lower(c.music_genre) = lower($4))
      and ($5::date is null or c.birth_date >= $5)
      and ($6::date is null or c.birth_date <= $6)
      and ($7::timestamptz is null or c.created_at >= $7)
      and ($8::timestamptz is null or c.created_at < $8)
    order by c.%I %s, c.id
    limit $9 offset $10
  $sql$, sort_col, case when p_desc then 'desc' else 'asc' end)
  using q, p_status, nullif(trim(p_city), ''), nullif(trim(p_genre), ''), p_birth_from, p_birth_to,
        p_created_from, p_created_to, least(greatest(p_limit, 1), 5000), greatest(p_offset, 0);
end $$;

create function admin_set_candidates_status(
  p_ids uuid[], p_status candidate_status, p_actor uuid, p_ip inet
)
returns table (id uuid, dossier_no text, email text, first_name text, previous_status candidate_status)
language plpgsql as $$
declare actor_email text;
begin
  select a.email into actor_email from admin_users a where a.id = p_actor;
  return query
  with prev as (
    select c.id, c.status from candidates c where c.id = any(p_ids) and c.status <> p_status for update
  ),
  upd as (
    update candidates c
       set status = p_status, status_changed_at = now(),
           public_profile = case when p_status = 'selected' then c.public_profile else false end
      from prev
     where c.id = prev.id
    returning c.id, c.dossier_no, c.email, c.first_name, prev.status as previous_status
  ),
  log as (
    insert into audit_log (actor_id, actor_email, action, entity, entity_id, before, after, ip)
    select p_actor, actor_email, 'candidate.status_changed', 'candidate', u.id::text,
           jsonb_build_object('status', u.previous_status), jsonb_build_object('status', p_status), p_ip
    from upd u
  )
  select u.id, u.dossier_no, u.email, u.first_name, u.previous_status from upd u;
end $$;

create function admin_registration_stats() returns jsonb language sql stable as $$
  select jsonb_build_object(
    'total', (select count(*) from candidates),
    'by_status', coalesce((select jsonb_object_agg(status, n) from (
        select status, count(*) n from candidates group by status) s), '{}'::jsonb),
    'by_day', coalesce((select jsonb_agg(jsonb_build_object('day', d, 'count', n) order by d) from (
        select (created_at at time zone 'Africa/Douala')::date d, count(*) n from candidates group by 1) s), '[]'::jsonb),
    'by_city', coalesce((select jsonb_agg(jsonb_build_object('label', city, 'count', n) order by n desc) from (
        select initcap(lower(city)) city, count(*) n from candidates group by 1 order by 2 desc limit 10) s), '[]'::jsonb),
    'by_genre', coalesce((select jsonb_agg(jsonb_build_object('label', g, 'count', n) order by n desc) from (
        select initcap(lower(music_genre)) g, count(*) n from candidates group by 1 order by 2 desc limit 10) s), '[]'::jsonb)
  )
$$;

-- Clés inconnues refusées : la liste blanche vit dans la table settings elle-même.
create function admin_update_settings(p_values jsonb, p_actor uuid, p_ip inet)
returns int language plpgsql as $$
declare
  k text;
  v jsonb;
  old_v jsonb;
  actor_email text;
  changed int := 0;
begin
  select a.email into actor_email from admin_users a where a.id = p_actor;
  for k, v in select * from jsonb_each(p_values) loop
    select value into old_v from settings where key = k for update;
    if not found then
      raise exception 'unknown_setting:%', k using errcode = 'P0001';
    end if;
    if old_v is distinct from v then
      update settings set value = v, updated_at = now(), updated_by = p_actor where key = k;
      insert into audit_log (actor_id, actor_email, action, entity, entity_id, before, after, ip)
      values (p_actor, actor_email, 'setting.updated', 'setting', k, jsonb_build_object('value', old_v), jsonb_build_object('value', v), p_ip);
      changed := changed + 1;
    end if;
  end loop;
  return changed;
end $$;

-- Retourne true si le compte vient d'être verrouillé.
create function register_login_failure(p_user uuid, p_max_attempts int default 5, p_lock_minutes int default 15)
returns boolean language plpgsql as $$
declare n int;
begin
  update admin_users set failed_attempts = failed_attempts + 1 where id = p_user returning failed_attempts into n;
  if n >= p_max_attempts then
    update admin_users set failed_attempts = 0, locked_until = now() + make_interval(mins => p_lock_minutes) where id = p_user;
    return true;
  end if;
  return false;
end $$;

-- Un pas TOTP n'est accepté qu'une fois (anti-rejeu).
create function consume_totp_step(p_user uuid, p_step bigint) returns boolean language sql as $$
  update admin_users set totp_last_step = p_step
   where id = p_user and (totp_last_step is null or totp_last_step < p_step)
  returning true
$$;

revoke execute on function register_login_failure(uuid, int, int), consume_totp_step(uuid, bigint) from public;

revoke execute on function escape_like(text), admin_list_candidates(text, candidate_status, text, text, date, date, timestamptz, timestamptz, text, boolean, int, int),
  admin_set_candidates_status(uuid[], candidate_status, uuid, inet), admin_registration_stats(),
  admin_update_settings(jsonb, uuid, inet) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on function admin_list_candidates(text, candidate_status, text, text, date, date, timestamptz, timestamptz, text, boolean, int, int),
      admin_set_candidates_status(uuid[], candidate_status, uuid, inet), admin_registration_stats(),
      admin_update_settings(jsonb, uuid, inet) from anon, authenticated;
  end if;
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('candidate-files', 'candidate-files', false, 52428800, array[
      'image/jpeg', 'image/png', 'image/webp', 'application/pdf',
      'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/wav', 'audio/ogg', 'audio/webm',
      'video/mp4', 'video/quicktime', 'video/webm', 'video/3gpp'
    ])
    on conflict (id) do nothing;
  end if;
end $$;

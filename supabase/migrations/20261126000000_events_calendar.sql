-- Calendrier de l'édition 2 tel que communiqué par l'organisation le 26/11/2026 :
-- inscriptions du 28/11 au 05/12, casting le 07/12, lancement le 12/12,
-- première émission le 19/12. Les heures restent celles de Douala (UTC+1) ;
-- 18 h pour la cérémonie et 19 h pour l'émission reprennent l'heure déjà affichée.
insert into settings (key, value) values
  ('registration_opens_at', '"2026-11-28T00:00:00+01:00"'::jsonb),
  ('registration_closes_at', '"2026-12-05T23:59:59+01:00"'::jsonb),
  ('casting_date', '"2026-12-07"'::jsonb),
  ('launch_ceremony_at', '"2026-12-12T18:00:00+01:00"'::jsonb),
  ('first_episode_at', '"2026-12-19T19:00:00+01:00"'::jsonb)
on conflict (key) do update
  set value = excluded.value, updated_at = now();

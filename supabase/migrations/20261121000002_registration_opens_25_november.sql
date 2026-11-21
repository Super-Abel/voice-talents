-- Ouverture des inscriptions reportée au mercredi 25/11/2026 à 00 h 00 (heure de Douala).
-- La clôture reste le 27/11/2026 à 23 h 59 : la fenêtre fait trois jours.
-- En attendant, /inscription affiche « Rideau encore fermé » et l'API refuse les dossiers.
-- Requête idempotente : relançable sans effet de bord.
insert into settings (key, value)
values ('registration_opens_at', '"2026-11-25T00:00:00+01:00"'::jsonb)
on conflict (key) do update
   set value      = excluded.value,
       updated_at = now();

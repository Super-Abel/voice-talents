-- Ouverture des inscriptions reportée au mercredi 25/11/2026 à 00 h 00 (heure de Douala).
-- La clôture est laissée telle quelle : c'est registration_closes_at qui la fixe dans settings.
-- En attendant, /inscription affiche « Rideau encore fermé » et l'API refuse les dossiers.
-- Requête idempotente : relançable sans effet de bord.
insert into settings (key, value)
values ('registration_opens_at', '"2026-11-25T00:00:00+01:00"'::jsonb)
on conflict (key) do update
   set value      = excluded.value,
       updated_at = now();

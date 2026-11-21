-- Le téléphone lit la durée de la vidéo avant l'envoi et la transmet. On la garde
-- pour que le back-office voie « 28 s » sans relire chaque fichier.
-- Valeur déclarée par l'appareil, pas mesurée par le serveur : informative.
alter table uploads
  add column duration_seconds smallint check (duration_seconds between 1 and 600);

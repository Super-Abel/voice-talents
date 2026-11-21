-- Le formulaire d'inscription ne collecte plus la pièce d'identité.
-- Les colonnes restent en place : les dossiers déjà enregistrés gardent leur
-- numéro et leur scan, consultables dans le back-office.
alter table candidates alter column id_number drop not null;

-- Nouvelle « personne à contacter » : prévenu(e) si le candidat est injoignable.
-- Nullable en base (les dossiers existants n'en ont pas), exigée par l'application.
alter table candidates add column contact_name text check (char_length(contact_name) between 1 and 80);
alter table candidates add column contact_phone text check (contact_phone ~ '^\+2376[0-9]{8}$');

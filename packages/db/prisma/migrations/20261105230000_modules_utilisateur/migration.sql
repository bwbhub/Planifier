-- Modules de l'utilisateur : tous activés à l'inscription (il en retire dans son profil).
-- Les comptes existants à liste vide (ancien défaut) reçoivent tous les modules : ils n'ont jamais pu choisir.
ALTER TABLE "users" ALTER COLUMN "modules" SET DEFAULT ARRAY['TODO', 'AGENDA', 'EVENTS']::"app_module"[];

UPDATE "users" SET "modules" = ARRAY['TODO', 'AGENDA', 'EVENTS']::"app_module"[] WHERE "modules" = ARRAY[]::"app_module"[];

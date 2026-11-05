-- AlterTable
ALTER TABLE "agenda_entries" ADD COLUMN     "participants" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Liste vide pour « personne », jamais NULL (Prisma ne sait pas l'écrire pour une liste).
ALTER TABLE "agenda_entries" ADD CONSTRAINT "agenda_entries_participants_check" CHECK ("participants" IS NOT NULL);

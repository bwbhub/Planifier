-- AlterTable
ALTER TABLE "agenda_entries" ADD COLUMN     "participants" TEXT[] DEFAULT ARRAY[]::TEXT[];

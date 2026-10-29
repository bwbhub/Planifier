-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "recurrence" JSONB,
ADD COLUMN     "recurrence_anchor" DATE;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "due_time" VARCHAR(5);

-- Heure murale `HH:MM` (00:00 à 23:59), jamais sans jour d'échéance.
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_due_time_format_check" CHECK ("due_time" IS NULL OR "due_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_due_time_needs_date_check" CHECK ("due_time" IS NULL OR "due_date" IS NOT NULL);

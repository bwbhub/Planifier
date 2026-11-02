-- CreateTable
CREATE TABLE "agenda_entries" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "start_day" DATE,
    "end_day" DATE,
    "tint" TEXT NOT NULL DEFAULT 'general',
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "source_uid" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "owner_id" TEXT NOT NULL,
    "task_id" TEXT,

    CONSTRAINT "agenda_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agenda_entries_owner_id_starts_at_idx" ON "agenda_entries"("owner_id", "starts_at");

-- CreateIndex
CREATE INDEX "agenda_entries_owner_id_start_day_idx" ON "agenda_entries"("owner_id", "start_day");

-- CreateIndex
CREATE INDEX "agenda_entries_task_id_idx" ON "agenda_entries"("task_id");

-- CreateIndex
CREATE UNIQUE INDEX "agenda_entries_owner_id_source_source_uid_key" ON "agenda_entries"("owner_id", "source", "source_uid");

-- AddForeignKey
ALTER TABLE "agenda_entries" ADD CONSTRAINT "agenda_entries_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_entries" ADD CONSTRAINT "agenda_entries_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Horaire ou à la journée, jamais les deux, et fin après début (hors du périmètre de Prisma).
ALTER TABLE "agenda_entries" ADD CONSTRAINT "agenda_entries_when_check" CHECK (
  ("starts_at" IS NOT NULL AND "ends_at" IS NOT NULL AND "start_day" IS NULL AND "end_day" IS NULL AND "ends_at" > "starts_at")
  OR ("starts_at" IS NULL AND "ends_at" IS NULL AND "start_day" IS NOT NULL AND "end_day" IS NOT NULL AND "end_day" >= "start_day")
);

-- Une entrée importée a sa source et son UID, les deux ou aucun (ADR 0011).
ALTER TABLE "agenda_entries" ADD CONSTRAINT "agenda_entries_source_check" CHECK (("source" IS NULL) = ("source_uid" IS NULL));

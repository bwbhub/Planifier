-- Les événements n'ont encore ni procédure ni écran : seules des données de démo existent (aucune version déployée).
-- Elles sont retirées (cascade : participants, invitations, propositions, commentaires, notifications d'événement)
-- plutôt que reprises, pour que les colonnes obligatoires s'ajoutent sans valeur de complaisance.
DELETE FROM "events";

-- CreateEnum
CREATE TYPE "comment_kind" AS ENUM ('TEXT', 'CHANGE');

-- DropForeignKey
ALTER TABLE "event_settings" DROP CONSTRAINT "event_settings_event_id_fkey";

-- DropForeignKey
ALTER TABLE "invites" DROP CONSTRAINT "invites_user_id_fkey";

-- DropIndex
DROP INDEX "events_space_id_start_date_idx";

-- DropIndex
DROP INDEX "events_start_date_idx";

-- DropIndex
DROP INDEX "invites_inviter_id_idx";

-- DropIndex
DROP INDEX "invites_token_key";

-- DropIndex
DROP INDEX "invites_user_id_idx";

-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "change" JSONB,
ADD COLUMN     "kind" "comment_kind" NOT NULL DEFAULT 'TEXT',
ALTER COLUMN "text" DROP NOT NULL;

-- AlterTable
ALTER TABLE "events" DROP COLUMN "color",
DROP COLUMN "cover_url",
DROP COLUMN "end_date",
DROP COLUMN "start_date",
ADD COLUMN     "allow_guest_invite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "end_day" DATE,
ADD COLUMN     "ends_at" TIMESTAMP(3),
ADD COLUMN     "is_guest_list_visible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "max_participants" INTEGER,
ADD COLUMN     "open_end" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "start_day" DATE,
ADD COLUMN     "start_key" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "starts_at" TIMESTAMP(3),
ADD COLUMN     "tint" TEXT NOT NULL DEFAULT 'general';

-- AlterTable
ALTER TABLE "invites" DROP COLUMN "status",
DROP COLUMN "token",
DROP COLUMN "user_id",
ADD COLUMN     "responded_at" TIMESTAMP(3),
ADD COLUMN     "response" "participant_status" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "token_hash" TEXT NOT NULL,
ALTER COLUMN "expires_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "proposed_invites" DROP COLUMN "reason",
ADD COLUMN     "message" TEXT,
ALTER COLUMN "suggested_email" SET NOT NULL;

-- DropTable
DROP TABLE "event_settings";

-- DropEnum
DROP TYPE "invite_status";

-- CreateIndex
CREATE INDEX "events_space_id_start_key_idx" ON "events"("space_id", "start_key");

-- CreateIndex
CREATE INDEX "events_start_key_id_idx" ON "events"("start_key", "id");

-- CreateIndex
CREATE UNIQUE INDEX "invites_token_hash_key" ON "invites"("token_hash");

-- CreateIndex
CREATE INDEX "invites_inviter_id_sent_at_idx" ON "invites"("inviter_id", "sent_at");

-- CreateIndex
CREATE INDEX "invites_email_idx" ON "invites"("email");

-- Horaire ou à la journée, jamais les deux, et fin après début (hors du périmètre de Prisma). Comme les entrées d'agenda.
ALTER TABLE "events" ADD CONSTRAINT "events_when_check" CHECK (
  ("starts_at" IS NOT NULL AND "ends_at" IS NOT NULL AND "start_day" IS NULL AND "end_day" IS NULL AND "ends_at" > "starts_at")
  OR ("starts_at" IS NULL AND "ends_at" IS NULL AND "start_day" IS NOT NULL AND "end_day" IS NOT NULL AND "end_day" >= "start_day")
);

-- Sans fin choisie (`open_end`), l'événement est horaire : sa fin est celle du jour de début.
ALTER TABLE "events" ADD CONSTRAINT "events_open_end_check" CHECK (NOT "open_end" OR "starts_at" IS NOT NULL);

-- Places pour « j'y vais » : entre 1 et 200 (EVENT_MAX_PARTICIPANTS), ou illimité.
ALTER TABLE "events" ADD CONSTRAINT "events_max_participants_check" CHECK ("max_participants" IS NULL OR "max_participants" BETWEEN 1 AND 200);

-- Un commentaire écrit a son texte ; un message automatique a son changement, et n'est jamais « important ».
ALTER TABLE "comments" ADD CONSTRAINT "comments_kind_check" CHECK (
  ("kind" = 'TEXT' AND "text" IS NOT NULL AND "change" IS NULL)
  OR ("kind" = 'CHANGE' AND "change" IS NOT NULL AND "text" IS NULL AND NOT "is_important")
);

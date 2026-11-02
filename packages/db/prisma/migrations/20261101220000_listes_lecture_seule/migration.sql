-- AlterTable
ALTER TABLE "todo_lists" ADD COLUMN     "read_only_space_id" TEXT;

-- CreateIndex
CREATE INDEX "todo_lists_read_only_space_id_idx" ON "todo_lists"("read_only_space_id");

-- AddForeignKey
ALTER TABLE "todo_lists" ADD CONSTRAINT "todo_lists_read_only_space_id_fkey" FOREIGN KEY ("read_only_space_id") REFERENCES "spaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Une liste n'a qu'un partage à la fois (hors du périmètre de Prisma).
ALTER TABLE "todo_lists" ADD CONSTRAINT "todo_lists_one_sharing_check" CHECK ("space_id" IS NULL OR "read_only_space_id" IS NULL);

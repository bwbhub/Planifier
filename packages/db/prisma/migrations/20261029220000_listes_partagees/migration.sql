-- AlterTable
ALTER TABLE "todo_lists" ADD COLUMN     "space_id" TEXT;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "completed_by_id" TEXT;

-- CreateIndex
CREATE INDEX "todo_lists_space_id_idx" ON "todo_lists"("space_id");

-- CreateIndex
CREATE INDEX "tasks_completed_by_id_idx" ON "tasks"("completed_by_id");

-- AddForeignKey
ALTER TABLE "todo_lists" ADD CONSTRAINT "todo_lists_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_completed_by_id_fkey" FOREIGN KEY ("completed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


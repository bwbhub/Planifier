-- CreateTable
CREATE TABLE "todo_lists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tint" TEXT NOT NULL DEFAULT 'general',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "owner_id" TEXT NOT NULL,

    CONSTRAINT "todo_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_date" DATE,
    "completed_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "list_id" TEXT NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "todo_lists_owner_id_idx" ON "todo_lists"("owner_id");

-- CreateIndex
CREATE INDEX "tasks_list_id_idx" ON "tasks"("list_id");

-- AddForeignKey
ALTER TABLE "todo_lists" ADD CONSTRAINT "todo_lists_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "todo_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "space_invites" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "space_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,

    CONSTRAINT "space_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "space_invites_token_hash_key" ON "space_invites"("token_hash");

-- CreateIndex
CREATE INDEX "space_invites_space_id_idx" ON "space_invites"("space_id");

-- CreateIndex
CREATE INDEX "space_invites_created_by_id_idx" ON "space_invites"("created_by_id");

-- AddForeignKey
ALTER TABLE "space_invites" ADD CONSTRAINT "space_invites_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_invites" ADD CONSTRAINT "space_invites_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

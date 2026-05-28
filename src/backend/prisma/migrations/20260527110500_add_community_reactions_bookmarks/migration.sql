-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('LIKE', 'DISLIKE');

-- CreateTable
CREATE TABLE "community_reactions" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" "ReactionType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_bookmarks" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "community_reactions_post_id_user_id_key" ON "community_reactions"("post_id", "user_id");

-- CreateIndex
CREATE INDEX "community_reactions_post_id_idx" ON "community_reactions"("post_id");

-- CreateIndex
CREATE INDEX "community_reactions_user_id_idx" ON "community_reactions"("user_id");

-- CreateIndex
CREATE INDEX "community_reactions_type_idx" ON "community_reactions"("type");

-- CreateIndex
CREATE UNIQUE INDEX "community_bookmarks_post_id_user_id_key" ON "community_bookmarks"("post_id", "user_id");

-- CreateIndex
CREATE INDEX "community_bookmarks_post_id_idx" ON "community_bookmarks"("post_id");

-- CreateIndex
CREATE INDEX "community_bookmarks_user_id_idx" ON "community_bookmarks"("user_id");

-- AddForeignKey
ALTER TABLE "community_reactions" ADD CONSTRAINT "community_reactions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "board_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_reactions" ADD CONSTRAINT "community_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_bookmarks" ADD CONSTRAINT "community_bookmarks_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "board_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_bookmarks" ADD CONSTRAINT "community_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

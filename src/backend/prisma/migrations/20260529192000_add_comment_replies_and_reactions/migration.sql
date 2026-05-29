-- Add one-level threaded comments and comment reactions without changing existing comments.
ALTER TABLE "comments" ADD COLUMN "parent_id" INTEGER;

CREATE TABLE "comment_reactions" (
  "id" SERIAL NOT NULL,
  "comment_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  "type" "ReactionType" NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "comment_reactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "comment_reactions_comment_id_user_id_key" ON "comment_reactions"("comment_id", "user_id");
CREATE INDEX "comment_reactions_comment_id_idx" ON "comment_reactions"("comment_id");
CREATE INDEX "comment_reactions_user_id_idx" ON "comment_reactions"("user_id");
CREATE INDEX "comment_reactions_type_idx" ON "comment_reactions"("type");
CREATE INDEX "comments_post_id_parent_id_idx" ON "comments"("post_id", "parent_id");
CREATE INDEX "comments_parent_id_idx" ON "comments"("parent_id");

ALTER TABLE "comments"
  ADD CONSTRAINT "comments_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comment_reactions"
  ADD CONSTRAINT "comment_reactions_comment_id_fkey"
  FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comment_reactions"
  ADD CONSTRAINT "comment_reactions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

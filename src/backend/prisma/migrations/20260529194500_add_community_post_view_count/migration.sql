-- Add a non-destructive view counter for board posts.
ALTER TABLE "board_posts" ADD COLUMN "view_count" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "board_posts_view_count_idx" ON "board_posts"("view_count");

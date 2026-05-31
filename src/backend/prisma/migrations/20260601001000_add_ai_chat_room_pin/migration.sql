ALTER TABLE "ai_chat_rooms" ADD COLUMN "is_pinned" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "ai_chat_rooms_user_id_is_pinned_updated_at_idx"
  ON "ai_chat_rooms"("user_id", "is_pinned", "updated_at");

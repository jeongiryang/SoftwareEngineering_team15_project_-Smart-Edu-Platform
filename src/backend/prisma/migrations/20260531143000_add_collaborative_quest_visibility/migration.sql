-- Add per-participant visibility state for collaborative quests.
ALTER TABLE "collaborative_quest_participants"
ADD COLUMN "hidden_at" TIMESTAMP(3),
ADD COLUMN "archived_at" TIMESTAMP(3);

CREATE INDEX "collaborative_quest_participants_user_id_hidden_at_idx"
ON "collaborative_quest_participants"("user_id", "hidden_at");

CREATE INDEX "collaborative_quest_participants_user_id_archived_at_idx"
ON "collaborative_quest_participants"("user_id", "archived_at");

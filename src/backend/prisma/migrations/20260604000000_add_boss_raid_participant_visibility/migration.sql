ALTER TABLE "boss_raid_party_members"
ADD COLUMN "hidden_at" TIMESTAMP(3),
ADD COLUMN "archived_at" TIMESTAMP(3),
ADD COLUMN "left_at" TIMESTAMP(3);

CREATE INDEX "boss_raid_party_members_user_id_hidden_at_idx"
ON "boss_raid_party_members"("user_id", "hidden_at");

CREATE INDEX "boss_raid_party_members_user_id_archived_at_idx"
ON "boss_raid_party_members"("user_id", "archived_at");

CREATE INDEX "boss_raid_party_members_user_id_left_at_idx"
ON "boss_raid_party_members"("user_id", "left_at");

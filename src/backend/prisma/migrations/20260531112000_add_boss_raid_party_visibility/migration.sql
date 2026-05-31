ALTER TABLE "boss_raid_parties" ADD COLUMN "is_public" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "boss_raid_parties_is_public_status_idx" ON "boss_raid_parties"("is_public", "status");

CREATE TYPE "BossRaidPartyStatus" AS ENUM ('OPEN', 'CLEARED', 'CLOSED');

CREATE TABLE "boss_raids" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "max_hp" INTEGER NOT NULL,
    "focus_minute_damage" INTEGER NOT NULL DEFAULT 1,
    "task_completion_damage" INTEGER NOT NULL DEFAULT 15,
    "base_reward_points" INTEGER NOT NULL DEFAULT 0,
    "bonus_reward_pool_points" INTEGER NOT NULL DEFAULT 0,
    "badge_id" INTEGER,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boss_raids_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "boss_raid_parties" (
    "id" SERIAL NOT NULL,
    "raid_id" INTEGER NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "join_code" TEXT NOT NULL,
    "status" "BossRaidPartyStatus" NOT NULL DEFAULT 'OPEN',
    "total_damage" INTEGER NOT NULL DEFAULT 0,
    "remaining_hp" INTEGER,
    "last_calculated_at" TIMESTAMP(3),
    "cleared_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boss_raid_parties_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "boss_raid_party_members" (
    "id" SERIAL NOT NULL,
    "party_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boss_raid_party_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "boss_raid_contributions" (
    "id" SERIAL NOT NULL,
    "party_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "focus_minutes" INTEGER NOT NULL DEFAULT 0,
    "completed_task_count" INTEGER NOT NULL DEFAULT 0,
    "total_damage" INTEGER NOT NULL DEFAULT 0,
    "last_contributed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boss_raid_contributions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "boss_raid_reward_claims" (
    "id" SERIAL NOT NULL,
    "raid_id" INTEGER NOT NULL,
    "party_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "base_reward_points" INTEGER NOT NULL DEFAULT 0,
    "bonus_reward_points" INTEGER NOT NULL DEFAULT 0,
    "badge_granted" BOOLEAN NOT NULL DEFAULT false,
    "claimed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boss_raid_reward_claims_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "boss_raids_code_key" ON "boss_raids"("code");
CREATE INDEX "boss_raids_is_active_idx" ON "boss_raids"("is_active");
CREATE INDEX "boss_raids_starts_at_idx" ON "boss_raids"("starts_at");
CREATE INDEX "boss_raids_badge_id_idx" ON "boss_raids"("badge_id");

CREATE UNIQUE INDEX "boss_raid_parties_join_code_key" ON "boss_raid_parties"("join_code");
CREATE INDEX "boss_raid_parties_raid_id_idx" ON "boss_raid_parties"("raid_id");
CREATE INDEX "boss_raid_parties_owner_id_idx" ON "boss_raid_parties"("owner_id");
CREATE INDEX "boss_raid_parties_status_idx" ON "boss_raid_parties"("status");

CREATE UNIQUE INDEX "boss_raid_party_members_party_id_user_id_key" ON "boss_raid_party_members"("party_id", "user_id");
CREATE INDEX "boss_raid_party_members_user_id_idx" ON "boss_raid_party_members"("user_id");

CREATE UNIQUE INDEX "boss_raid_contributions_party_id_user_id_key" ON "boss_raid_contributions"("party_id", "user_id");
CREATE INDEX "boss_raid_contributions_user_id_idx" ON "boss_raid_contributions"("user_id");

CREATE UNIQUE INDEX "boss_raid_reward_claims_raid_id_user_id_key" ON "boss_raid_reward_claims"("raid_id", "user_id");
CREATE INDEX "boss_raid_reward_claims_party_id_idx" ON "boss_raid_reward_claims"("party_id");
CREATE INDEX "boss_raid_reward_claims_user_id_idx" ON "boss_raid_reward_claims"("user_id");

ALTER TABLE "boss_raids"
ADD CONSTRAINT "boss_raids_badge_id_fkey"
FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "boss_raid_parties"
ADD CONSTRAINT "boss_raid_parties_raid_id_fkey"
FOREIGN KEY ("raid_id") REFERENCES "boss_raids"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "boss_raid_parties"
ADD CONSTRAINT "boss_raid_parties_owner_id_fkey"
FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "boss_raid_party_members"
ADD CONSTRAINT "boss_raid_party_members_party_id_fkey"
FOREIGN KEY ("party_id") REFERENCES "boss_raid_parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "boss_raid_party_members"
ADD CONSTRAINT "boss_raid_party_members_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "boss_raid_contributions"
ADD CONSTRAINT "boss_raid_contributions_party_id_fkey"
FOREIGN KEY ("party_id") REFERENCES "boss_raid_parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "boss_raid_contributions"
ADD CONSTRAINT "boss_raid_contributions_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "boss_raid_reward_claims"
ADD CONSTRAINT "boss_raid_reward_claims_raid_id_fkey"
FOREIGN KEY ("raid_id") REFERENCES "boss_raids"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "boss_raid_reward_claims"
ADD CONSTRAINT "boss_raid_reward_claims_party_id_fkey"
FOREIGN KEY ("party_id") REFERENCES "boss_raid_parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "boss_raid_reward_claims"
ADD CONSTRAINT "boss_raid_reward_claims_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

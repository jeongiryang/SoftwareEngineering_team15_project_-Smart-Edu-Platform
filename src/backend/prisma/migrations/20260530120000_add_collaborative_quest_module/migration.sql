-- CreateEnum
CREATE TYPE "CollaborativeQuestStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED');

-- CreateTable
CREATE TABLE "collaborative_quests" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "goal_value" INTEGER NOT NULL,
    "current_value" INTEGER NOT NULL DEFAULT 0,
    "status" "CollaborativeQuestStatus" NOT NULL DEFAULT 'ACTIVE',
    "reward_points" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" INTEGER NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ends_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collaborative_quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collaborative_quest_participants" (
    "id" SERIAL NOT NULL,
    "quest_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "contribution_value" INTEGER NOT NULL DEFAULT 0,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collaborative_quest_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collaborative_quest_contributions" (
    "id" SERIAL NOT NULL,
    "quest_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "memo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collaborative_quest_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collaborative_quest_reward_claims" (
    "id" SERIAL NOT NULL,
    "quest_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "reward_points" INTEGER NOT NULL DEFAULT 0,
    "claimed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collaborative_quest_reward_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "collaborative_quests_status_idx" ON "collaborative_quests"("status");

-- CreateIndex
CREATE INDEX "collaborative_quests_created_by_id_idx" ON "collaborative_quests"("created_by_id");

-- CreateIndex
CREATE INDEX "collaborative_quests_ends_at_idx" ON "collaborative_quests"("ends_at");

-- CreateIndex
CREATE UNIQUE INDEX "collaborative_quest_participants_quest_id_user_id_key" ON "collaborative_quest_participants"("quest_id", "user_id");

-- CreateIndex
CREATE INDEX "collaborative_quest_participants_user_id_idx" ON "collaborative_quest_participants"("user_id");

-- CreateIndex
CREATE INDEX "collaborative_quest_contributions_quest_id_idx" ON "collaborative_quest_contributions"("quest_id");

-- CreateIndex
CREATE INDEX "collaborative_quest_contributions_user_id_idx" ON "collaborative_quest_contributions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "collaborative_quest_reward_claims_quest_id_user_id_key" ON "collaborative_quest_reward_claims"("quest_id", "user_id");

-- CreateIndex
CREATE INDEX "collaborative_quest_reward_claims_user_id_idx" ON "collaborative_quest_reward_claims"("user_id");

-- AddForeignKey
ALTER TABLE "collaborative_quests" ADD CONSTRAINT "collaborative_quests_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaborative_quest_participants" ADD CONSTRAINT "collaborative_quest_participants_quest_id_fkey" FOREIGN KEY ("quest_id") REFERENCES "collaborative_quests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaborative_quest_participants" ADD CONSTRAINT "collaborative_quest_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaborative_quest_contributions" ADD CONSTRAINT "collaborative_quest_contributions_quest_id_fkey" FOREIGN KEY ("quest_id") REFERENCES "collaborative_quests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaborative_quest_contributions" ADD CONSTRAINT "collaborative_quest_contributions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaborative_quest_reward_claims" ADD CONSTRAINT "collaborative_quest_reward_claims_quest_id_fkey" FOREIGN KEY ("quest_id") REFERENCES "collaborative_quests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaborative_quest_reward_claims" ADD CONSTRAINT "collaborative_quest_reward_claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

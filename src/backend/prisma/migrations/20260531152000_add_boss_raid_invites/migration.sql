CREATE TYPE "BossRaidInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');

CREATE TABLE "boss_raid_invites" (
    "id" SERIAL NOT NULL,
    "party_id" INTEGER NOT NULL,
    "inviter_id" INTEGER NOT NULL,
    "invitee_id" INTEGER NOT NULL,
    "status" "BossRaidInviteStatus" NOT NULL DEFAULT 'PENDING',
    "responded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boss_raid_invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "boss_raid_invites_party_id_invitee_id_key"
ON "boss_raid_invites"("party_id", "invitee_id");

CREATE INDEX "boss_raid_invites_invitee_id_status_idx"
ON "boss_raid_invites"("invitee_id", "status");

CREATE INDEX "boss_raid_invites_inviter_id_status_idx"
ON "boss_raid_invites"("inviter_id", "status");

CREATE INDEX "boss_raid_invites_party_id_status_idx"
ON "boss_raid_invites"("party_id", "status");

ALTER TABLE "boss_raid_invites"
ADD CONSTRAINT "boss_raid_invites_party_id_fkey"
FOREIGN KEY ("party_id") REFERENCES "boss_raid_parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "boss_raid_invites"
ADD CONSTRAINT "boss_raid_invites_inviter_id_fkey"
FOREIGN KEY ("inviter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "boss_raid_invites"
ADD CONSTRAINT "boss_raid_invites_invitee_id_fkey"
FOREIGN KEY ("invitee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

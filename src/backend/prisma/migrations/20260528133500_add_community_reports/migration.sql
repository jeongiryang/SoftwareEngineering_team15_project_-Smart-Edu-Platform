-- CreateEnum
CREATE TYPE "CommunityReportStatus" AS ENUM ('PENDING', 'DISMISSED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "CommunityReportTargetType" AS ENUM ('POST', 'COMMENT');

-- CreateTable
CREATE TABLE "community_reports" (
    "id" SERIAL NOT NULL,
    "reporter_id" INTEGER NOT NULL,
    "target_type" "CommunityReportTargetType" NOT NULL,
    "post_id" INTEGER,
    "comment_id" INTEGER,
    "reason" TEXT NOT NULL,
    "status" "CommunityReportStatus" NOT NULL DEFAULT 'PENDING',
    "resolved_by_id" INTEGER,
    "resolved_at" TIMESTAMP(3),
    "resolution_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_reports_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "community_reports_target_check" CHECK (
        (
            "target_type" = 'POST'
            AND "post_id" IS NOT NULL
            AND "comment_id" IS NULL
        )
        OR (
            "target_type" = 'COMMENT'
            AND "comment_id" IS NOT NULL
            AND "post_id" IS NULL
        )
    )
);

-- CreateIndex
CREATE INDEX "community_reports_reporter_id_idx" ON "community_reports"("reporter_id");

-- CreateIndex
CREATE INDEX "community_reports_post_id_idx" ON "community_reports"("post_id");

-- CreateIndex
CREATE INDEX "community_reports_comment_id_idx" ON "community_reports"("comment_id");

-- CreateIndex
CREATE INDEX "community_reports_status_idx" ON "community_reports"("status");

-- CreateIndex
CREATE INDEX "community_reports_target_type_idx" ON "community_reports"("target_type");

-- CreateIndex
CREATE INDEX "community_reports_resolved_by_id_idx" ON "community_reports"("resolved_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "community_reports_reporter_id_post_id_key" ON "community_reports"("reporter_id", "post_id") WHERE "post_id" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "community_reports_reporter_id_comment_id_key" ON "community_reports"("reporter_id", "comment_id") WHERE "comment_id" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "board_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

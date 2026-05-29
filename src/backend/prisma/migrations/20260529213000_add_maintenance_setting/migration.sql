-- Add a singleton maintenance mode setting for service update notices.
CREATE TABLE "maintenance_settings" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "estimated_end_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "maintenance_settings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "maintenance_settings_singleton_check" CHECK ("id" = 1)
);

INSERT INTO "maintenance_settings" (
  "id",
  "enabled",
  "title",
  "message",
  "created_at",
  "updated_at"
) VALUES (
  1,
  false,
  '사각사각 업데이트 중',
  '더 좋은 학습 경험을 준비하고 있어요. 조금만 기다려주세요.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

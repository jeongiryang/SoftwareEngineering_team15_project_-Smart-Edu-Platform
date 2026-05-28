-- CreateTable
CREATE TABLE "accessibility_preferences" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "text_scale" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "high_contrast" BOOLEAN NOT NULL DEFAULT false,
    "elementary_friendly_ui" BOOLEAN NOT NULL DEFAULT false,
    "voice_input_enabled" BOOLEAN NOT NULL DEFAULT false,
    "voice_output_enabled" BOOLEAN NOT NULL DEFAULT false,
    "review_reminder_enabled" BOOLEAN NOT NULL DEFAULT false,
    "reminder_time" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accessibility_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voice_accessibility_requests" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "mode" TEXT NOT NULL,
    "voice_type" TEXT,
    "input_text" TEXT,
    "transcript" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_accessibility_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accessibility_preferences_user_id_key" ON "accessibility_preferences"("user_id");

-- CreateIndex
CREATE INDEX "voice_accessibility_requests_user_id_idx" ON "voice_accessibility_requests"("user_id");

-- CreateIndex
CREATE INDEX "voice_accessibility_requests_mode_idx" ON "voice_accessibility_requests"("mode");

-- AddForeignKey
ALTER TABLE "accessibility_preferences" ADD CONSTRAINT "accessibility_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_accessibility_requests" ADD CONSTRAINT "voice_accessibility_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

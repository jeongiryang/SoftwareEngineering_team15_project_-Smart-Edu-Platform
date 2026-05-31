-- CreateTable
CREATE TABLE "ai_chat_rooms" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'AI 대화',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_chat_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_chat_messages" (
    "id" SERIAL NOT NULL,
    "room_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "is_mock" BOOLEAN NOT NULL DEFAULT false,
    "is_truncated" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'AI_QNA',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_chat_rooms_user_id_updated_at_idx" ON "ai_chat_rooms"("user_id", "updated_at");

-- CreateIndex
CREATE INDEX "ai_chat_messages_room_id_created_at_idx" ON "ai_chat_messages"("room_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_chat_messages_user_id_created_at_idx" ON "ai_chat_messages"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "ai_chat_rooms" ADD CONSTRAINT "ai_chat_rooms_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_chat_messages" ADD CONSTRAINT "ai_chat_messages_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "ai_chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_chat_messages" ADD CONSTRAINT "ai_chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

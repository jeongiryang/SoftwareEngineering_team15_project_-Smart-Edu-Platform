-- CreateTable
CREATE TABLE "direct_message_threads" (
    "id" SERIAL NOT NULL,
    "participant_a_id" INTEGER NOT NULL,
    "participant_b_id" INTEGER NOT NULL,
    "last_message_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "direct_message_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direct_messages" (
    "id" SERIAL NOT NULL,
    "thread_id" INTEGER NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "direct_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direct_message_read_states" (
    "id" SERIAL NOT NULL,
    "thread_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "last_read_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "direct_message_read_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "direct_message_threads_participant_a_id_participant_b_id_key" ON "direct_message_threads"("participant_a_id", "participant_b_id");

-- CreateIndex
CREATE INDEX "direct_message_threads_participant_a_id_idx" ON "direct_message_threads"("participant_a_id");

-- CreateIndex
CREATE INDEX "direct_message_threads_participant_b_id_idx" ON "direct_message_threads"("participant_b_id");

-- CreateIndex
CREATE INDEX "direct_message_threads_last_message_at_idx" ON "direct_message_threads"("last_message_at");

-- CreateIndex
CREATE INDEX "direct_messages_thread_id_created_at_idx" ON "direct_messages"("thread_id", "created_at");

-- CreateIndex
CREATE INDEX "direct_messages_sender_id_idx" ON "direct_messages"("sender_id");

-- CreateIndex
CREATE UNIQUE INDEX "direct_message_read_states_thread_id_user_id_key" ON "direct_message_read_states"("thread_id", "user_id");

-- CreateIndex
CREATE INDEX "direct_message_read_states_user_id_idx" ON "direct_message_read_states"("user_id");

-- AddForeignKey
ALTER TABLE "direct_message_threads" ADD CONSTRAINT "direct_message_threads_participant_a_id_fkey" FOREIGN KEY ("participant_a_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_message_threads" ADD CONSTRAINT "direct_message_threads_participant_b_id_fkey" FOREIGN KEY ("participant_b_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "direct_message_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_message_read_states" ADD CONSTRAINT "direct_message_read_states_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "direct_message_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_message_read_states" ADD CONSTRAINT "direct_message_read_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "ShopItemType" AS ENUM ('PROFILE_IMAGE', 'PROFILE_BACKGROUND', 'TITLE');

-- AlterTable
ALTER TABLE "user_profiles"
ADD COLUMN "profile_background_url" TEXT,
ADD COLUMN "title_text" TEXT;

-- CreateTable
CREATE TABLE "shop_items" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ShopItemType" NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "asset_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_shop_purchases" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "item_id" INTEGER NOT NULL,
    "purchased_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_shop_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shop_items_code_key" ON "shop_items"("code");

-- CreateIndex
CREATE INDEX "shop_items_type_idx" ON "shop_items"("type");

-- CreateIndex
CREATE INDEX "shop_items_is_active_idx" ON "shop_items"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "user_shop_purchases_user_id_item_id_key" ON "user_shop_purchases"("user_id", "item_id");

-- CreateIndex
CREATE INDEX "user_shop_purchases_item_id_idx" ON "user_shop_purchases"("item_id");

-- AddForeignKey
ALTER TABLE "user_shop_purchases" ADD CONSTRAINT "user_shop_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_shop_purchases" ADD CONSTRAINT "user_shop_purchases_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "shop_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

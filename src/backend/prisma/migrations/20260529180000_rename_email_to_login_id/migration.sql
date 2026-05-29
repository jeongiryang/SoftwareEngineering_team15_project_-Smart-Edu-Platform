-- Rename the existing login identifier column without dropping user data.
ALTER TABLE "users" RENAME COLUMN "email" TO "login_id";

-- Convert known development seed identifiers to the new non-email login IDs.
UPDATE "users" SET "login_id" = 'dev_user' WHERE "login_id" = 'dev.user@example.com';
UPDATE "users" SET "login_id" = 'study_peer' WHERE "login_id" = 'dev.peer@example.com';
UPDATE "users" SET "login_id" = 'community_user' WHERE "login_id" = 'dev.community@example.com';
UPDATE "users" SET "login_id" = 'reward_user' WHERE "login_id" = 'dev.reward@example.com';
UPDATE "users" SET "login_id" = 'accessibility_user' WHERE "login_id" = 'dev.access@example.com';
UPDATE "users" SET "login_id" = 'beginner_user' WHERE "login_id" = 'dev.beginner@example.com';
UPDATE "users" SET "login_id" = 'admin_user' WHERE "login_id" = 'dev.admin@example.com';

-- Keep any remaining existing local accounts valid by deriving a safe login ID.
UPDATE "users"
SET "login_id" = CONCAT(
  LEFT(
    COALESCE(NULLIF(REGEXP_REPLACE(LOWER(SPLIT_PART("login_id", '@', 1)), '[^a-z0-9_-]', '_', 'g'), ''), 'user'),
    GREATEST(3, 29 - LENGTH("id"::text))
  ),
  '_',
  "id"::text
)
WHERE "login_id" LIKE '%@%' OR "login_id" !~ '^[a-z0-9_-]{3,30}$';

-- Keep the Prisma-generated unique index name aligned with the new schema field.
ALTER INDEX IF EXISTS "users_email_key" RENAME TO "users_login_id_key";

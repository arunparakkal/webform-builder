-- AlterTable
ALTER TABLE "users" ADD COLUMN "password_hash" TEXT;
ALTER TABLE "users" ADD COLUMN "name" TEXT;

-- Existing seed users (if any) get a temporary unusable hash; they must re-register or be reseeded.
UPDATE "users"
SET "password_hash" = '$2b$10$InvalidPlaceholderHashForceReset000000000000000000000u'
WHERE "password_hash" IS NULL;

ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL;

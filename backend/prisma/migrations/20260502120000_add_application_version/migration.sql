-- AlterTable: add optimistic-locking version counter to Application
-- Existing rows get version = 0 (the column default), so no data migration is needed.
ALTER TABLE "Application" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;

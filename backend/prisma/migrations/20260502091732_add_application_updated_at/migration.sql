/*
  Warnings:

  - Added the required column `updatedAt` to the `Application` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: back-fill existing rows with current timestamp, then remove the default
ALTER TABLE "Application" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now();
ALTER TABLE "Application" ALTER COLUMN "updatedAt" DROP DEFAULT;

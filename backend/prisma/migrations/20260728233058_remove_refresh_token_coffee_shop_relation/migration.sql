/*
  Warnings:

  - You are about to drop the column `coffeeShopId` on the `RefreshToken` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_coffeeShopId_fkey";

-- AlterTable
ALTER TABLE "RefreshToken" DROP COLUMN "coffeeShopId";

/*
  Warnings:

  - You are about to drop the column `presetName` on the `CampaignStyle` table. All the data in the column will be lost.
  - You are about to drop the column `styleType` on the `CampaignStyle` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedImageUrl` on the `CampaignStyle` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[campaignId,styleId]` on the table `CampaignStyle` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `styleId` to the `CampaignStyle` table without a default value. This is not possible if the table is not empty.

*/
-- Delete existing rows since they can't be mapped to the new Style table
DELETE FROM "CampaignStyle";

-- AlterTable
ALTER TABLE "CampaignStyle" DROP COLUMN "presetName",
DROP COLUMN "styleType",
DROP COLUMN "uploadedImageUrl",
ADD COLUMN     "styleId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Style" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Style_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Style_name_key" ON "Style"("name");

-- CreateIndex
CREATE INDEX "CampaignStyle_styleId_idx" ON "CampaignStyle"("styleId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignStyle_campaignId_styleId_key" ON "CampaignStyle"("campaignId", "styleId");

-- AddForeignKey
ALTER TABLE "CampaignStyle" ADD CONSTRAINT "CampaignStyle_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "Style"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "CampaignStyle" ADD COLUMN     "styleType" TEXT NOT NULL DEFAULT 'library',
ADD COLUMN     "uploadedImageUrl" TEXT,
ALTER COLUMN "styleId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Style" ADD COLUMN     "previewImageUrl" TEXT;

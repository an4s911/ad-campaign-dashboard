-- AlterTable
ALTER TABLE "GeneratedImage" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ALTER COLUMN "imageUrl" SET DEFAULT '';

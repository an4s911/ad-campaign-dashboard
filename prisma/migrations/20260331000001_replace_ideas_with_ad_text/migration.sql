-- CreateTable
CREATE TABLE "CampaignText" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CampaignText_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CampaignText_campaignId_idx" ON "CampaignText"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignText_productId_idx" ON "CampaignText"("productId");

-- AddForeignKey
ALTER TABLE "CampaignText" ADD CONSTRAINT "CampaignText_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignText" ADD CONSTRAINT "CampaignText_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing CampaignIdea rows into CampaignText.
-- Ideas have no productId; assign each to the first product of that campaign (by CampaignProduct.id).
-- Ideas whose campaign has no associated products are skipped.
INSERT INTO "CampaignText" ("id", "campaignId", "productId", "text", "isEnabled", "sortOrder")
SELECT
    ci."id",
    ci."campaignId",
    first_product."productId",
    ci."description",
    true,
    ci."sortOrder"
FROM "CampaignIdea" ci
JOIN LATERAL (
    SELECT cp."productId"
    FROM "CampaignProduct" cp
    WHERE cp."campaignId" = ci."campaignId"
    ORDER BY cp."id"
    LIMIT 1
) first_product ON true;

-- DropTable
DROP TABLE "CampaignIdea";

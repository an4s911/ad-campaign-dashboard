-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "targetDays" JSONB NOT NULL DEFAULT '["mon","tue","wed","thu","fri","sat","sun"]',
ADD COLUMN     "targetIncome" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "targetLocations" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "targetProductTags" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "targetShoppingBehavior" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "targetTimeOfDay" JSONB NOT NULL DEFAULT '["all_day"]',
ADD COLUMN     "targetWeather" JSONB NOT NULL DEFAULT '["any"]';

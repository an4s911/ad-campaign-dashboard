import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { DashboardStatsResponse, RecentActivityItem } from "@/lib/dashboard";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toUtcDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function GET() {
  try {
    const now = new Date();
    const adsThisWeekStart = new Date(now.getTime() - 7 * DAY_IN_MS);
    const todayStart = startOfUtcDay(now);
    const adsPerDayStart = addUtcDays(todayStart, -29);
    const recentActivityLimit = 10;

    const [
      totalProducts,
      activeCampaigns,
      totalAdsGenerated,
      adsThisWeek,
      adsInRange,
      campaignStatusCounts,
      recentProducts,
      recentCampaigns,
      recentGeneratedImages,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.campaign.count({ where: { status: "active" } }),
      prisma.generatedImage.count({ where: { isDeleted: false } }),
      prisma.generatedImage.count({
        where: {
          isDeleted: false,
          createdAt: { gte: adsThisWeekStart },
        },
      }),
      prisma.generatedImage.findMany({
        where: {
          isDeleted: false,
          createdAt: { gte: adsPerDayStart },
        },
        select: { createdAt: true },
      }),
      prisma.campaign.groupBy({
        by: ["status"],
        _count: { _all: true },
        where: { status: { in: ["draft", "active", "disabled"] } },
      }),
      prisma.product.findMany({
        orderBy: { createdAt: "desc" },
        take: recentActivityLimit,
        select: {
          name: true,
          createdAt: true,
        },
      }),
      prisma.campaign.findMany({
        orderBy: { updatedAt: "desc" },
        take: recentActivityLimit,
        select: {
          name: true,
          updatedAt: true,
        },
      }),
      prisma.generatedImage.findMany({
        where: { isDeleted: false },
        orderBy: { createdAt: "desc" },
        take: recentActivityLimit,
        select: {
          createdAt: true,
          campaign: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    const adsPerDayMap = new Map<string, number>();
    for (let index = 0; index < 30; index += 1) {
      const date = addUtcDays(adsPerDayStart, index);
      adsPerDayMap.set(toUtcDateKey(date), 0);
    }

    for (const ad of adsInRange) {
      const key = toUtcDateKey(ad.createdAt);
      if (adsPerDayMap.has(key)) {
        adsPerDayMap.set(key, (adsPerDayMap.get(key) ?? 0) + 1);
      }
    }

    const campaignsByStatus = {
      draft: 0,
      active: 0,
      disabled: 0,
    };

    for (const item of campaignStatusCounts) {
      if (item.status === "draft" || item.status === "active" || item.status === "disabled") {
        campaignsByStatus[item.status] = item._count._all;
      }
    }

    const recentActivity: RecentActivityItem[] = [
      ...recentProducts.map((product) => ({
        type: "product" as const,
        name: product.name,
        timestamp: product.createdAt.toISOString(),
      })),
      ...recentCampaigns.map((campaign) => ({
        type: "campaign" as const,
        name: campaign.name,
        timestamp: campaign.updatedAt.toISOString(),
      })),
      ...recentGeneratedImages.map((image) => ({
        type: "ad_generated" as const,
        name: image.campaign.name,
        timestamp: image.createdAt.toISOString(),
      })),
    ]
      .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
      .slice(0, recentActivityLimit);

    const response: DashboardStatsResponse = {
      totalProducts,
      activeCampaigns,
      totalAdsGenerated,
      adsThisWeek,
      adsPerDay: Array.from(adsPerDayMap.entries()).map(([date, count]) => ({
        date,
        count,
      })),
      campaignsByStatus,
      recentActivity,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}

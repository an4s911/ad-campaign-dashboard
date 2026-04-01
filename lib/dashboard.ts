export type RecentActivityType = "product" | "campaign" | "ad_generated";

export interface AdsPerDayPoint {
  date: string;
  count: number;
}

export interface CampaignsByStatus {
  draft: number;
  active: number;
  disabled: number;
}

export interface RecentActivityItem {
  type: RecentActivityType;
  name: string;
  timestamp: string;
}

export interface DashboardStatsResponse {
  totalProducts: number;
  activeCampaigns: number;
  totalAdsGenerated: number;
  adsThisWeek: number;
  adsPerDay: AdsPerDayPoint[];
  campaignsByStatus: CampaignsByStatus;
  recentActivity: RecentActivityItem[];
}

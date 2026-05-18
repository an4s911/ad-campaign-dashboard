"use client";

import { useEffect, useState, type ReactElement, type SVGProps } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  DashboardStatsResponse,
  RecentActivityItem,
  RecentActivityType,
} from "@/lib/dashboard";

const EMPTY_STATS: DashboardStatsResponse = {
  totalProducts: 0,
  activeCampaigns: 0,
  totalAdsGenerated: 0,
  adsThisWeek: 0,
  adsPerDay: Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - (29 - index));
    return {
      date: date.toISOString().slice(0, 10),
      count: 0,
    };
  }),
  campaignsByStatus: {
    draft: 0,
    active: 0,
    disabled: 0,
  },
  recentActivity: [],
};

const numberFormatter = new Intl.NumberFormat("en-US");
const dayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function PackageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 7.5 8.25 4.5 8.25-4.5M12 12v8.25m8.25-12.75v9A2.25 2.25 0 0 1 18 18.75H6A2.25 2.25 0 0 1 3.75 16.5v-9m16.5 0A2.25 2.25 0 0 0 19.125 5.5l-6-3.273a2.25 2.25 0 0 0-2.25 0l-6 3.273A2.25 2.25 0 0 0 3.75 7.5" />
    </svg>
  );
}

function MegaphoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38a.75.75 0 0 1-1.021-.27 18.566 18.566 0 0 1-2.414-5.904m5.57-5.504c-.253-.962-.584-1.892-.985-2.783a1.125 1.125 0 0 1 .463-1.511l.657-.38a.75.75 0 0 1 1.021.27 18.566 18.566 0 0 1 2.414 5.904m-5.57 5.504a18.583 18.583 0 0 0 5.57-5.504m-5.57 5.504V18a.75.75 0 0 0 .75.75h.75" />
    </svg>
  );
}

function ImageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75 8.836 9.164a2.25 2.25 0 0 1 3.182 0l6.232 6.232m-10.5 3.354h10.5A2.25 2.25 0 0 0 20.5 16.5V7.5A2.25 2.25 0 0 0 18.25 5.25H5.75A2.25 2.25 0 0 0 3.5 7.5v9A2.25 2.25 0 0 0 5.75 18.75Zm8.25-9.75h.008v.008H14v-.008Z" />
    </svg>
  );
}

function TrendingUpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 15.75 6-6 4.5 4.5 6-7.5M15.75 6.75h4.5v4.5" />
    </svg>
  );
}

function ArrowRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  );
}

function formatRelativeTime(timestamp: string) {
  const deltaInSeconds = Math.round((new Date(timestamp).getTime() - Date.now()) / 1000);
  const absoluteSeconds = Math.abs(deltaInSeconds);

  if (absoluteSeconds < 60) {
    return "just now";
  }

  if (absoluteSeconds < 60 * 60) {
    const minutes = Math.round(deltaInSeconds / 60);
    return `${Math.abs(minutes)} minute${Math.abs(minutes) === 1 ? "" : "s"} ago`;
  }

  if (absoluteSeconds < 60 * 60 * 24) {
    const hours = Math.round(deltaInSeconds / (60 * 60));
    return `${Math.abs(hours)} hour${Math.abs(hours) === 1 ? "" : "s"} ago`;
  }

  if (absoluteSeconds < 60 * 60 * 24 * 30) {
    const days = Math.round(deltaInSeconds / (60 * 60 * 24));
    return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`;
  }

  return dateTimeFormatter.format(new Date(timestamp));
}

function formatChartDay(date: string) {
  return dayFormatter.format(new Date(`${date}T00:00:00.000Z`));
}

function formatTooltipValue(value: unknown, label: string) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const safeValue = typeof rawValue === "number" ? rawValue : Number(rawValue ?? 0);
  return [`${numberFormatter.format(safeValue)} ads`, label] as [string, string];
}

function getActivityCopy(item: RecentActivityItem) {
  switch (item.type) {
    case "product":
      return `Product created: ${item.name}`;
    case "campaign":
      return `Campaign updated: ${item.name}`;
    case "ad_generated":
      return `Ad generated for campaign: ${item.name}`;
    default:
      return item.name;
  }
}

function getActivityIcon(type: RecentActivityType) {
  switch (type) {
    case "product":
      return PackageIcon;
    case "campaign":
      return MegaphoneIcon;
    case "ad_generated":
      return ImageIcon;
    default:
      return PackageIcon;
  }
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: (props: SVGProps<SVGSVGElement>) => ReactElement;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="text-3xl font-semibold tracking-[-0.03em] text-foreground">
        {numberFormatter.format(value)}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-fade-in space-y-10">
      <div className="border-b border-border pb-10">
        <div className="h-4 w-32 shimmer" />
        <div className="mt-5 h-16 w-80 shimmer" />
      </div>
      <div className="grid gap-8 md:grid-cols-[220px_1fr] md:gap-16">
        <div>
          <div className="h-3 w-10 shimmer" />
          <div className="mt-4 h-8 w-36 shimmer" />
          <div className="mt-4 h-20 w-full shimmer" />
        </div>
        <div className="h-[28rem] shimmer border-y border-border" />
      </div>
      <div className="grid gap-8 border-t border-border pt-10 md:grid-cols-[220px_1fr] md:gap-16">
        <div>
          <div className="h-3 w-10 shimmer" />
          <div className="mt-4 h-8 w-36 shimmer" />
        </div>
        <div className="space-y-4 border-y border-border py-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-12 shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="animate-fade-in rounded-2xl border border-error/20 bg-card p-6 shadow-card">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-error/10 text-error">
        <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008Zm9.303 2.126c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374L10.051 4.378c.866-1.5 3.032-1.5 3.898 0l7.354 12.748Z" />
        </svg>
      </div>
      <h2 className="mt-4 text-lg font-semibold text-foreground">Unable to load dashboard stats</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        The analytics endpoint did not return data. Retry the request and keep the rest of the dashboard unchanged.
      </p>
      <button
        onClick={onRetry}
        className="mt-5 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-all duration-150 hover:brightness-110"
      >
        Retry
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStatsResponse>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function fetchStats() {
    setLoading(true);
    setError(false);

    try {
      const response = await fetch("/api/dashboard/stats", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }

      const data: DashboardStatsResponse = await response.json();
      setStats(data);
    } catch (fetchError) {
      console.error(fetchError);
      setError(true);
      setStats(EMPTY_STATS);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchStats();
  }, []);

  const campaignChartData = [
    { key: "draft", name: "Draft", value: stats.campaignsByStatus.draft, color: "#7E85A0" },
    { key: "active", name: "Active", value: stats.campaignsByStatus.active, color: "#3DD68C" },
    { key: "disabled", name: "Disabled", value: stats.campaignsByStatus.disabled, color: "#FF8A65" },
  ];

  const hasCampaignStatusData = campaignChartData.some((item) => item.value > 0);
  const pieChartData = hasCampaignStatusData
    ? campaignChartData
    : [{ key: "empty", name: "No data", value: 1, color: "rgba(126, 133, 160, 0.3)" }];

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <DashboardError onRetry={() => void fetchStats()} />;
  }

  return (
    <div className="animate-fade-in space-y-12">
      <header className="flex flex-col gap-8 border-b border-border pb-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Control room</p>
          <h1 className="mt-4 font-display text-[3rem] font-semibold leading-[0.95] tracking-[-0.05em] text-foreground md:text-[4rem]">
            Welcome back.
          </h1>
        </div>
        <div className="grid grid-cols-2 gap-8 text-right">
          <div>
            <p className="text-3xl font-semibold tracking-[-0.04em] text-foreground">{numberFormatter.format(stats.activeCampaigns)}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Active campaigns</p>
          </div>
          <div>
            <p className="text-3xl font-semibold tracking-[-0.04em] text-foreground">{numberFormatter.format(stats.adsThisWeek)}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ads this week</p>
          </div>
        </div>
      </header>

      <section className="grid gap-8 md:grid-cols-[220px_1fr] md:gap-16">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">01</p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.03em] text-foreground">Production rhythm</h2>
          <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">Generated ads across the last 30 days. The shape matters more than the count.</p>
        </div>
        <div className="border-y border-border bg-card/45 px-2 py-6 md:px-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">Ads generated over time</p>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {numberFormatter.format(stats.totalAdsGenerated)} total
            </span>
          </div>
          <div className="h-[28rem]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.adsPerDay} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="adsAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.36} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.55} />
                <XAxis axisLine={false} dataKey="date" minTickGap={28} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickFormatter={formatChartDay} tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickLine={false} width={32} />
                <Tooltip
                  cursor={{ stroke: "var(--primary)", strokeOpacity: 0.2 }}
                  contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 0, boxShadow: "none", color: "var(--foreground)" }}
                  formatter={(value) => formatTooltipValue(value, "Generated")}
                  labelFormatter={(label) => (typeof label === "string" ? formatChartDay(label) : "")}
                />
                <Area type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={2.5} fill="url(#adsAreaGradient)" activeDot={{ r: 4, strokeWidth: 0, fill: "var(--primary)" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid gap-8 border-t border-border pt-12 md:grid-cols-[220px_1fr] md:gap-16">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">02</p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.03em] text-foreground">Campaign mix</h2>
          <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">Current status spread, kept quiet so anomalies stand out.</p>
        </div>
        <div className="grid items-center gap-8 md:grid-cols-[1fr_260px]">
          <div className="divide-y divide-border border-y border-border">
            {campaignChartData.map((item) => (
              <div key={item.key} className="flex items-center justify-between py-5">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />
                  <span className="text-sm font-medium text-foreground">{item.name}</span>
                </div>
                <span className="text-2xl font-semibold tracking-[-0.04em] text-foreground">{numberFormatter.format(item.value)}</span>
              </div>
            ))}
          </div>
          <div className="relative h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieChartData} dataKey="value" innerRadius={68} outerRadius={96} paddingAngle={hasCampaignStatusData ? 3 : 0} strokeWidth={0}>
                  {pieChartData.map((item) => (<Cell key={item.key} fill={item.color} />))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 0, boxShadow: "none", color: "var(--foreground)" }}
                  formatter={(value, name) =>
                    hasCampaignStatusData
                      ? [numberFormatter.format(typeof (Array.isArray(value) ? value[0] : value) === "number" ? (Array.isArray(value) ? value[0] : value) : Number((Array.isArray(value) ? value[0] : value) ?? 0)), typeof name === "string" ? name : "Status"]
                      : ["0", "No data"]
                  }
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-semibold tracking-[-0.04em] text-foreground">{numberFormatter.format(stats.campaignsByStatus.active)}</span>
              <span className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">Active</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 border-t border-border pt-12 md:grid-cols-[220px_1fr] md:gap-16">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">03</p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.03em] text-foreground">Latest movements</h2>
          <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">Products, campaigns, and generated ads in one editorial feed.</p>
        </div>
        {stats.recentActivity.length === 0 ? (
          <div className="border-y border-dashed border-border py-16 text-center">
            <h3 className="text-base font-semibold text-foreground">No recent activity yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">Create products, update campaigns, or generate ads to populate this feed.</p>
          </div>
        ) : (
          <div className="divide-y divide-border border-y border-border">
            {stats.recentActivity.map((item, index) => {
              const Icon = getActivityIcon(item.type);
              return (
                <div key={`${item.type}-${item.timestamp}-${index}`} className="flex items-center gap-4 py-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-card text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{getActivityCopy(item)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatRelativeTime(item.timestamp)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid gap-6 border-t border-border pt-12 md:grid-cols-2">
        <Link href="/campaign/new" className="group border-y border-border py-6 transition-colors hover:border-primary/60">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Start</p>
          <div className="mt-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-foreground">New campaign</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Launch AI-generated ad concepts from existing products.</p>
            </div>
            <ArrowRightIcon className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary" aria-hidden="true" />
          </div>
        </Link>
        <Link href="/product" className="group border-y border-border py-6 transition-colors hover:border-primary/60">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Catalog</p>
          <div className="mt-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-foreground">View products</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Review assets and manage what campaigns can use.</p>
            </div>
            <ArrowRightIcon className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary" aria-hidden="true" />
          </div>
        </Link>
      </section>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface CampaignListItem {
  id: string;
  name: string;
  adCount: number;
  status: string;
  createdAt: string;
  productCount: number;
  generatedImageCount: number;
}

const statusConfig: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  draft: { dot: "bg-muted-foreground", bg: "bg-muted", text: "text-muted-foreground", label: "Draft" },
  active: { dot: "bg-success", bg: "bg-success/10", text: "text-success", label: "Active" },
  disabled: { dot: "bg-warning", bg: "bg-warning/10", text: "text-warning", label: "Disabled" },
};

export default function CampaignPage() {
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch("/api/campaigns");
      if (res.ok) setCampaigns(await res.json());
    } catch {
      showToast("Failed to fetch campaigns", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  function showToast(message: string, type: "error" | "success") {
    setToast({ message, type });
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
    setTimeout(() => setToast(null), 3400);
  }

  async function handleToggleStatus(e: React.MouseEvent, campaign: CampaignListItem) {
    e.preventDefault();
    e.stopPropagation();
    const newStatus = campaign.status === "active" ? "disabled" : "active";
    const prev = campaign.status;
    setCampaigns((c) => c.map((x) => (x.id === campaign.id ? { ...x, status: newStatus } : x)));
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        setCampaigns((c) => c.map((x) => (x.id === campaign.id ? { ...x, status: prev } : x)));
        showToast("Failed to update status", "error");
      }
    } catch {
      setCampaigns((c) => c.map((x) => (x.id === campaign.id ? { ...x, status: prev } : x)));
      showToast("Failed to update status", "error");
    }
  }

  async function handleDelete(e: React.MouseEvent, campaign: CampaignListItem) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Delete "${campaign.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, { method: "DELETE" });
      if (res.ok) {
        setCampaigns((c) => c.filter((x) => x.id !== campaign.id));
        showToast("Campaign deleted", "success");
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to delete", "error");
      }
    } catch {
      showToast("Failed to delete campaign", "error");
    }
  }

  function formatDate(dateStr: string) {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(dateStr));
  }

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8 flex items-center justify-between">
          <div className="h-8 w-36 shimmer rounded-lg" />
          <div className="h-10 w-40 shimmer rounded-xl" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[72px] shimmer rounded-xl" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Toast */}
      <div
        aria-live="polite"
        className={`fixed right-6 top-6 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
          toastVisible ? "toast-enter" : toast ? "toast-exit" : "pointer-events-none opacity-0"
        } ${toast?.type === "error" ? "bg-error text-error-foreground" : "bg-success text-success-foreground"}`}
      >
        {toast?.message}
      </div>

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">Campaigns</h1>
          <p className="mt-1 text-sm text-muted-foreground">{campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/campaign/new"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all duration-150 hover:brightness-110"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 shadow-card">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <svg aria-hidden="true" className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38a.75.75 0 0 1-1.021-.27 18.566 18.566 0 0 1-2.414-5.904m5.57-5.504c-.253-.962-.584-1.892-.985-2.783a1.125 1.125 0 0 1 .463-1.511l.657-.38a.75.75 0 0 1 1.021.27 18.566 18.566 0 0 1 2.414 5.904m-5.57 5.504a18.583 18.583 0 0 0 5.57-5.504m-5.57 5.504V18a.75.75 0 0 0 .75.75h.75" />
            </svg>
          </div>
          <h3 className="mb-1 text-base font-semibold text-foreground">No campaigns yet</h3>
          <p className="mb-5 text-sm text-muted-foreground">Create your first campaign to start generating ads.</p>
          <Link
            href="/campaign/new"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-all duration-150 hover:brightness-110"
          >
            Create First Campaign
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="grid grid-cols-[1.5fr_100px_80px_80px_110px_120px] items-center gap-4 border-b border-border px-5 py-3 text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
              <span>Name</span>
              <span>Status</span>
              <span>Products</span>
              <span>Images</span>
              <span>Created</span>
              <span className="text-right">Actions</span>
            </div>
            <div className="stagger-children divide-y divide-border/60">
              {campaigns.map((campaign) => {
                const sc = statusConfig[campaign.status] ?? statusConfig.draft;
                return (
                  <Link
                    key={campaign.id}
                    href={`/campaign/${campaign.id}`}
                    className="grid grid-cols-[1.5fr_100px_80px_80px_110px_120px] items-center gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-muted/50"
                  >
                    <span className="truncate text-sm font-medium text-foreground">{campaign.name}</span>
                    <span>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.bg} ${sc.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} aria-hidden="true" />
                        {sc.label}
                      </span>
                    </span>
                    <span className="text-sm text-muted-foreground tabular-nums">{campaign.productCount}</span>
                    <span className="text-sm text-muted-foreground tabular-nums">{campaign.generatedImageCount}</span>
                    <span className="text-sm text-muted-foreground">{formatDate(campaign.createdAt)}</span>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => handleToggleStatus(e, campaign)}
                        aria-label={campaign.status === "active" ? `Disable ${campaign.name}` : `Activate ${campaign.name}`}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {campaign.status === "active" ? (
                          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                          </svg>
                        ) : (
                          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, campaign)}
                        aria-label={`Delete ${campaign.name}`}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors duration-150 hover:bg-error/8 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3 stagger-children">
            {campaigns.map((campaign) => {
              const sc = statusConfig[campaign.status] ?? statusConfig.draft;
              return (
                <Link
                  key={campaign.id}
                  href={`/campaign/${campaign.id}`}
                  className="block rounded-2xl border border-border bg-card p-4 shadow-card transition-all duration-150 active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{campaign.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(campaign.createdAt)}</p>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.bg} ${sc.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} aria-hidden="true" />
                      {sc.label}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-4 border-t border-border/50 pt-3 text-xs text-muted-foreground">
                    <span>{campaign.productCount} product{campaign.productCount !== 1 ? "s" : ""}</span>
                    <span>{campaign.generatedImageCount} image{campaign.generatedImageCount !== 1 ? "s" : ""}</span>
                    <div className="ml-auto flex gap-1">
                      <button
                        onClick={(e) => handleToggleStatus(e, campaign)}
                        aria-label={campaign.status === "active" ? "Disable" : "Activate"}
                        className="rounded-lg p-1.5 text-muted-foreground active:bg-muted"
                      >
                        {campaign.status === "active" ? (
                          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                          </svg>
                        ) : (
                          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, campaign)}
                        aria-label="Delete"
                        className="rounded-lg p-1.5 text-muted-foreground active:bg-error/10 active:text-error"
                      >
                        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

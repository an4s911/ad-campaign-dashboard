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

export default function CampaignPage() {
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch("/api/campaigns");
      if (res.ok) {
        setCampaigns(await res.json());
      }
    } catch {
      showToast("Failed to fetch campaigns", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  function showToast(message: string, type: "error" | "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleToggleStatus(campaign: CampaignListItem) {
    const newStatus = campaign.status === "active" ? "disabled" : "active";
    const prev = campaign.status;
    setCampaigns((c) =>
      c.map((x) => (x.id === campaign.id ? { ...x, status: newStatus } : x))
    );
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        setCampaigns((c) =>
          c.map((x) => (x.id === campaign.id ? { ...x, status: prev } : x))
        );
        showToast("Failed to update status", "error");
      }
    } catch {
      setCampaigns((c) =>
        c.map((x) => (x.id === campaign.id ? { ...x, status: prev } : x))
      );
      showToast("Failed to update status", "error");
    }
  }

  async function handleDelete(campaign: CampaignListItem) {
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
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const statusConfig: Record<string, { dot: string; text: string; label: string }> = {
    draft: { dot: "bg-muted-foreground", text: "text-muted-foreground", label: "Draft" },
    active: { dot: "bg-success", text: "text-success", label: "Active" },
    disabled: { dot: "bg-warning", text: "text-warning", label: "Disabled" },
  };

  if (loading) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div className="h-8 w-36 animate-pulse rounded bg-muted" />
          <div className="h-10 w-36 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {toast && (
        <div
          className={`fixed right-6 top-6 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${
            toast.type === "error"
              ? "bg-error text-error-foreground"
              : "bg-success text-success-foreground"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
        <Link
          href="/campaign/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16 text-card-foreground">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <svg className="h-7 w-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38a.75.75 0 0 1-1.021-.27 18.566 18.566 0 0 1-2.414-5.904m5.57-5.504c-.253-.962-.584-1.892-.985-2.783a1.125 1.125 0 0 1 .463-1.511l.657-.38a.75.75 0 0 1 1.021.27 18.566 18.566 0 0 1 2.414 5.904m-5.57 5.504a18.583 18.583 0 0 0 5.57-5.504m-5.57 5.504V18a.75.75 0 0 0 .75.75h.75" />
            </svg>
          </div>
          <h3 className="mb-1 text-base font-semibold text-card-foreground">No campaigns yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">Create your first campaign to start generating ads.</p>
          <Link
            href="/campaign/new"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
          >
            Create First Campaign
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="grid grid-cols-[1.5fr_90px_90px_90px_110px_130px] items-center gap-4 border-b border-border bg-muted/30 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Name</span>
            <span>Status</span>
            <span>Products</span>
            <span>Images</span>
            <span>Created</span>
            <span className="text-right">Actions</span>
          </div>

          {campaigns.map((campaign) => {
            const sc = statusConfig[campaign.status] ?? statusConfig.draft;
            return (
              <div
                key={campaign.id}
                className="grid grid-cols-[1.5fr_90px_90px_90px_110px_130px] items-center gap-4 border-b border-border/50 px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/50"
              >
                <span className="truncate text-sm font-medium text-foreground">{campaign.name}</span>
                <span className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${sc.dot}`} />
                  <span className={`text-xs font-medium ${sc.text}`}>{sc.label}</span>
                </span>
                <span className="text-sm text-muted-foreground">{campaign.productCount}</span>
                <span className="text-sm text-muted-foreground">{campaign.generatedImageCount}</span>
                <span className="text-sm text-muted-foreground">{formatDate(campaign.createdAt)}</span>
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/campaign/${campaign.id}`}
                    title="Edit"
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => handleToggleStatus(campaign)}
                    title={campaign.status === "active" ? "Disable" : "Activate"}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {campaign.status === "active" ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(campaign)}
                    title="Delete"
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-error/10 hover:text-error"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

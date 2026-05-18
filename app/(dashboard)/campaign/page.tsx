"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

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

const statusFilters = ["all", "draft", "active", "disabled"] as const;

type StatusFilter = (typeof statusFilters)[number];

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function CampaignPage() {
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deleteCandidate, setDeleteCandidate] = useState<CampaignListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch("/api/campaigns");
      if (res.ok) setCampaigns(await res.json());
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const filteredCampaigns = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return campaigns.filter((campaign) => {
      const matchesQuery = !normalizedQuery || campaign.name.toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [campaigns, query, statusFilter]);

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
      }
    } catch {
      setCampaigns((c) => c.map((x) => (x.id === campaign.id ? { ...x, status: prev } : x)));
    }
  }

  function handleDelete(e: React.MouseEvent, campaign: CampaignListItem) {
    e.preventDefault();
    e.stopPropagation();
    setDeleteCandidate(campaign);
  }

  async function confirmDelete() {
    if (!deleteCandidate) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/campaigns/${deleteCandidate.id}`, { method: "DELETE" });
      if (res.ok) {
        setCampaigns((c) => c.filter((x) => x.id !== deleteCandidate.id));
        setDeleteCandidate(null);
      }
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-in space-y-10">
        <div className="border-b border-border pb-10">
          <div className="h-4 w-28 shimmer" />
          <div className="mt-4 h-14 w-72 shimmer" />
        </div>
        <div className="divide-y divide-border border-y border-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 shimmer" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-10">
      <header className="flex flex-col gap-8 border-b border-border pb-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Campaign library</p>
          <h1 className="mt-4 font-display text-[3rem] font-semibold leading-[0.95] tracking-[-0.05em] text-foreground md:text-[4rem]">
            Campaigns
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}, composed for launch and review.
          </p>
        </div>
        <Link
          href="/campaign/new"
          className="inline-flex h-11 items-center justify-center bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          New campaign
        </Link>
      </header>

      <section className="grid gap-8 md:grid-cols-[220px_1fr] md:gap-16">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">01</p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.03em] text-foreground">Find the work</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Filter by title or status without turning the page into an ops console.</p>
        </div>
        <div className="space-y-4">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search campaigns"
            className="h-12 w-full border-0 border-b border-border bg-transparent px-0 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-0"
          />
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                  statusFilter === status
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {status === "all" ? "All" : statusConfig[status].label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8 border-t border-border pt-10 md:grid-cols-[220px_1fr] md:gap-16">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">02</p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.03em] text-foreground">Campaign index</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Status, production volume, and actions in one scan.</p>
        </div>

        {filteredCampaigns.length === 0 ? (
          <div className="border-y border-dashed border-border py-16 text-center">
            <h3 className="text-base font-semibold text-foreground">No campaigns found</h3>
            <p className="mt-2 text-sm text-muted-foreground">Adjust search or create a new campaign.</p>
          </div>
        ) : (
          <div className="divide-y divide-border border-y border-border">
            {filteredCampaigns.map((campaign) => {
              const sc = statusConfig[campaign.status] ?? statusConfig.draft;
              return (
                <Link
                  key={campaign.id}
                  href={`/campaign/${campaign.id}`}
                  className="grid gap-4 py-5 transition-colors hover:bg-muted/35 md:grid-cols-[minmax(0,1.4fr)_120px_100px_100px_112px] md:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold tracking-[-0.02em] text-foreground">{campaign.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground md:hidden">{formatDate(campaign.createdAt)}</p>
                  </div>
                  <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.bg} ${sc.text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} aria-hidden="true" />
                    {sc.label}
                  </span>
                  <span className="text-sm text-muted-foreground tabular-nums">{campaign.productCount} products</span>
                  <span className="text-sm text-muted-foreground tabular-nums">{campaign.generatedImageCount} images</span>
                  <div className="flex items-center gap-2 md:justify-end">
                    <span className="hidden text-sm text-muted-foreground md:inline">{formatDate(campaign.createdAt)}</span>
                    <button
                      onClick={(e) => handleToggleStatus(e, campaign)}
                      aria-label={campaign.status === "active" ? `Disable ${campaign.name}` : `Activate ${campaign.name}`}
                      className="border border-border px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {campaign.status === "active" ? "Pause" : "Activate"}
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, campaign)}
                      aria-label={`Delete ${campaign.name}`}
                      className="border border-border px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-error/40 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Delete
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deleteCandidate)}
        title="Delete campaign?"
        description={deleteCandidate ? `Delete ${deleteCandidate.name}. This cannot be undone.` : ""}
        confirmLabel="Delete campaign"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => {
          if (!deleting) setDeleteCandidate(null);
        }}
      />
    </div>
  );
}

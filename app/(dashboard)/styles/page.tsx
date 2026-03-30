"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import StyleCard from "@/components/styles/StyleCard";
import StylePreviewModal, { StylePreviewData } from "@/components/styles/StylePreviewModal";

export default function StylesPage() {
  const [styles, setStyles] = useState<StylePreviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState<StylePreviewData | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);

  const showToast = useCallback((message: string, type: "error" | "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchStyles = useCallback(async () => {
    try {
      const res = await fetch("/api/styles?includeDisabled=true");
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to fetch styles");
      }
      setStyles(await res.json());
    } catch (fetchError) {
      showToast(
        fetchError instanceof Error ? fetchError.message : "Failed to fetch styles",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchStyles();
  }, [fetchStyles]);

  return (
    <div>
      <div
        aria-live="polite"
        className={`fixed right-6 top-6 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-opacity ${
          toast ? "opacity-100" : "pointer-events-none opacity-0"
        } ${
          toast?.type === "error"
            ? "bg-error text-error-foreground"
            : "bg-success text-success-foreground"
        }`}
      >
        {toast?.message}
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Styles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the markdown style guides used in campaign creation.
          </p>
        </div>
        <Link href="/styles/new">
          <Button className="gap-2">
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Style
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-80 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : styles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <svg aria-hidden="true" className="h-7 w-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 6.75h9m-9 4.5h9m-9 4.5h5.25M6.75 3.75h10.5A2.25 2.25 0 0 1 19.5 6v12a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 18V6a2.25 2.25 0 0 1 2.25-2.25Z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-card-foreground">No styles yet</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Add your first style guide to make it available in campaign creation.
          </p>
          <Link href="/styles/new" className="mt-5">
            <Button>Add Style</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {styles.map((style) => (
            <StyleCard
              key={style.id}
              style={style}
              onPreview={() => setSelectedStyle(style)}
              previewTrigger="card"
              hoverEditHref={`/styles/${style.id}/edit`}
            />
          ))}
        </div>
      )}

      <StylePreviewModal
        style={selectedStyle}
        onClose={() => setSelectedStyle(null)}
        editHref={selectedStyle ? `/styles/${selectedStyle.id}/edit` : undefined}
      />
    </div>
  );
}

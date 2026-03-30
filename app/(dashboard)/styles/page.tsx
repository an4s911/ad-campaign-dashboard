"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import StyleCard from "@/components/styles/StyleCard";
import StylePreviewModal from "@/components/styles/StylePreviewModal";

interface StyleGuide {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

export default function StylesPage() {
  const [styles, setStyles] = useState<StyleGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<StyleGuide | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  function showToast(message: string, type: "error" | "success") {
    setToast({ message, type });
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
    setTimeout(() => setToast(null), 3400);
  }

  const fetchStyles = useCallback(async () => {
    try {
      const res = await fetch("/api/styles");
      if (res.ok) setStyles(await res.json());
    } catch {
      showToast("Failed to fetch styles", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStyles(); }, [fetchStyles]);

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8 flex items-center justify-between">
          <div className="h-8 w-32 shimmer rounded-lg" />
          <div className="h-10 w-32 shimmer rounded-xl" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 shimmer rounded-2xl" style={{ animationDelay: `${i * 100}ms` }} />
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
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">Style Guides</h1>
          <p className="mt-1 text-sm text-muted-foreground">{styles.length} style{styles.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/styles/new"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all duration-150 hover:brightness-110"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Style
        </Link>
      </div>

      {styles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 shadow-card">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <svg aria-hidden="true" className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 6.75h9m-9 4.5h9m-9 4.5h5.25M6.75 3.75h10.5A2.25 2.25 0 0 1 19.5 6v12a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 18V6a2.25 2.25 0 0 1 2.25-2.25Z" />
            </svg>
          </div>
          <h3 className="mb-1 text-base font-semibold text-foreground">No style guides yet</h3>
          <p className="mb-5 text-sm text-muted-foreground">Create a style guide to define ad aesthetics.</p>
          <Link
            href="/styles/new"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-all duration-150 hover:brightness-110"
          >
            Create First Style
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
          {styles.map((style) => (
            <StyleCard
              key={style.id}
              style={style}
              onPreview={() => setPreview(style)}
            />
          ))}
        </div>
      )}

      {preview && (
        <StylePreviewModal style={preview} onClose={() => setPreview(null)} />
      )}
    </div>
  );
}

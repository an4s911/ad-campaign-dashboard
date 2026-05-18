"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import StyleCard from "@/components/styles/StyleCard";
import StylePreviewModal from "@/components/styles/StylePreviewModal";
import GenerateStyleFromImageModal from "@/components/styles/GenerateStyleFromImageModal";

interface StyleGuide {
  id: string;
  name: string;
  content?: string;
  prompt?: string;
  previewImageUrl?: string | null;
  createdAt: string;
}

export default function StylesPage() {
  const [styles, setStyles] = useState<StyleGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<StyleGuide | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
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
      <div className="mb-10 flex flex-col gap-8 border-b border-border pb-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Visual language</p>
          <h1 className="mt-4 font-display text-[3rem] font-semibold leading-[0.95] tracking-[-0.05em] text-foreground md:text-[4rem]">Style Guides</h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">{styles.length} style{styles.length !== 1 ? "s" : ""} shaping campaign output.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowGenerateModal(true)}
            className="inline-flex h-11 items-center justify-center border border-border bg-card/55 px-5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-muted"
          >
            Generate from image
          </button>
          <Link
            href="/styles/new"
            className="inline-flex h-11 items-center justify-center bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Add style
          </Link>
        </div>
      </div>

      {styles.length === 0 ? (
        <div className="flex flex-col items-center justify-center border-y border-dashed border-border py-20 text-center">
          <h3 className="mb-1 text-base font-semibold text-foreground">No style guides yet</h3>
          <p className="mb-5 text-sm text-muted-foreground">Create a style guide to define ad aesthetics.</p>
          <Link
            href="/styles/new"
            className="inline-flex h-10 items-center justify-center bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Create first style
          </Link>
        </div>
      ) : (
        <section className="grid gap-8 md:grid-cols-[220px_1fr] md:gap-16">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">01</p>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.03em] text-foreground">Creative register</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Prompts stay available, but image and name lead the scan.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 stagger-children">
            {styles.map((style) => (
              <StyleCard
                key={style.id}
                style={style}
                onPreview={() => setPreview(style)}
                previewImageOnClick
              />
            ))}
          </div>
        </section>
      )}

      {preview && (
        <StylePreviewModal style={preview} onClose={() => setPreview(null)} />
      )}

      <GenerateStyleFromImageModal
        open={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
      />
    </div>
  );
}

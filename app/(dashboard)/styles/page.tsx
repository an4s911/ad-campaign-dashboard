"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";

interface Style {
  id: string;
  name: string;
  prompt: string;
  isEnabled: boolean;
  updatedAt: string;
}

function getPromptExcerpt(prompt: string) {
  const plain = prompt.replace(/[#>*_`[\]\-]/g, " ").replace(/\s+/g, " ").trim();
  return plain.length > 220 ? `${plain.slice(0, 220)}...` : plain;
}

export default function StylesPage() {
  const [styles, setStyles] = useState<Style[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);
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

  useEffect(() => {
    if (!selectedStyle) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedStyle(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedStyle]);

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

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Styles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the markdown style guides used in campaign creation.
          </p>
        </div>
        <Link href="/styles/new">
          <Button className="gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
            <svg className="h-7 w-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
            <div key={style.id} className="group relative">
              <Link
                href={`/styles/${style.id}/edit`}
                onClick={(event) => event.stopPropagation()}
                className="absolute right-4 top-4 z-10 rounded-md border border-border bg-background/95 p-2 text-muted-foreground opacity-0 shadow-sm transition-all hover:text-foreground group-hover:opacity-100 focus:opacity-100"
                aria-label={`Edit ${style.name}`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                </svg>
              </Link>

              <button
                type="button"
                onClick={() => setSelectedStyle(style)}
                className="flex h-80 w-full flex-col rounded-xl border-2 border-border bg-card p-5 text-left text-card-foreground transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="mb-4 pr-12">
                  <p className="text-base font-semibold text-foreground">{style.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Click to preview
                  </p>
                </div>

                <div className="flex-1 overflow-hidden rounded-lg border border-border/60 bg-muted/40 p-4">
                  <p className="text-sm leading-6 text-muted-foreground line-clamp-10">
                    {getPromptExcerpt(style.prompt)}
                  </p>
                </div>
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedStyle && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-4"
          onClick={() => setSelectedStyle(null)}
        >
          <div
            className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-card-foreground">
                  {selectedStyle.name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Full markdown preview
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/styles/${selectedStyle.id}/edit`}>
                  <Button className="gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                    </svg>
                    Edit Style
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedStyle(null)}
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Close preview"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="markdown-prose prose prose-sm min-h-full max-w-none rounded-xl border border-border bg-muted p-5">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedStyle.prompt}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

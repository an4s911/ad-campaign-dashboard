"use client";

import { useEffect } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";

export interface StylePreviewData {
  id: string;
  name: string;
  prompt: string;
}

interface StylePreviewModalProps {
  style: StylePreviewData | null;
  onClose: () => void;
  editHref?: string;
}

export default function StylePreviewModal({
  style,
  onClose,
  editHref,
}: StylePreviewModalProps) {
  useEffect(() => {
    if (!style) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, style]);

  if (!style || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={style.name}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-4 overscroll-contain"
      onClick={onClose}
    >
      <div
        className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">
              {style.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Full markdown preview
            </p>
          </div>
          <div className="flex items-center gap-2">
            {editHref && (
              <Link href={editHref}>
                <Button className="gap-2">
                  <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                  </svg>
                  Edit Style
                </Button>
              </Link>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close preview"
            >
              <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="markdown-prose prose prose-sm min-h-full max-w-none rounded-xl border border-border bg-muted p-5">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {style.prompt}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

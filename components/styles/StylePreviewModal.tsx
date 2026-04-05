"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ImagePreviewModal from "@/components/ui/ImagePreviewModal";

const passthroughImageLoader = ({ src }: { src: string }) => src;

export interface StylePreviewData {
  id: string;
  name: string;
  content?: string;
  prompt?: string;
  previewImageUrl?: string | null;
}

export default function StylePreviewModal({
  style,
  onClose,
}: {
  style: StylePreviewData | null;
  onClose: () => void;
}) {
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const handleClose = useCallback(() => {
    setPreviewImageUrl(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!style) return;

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (previewImageUrl) return;
      handleClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [style, previewImageUrl, handleClose]);

  if (!style) return null;

  const displayContent = style.content || style.prompt || "";

  return (
    <>
      {createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={style.name}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in overscroll-contain"
          onClick={handleClose}
        >
          <div
            className="relative max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-card-hover animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="truncate pr-4 text-lg font-semibold text-foreground">{style.name}</h2>
              <div className="flex items-center gap-2">
                <Link
                  href={`/styles/${style.id}/edit`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-150 hover:bg-muted"
                >
                  <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                  </svg>
                  Edit
                </Link>
                <button
                  onClick={handleClose}
                  aria-label="Close"
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                >
                  <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(80vh - 72px)" }}>
              {style.previewImageUrl ? (
                <button
                  type="button"
                  aria-label={`Open full preview for ${style.name}`}
                  onClick={() => setPreviewImageUrl(style.previewImageUrl ?? null)}
                  className="group relative mb-6 block aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Image
                    src={style.previewImageUrl}
                    alt={style.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 800px"
                    loader={passthroughImageLoader}
                    unoptimized
                    className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/10" />
                  <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
                    Open full image
                  </div>
                </button>
              ) : null}
              <div className="markdown-prose prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {displayContent}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      <ImagePreviewModal
        imageUrl={previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
      />
    </>
  );
}

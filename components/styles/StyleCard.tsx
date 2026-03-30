"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface StyleData {
  id: string;
  name: string;
  content?: string;
  prompt?: string;
}

export default function StyleCard({
  style,
  onPreview,
  selectable,
  showCheckbox,
  selected,
  onSelect,
  height,
}: {
  style: StyleData;
  onPreview?: () => void;
  selectable?: boolean;
  showCheckbox?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  height?: string;
  previewTrigger?: string;
}) {
  const hasCheckbox = selectable || showCheckbox;
  const displayContent = style.content || style.prompt || "";

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-card shadow-card transition-all duration-200 hover:shadow-card-hover ${
        selected ? "border-primary ring-1 ring-primary/30" : "border-border"
      }`}
      style={{ height: height || "auto" }}
    >
      {hasCheckbox && (
        <button
          onClick={onSelect}
          className="absolute left-3 top-3 z-10 flex h-5 w-5 items-center justify-center rounded-md border border-border bg-card shadow-sm transition-colors duration-150"
        >
          {selected && (
            <svg aria-hidden="true" className="h-3.5 w-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          )}
        </button>
      )}

      {/* Content Preview */}
      <div
        className="cursor-pointer p-5 pb-14"
        onClick={onPreview}
        style={{ height: height ? `calc(${height} - 0px)` : "auto" }}
      >
        <h3 className="mb-3 text-sm font-semibold text-foreground truncate">{style.name}</h3>
        <div className="markdown-prose prose prose-xs max-w-none text-xs text-muted-foreground pointer-events-none line-clamp-6">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {displayContent}
          </ReactMarkdown>
        </div>
      </div>

      {/* Fade overlay */}
      <div className="pointer-events-none absolute inset-x-0 bottom-10 h-12 bg-gradient-to-t from-card to-transparent" />

      {/* Bottom actions */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-border/60 bg-card px-4 py-2.5">
        <button
          onClick={onPreview}
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Preview
        </button>
        <Link
          href={`/styles/${style.id}/edit`}
          aria-label={`Edit ${style.name}`}
          className="rounded-lg p-1 text-muted-foreground transition-colors duration-150 hover:text-foreground"
        >
          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

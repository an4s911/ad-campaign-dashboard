"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { StylePreviewData } from "@/components/StylePreviewModal";

interface StyleCardProps {
  style: StylePreviewData;
  selected?: boolean;
  onSelect?: () => void;
  onPreview: () => void;
  previewTrigger: "card" | "preview-pane";
  showCheckbox?: boolean;
  hoverEditHref?: string;
  heightClassName?: string;
}

export default function StyleCard({
  style,
  selected = false,
  onSelect,
  onPreview,
  previewTrigger,
  showCheckbox = false,
  hoverEditHref,
  heightClassName = "h-80",
}: StyleCardProps) {
  const cardClassName = `flex ${heightClassName} flex-col overflow-hidden rounded-lg border-2 transition-all ${
    selected
      ? "border-primary bg-primary/10 ring-1 ring-primary/20"
      : "border-border bg-card text-card-foreground hover:border-primary/30"
  }`;

  const previewContentClassName = "markdown-prose prose prose-sm pointer-events-none max-w-none transition duration-200 group-hover/preview:scale-[1.01] group-hover/preview:blur-[3px] [&_h1]:mb-3 [&_h1]:text-sm [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-xs [&_li]:my-0 [&_li]:text-xs [&_ol]:my-2 [&_p]:my-2 [&_p]:text-xs [&_pre]:rounded-lg [&_pre]:p-3 [&_strong]:text-current";

  return (
    <div className={hoverEditHref ? "group relative" : undefined}>
      {hoverEditHref && (
        <Link
          href={hoverEditHref}
          onClick={(event) => event.stopPropagation()}
          className="absolute right-4 top-4 z-10 rounded-md border border-border bg-background/95 p-2 text-muted-foreground opacity-0 shadow-sm transition-all hover:text-foreground group-hover:opacity-100 focus:opacity-100"
          aria-label={`Edit ${style.name}`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
          </svg>
        </Link>
      )}

      <div className={cardClassName}>
        <button
          type="button"
          onClick={previewTrigger === "card" ? onPreview : onSelect}
          className="flex items-start justify-between gap-3 border-b border-border/70 px-4 py-4 text-left"
        >
          <div className={`min-w-0 flex-1 ${showCheckbox || hoverEditHref ? "pr-10" : ""}`}>
            <p className="text-sm font-medium text-foreground">{style.name}</p>
          </div>
          {showCheckbox && (
            <div
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background"
              }`}
              aria-hidden="true"
            >
              {selected && (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={onPreview}
          className="group/preview relative flex-1 overflow-hidden bg-muted/40 text-left"
          aria-label={`Preview ${style.name}`}
        >
          <div className="absolute inset-0 overflow-hidden px-4 py-4">
            <div className={previewContentClassName}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {style.prompt}
              </ReactMarkdown>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0 bg-background/0 transition-colors duration-200 group-hover/preview:bg-background/45 dark:group-hover/preview:bg-background/30" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover/preview:opacity-100">
            <span className="rounded-full border border-border/80 bg-card/95 px-3 py-1.5 text-xs font-semibold text-foreground shadow-lg shadow-black/10 backdrop-blur-md dark:border-border dark:bg-card/90 dark:shadow-black/30">
              Preview full style guide
            </span>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-card via-card/95 to-transparent" />
        </button>
      </div>
    </div>
  );
}

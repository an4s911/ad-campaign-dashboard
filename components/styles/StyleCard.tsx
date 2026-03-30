"use client";

import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const passthroughImageLoader = ({ src }: { src: string }) => src;

interface StyleData {
  id: string;
  name: string;
  content?: string;
  prompt?: string;
  previewImageUrl?: string | null;
}

export default function StyleCard({
  style,
  onPreview,
  selectable,
  showCheckbox,
  selected,
  onSelect,
  selectFromHeader,
  height,
  previewImageOnClick,
}: {
  style: StyleData;
  onPreview?: () => void;
  selectable?: boolean;
  showCheckbox?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  selectFromHeader?: boolean;
  height?: string;
  previewImageOnClick?: boolean;
  previewTrigger?: string;
}) {
  const hasCheckbox = selectable || showCheckbox;
  const displayContent = style.content || style.prompt || "";
  const hasPreviewImage = Boolean(style.previewImageUrl);

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-card shadow-card transition-all duration-200 hover:scale-[1.015] hover:shadow-card-hover ${
        selected
          ? "border-primary ring-1 ring-primary/30 shadow-[0_0_0_1px_rgba(91,91,214,0.2),0_16px_40px_rgba(91,91,214,0.12)]"
          : "border-border hover:border-primary/30 hover:shadow-[0_0_0_1px_rgba(91,91,214,0.12),0_12px_30px_rgba(15,23,42,0.1)]"
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

      <div className="flex h-full flex-col" style={{ height: height ? `calc(${height} - 0px)` : "auto" }}>
        {hasPreviewImage ? (
          selectFromHeader && onSelect ? (
            <button
              type="button"
              onClick={onSelect}
              className="relative block aspect-[4/3] w-full overflow-hidden text-left"
            >
              <Image
                src={style.previewImageUrl as string}
                alt={style.name}
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                loader={passthroughImageLoader}
                unoptimized
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="truncate text-sm font-semibold text-white">
                  {style.name}
                </h3>
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={previewImageOnClick ? onPreview : undefined}
              className={`relative block aspect-[4/3] w-full overflow-hidden text-left ${
                previewImageOnClick ? "cursor-pointer" : "cursor-default"
              }`}
            >
              <Image
                src={style.previewImageUrl as string}
                alt={style.name}
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                loader={passthroughImageLoader}
                unoptimized
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="truncate text-sm font-semibold text-white">
                  {style.name}
                </h3>
              </div>
            </button>
          )
        ) : selectFromHeader && onSelect ? (
          <button
            type="button"
            onClick={onSelect}
            className="block w-full cursor-pointer px-5 pt-5 pb-3 text-left"
          >
            <h3 className="truncate text-sm font-semibold text-foreground">{style.name}</h3>
          </button>
        ) : (
          <div className="px-5 pt-5 pb-3">
            <h3 className="truncate text-sm font-semibold text-foreground">{style.name}</h3>
          </div>
        )}

        <div className="cursor-pointer px-5 pb-14 pt-4" onClick={onPreview}>
          <div className="markdown-prose prose prose-xs pointer-events-none max-w-none text-xs text-muted-foreground line-clamp-6">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {displayContent}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-10 h-12 bg-gradient-to-t from-card via-card/95 to-transparent" />

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

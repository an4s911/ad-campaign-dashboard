"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import ImagePreviewModal from "@/components/ui/ImagePreviewModal";

const passthroughImageLoader = ({ src }: { src: string }) => src;

interface ImageDropzoneProps {
  imageUrl: string | null;
  onImageUploaded: (url: string) => void;
  onImageRemoved?: () => void;
  aspectRatioClassName?: string;
  emptyLabel?: string;
  emptyHint?: string;
  previewAlt?: string;
}

export default function ImageDropzone({
  imageUrl,
  onImageUploaded,
  onImageRemoved,
  aspectRatioClassName = "aspect-[4/3]",
  emptyLabel = "Click to upload",
  emptyHint = "PNG, JPG, WebP",
  previewAlt = "Uploaded image",
}: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  async function uploadFile(file: File) {
    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      onImageUploaded(data.url);
    } catch {
      setError("Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragActive(false);

    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      uploadFile(file);
    }
  }

  function handleRemove() {
    onImageRemoved?.();
    setPreviewImageUrl(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  if (imageUrl) {
    return (
      <>
        <div className={`group relative overflow-hidden rounded-2xl border border-border bg-muted ${aspectRatioClassName}`}>
          <button
            type="button"
            aria-label="Preview image"
            onClick={() => setPreviewImageUrl(imageUrl)}
            className="absolute inset-0 block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="relative h-full w-full">
              <Image
                src={imageUrl}
                alt={previewAlt}
                fill
                sizes="(max-width: 768px) 100vw, 480px"
                loader={passthroughImageLoader}
                unoptimized
                className="object-cover"
              />
            </div>
          </button>

          {onImageRemoved ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleRemove();
              }}
              aria-label="Remove image"
              className="absolute right-2 top-2 rounded-md bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          ) : null}
        </div>

        <ImagePreviewModal
          imageUrl={previewImageUrl}
          onClose={() => setPreviewImageUrl(null)}
        />
      </>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            uploadFile(file);
          }
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragActive(false);
        }}
        className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${aspectRatioClassName} ${
          error
            ? "border-error/40 bg-error/4"
            : dragActive
              ? "scale-[1.01] border-primary bg-primary/4"
              : "border-border bg-muted/30 hover:border-muted-foreground/30 hover:bg-muted/50"
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
            <svg aria-hidden="true" className="h-6 w-6 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Uploading...
          </div>
        ) : (
          <>
            <svg aria-hidden="true" className="mb-3 h-8 w-8 text-muted-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-primary">{emptyLabel}</span> or drag and drop
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">{emptyHint}</p>
          </>
        )}
      </button>

      {error ? <p className="mt-2 text-xs text-error">{error}</p> : null}
    </div>
  );
}

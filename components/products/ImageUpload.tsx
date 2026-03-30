"use client";

import { useRef, useState } from "react";
import Image from "next/image";

const passthroughImageLoader = ({ src }: { src: string }) => src;

export default function ImageUpload({
  imageUrl,
  onImageUploaded,
  onImageRemoved,
}: {
  imageUrl: string;
  onImageUploaded: (url: string) => void;
  onImageRemoved: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");

  async function uploadFile(file: File) {
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      onImageUploaded(data.url);
    } catch {
      setError("Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) uploadFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
  }

  function handleRemove() {
    onImageRemoved();
    if (inputRef.current) inputRef.current.value = "";
  }

  if (imageUrl) {
    return (
      <div className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
        <Image
          src={imageUrl}
          alt="Product image"
          fill
          sizes="(max-width: 768px) 100vw, 300px"
          loader={passthroughImageLoader}
          unoptimized
          className="object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/40">
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remove image"
            className="rounded-xl bg-white/90 px-3 py-2 text-xs font-medium text-gray-900 opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadFile(file);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex w-full aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          error
            ? "border-error/40 bg-error/4"
            : dragActive
              ? "border-primary bg-primary/4 scale-[1.01]"
              : "border-border bg-muted/30 hover:border-muted-foreground/30 hover:bg-muted/50"
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
            <svg aria-hidden="true" className="h-6 w-6 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {"Uploading\u2026"}
          </div>
        ) : (
          <>
            <svg aria-hidden="true" className="mb-3 h-8 w-8 text-muted-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-primary">Click to upload</span> or drag and drop
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">PNG, JPG, WebP</p>
          </>
        )}
      </button>
      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </div>
  );
}

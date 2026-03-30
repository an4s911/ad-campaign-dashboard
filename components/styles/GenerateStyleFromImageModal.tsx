"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import ImageDropzone from "@/components/ui/ImageDropzone";

const GENERATED_STYLE_STORAGE_KEY = "generated-style-draft";

export default function GenerateStyleFromImageModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [loading, onClose, open]);

  if (!open) {
    return null;
  }

  async function handleGenerate() {
    if (!imageUrl) {
      setError("Upload a reference image first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate-style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate style");
      }

      sessionStorage.setItem(
        GENERATED_STYLE_STORAGE_KEY,
        JSON.stringify({
          prompt: data?.prompt ?? "",
          previewImageUrl: imageUrl,
        })
      );

      onClose();
      router.push("/styles/new?fromImage=1");
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Failed to generate style"
      );
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Generate style from image"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={() => {
        if (!loading) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-card-hover"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Generate from Image
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload an ad or promo image. The visual style will be converted
              into a draft markdown style guide.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <ImageDropzone
          imageUrl={imageUrl}
          onImageUploaded={(url) => {
            setImageUrl(url);
            setError("");
          }}
          onImageRemoved={() => setImageUrl(null)}
          aspectRatioClassName="aspect-[16/10]"
          previewAlt="Style reference image"
        />

        {loading ? (
          <div className="mt-4 rounded-xl border border-primary/20 bg-primary/8 px-4 py-3 text-sm text-primary">
            Analyzing image style...
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !imageUrl}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:brightness-110 disabled:opacity-40"
          >
            {loading ? "Generating..." : "Generate Style"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export { GENERATED_STYLE_STORAGE_KEY };

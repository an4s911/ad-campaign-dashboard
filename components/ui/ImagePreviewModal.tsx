"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function ImagePreviewModal({
  imageUrl,
  onClose,
}: {
  imageUrl: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!imageUrl) return;

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [imageUrl, onClose]);

  if (!imageUrl) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in [animation-duration:180ms] overscroll-contain"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close preview"
        className="fixed right-4 top-4 z-110 rounded-xl p-2.5 text-white/60 transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="Preview"
        className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl animate-scale-in [animation-duration:160ms]"
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body
  );
}

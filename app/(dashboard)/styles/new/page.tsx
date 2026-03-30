"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import StyleForm from "@/components/styles/StyleForm";
import { GENERATED_STYLE_STORAGE_KEY } from "@/components/styles/GenerateStyleFromImageModal";

export default function NewStylePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (searchParams.get("fromImage") !== "1") {
      return;
    }

    const stored = sessionStorage.getItem(GENERATED_STYLE_STORAGE_KEY);
    if (!stored) {
      router.replace("/styles/new");
      return;
    }

    try {
      const data = JSON.parse(stored) as {
        prompt?: string;
        previewImageUrl?: string | null;
      };

      if (data.prompt) {
        setPrompt(data.prompt);
        setShowPreview(true);
      }

      if (data.previewImageUrl) {
        setPreviewImageUrl(data.previewImageUrl);
      }
    } catch {
    } finally {
      sessionStorage.removeItem(GENERATED_STYLE_STORAGE_KEY);
      router.replace("/styles/new");
    }
  }, [router, searchParams]);

  async function handleSave() {
    const trimmedName = name.trim();
    const trimmedPrompt = prompt.trim();

    if (!trimmedName || !trimmedPrompt) {
      setError("Name and markdown content are required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/styles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          prompt: trimmedPrompt,
          previewImageUrl,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error || "Failed to create style");
        return;
      }

      router.push("/styles");
      router.refresh();
    } catch {
      setError("Failed to create style");
    } finally {
      setSaving(false);
    }
  }

  return (
    <StyleForm
      title="New Style"
      description="Create a markdown style guide for campaign generation."
      submitLabel="Create Style"
      submittingLabel="Creating..."
      values={{ name, prompt, previewImageUrl }}
      onChange={(next) => {
        if (next.name !== undefined) setName(next.name);
        if (next.prompt !== undefined) setPrompt(next.prompt);
        if (next.previewImageUrl !== undefined) {
          setPreviewImageUrl(next.previewImageUrl);
        }
      }}
      onSubmit={handleSave}
      error={error}
      saving={saving}
      showPreview={showPreview}
      onTogglePreview={() => setShowPreview((current) => !current)}
    />
  );
}

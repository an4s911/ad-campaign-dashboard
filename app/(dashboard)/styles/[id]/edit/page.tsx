"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StyleForm from "@/components/styles/StyleForm";

interface Style {
  id: string;
  name: string;
  prompt: string;
  previewImageUrl?: string | null;
}

export default function EditStylePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchStyle() {
      try {
        const response = await fetch(`/api/styles/${id}`);
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error || "Failed to load style");
        }

        if (!cancelled) {
          const style = data as Style;
          setName(style.name);
          setPrompt(style.prompt);
          setPreviewImageUrl(style.previewImageUrl ?? null);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(
            fetchError instanceof Error ? fetchError.message : "Failed to load style"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchStyle();
    return () => {
      cancelled = true;
    };
  }, [id]);

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
      const response = await fetch(`/api/styles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          prompt: trimmedPrompt,
          previewImageUrl,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error || "Failed to update style");
        return;
      }

      router.push("/styles");
      router.refresh();
    } catch {
      setError("Failed to update style");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 h-8 w-40 animate-pulse rounded bg-muted" />
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="min-h-170 animate-pulse rounded-2xl border border-border bg-card" />
          <div className="min-h-170 animate-pulse rounded-2xl border border-border bg-card" />
        </div>
      </div>
    );
  }

  return (
    <StyleForm
      title="Edit Style"
      description="Update the markdown style guide used in campaign generation."
      submitLabel="Save Changes"
      submittingLabel="Saving..."
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

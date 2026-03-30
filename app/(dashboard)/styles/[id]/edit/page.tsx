"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Style {
  id: string;
  name: string;
  prompt: string;
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
  const [showPreview, setShowPreview] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchStyle() {
      try {
        const res = await fetch(`/api/styles/${id}`);
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load style");
        }

        if (!cancelled) {
          const style = data as Style;
          setName(style.name);
          setPrompt(style.prompt);
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
      const res = await fetch(`/api/styles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          prompt: trimmedPrompt,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
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
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Style</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Update the markdown style guide used in campaign generation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/styles">
            <Button variant="outline">Back to Styles</Button>
          </Link>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPreview((current) => !current)}
          >
            {showPreview ? "Hide Preview" : "Preview Markdown"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <div className={`grid gap-5 ${showPreview ? "xl:grid-cols-2" : "xl:grid-cols-1"}`}>
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 space-y-2">
            <Label htmlFor="style-name">Style Name</Label>
            <Input
              id="style-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Minimalist Clean"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="style-markdown">Markdown</Label>
            <textarea
              id="style-markdown"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="# Style name&#10;&#10;## Visual Direction&#10;- ..."
              className="min-h-140 w-full resize-y rounded-xl border border-input bg-background px-4 py-3 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <Link href="/styles">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {showPreview && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-card-foreground">Preview</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Review the rendered markdown before saving.
              </p>
            </div>

            <div className="markdown-prose prose prose-sm min-h-140 max-w-none overflow-y-auto rounded-xl border border-border bg-muted p-5">
              {prompt.trim() ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {prompt}
                </ReactMarkdown>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Start typing markdown to preview the rendered style guide.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

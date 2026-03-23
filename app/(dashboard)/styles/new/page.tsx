"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewStylePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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
      const res = await fetch("/api/styles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          prompt: trimmedPrompt,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
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
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Style</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a markdown style guide for campaign generation.
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

      <div className="grid gap-5 xl:grid-cols-2">
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
              {saving ? "Creating..." : "Create Style"}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">Preview</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Review the rendered markdown before saving.
              </p>
            </div>
          </div>

          {showPreview ? (
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
          ) : (
            <div className="flex min-h-140 items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
              Click <span className="mx-1 font-medium text-foreground">Preview Markdown</span> to render the style guide without saving.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import ImageDropzone from "@/components/ui/ImageDropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StyleFormValues {
  name: string;
  prompt: string;
  previewImageUrl: string | null;
}

export default function StyleForm({
  title,
  description,
  submitLabel,
  submittingLabel,
  values,
  onChange,
  onSubmit,
  error,
  saving,
  showPreview,
  onTogglePreview,
}: {
  title: string;
  description: string;
  submitLabel: string;
  submittingLabel: string;
  values: StyleFormValues;
  onChange: (next: Partial<StyleFormValues>) => void;
  onSubmit: () => void;
  error: string;
  saving: boolean;
  showPreview: boolean;
  onTogglePreview: () => void;
}) {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/styles">
            <Button variant="outline">Back to Styles</Button>
          </Link>
          <Button type="button" variant="outline" onClick={onTogglePreview}>
            {showPreview ? "Hide Preview" : "Preview Markdown"}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      ) : null}

      <div className={`grid gap-5 ${showPreview ? "xl:grid-cols-2" : "xl:grid-cols-1"}`}>
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 space-y-2">
            <Label htmlFor="style-name">Style Name</Label>
            <Input
              id="style-name"
              value={values.name}
              onChange={(event) => onChange({ name: event.target.value })}
              placeholder="Minimalist Clean"
            />
          </div>

          <div className="mb-4 space-y-2">
            <Label>Preview Image</Label>
            <div className="max-w-2xl">
              <ImageDropzone
                imageUrl={values.previewImageUrl}
                onImageUploaded={(previewImageUrl) => onChange({ previewImageUrl })}
                onImageRemoved={() => onChange({ previewImageUrl: null })}
                aspectRatioClassName="aspect-[16/10]"
                previewAlt="Style preview image"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="style-markdown">Markdown</Label>
            <textarea
              id="style-markdown"
              value={values.prompt}
              onChange={(event) => onChange({ prompt: event.target.value })}
              placeholder="# Style name&#10;&#10;## Visual Direction&#10;- ..."
              className="min-h-140 w-full resize-y rounded-xl border border-input bg-background px-4 py-3 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <Link href="/styles">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="button" onClick={onSubmit} disabled={saving}>
              {saving ? submittingLabel : submitLabel}
            </Button>
          </div>
        </div>

        {showPreview ? (
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-card-foreground">Preview</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Review the rendered markdown before saving.
              </p>
            </div>

            <div className="markdown-prose prose prose-sm min-h-140 max-w-none overflow-y-auto rounded-xl border border-border bg-muted p-5">
              {values.prompt.trim() ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {values.prompt}
                </ReactMarkdown>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Start typing markdown to preview the rendered style guide.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

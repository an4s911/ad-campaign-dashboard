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
    <div className="animate-fade-in">
      <header className="mb-10 flex flex-col gap-8 border-b border-border pb-10 md:flex-row md:items-end md:justify-between">
        <div>
          <Link href="/styles" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground">
            Styles
          </Link>
          <h1 className="mt-4 font-display text-[3rem] font-semibold leading-[0.95] tracking-[-0.05em] text-foreground md:text-[4rem]">{title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/styles">
            <Button variant="outline">Back to Styles</Button>
          </Link>
          <Button type="button" variant="outline" onClick={onTogglePreview}>
            {showPreview ? "Hide Preview" : "Preview Markdown"}
          </Button>
        </div>
      </header>

      {error ? (
        <div className="mb-6 border-y border-error/25 bg-error/10 px-1 py-3 text-sm text-error">
          {error}
        </div>
      ) : null}

      <div className={`grid gap-10 ${showPreview ? "xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]" : "xl:grid-cols-1"}`}>
        <div className="space-y-12">
          <section className="grid gap-8 md:grid-cols-[220px_1fr] md:gap-16">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">01</p>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.03em] text-foreground">Identity</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Name the visual language so teams can find it fast.</p>
            </div>
            <div className="border-y border-border py-6">
              <Label htmlFor="style-name">Style Name</Label>
              <Input
                id="style-name"
                value={values.name}
                onChange={(event) => onChange({ name: event.target.value })}
                placeholder="Minimalist Clean"
                className="mt-2"
              />
            </div>
          </section>

          <section className="grid gap-8 border-t border-border pt-12 md:grid-cols-[220px_1fr] md:gap-16">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">02</p>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.03em] text-foreground">Reference image</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">One visual anchor keeps the generated direction honest.</p>
            </div>
            <div className="max-w-2xl border-y border-border py-6">
              <ImageDropzone
                imageUrl={values.previewImageUrl}
                onImageUploaded={(previewImageUrl) => onChange({ previewImageUrl })}
                onImageRemoved={() => onChange({ previewImageUrl: null })}
                aspectRatioClassName="aspect-[16/10]"
                previewAlt="Style preview image"
              />
            </div>
          </section>

          <section className="grid gap-8 border-t border-border pt-12 md:grid-cols-[220px_1fr] md:gap-16">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">03</p>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.03em] text-foreground">Direction</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Markdown defines the constraints, tone, materials, and exclusions.</p>
            </div>
            <div className="border-y border-border py-6">
              <Label htmlFor="style-markdown">Markdown</Label>
              <textarea
                id="style-markdown"
                value={values.prompt}
                onChange={(event) => onChange({ prompt: event.target.value })}
                placeholder="# Style name&#10;&#10;## Visual Direction&#10;- ..."
                className="mt-2 min-h-140 w-full resize-y border border-input bg-background/40 px-4 py-3 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </section>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
            <Link href="/styles">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="button" onClick={onSubmit} disabled={saving}>
              {saving ? submittingLabel : submitLabel}
            </Button>
          </div>
        </div>

        {showPreview ? (
          <aside className="border-y border-border py-6 xl:sticky xl:top-8 xl:h-fit">
            <div className="mb-4">
              <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-foreground">Preview</h2>
              <p className="mt-1 text-sm text-muted-foreground">Rendered markdown before saving.</p>
            </div>
            <div className="markdown-prose prose prose-sm min-h-140 max-w-none overflow-y-auto bg-muted/45 p-5">
              {values.prompt.trim() ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{values.prompt}</ReactMarkdown>
              ) : (
                <p className="text-sm text-muted-foreground">Start typing markdown to preview the rendered style guide.</p>
              )}
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

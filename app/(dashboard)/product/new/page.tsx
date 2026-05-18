"use client";

import { useMemo, useState, SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/products/ImageUpload";
import TagSection from "@/components/products/TagSection";
import { useUnsavedChangesGuard } from "@/providers/UnsavedChangesProvider";

function getProductSnapshot(values: {
  name: string;
  description: string;
  imageUrl1: string | null;
  imageUrl2: string | null;
  tags: string[];
}) {
  return JSON.stringify(values);
}

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl1, setImageUrl1] = useState<string | null>(null);
  const [imageUrl2, setImageUrl2] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const currentSnapshot = useMemo(
    () =>
      getProductSnapshot({
        name,
        description,
        imageUrl1,
        imageUrl2,
        tags,
      }),
    [name, description, imageUrl1, imageUrl2, tags]
  );
  const { allowNavigation, guardedPush } = useUnsavedChangesGuard(
    currentSnapshot !==
      getProductSnapshot({
        name: "",
        description: "",
        imageUrl1: null,
        imageUrl2: null,
        tags: [],
      })
  );

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!description.trim()) newErrors.description = "Description is required";
    if (!imageUrl1) newErrors.imageUrl1 = "Image 1 is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          imageUrl1,
          imageUrl2,
          tags,
        }),
      });

      if (res.ok) {
        allowNavigation(() => {
          router.push("/product");
        });
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save product");
      }
    } catch {
      alert("Failed to save product");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <form onSubmit={handleSubmit} className="space-y-12">
        <header className="flex flex-col gap-8 border-b border-border pb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <button
              type="button"
              onClick={() => guardedPush("/product")}
              className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
            >
              Products
            </button>
            <h1 className="mt-4 font-display text-[3rem] font-semibold leading-[0.95] tracking-[-0.05em] text-foreground md:text-[4rem]">
              Add Product
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => guardedPush("/product")}
              className="h-11 border border-border bg-card/55 px-5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-11 bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Create Product"}
            </button>
          </div>
        </header>

        <section className="grid gap-8 md:grid-cols-[220px_1fr] md:gap-16">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">01</p>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.03em] text-foreground">Product brief</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Name and description become source material for campaign generation.</p>
          </div>
          <div className="space-y-5 border-y border-border py-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">
                Name <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                }}
                placeholder="Product name"
                className={`h-11 w-full border-0 border-b bg-transparent px-0 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-0 ${
                  errors.name ? "border-error" : "border-input"
                }`}
              />
              {errors.name && <p className="mt-1 text-xs text-error">{errors.name}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">
                Description <span className="text-error">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors((prev) => ({ ...prev, description: "" }));
                }}
                placeholder="Product description"
                rows={7}
                className={`w-full resize-y border bg-background/40 px-3 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-0 ${
                  errors.description ? "border-error" : "border-input"
                }`}
              />
              {errors.description && <p className="mt-1 text-xs text-error">{errors.description}</p>}
            </div>
          </div>
        </section>

        <section className="grid gap-8 border-t border-border pt-12 md:grid-cols-[220px_1fr] md:gap-16">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">02</p>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.03em] text-foreground">Imagery</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Clear product shots give generated ads better structure.</p>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Primary <span className="text-error">*</span>
                </label>
                <ImageUpload
                  imageUrl={imageUrl1 ?? ""}
                  onImageUploaded={(url) => {
                    setImageUrl1(url);
                    if (errors.imageUrl1) setErrors((prev) => ({ ...prev, imageUrl1: "" }));
                  }}
                  onImageRemoved={() => setImageUrl1(null)}
                />
                {errors.imageUrl1 && <p className="mt-1 text-xs text-error">{errors.imageUrl1}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Secondary</label>
                <ImageUpload
                  imageUrl={imageUrl2 ?? ""}
                  onImageUploaded={setImageUrl2}
                  onImageRemoved={() => setImageUrl2(null)}
                />
              </div>
            </div>
            <p className="border-y border-border py-3 text-xs leading-relaxed text-muted-foreground">
              Images are used for ad generation, analysis, and tag generation. High-quality product shots with clear backgrounds work best.
            </p>
          </div>
        </section>

        <section className="grid gap-8 border-t border-border pt-12 md:grid-cols-[220px_1fr] md:gap-16">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">03</p>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.03em] text-foreground">Labels</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Tags help group products without overwhelming campaign setup.</p>
          </div>
          <div className="border-y border-border py-6">
            <TagSection imageUrls={[imageUrl1, imageUrl2]} onTagsChange={setTags} />
          </div>
        </section>
      </form>
    </div>
  );
}

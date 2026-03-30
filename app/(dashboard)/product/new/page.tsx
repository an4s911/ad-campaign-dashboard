"use client";

import { useMemo, useState, FormEvent } from "react";
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

  async function handleSubmit(e: FormEvent) {
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
    <div className="mx-auto max-w-5xl">
      <form onSubmit={handleSubmit}>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => guardedPush("/product")}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-foreground">Add Product</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => guardedPush("/product")}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Create Product"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="space-y-4">
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
                    className={`w-full rounded-lg border bg-background text-foreground px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.name ? "border-error/50 bg-error/10" : "border-input"
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
                    rows={6}
                    className={`w-full min-h-[150px] resize-y rounded-lg border bg-background text-foreground px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.description ? "border-error/50 bg-error/10" : "border-input"
                    }`}
                  />
                  {errors.description && <p className="mt-1 text-xs text-error">{errors.description}</p>}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <label className="mb-2 block text-sm font-medium text-card-foreground">Product Tags</label>
              <TagSection imageUrls={[imageUrl1, imageUrl2]} onTagsChange={setTags} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <label className="mb-3 block text-sm font-medium text-card-foreground">Product Images</label>
              <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="rounded-xl bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Images are used for ad generation, analysis, and tag generation. High-quality product shots with clear backgrounds work best.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

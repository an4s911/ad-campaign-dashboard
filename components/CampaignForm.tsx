"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import TogglePills from "@/components/TogglePills";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ---------- Types ----------

interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl1: string;
  imageUrl2: string | null;
  isEnabled: boolean;
}

interface GeneratedImage {
  id: string;
  imageUrl: string;
  status: string; // pending, completed, failed
  campaignId: string;
  createdAt: string;
}

interface Style {
  id: string;
  name: string;
  prompt: string;
}

interface CampaignFormProps {
  campaignId: string | null; // null = create, string = edit
}

// ---------- Constants ----------

const STORE_CATEGORIES = [
  "Clothing", "Food", "Electronics", "Grocery", "Pharmacy", "Sports",
  "Home & Living", "Beauty", "Books", "Toys", "Automotive", "Pet Supplies",
];

const GENDER_OPTIONS = ["Male", "Female", "All"];

const AUDIENCE_TAGS = [
  "Businessmen", "College Students", "Families", "Couples", "Gym Goers",
  "Young Professionals", "Seniors", "Parents", "Teens", "Commuters",
  "Tourists", "Luxury Shoppers", "Budget Shoppers",
];

const POLL_INTERVAL = 3000;
const passthroughImageLoader = ({ src }: { src: string }) => src;

// ---------- Component ----------

export default function CampaignForm({ campaignId }: CampaignFormProps) {
  const router = useRouter();
  const isEditing = !!campaignId;

  // Section 1 – Basic Info
  const [name, setName] = useState("");
  const [adCount, setAdCount] = useState(10);

  // Section 2 – Product Selection
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Section 3 – Targeting
  const [storeCategories, setStoreCategories] = useState<string[]>([]);
  const [ageMin, setAgeMin] = useState<string>("");
  const [ageMax, setAgeMax] = useState<string>("");
  const [gender, setGender] = useState<string[]>([]);
  const [audienceTags, setAudienceTags] = useState<string[]>([]);

  // Section 4 – Ideas
  const [ideas, setIdeas] = useState<string[]>([""]);

  // Section 5 – Styles
  const [allStyles, setAllStyles] = useState<Style[]>([]);
  const [selectedStyleIds, setSelectedStyleIds] = useState<string[]>([]);
  const [previewStyle, setPreviewStyle] = useState<Style | null>(null);
  const [stylesLoading, setStylesLoading] = useState(true);

  // Section 6 – Generate & Review
  const [savedCampaignId, setSavedCampaignId] = useState<string | null>(campaignId);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);

  // Validation & Toast
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  // Polling ref
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function showToast(message: string, type: "error" | "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  // ---------- Fetch products ----------
  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) setAllProducts(await res.json());
    } catch {
      showToast("Failed to load products", "error");
    } finally {
      setProductsLoading(false);
    }
  }, []);

  // ---------- Fetch styles ----------
  const fetchStyles = useCallback(async () => {
    try {
      const res = await fetch("/api/styles");
      if (res.ok) setAllStyles(await res.json());
    } catch {
      showToast("Failed to load styles", "error");
    } finally {
      setStylesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchStyles();
  }, [fetchProducts, fetchStyles]);

  // ---------- Load existing campaign for edit ----------
  useEffect(() => {
    if (!campaignId) return;
    (async () => {
      try {
        const res = await fetch(`/api/campaigns/${campaignId}`);
        if (!res.ok) return;
        const data = await res.json();
        setName(data.name);
        setAdCount(data.adCount);
        setSelectedProductIds(
          data.products.map((cp: { productId: string }) => cp.productId)
        );
        setStoreCategories(data.targetStoreCategories ?? []);
        setAgeMin(data.targetAgeMin != null ? String(data.targetAgeMin) : "");
        setAgeMax(data.targetAgeMax != null ? String(data.targetAgeMax) : "");
        setGender(data.targetGender ?? []);
        setAudienceTags(data.targetTags ?? []);
        setIdeas(
          data.ideas.length > 0
            ? data.ideas.map((i: { description: string }) => i.description)
            : [""]
        );

        // Styles
        setSelectedStyleIds(
          data.styles.map((cs: { styleId: string }) => cs.styleId)
        );

        // Generated images (includes pending ones)
        if (data.generatedImages?.length > 0) {
          setGeneratedImages(data.generatedImages);
        }
      } catch {
        showToast("Failed to load campaign", "error");
      }
    })();
  }, [campaignId]);

  useEffect(() => {
    if (!previewStyle) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPreviewStyle(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewStyle]);

  // ---------- Polling for pending images ----------
  const hasPending = generatedImages.some((img) => img.status === "pending");

  useEffect(() => {
    if (!hasPending || !savedCampaignId) {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    async function poll() {
      try {
        const res = await fetch(
          `/api/campaigns/${savedCampaignId}/images/poll`
        );
        if (res.ok) {
          const images: GeneratedImage[] = await res.json();
          setGeneratedImages(images);
        }
      } catch {
        // Silently retry on next interval
      }
    }

    // Poll immediately once, then set interval
    poll();
    pollTimerRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [hasPending, savedCampaignId]);

  // ---------- Validation ----------
  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Campaign name is required";
    if (!adCount || adCount < 1) errs.adCount = "Must be at least 1";
    if (selectedProductIds.length === 0) errs.products = "Select at least one product";
    if (ideas.every((i) => !i.trim())) errs.ideas = "Add at least one idea";
    if (selectedStyleIds.length === 0) errs.styles = "Select at least one style";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ---------- Build styles array ----------
  function buildStyles(): string[] {
    return selectedStyleIds;
  }

  // ---------- Save campaign (create or update) ----------
  async function saveCampaign(): Promise<string | null> {
    if (!validate()) return null;
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        adCount,
        targetStoreCategories: storeCategories,
        targetAgeMin: ageMin ? parseInt(ageMin) : null,
        targetAgeMax: ageMax ? parseInt(ageMax) : null,
        targetGender: gender,
        targetTags: audienceTags,
        productIds: selectedProductIds,
        ideas: ideas.filter((i) => i.trim()),
        styles: buildStyles(),
      };

      const url = savedCampaignId
        ? `/api/campaigns/${savedCampaignId}`
        : "/api/campaigns";
      const method = savedCampaignId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        const id = data.id;
        if (!savedCampaignId) setSavedCampaignId(id);
        showToast(savedCampaignId ? "Campaign updated" : "Campaign saved as draft", "success");
        return id;
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to save", "error");
        return null;
      }
    } catch {
      showToast("Failed to save campaign", "error");
      return null;
    } finally {
      setSaving(false);
    }
  }

  // ---------- Generate images (async – returns immediately) ----------
  async function handleGenerate() {
    // Always save latest form state before generating
    const cid = await saveCampaign();
    if (!cid) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/campaigns/${cid}/generate`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        // Append pending image records – polling will update them as they complete
        setGeneratedImages((prev) => [...prev, ...data.images]);
        showToast(`Generating ${data.images.length} images...`, "success");
      } else {
        const data = await res.json();
        showToast(data.error || "Generation failed", "error");
      }
    } catch {
      showToast("Failed to start generation", "error");
    } finally {
      setGenerating(false);
    }
  }

  // ---------- Delete generated image ----------
  async function handleDeleteImage(imageId: string) {
    const cid = savedCampaignId;
    if (!cid) return;
    setGeneratedImages((prev) => prev.filter((img) => img.id !== imageId));
    try {
      const res = await fetch(`/api/campaigns/${cid}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
      });
      if (!res.ok) showToast("Failed to remove image", "error");
    } catch {
      showToast("Failed to remove image", "error");
    }
  }

  // ---------- Activate campaign ----------
  async function handleActivate() {
    let cid = savedCampaignId;
    if (!cid) {
      cid = await saveCampaign();
      if (!cid) return;
    } else {
      const saved = await saveCampaign();
      if (!saved) return;
    }
    setActivating(true);
    try {
      const res = await fetch(`/api/campaigns/${cid}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      if (res.ok) {
        showToast("Campaign activated!", "success");
        setTimeout((() => router.push("/campaign")), 600);
      } else {
        showToast("Failed to activate campaign", "error");
      }
    } catch {
      showToast("Failed to activate campaign", "error");
    } finally {
      setActivating(false);
    }
  }

  // ---------- Ideas helpers ----------
  function updateIdea(index: number, value: string) {
    setIdeas((prev) => prev.map((v, i) => (i === index ? value : v)));
  }
  function removeIdea(index: number) {
    if (ideas.length <= 1) return;
    setIdeas((prev) => prev.filter((_, i) => i !== index));
  }
  function addIdea() {
    setIdeas((prev) => [...prev, ""]);
  }

  // ---------- Product toggle ----------
  function toggleProduct(id: string) {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    if (errors.products) setErrors((e) => ({ ...e, products: "" }));
  }

  // ---------- Computed ----------
  const completedImages = generatedImages.filter((img) => img.status === "completed");
  const pendingImages = generatedImages.filter((img) => img.status === "pending");
  const failedImages = generatedImages.filter((img) => img.status === "failed");
  const previewModal =
    previewStyle && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-4"
            onClick={() => setPreviewStyle(null)}
          >
            <div
              className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-card-foreground">
                    {previewStyle.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Full markdown preview
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewStyle(null)}
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Close preview"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="markdown-prose prose prose-sm min-h-full max-w-none rounded-xl border border-border bg-muted p-5">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {previewStyle.prompt}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  // ---------- Render ----------
  return (
    <div className="mx-auto max-w-4xl">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-6 top-6 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === "error" ? "bg-error text-error-foreground " : "bg-success text-success-foreground "
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={(() => router.push("/campaign"))}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-foreground">
          {isEditing ? "Edit Campaign" : "New Campaign"}
        </h1>
      </div>

      <div className="space-y-8">
        {/* ============ Section 1 – Basic Info ============ */}
        <section className="rounded-xl border border-border bg-card text-card-foreground p-6">
          <h2 className="mb-4 text-base font-semibold text-foreground">Basic Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">
                Campaign Name <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((p) => ({ ...p, name: "" }));
                }}
                placeholder="e.g. Summer Sale 2026"
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.name ? "border-error/50" : "border-input"
                }`}
              />
              {errors.name && <p className="mt-1 text-xs text-error">{errors.name}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">
                Number of Ads <span className="text-error">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={adCount}
                onChange={(e) => setAdCount(parseInt(e.target.value) || 1)}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.adCount ? "border-error/50" : "border-input"
                }`}
              />
              {errors.adCount && <p className="mt-1 text-xs text-error">{errors.adCount}</p>}
            </div>
          </div>
        </section>

        {/* ============ Section 2 – Product Selection ============ */}
        <section className="rounded-xl border border-border bg-card text-card-foreground p-6">
          <h2 className="mb-1 text-base font-semibold text-foreground">Select Products <span className="text-error">*</span></h2>
          <p className="mb-4 text-sm text-muted-foreground">Choose the products to feature in this campaign.</p>
          {errors.products && <p className="mb-3 text-xs text-error">{errors.products}</p>}

          {productsLoading ? (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : allProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No products available. Add products first.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {allProducts
                .filter((p) => p.isEnabled)
                .map((product) => {
                  const isSelected = selectedProductIds.includes(product.id);
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => toggleProduct(product.id)}
                      className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                          : "border-border bg-card text-card-foreground hover:border-border"
                      }`}
                    >
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={product.imageUrl1}
                          alt={product.name}
                          fill
                          sizes="48px"
                          loader={passthroughImageLoader}
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{product.description.slice(0, 40)}</p>
                      </div>
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                          isSelected ? "border-primary bg-primary text-primary-foreground" : "border-input"
                        }`}
                      >
                        {isSelected && (
                          <svg className="h-3 w-3 " fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          )}
        </section>

        {/* ============ Section 3 – Targeting ============ */}
        <section className="rounded-xl border border-border bg-card text-card-foreground p-6">
          <h2 className="mb-4 text-base font-semibold text-foreground">Targeting</h2>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-card-foreground">Store Categories</label>
              <TogglePills options={STORE_CATEGORIES} selected={storeCategories} onChange={setStoreCategories} />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-card-foreground">Age Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={120}
                  placeholder="Min"
                  value={ageMin}
                  onChange={(e) => setAgeMin(e.target.value)}
                  className="w-24 rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-muted-foreground">—</span>
                <input
                  type="number"
                  min={0}
                  max={120}
                  placeholder="Max"
                  value={ageMax}
                  onChange={(e) => setAgeMax(e.target.value)}
                  className="w-24 rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-card-foreground">Gender</label>
              <TogglePills options={GENDER_OPTIONS} selected={gender} onChange={setGender} />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-card-foreground">Audience Tags</label>
              <TogglePills options={AUDIENCE_TAGS} selected={audienceTags} onChange={setAudienceTags} />
            </div>
          </div>
        </section>

        {/* ============ Section 4 – Campaign Ideas ============ */}
        <section className="rounded-xl border border-border bg-card text-card-foreground p-6">
          <h2 className="mb-1 text-base font-semibold text-foreground">Campaign Ideas</h2>
          <p className="mb-4 text-sm text-muted-foreground">Describe your vision for the ad images.</p>
          {errors.ideas && <p className="mb-3 text-xs text-error">{errors.ideas}</p>}

          <div className="space-y-3">
            {ideas.map((idea, index) => (
              <div key={index} className="flex gap-2">
                <textarea
                  value={idea}
                  onChange={(e) => {
                    updateIdea(index, e.target.value);
                    if (errors.ideas) setErrors((p) => ({ ...p, ideas: "" }));
                  }}
                  placeholder={`Idea ${index + 1}: Describe an ad concept...`}
                  rows={2}
                  className="flex-1 resize-none rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {ideas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIdea(index)}
                    className="mt-1 self-start rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-error/10 hover:text-error"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addIdea}
            className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:opacity-90"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Another Idea
          </button>
        </section>

        {/* ============ Section 5 – Style Selection ============ */}
        <section className="rounded-xl border border-border bg-card text-card-foreground p-6">
          <h2 className="mb-1 text-base font-semibold text-foreground">
            Style Selection <span className="text-error">*</span>
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Choose one or more visual styles for your ad images.
          </p>
          {errors.styles && <p className="mb-3 text-xs text-error">{errors.styles}</p>}

          {stylesLoading ? (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : allStyles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No styles available.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {allStyles.map((style) => {
                const isSelected = selectedStyleIds.includes(style.id);
                return (
                  <div
                    key={style.id}
                    className={`flex h-80 flex-col overflow-hidden rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                        : "border-border bg-card text-card-foreground hover:border-primary/30"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStyleIds((prev) =>
                          prev.includes(style.id)
                            ? prev.filter((x) => x !== style.id)
                            : [...prev, style.id]
                        );
                        if (errors.styles) setErrors((e) => ({ ...e, styles: "" }));
                      }}
                      className="flex items-start justify-between gap-3 border-b border-border/70 px-4 py-4 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{style.name}</p>
                      </div>
                      <div
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input bg-background"
                        }`}
                        aria-hidden="true"
                      >
                        {isSelected && (
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewStyle(style)}
                      className="group relative flex-1 overflow-hidden bg-muted/40 text-left"
                      aria-label={`Preview ${style.name}`}
                    >
                      <div className="absolute inset-0 overflow-hidden px-4 py-4">
                        <div className="markdown-prose prose prose-sm pointer-events-none max-w-none transition duration-200 group-hover:scale-[1.01] group-hover:blur-[3px] [&_h1]:mb-3 [&_h1]:text-sm [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-xs [&_li]:my-0 [&_li]:text-xs [&_ol]:my-2 [&_p]:my-2 [&_p]:text-xs [&_pre]:rounded-lg [&_pre]:p-3 [&_strong]:text-current">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {style.prompt}
                          </ReactMarkdown>
                        </div>
                      </div>
                      <div className="pointer-events-none absolute inset-0 bg-background/0 transition-colors duration-200 group-hover:bg-background/45 dark:group-hover:bg-background/30" />
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="rounded-full border border-border/80 bg-card/95 px-3 py-1.5 text-xs font-semibold text-foreground shadow-lg shadow-black/10 backdrop-blur-md dark:border-border dark:bg-card/90 dark:shadow-black/30">
                          Preview full style guide
                        </span>
                      </div>
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-card via-card/95 to-transparent" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ============ Section 6 – Generate & Review ============ */}
        <section className="rounded-xl border border-border bg-card text-card-foreground p-6">
          <h2 className="mb-4 text-base font-semibold text-foreground">Generate & Review</h2>

          {/* Generate button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || saving}
            className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium  transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {generating ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Starting...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                </svg>
                {generatedImages.length > 0 ? `Generate ${adCount} More` : `Generate ${adCount} Ads`}
              </>
            )}
          </button>

          {/* Progress indicator when generating */}
          {pendingImages.length > 0 && (
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3">
              <svg className="h-5 w-5 shrink-0 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-sm text-primary">
                Generating images... {completedImages.length} of {completedImages.length + pendingImages.length} ready
                {failedImages.length > 0 && <span className="text-error"> ({failedImages.length} failed)</span>}
              </p>
            </div>
          )}

          {/* Image grid */}
          {generatedImages.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-sm font-medium text-card-foreground">
                {completedImages.length} image{completedImages.length !== 1 && "s"} ready
                {pendingImages.length > 0 && `, ${pendingImages.length} generating`}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {generatedImages.map((img) => (
                  <div key={img.id} className="group relative overflow-hidden rounded-lg border border-border bg-muted">
                    {img.status === "completed" ? (
                      <>
                        <Image
                          src={img.imageUrl}
                          alt="Generated ad"
                          fill
                          sizes="(min-width: 640px) 33vw, 50vw"
                          loader={passthroughImageLoader}
                          unoptimized
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(img.id)}
                          className="absolute right-2 top-2 rounded-md bg-black/60 p-1  opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </>
                    ) : img.status === "pending" ? (
                      <div className="flex aspect-square items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                          <svg className="h-6 w-6 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span className="text-xs text-muted-foreground">Generating...</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex aspect-square items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                          <svg className="h-6 w-6 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                          </svg>
                          <span className="text-xs text-error">Failed</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-6 flex items-center gap-3 border-t border-border/50 pt-6">
            <button
              type="button"
              onClick={(() => router.push("/campaign"))}
              className="rounded-lg border border-input px-4 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => saveCampaign()}
              disabled={saving}
              className="rounded-lg border border-input px-4 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              {saving ? "Saving..." : isEditing ? "Update Campaign" : "Save as Draft"}
            </button>
            <button
              type="button"
              onClick={handleActivate}
              disabled={activating || saving}
              className="rounded-lg bg-success text-success-foreground px-5 py-2 text-sm font-medium  transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {activating ? "Activating..." : isEditing ? "Update & Activate" : "Create Campaign"}
            </button>
          </div>
        </section>
      </div>
      {previewModal}
    </div>
  );
}

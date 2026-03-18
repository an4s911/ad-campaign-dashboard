"use client";

import { useState, useEffect, useCallback } from "react";
import TogglePills from "@/components/TogglePills";
import ImageUpload from "@/components/ImageUpload";

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
  campaignId: string;
  createdAt: string;
}

interface StyleEntry {
  styleType: "preset" | "uploaded";
  presetName?: string;
  uploadedImageUrl?: string;
}

interface CampaignFormProps {
  campaignId: string | null; // null = create, string = edit
  onDone: () => void;
  onCancel: () => void;
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

// --- Style Presets ---
// Add more presets here: { name: "...", colors: ["...", "..."] }
const STYLE_PRESETS = [
  { name: "Minimalist Clean", colors: ["#f8fafc", "#e2e8f0", "#94a3b8", "#475569"] },
  { name: "Bold & Vibrant", colors: ["#ef4444", "#f97316", "#eab308", "#22c55e"] },
  { name: "Premium Luxury", colors: ["#1c1917", "#292524", "#a16207", "#d4af37"] },
];

// ---------- Component ----------

export default function CampaignForm({ campaignId, onDone, onCancel }: CampaignFormProps) {
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
  const [styleMode, setStyleMode] = useState<"preset" | "upload">("preset");
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [uploadedStyleUrl, setUploadedStyleUrl] = useState<string | null>(null);

  // Section 6 – Generate & Review
  const [savedCampaignId, setSavedCampaignId] = useState<string | null>(campaignId);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);

  // Validation & Toast
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

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

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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
        const presetStyles = data.styles.filter(
          (s: { styleType: string }) => s.styleType === "preset"
        );
        const uploadedStyle = data.styles.find(
          (s: { styleType: string }) => s.styleType === "uploaded"
        );
        if (uploadedStyle) {
          setStyleMode("upload");
          setUploadedStyleUrl(uploadedStyle.uploadedImageUrl);
        } else {
          setStyleMode("preset");
          setSelectedPresets(
            presetStyles.map((s: { presetName: string }) => s.presetName)
          );
        }

        // Generated images
        if (data.generatedImages?.length > 0) {
          setGeneratedImages(data.generatedImages);
        }
      } catch {
        showToast("Failed to load campaign", "error");
      }
    })();
  }, [campaignId]);

  // ---------- Validation ----------
  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Campaign name is required";
    if (!adCount || adCount < 1) errs.adCount = "Must be at least 1";
    if (selectedProductIds.length === 0) errs.products = "Select at least one product";
    if (ideas.every((i) => !i.trim())) errs.ideas = "Add at least one idea";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ---------- Build styles array ----------
  function buildStyles(): StyleEntry[] {
    if (styleMode === "upload" && uploadedStyleUrl) {
      return [{ styleType: "uploaded", uploadedImageUrl: uploadedStyleUrl }];
    }
    return selectedPresets.map((p) => ({ styleType: "preset", presetName: p }));
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

  // ---------- Generate images ----------
  async function handleGenerate() {
    let cid = savedCampaignId;
    if (!cid) {
      cid = await saveCampaign();
      if (!cid) return;
    }
    setGenerating(true);
    try {
      const res = await fetch(`/api/campaigns/${cid}/generate`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setGeneratedImages((prev) => [...prev, ...data.images]);
        showToast(`Generated ${data.images.length} images`, "success");
      } else {
        const data = await res.json();
        showToast(data.error || "Generation failed", "error");
      }
    } catch {
      showToast("Failed to generate images", "error");
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
      // Save latest changes first
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
        setTimeout(onDone, 600);
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

  // ---------- Preset toggle ----------
  function togglePreset(name: string) {
    setSelectedPresets((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  }

  // ---------- Render ----------
  return (
    <div className="mx-auto max-w-4xl">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-6 top-6 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === "error" ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={onCancel}
          className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? "Edit Campaign" : "New Campaign"}
        </h1>
      </div>

      <div className="space-y-8">
        {/* ============ Section 1 – Basic Info ============ */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Basic Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Campaign Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((p) => ({ ...p, name: "" }));
                }}
                placeholder="e.g. Summer Sale 2026"
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Number of Ads <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={adCount}
                onChange={(e) => setAdCount(parseInt(e.target.value) || 1)}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.adCount ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.adCount && <p className="mt-1 text-xs text-red-500">{errors.adCount}</p>}
            </div>
          </div>
        </section>

        {/* ============ Section 2 – Product Selection ============ */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-1 text-base font-semibold text-gray-900">Select Products <span className="text-red-400">*</span></h2>
          <p className="mb-4 text-sm text-gray-400">Choose the products to feature in this campaign.</p>
          {errors.products && <p className="mb-3 text-xs text-red-500">{errors.products}</p>}

          {productsLoading ? (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : allProducts.length === 0 ? (
            <p className="text-sm text-gray-400">No products available. Add products first.</p>
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
                          ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500/20"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        <img src={product.imageUrl1} alt={product.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="truncate text-xs text-gray-400">{product.description.slice(0, 40)}</p>
                      </div>
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                          isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Targeting</h2>

          <div className="space-y-5">
            {/* Store Categories */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Store Categories</label>
              <TogglePills options={STORE_CATEGORIES} selected={storeCategories} onChange={setStoreCategories} />
            </div>

            {/* Age Range */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Age Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={120}
                  placeholder="Min"
                  value={ageMin}
                  onChange={(e) => setAgeMin(e.target.value)}
                  className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-400">—</span>
                <input
                  type="number"
                  min={0}
                  max={120}
                  placeholder="Max"
                  value={ageMax}
                  onChange={(e) => setAgeMax(e.target.value)}
                  className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Gender</label>
              <TogglePills options={GENDER_OPTIONS} selected={gender} onChange={setGender} />
            </div>

            {/* Audience Tags */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Audience Tags</label>
              <TogglePills options={AUDIENCE_TAGS} selected={audienceTags} onChange={setAudienceTags} />
            </div>
          </div>
        </section>

        {/* ============ Section 4 – Campaign Ideas ============ */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-1 text-base font-semibold text-gray-900">Campaign Ideas</h2>
          <p className="mb-4 text-sm text-gray-400">Describe your vision for the ad images.</p>
          {errors.ideas && <p className="mb-3 text-xs text-red-500">{errors.ideas}</p>}

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
                  className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {ideas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIdea(index)}
                    className="mt-1 self-start rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
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
            className="mt-3 flex items-center gap-1.5 text-sm font-medium text-blue-500 transition-colors hover:text-blue-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Another Idea
          </button>
        </section>

        {/* ============ Section 5 – Style Selection ============ */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Style Selection</h2>

          {/* Mode toggle */}
          <div className="mb-5 inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => setStyleMode("preset")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                styleMode === "preset"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Choose from Presets
            </button>
            <button
              type="button"
              onClick={() => setStyleMode("upload")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                styleMode === "upload"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Upload Reference Image
            </button>
          </div>

          {styleMode === "preset" ? (
            <div className="grid grid-cols-3 gap-3">
              {/* --- Preset style cards --- */}
              {STYLE_PRESETS.map((preset) => {
                const isSelected = selectedPresets.includes(preset.name);
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => togglePreset(preset.name)}
                    className={`rounded-lg border-2 p-4 text-left transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500/20"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    {/* Color preview */}
                    <div className="mb-3 flex gap-1.5">
                      {preset.colors.map((color, i) => (
                        <div
                          key={i}
                          className="h-8 flex-1 rounded"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{preset.name}</p>
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                          isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="max-w-xs">
              <ImageUpload
                label="Reference Image"
                value={uploadedStyleUrl}
                onChange={setUploadedStyleUrl}
              />
            </div>
          )}
        </section>

        {/* ============ Section 6 – Generate & Review ============ */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Generate & Review</h2>

          {/* Generate button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || saving}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
          >
            {generating ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
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

          {/* Image grid */}
          {generatedImages.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-sm font-medium text-gray-700">
                {generatedImages.length} image{generatedImages.length !== 1 && "s"} generated
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {generatedImages.map((img) => (
                  <div key={img.id} className="group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    <img
                      src={img.imageUrl}
                      alt="Generated ad"
                      className="aspect-square w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.id)}
                      className="absolute right-2 top-2 rounded-md bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-6">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => saveCampaign()}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              {saving ? "Saving..." : isEditing ? "Update Campaign" : "Save as Draft"}
            </button>
            <button
              type="button"
              onClick={handleActivate}
              disabled={activating || saving}
              className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
            >
              {activating ? "Activating..." : isEditing ? "Update & Activate" : "Create Campaign"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

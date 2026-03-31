"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import TogglePills from "@/components/campaigns/TogglePills";
import MutualExclusionPills from "@/components/campaigns/MutualExclusionPills";
import LocationTargeting, { TargetLocation } from "@/components/campaigns/LocationTargeting";
import StyleCard from "@/components/styles/StyleCard";
import StylePreviewModal, { StylePreviewData } from "@/components/styles/StylePreviewModal";
import ImageDropzone from "@/components/ui/ImageDropzone";
import ImagePreviewModal from "@/components/ui/ImagePreviewModal";
import { useUnsavedChangesGuard } from "@/providers/UnsavedChangesProvider";

interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl1: string;
  imageUrl2: string | null;
  isEnabled: boolean;
  tags: string[];
}

interface GeneratedImage {
  id: string;
  imageUrl: string;
  status: string;
  campaignId: string;
  createdAt: string;
}

interface Style {
  id: string;
  name: string;
  prompt: string;
  previewImageUrl?: string | null;
}

interface UploadedStyleReference {
  id: string;
  styleType: "uploaded";
  uploadedImageUrl: string;
}

interface AdTextEntry {
  id: string;
  productId: string;
  text: string;
  isEnabled: boolean;
}

interface CampaignFormProps {
  campaignId: string | null;
}

type SaveIndicatorState = "hidden" | "saving" | "saved";
type SaveCampaignOptions = {
  status?: "draft" | "active";
  source?: "autosave" | "manual" | "generate" | "status";
  requireValidation?: boolean;
};

const STORE_CATEGORIES = [
  "Clothing", "Food", "Electronics", "Grocery", "Pharmacy", "Sports",
  "Home & Living", "Beauty", "Books", "Toys", "Automotive", "Pet Supplies",
];

const GENDER_OPTIONS = ["Male", "Female", "All"];

const INCOME_LEVELS = ["Low", "Middle", "Upper-Middle", "High"];

const SHOPPING_BEHAVIORS = [
  "Impulse Buyers", "Deal Seekers", "Brand Loyal", "First-Time Shoppers",
  "Repeat Customers", "Window Shoppers", "Bulk Buyers",
];

const DAYS_OF_WEEK = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
];
const ALL_DAY_VALUES = DAYS_OF_WEEK.map((d) => d.value);

const TIME_OF_DAY_OPTIONS = [
  "Morning (6am-12pm)",
  "Afternoon (12pm-5pm)",
  "Evening (5pm-9pm)",
  "Night (9pm-6am)",
  "All Day",
];

const WEATHER_OPTIONS = ["Sunny", "Rainy", "Cold", "Hot", "Snowy", "Any"];

const TAG_TO_CATEGORY: Record<string, string> = {
  food: "Food", grocery: "Grocery", clothing: "Clothing", apparel: "Clothing",
  electronics: "Electronics", tech: "Electronics", pharmacy: "Pharmacy", medicine: "Pharmacy",
  sports: "Sports", fitness: "Sports", home: "Home & Living", furniture: "Home & Living",
  beauty: "Beauty", cosmetics: "Beauty", books: "Books", toys: "Toys",
  automotive: "Automotive", car: "Automotive", pet: "Pet Supplies",
};

const POLL_INTERVAL = 3000;
const passthroughImageLoader = ({ src }: { src: string }) => src;
const AUTO_SAVE_DELAY_MS = 1500;

function getCampaignSnapshot(values: {
  name: string;
  adCount: number;
  selectedProductIds: string[];
  storeCategories: string[];
  ageMin: string;
  ageMax: string;
  gender: string[];
  productTags: string[];
  incomeLevel: string[];
  shoppingBehavior: string[];
  targetDays: string[];
  timeOfDay: string[];
  weather: string[];
  targetLocations: TargetLocation[];
  adTexts: AdTextEntry[];
  selectedStyleIds: string[];
  uploadedStyleReferenceUrls: string[];
}) {
  return JSON.stringify(values);
}

export default function CampaignForm({ campaignId }: CampaignFormProps) {
  const router = useRouter();
  const isEditing = !!campaignId;
  const [loadingCampaign, setLoadingCampaign] = useState(isEditing);
  const [name, setName] = useState("");
  const [adCount, setAdCount] = useState(10);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [storeCategories, setStoreCategories] = useState<string[]>([]);
  const [ageMin, setAgeMin] = useState<string>("");
  const [ageMax, setAgeMax] = useState<string>("");
  const [gender, setGender] = useState<string[]>([]);
  const [productTags, setProductTags] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [incomeLevel, setIncomeLevel] = useState<string[]>([]);
  const [shoppingBehavior, setShoppingBehavior] = useState<string[]>([]);
  const [targetDays, setTargetDays] = useState<string[]>(ALL_DAY_VALUES);
  const [timeOfDay, setTimeOfDay] = useState<string[]>(["All Day"]);
  const [weather, setWeather] = useState<string[]>(["Any"]);
  const [targetLocations, setTargetLocations] = useState<TargetLocation[]>([]);
  const [adTexts, setAdTexts] = useState<AdTextEntry[]>([]);
  const [allStyles, setAllStyles] = useState<Style[]>([]);
  const [selectedStyleIds, setSelectedStyleIds] = useState<string[]>([]);
  const [uploadedStyleReferences, setUploadedStyleReferences] = useState<UploadedStyleReference[]>([]);
  const [previewStyle, setPreviewStyle] = useState<StylePreviewData | null>(null);
  const [stylesLoading, setStylesLoading] = useState(true);
  const [savedCampaignId, setSavedCampaignId] = useState<string | null>(campaignId);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generateTotal, setGenerateTotal] = useState(0);
  const [generateDone, setGenerateDone] = useState(0);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [campaignStatus, setCampaignStatus] = useState<string>("draft");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [saveIndicator, setSaveIndicator] = useState<SaveIndicatorState>("hidden");
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveIndicatorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFailedAutosaveSnapshotRef = useRef<string | null>(null);
  const saveCampaignRef = useRef<
    ((options?: SaveCampaignOptions) => Promise<string | null>) | null
  >(null);
  const [initialSnapshot, setInitialSnapshot] = useState(() =>
    getCampaignSnapshot({
      name: "",
      adCount: 10,
      selectedProductIds: [],
      storeCategories: [],
      ageMin: "",
      ageMax: "",
      gender: [],
      productTags: [],
      incomeLevel: [],
      shoppingBehavior: [],
      targetDays: ALL_DAY_VALUES,
      timeOfDay: ["All Day"],
      weather: ["Any"],
      targetLocations: [],
      adTexts: [],
      selectedStyleIds: [],
      uploadedStyleReferenceUrls: [],
    })
  );

  const showToast = useCallback((message: string, type: "error" | "success") => {
    setToast({ message, type });
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
    setTimeout(() => setToast(null), 3400);
  }, []);

  const clearAutoSaveTimer = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }, []);

  const clearSaveIndicatorTimer = useCallback(() => {
    if (saveIndicatorTimerRef.current) {
      clearTimeout(saveIndicatorTimerRef.current);
      saveIndicatorTimerRef.current = null;
    }
  }, []);

  const showSavingIndicator = useCallback(() => {
    clearSaveIndicatorTimer();
    setSaveIndicator("saving");
  }, [clearSaveIndicatorTimer]);

  const showSavedIndicator = useCallback(() => {
    clearSaveIndicatorTimer();
    setSaveIndicator("saved");
    saveIndicatorTimerRef.current = setTimeout(() => {
      setSaveIndicator("hidden");
    }, 1600);
  }, [clearSaveIndicatorTimer]);

  const hideSaveIndicator = useCallback(() => {
    clearSaveIndicatorTimer();
    setSaveIndicator("hidden");
  }, [clearSaveIndicatorTimer]);

  // Derived tags from selected products (deduplicated, sorted)
  const derivedProductTags = useMemo(() => {
    const selected = allProducts.filter((p) => selectedProductIds.includes(p.id));
    const tagSet = new Set<string>();
    selected.forEach((p) => p.tags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [allProducts, selectedProductIds]);

  // Sync productTags when derived tags or custom tags change
  useEffect(() => {
    const derived = new Set(derivedProductTags);
    const filteredCustom = customTags.filter((t) => !derived.has(t));
    setProductTags([...derivedProductTags, ...filteredCustom]);
  }, [derivedProductTags, customTags]);

  // Auto-match product tags to store categories (convenience pre-selection)
  useEffect(() => {
    if (derivedProductTags.length === 0) return;
    const toAdd: string[] = [];
    derivedProductTags.forEach((tag) => {
      const lower = tag.toLowerCase();
      for (const [key, category] of Object.entries(TAG_TO_CATEGORY)) {
        if (lower.includes(key) && STORE_CATEGORIES.includes(category)) {
          toAdd.push(category);
        }
      }
    });
    if (toAdd.length === 0) return;
    setStoreCategories((prev) => {
      const next = new Set(prev);
      toAdd.forEach((c) => next.add(c));
      return Array.from(next);
    });
  }, [derivedProductTags]);

  // Count enabled ad text entries that have non-empty text
  const activeAdTextCount = useMemo(
    () => adTexts.filter((t) => t.isEnabled && t.text.trim() !== "").length,
    [adTexts]
  );

  const totalStyleSelections = useMemo(
    () => selectedStyleIds.length + uploadedStyleReferences.length,
    [selectedStyleIds.length, uploadedStyleReferences.length]
  );
  const currentSnapshot = useMemo(
    () =>
      getCampaignSnapshot({
        name,
        adCount,
        selectedProductIds,
        storeCategories,
        ageMin,
        ageMax,
        gender,
        productTags,
        incomeLevel,
        shoppingBehavior,
        targetDays,
        timeOfDay,
        weather,
        targetLocations,
        adTexts,
        selectedStyleIds,
        uploadedStyleReferenceUrls: uploadedStyleReferences.map(
          (style) => style.uploadedImageUrl
        ),
      }),
    [
      name,
      adCount,
      selectedProductIds,
      storeCategories,
      ageMin,
      ageMax,
      gender,
      productTags,
      incomeLevel,
      shoppingBehavior,
      targetDays,
      timeOfDay,
      weather,
      targetLocations,
      adTexts,
      selectedStyleIds,
      uploadedStyleReferences,
    ]
  );
  const { clearUnsavedChanges, allowNavigation, guardedPush } =
    useUnsavedChangesGuard(!loadingCampaign && currentSnapshot !== initialSnapshot);
  const canAutoSave = useMemo(() => {
    if (loadingCampaign) return false;
    if (saving || generating || activating) return false;
    return Boolean(savedCampaignId);
  }, [
    loadingCampaign,
    saving,
    generating,
    activating,
    savedCampaignId,
  ]);
  const canCreateDraft = useMemo(
    () => Boolean(name.trim()) && adCount > 0 && selectedProductIds.length > 0,
    [name, adCount, selectedProductIds.length]
  );
  const hasUnsavedChanges = !loadingCampaign && currentSnapshot !== initialSnapshot;

  // Real-time validation for generate button
  const canGenerate = useMemo(() => {
    if (!name.trim()) return false;
    if (!adCount || adCount < 1) return false;
    if (selectedProductIds.length === 0) return false;
    if (selectedProductIds.length > adCount) return false;
    if (activeAdTextCount === 0) return false;
    if (totalStyleSelections === 0) return false;
    if (totalStyleSelections > adCount) return false;
    return true;
  }, [name, adCount, selectedProductIds.length, activeAdTextCount, totalStyleSelections]);

  // Validation hint message for disabled generate button
  const generateHint = useMemo(() => {
    if (!name.trim()) return "Enter a campaign name";
    if (!adCount || adCount < 1) return "Set number of ads";
    if (selectedProductIds.length === 0) return "Select at least one product";
    if (selectedProductIds.length > adCount) return `Too many products (${selectedProductIds.length}) for ${adCount} ads`;
    if (activeAdTextCount === 0) return "Add at least one ad text entry";
    if (totalStyleSelections === 0) return "Select at least one style";
    if (totalStyleSelections > adCount) return `Too many styles (${totalStyleSelections}) for ${adCount} ads`;
    return "";
  }, [name, adCount, selectedProductIds.length, activeAdTextCount, totalStyleSelections]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) setAllProducts(await res.json());
    } catch {
      showToast("Failed to load products", "error");
    } finally {
      setProductsLoading(false);
    }
  }, [showToast]);

  const fetchStyles = useCallback(async () => {
    try {
      const res = await fetch("/api/styles");
      if (res.ok) setAllStyles(await res.json());
    } catch {
      showToast("Failed to load styles", "error");
    } finally {
      setStylesLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchProducts();
    fetchStyles();
  }, [fetchProducts, fetchStyles]);

  useEffect(() => {
    if (!campaignId) {
      setLoadingCampaign(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/campaigns/${campaignId}`);
        if (!res.ok) return;
        const data = await res.json();
        const nextSelectedProductIds = data.products.map(
          (cp: { productId: string }) => cp.productId
        );
        const nextAdTexts = (data.texts ?? []).map(
          (t: { id: string; productId: string; text: string; isEnabled: boolean }) => ({
            id: t.id,
            productId: t.productId,
            text: t.text,
            isEnabled: t.isEnabled,
          })
        );
        const nextSelectedStyleIds = data.styles
          .filter(
            (cs: { styleType?: string; styleId?: string | null }) =>
              cs.styleType !== "uploaded" && Boolean(cs.styleId)
          )
          .map((cs: { styleId: string }) => cs.styleId);
        const nextUploadedReferences = data.styles
          .filter(
            (cs: {
              id: string;
              styleType?: string;
              uploadedImageUrl?: string | null;
            }) => cs.styleType === "uploaded" && Boolean(cs.uploadedImageUrl)
          )
          .map(
            (cs: {
              id: string;
              uploadedImageUrl: string;
            }) => ({
              id: cs.id,
              styleType: "uploaded" as const,
              uploadedImageUrl: cs.uploadedImageUrl,
            })
          );

        setName(data.name);
        setAdCount(data.adCount);
        setSelectedProductIds(nextSelectedProductIds);
        setStoreCategories(data.targetStoreCategories ?? []);
        setAgeMin(data.targetAgeMin != null ? String(data.targetAgeMin) : "");
        setAgeMax(data.targetAgeMax != null ? String(data.targetAgeMax) : "");
        setGender(data.targetGender ?? []);
        setProductTags(data.targetProductTags ?? []);
        setCustomTags(data.targetProductTags ?? []);
        setIncomeLevel(data.targetIncome ?? []);
        setShoppingBehavior(data.targetShoppingBehavior ?? []);
        setTargetDays(data.targetDays ?? ALL_DAY_VALUES);
        setTimeOfDay(data.targetTimeOfDay ?? ["All Day"]);
        setWeather(data.targetWeather ?? ["Any"]);
        setTargetLocations(data.targetLocations ?? []);
        setAdTexts(nextAdTexts);
        setSelectedStyleIds(nextSelectedStyleIds);
        setUploadedStyleReferences(nextUploadedReferences);
        setCampaignStatus(data.status ?? "draft");
        if (data.generatedImages?.length > 0) {
          setGeneratedImages(data.generatedImages);
        }
        setInitialSnapshot(
          getCampaignSnapshot({
            name: data.name,
            adCount: data.adCount,
            selectedProductIds: nextSelectedProductIds,
            storeCategories: data.targetStoreCategories ?? [],
            ageMin: data.targetAgeMin != null ? String(data.targetAgeMin) : "",
            ageMax: data.targetAgeMax != null ? String(data.targetAgeMax) : "",
            gender: data.targetGender ?? [],
            productTags: data.targetProductTags ?? [],
            incomeLevel: data.targetIncome ?? [],
            shoppingBehavior: data.targetShoppingBehavior ?? [],
            targetDays: data.targetDays ?? ALL_DAY_VALUES,
            timeOfDay: data.targetTimeOfDay ?? ["All Day"],
            weather: data.targetWeather ?? ["Any"],
            targetLocations: data.targetLocations ?? [],
            adTexts: nextAdTexts,
            selectedStyleIds: nextSelectedStyleIds,
            uploadedStyleReferenceUrls: nextUploadedReferences.map(
              (style: UploadedStyleReference) => style.uploadedImageUrl
            ),
          })
        );
      } catch {
        showToast("Failed to load campaign", "error");
      } finally {
        setLoadingCampaign(false);
      }
    })();
  }, [campaignId, showToast]);

  // Polling fallback for old-style images with replicatePredictionId
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
      }
    }

    poll();
    pollTimerRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [hasPending, savedCampaignId]);

  useEffect(() => {
    if (!previewImageUrl) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPreviewImageUrl(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewImageUrl]);

  useEffect(() => {
    return () => {
      clearAutoSaveTimer();
      clearSaveIndicatorTimer();
    };
  }, [clearAutoSaveTimer, clearSaveIndicatorTimer]);

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Campaign name is required";
    if (!adCount || adCount < 1) errs.adCount = "Must be at least 1";
    if (selectedProductIds.length === 0) errs.products = "Select at least one product";
    if (selectedProductIds.length > adCount) errs.products = `Max ${adCount} products for ${adCount} ads`;
    if (activeAdTextCount === 0) errs.adTexts = "Add at least one ad text entry";
    if (totalStyleSelections === 0) errs.styles = "Select at least one style";
    if (totalStyleSelections > adCount) errs.styles = `Max ${adCount} styles for ${adCount} ads`;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [name, adCount, selectedProductIds.length, activeAdTextCount, totalStyleSelections]);

  const buildTexts = useCallback(() => {
    return adTexts
      .map((t, i) => ({
        productId: t.productId,
        text: t.text.trim(),
        isEnabled: t.isEnabled,
        sortOrder: i,
      }))
      .filter((t) => t.text);
  }, [adTexts]);

  const buildStyles = useCallback((): Array<
    | { styleType: "library"; styleId: string }
    | { styleType: "uploaded"; uploadedImageUrl: string }
  > => {
    return [
      ...selectedStyleIds.map((styleId) => ({
        styleType: "library" as const,
        styleId,
      })),
      ...uploadedStyleReferences.map((style) => ({
        styleType: "uploaded" as const,
        uploadedImageUrl: style.uploadedImageUrl,
      })),
    ];
  }, [selectedStyleIds, uploadedStyleReferences]);

  const buildPayload = useCallback((status?: "draft" | "active") => {
    return {
      name: name.trim(),
      adCount,
      targetStoreCategories: storeCategories,
      targetAgeMin: ageMin ? Number(ageMin) : null,
      targetAgeMax: ageMax ? Number(ageMax) : null,
      targetGender: gender,
      targetTags: [],
      targetProductTags: productTags,
      targetIncome: incomeLevel,
      targetShoppingBehavior: shoppingBehavior,
      targetDays,
      targetTimeOfDay: timeOfDay,
      targetWeather: weather,
      targetLocations,
      productIds: selectedProductIds,
      texts: buildTexts(),
      styles: buildStyles(),
      ...(status === "active" ? { status: "active" } : {}),
    };
  }, [
    name,
    adCount,
    storeCategories,
    ageMin,
    ageMax,
    gender,
    productTags,
    incomeLevel,
    shoppingBehavior,
    targetDays,
    timeOfDay,
    weather,
    targetLocations,
    selectedProductIds,
    buildTexts,
    buildStyles,
  ]);

  useEffect(() => {
    if (!canAutoSave || currentSnapshot === initialSnapshot) {
      clearAutoSaveTimer();
      return;
    }

    if (lastFailedAutosaveSnapshotRef.current === currentSnapshot) {
      return;
    }

    clearAutoSaveTimer();
    autoSaveTimerRef.current = setTimeout(() => {
      void saveCampaignRef.current?.({
        source: "autosave",
        requireValidation: false,
      });
    }, AUTO_SAVE_DELAY_MS);

    return () => {
      clearAutoSaveTimer();
    };
  }, [canAutoSave, currentSnapshot, initialSnapshot, clearAutoSaveTimer]);

  // Handle adCount changes with auto-deselection logic
  function handleAdCountChange(newValue: number) {
    const clamped = Math.max(1, newValue);
    setAdCount(clamped);

    // Auto-deselect excess products (keep first N)
    if (selectedProductIds.length > clamped) {
      setSelectedProductIds((prev) => prev.slice(0, clamped));
    }

    // Auto-deselect excess styles, prioritizing saved library selections first.
    if (selectedStyleIds.length > clamped) {
      setSelectedStyleIds((prev) => prev.slice(0, clamped));
    }
    setUploadedStyleReferences((prev) => {
      const remainingSlots = Math.max(0, clamped - Math.min(selectedStyleIds.length, clamped));
      return prev.slice(0, remainingSlots);
    });

    // Ad texts: auto-disable from the bottom if over the new limit. Do not delete.
    setAdTexts((prev) => {
      let enabledCount = prev.filter((t) => t.isEnabled && t.text.trim() !== "").length;
      if (enabledCount <= clamped) return prev;
      const next = [...prev];
      for (let i = next.length - 1; i >= 0 && enabledCount > clamped; i--) {
        if (next[i].isEnabled && next[i].text.trim() !== "") {
          next[i] = { ...next[i], isEnabled: false };
          enabledCount--;
        }
      }
      return next;
    });
  }

  function handleCustomTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const tag = customTagInput.trim().toLowerCase();
    if (!tag || productTags.includes(tag)) {
      setCustomTagInput("");
      return;
    }
    setCustomTags((prev) => [...prev, tag]);
    setProductTags((prev) => [...prev, tag]);
    setCustomTagInput("");
  }

  function removeCustomTag(tag: string) {
    setCustomTags((prev) => prev.filter((t) => t !== tag));
    setProductTags((prev) => prev.filter((t) => t !== tag));
  }

  const saveCampaign = useCallback(async ({
    status = "draft",
    source = "manual",
    requireValidation = true,
  }: SaveCampaignOptions = {}): Promise<string | null> => {
    if (requireValidation && !validate()) {
      return null;
    }

    clearAutoSaveTimer();
    const snapshotAtSave = currentSnapshot;
    showSavingIndicator();
    setSaving(true);
    try {
      const res = await fetch(savedCampaignId ? `/api/campaigns/${savedCampaignId}` : "/api/campaigns", {
        method: savedCampaignId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(status)),
      });

      const data = await res.json();
      if (res.ok) {
        const nextCampaignId = savedCampaignId ?? data.id;
        if (!savedCampaignId && data.id) {
          setSavedCampaignId(data.id);
        }
        lastFailedAutosaveSnapshotRef.current = null;
        setInitialSnapshot(snapshotAtSave);
        showSavedIndicator();

        if (status === "active") {
          allowNavigation(() => {
            router.push("/campaign");
          });
          return nextCampaignId;
        }

        if (source === "manual" && !savedCampaignId && nextCampaignId) {
          allowNavigation(() => {
            router.push(`/campaign/${nextCampaignId}`);
            router.refresh();
          });
          return nextCampaignId;
        }

        clearUnsavedChanges();
        if (source === "manual") {
          showToast(
            savedCampaignId ? "Campaign updated" : "Campaign saved as draft",
            "success"
          );
        }
        return nextCampaignId;
      } else {
        if (source === "autosave") {
          lastFailedAutosaveSnapshotRef.current = snapshotAtSave;
        }
        hideSaveIndicator();
        showToast(data.error || "Failed to save", "error");
        return null;
      }
    } catch {
      if (source === "autosave") {
        lastFailedAutosaveSnapshotRef.current = snapshotAtSave;
      }
      hideSaveIndicator();
      showToast("Failed to save campaign", "error");
      return null;
    } finally {
      setSaving(false);
    }
  }, [
    validate,
    currentSnapshot,
    savedCampaignId,
    buildPayload,
    clearAutoSaveTimer,
    allowNavigation,
    router,
    clearUnsavedChanges,
    hideSaveIndicator,
    showSavedIndicator,
    showSavingIndicator,
    showToast,
  ]);

  useEffect(() => {
    saveCampaignRef.current = saveCampaign;
  }, [saveCampaign]);

  async function handleGenerate() {
    if (!validate()) return;

    // Generation is tied to a persisted campaign id because the backend stores
    // each generated image against that campaign while it streams progress back.
    // Save first whenever the form is not fully persisted yet.
    let targetId = savedCampaignId;
    const needsSave = !targetId || currentSnapshot !== initialSnapshot;

    if (needsSave) {
      const savedCampaignTargetId = await saveCampaign({
        source: "generate",
        requireValidation: false,
      });
      if (!savedCampaignTargetId) {
        return;
      }
      targetId = savedCampaignTargetId;
    }

    if (!targetId) return;

    setGenerating(true);
    setGenerateTotal(0);
    setGenerateDone(0);

    try {
      // This endpoint does not return a single JSON payload. It keeps the
      // request open and streams SSE messages as each image finishes or fails.
      const response = await fetch(`/api/campaigns/${targetId}/generate`, { method: "POST" });

      if (!response.ok) {
        // Early validation/loading failures come back as a normal JSON error
        // response instead of an SSE stream.
        try {
          const data = await response.json();
          showToast(data.error || "Generation failed", "error");
        } catch {
          showToast("Generation failed", "error");
        }
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        showToast("Streaming not supported", "error");
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        // SSE messages are separated by a blank line. Network chunks do not
        // necessarily line up with message boundaries, so keep any incomplete
        // tail in `buffer` until the next read completes it.
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;
          try {
            // The backend sends JSON inside each SSE `data:` line. The event
            // types come from app/api/campaigns/[id]/generate/route.ts.
            const event = JSON.parse(line.slice(6));
            if (event.type === "start") {
              // First event announces how many generation tasks the backend
              // queued, so the UI can initialize progress.
              setGenerateTotal(event.total);
              showToast(`Generating ${event.total} images...`, "success");
            } else if (event.type === "image") {
              // Successful generations stream back the saved DB record for the
              // new image, which we append immediately to the gallery.
              setGeneratedImages((prev) => [...prev, event.image]);
              setGenerateDone((prev) => prev + 1);
            } else if (event.type === "error") {
              // Failed tasks still increment progress so the progress bar
              // reaches completion even when some images fail.
              if (event.image) {
                setGeneratedImages((prev) => [...prev, event.image]);
              }
              setGenerateDone((prev) => prev + 1);
            }
          } catch {
          }
        }
      }
    } catch {
      showToast("Failed to start generation", "error");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDeleteImage(imageId: string) {
    if (!savedCampaignId) return;
    setGeneratedImages((prev) => prev.filter((img) => img.id !== imageId));
    try {
      const res = await fetch(`/api/campaigns/${savedCampaignId}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
      });
      if (!res.ok) showToast("Failed to remove image", "error");
    } catch {
      showToast("Failed to remove image", "error");
    }
  }

  async function handleToggleStatus() {
    if (!savedCampaignId) return;

    setActivating(true);
    try {
      if (hasUnsavedChanges) {
        const savedCampaignTargetId = await saveCampaign({
          source: "status",
          requireValidation: false,
        });

        if (!savedCampaignTargetId) {
          return;
        }
      }

      const newStatus = campaignStatus === "active" ? "disabled" : "active";
      const res = await fetch(`/api/campaigns/${savedCampaignId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setCampaignStatus(newStatus);
        showToast(`Campaign ${newStatus === "active" ? "activated" : "disabled"}`, "success");
      } else {
        showToast("Failed to update status", "error");
      }
    } catch {
      showToast("Failed to update status", "error");
    } finally {
      setActivating(false);
    }
  }

  function addAdText(productId: string) {
    const enabled = adTexts.filter((t) => t.isEnabled && t.text.trim() !== "").length;
    setAdTexts((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        productId,
        text: "",
        isEnabled: enabled < adCount,
      },
    ]);
  }

  function updateAdText(id: string, text: string) {
    setAdTexts((prev) => prev.map((t) => (t.id === id ? { ...t, text } : t)));
    if (errors.adTexts) setErrors((e) => ({ ...e, adTexts: "" }));
  }

  function removeAdText(id: string) {
    setAdTexts((prev) => prev.filter((t) => t.id !== id));
  }

  function toggleAdText(id: string) {
    setAdTexts((prev) => {
      const entry = prev.find((t) => t.id === id);
      if (!entry) return prev;
      if (entry.isEnabled) {
        return prev.map((t) => (t.id === id ? { ...t, isEnabled: false } : t));
      }
      const enabledCount = prev.filter((t) => t.isEnabled && t.text.trim() !== "").length;
      if (enabledCount >= adCount) return prev;
      return prev.map((t) => (t.id === id ? { ...t, isEnabled: true } : t));
    });
  }

  function toggleProduct(id: string) {
    setSelectedProductIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= adCount) return prev; // At limit
      return [...prev, id];
    });
    if (errors.products) setErrors((e) => ({ ...e, products: "" }));
  }

  function toggleStyle(styleId: string) {
    setSelectedStyleIds((prev) => {
      if (prev.includes(styleId)) return prev.filter((x) => x !== styleId);
      if (prev.length + uploadedStyleReferences.length >= adCount) return prev;
      return [...prev, styleId];
    });
    if (errors.styles) setErrors((e) => ({ ...e, styles: "" }));
  }

  function addUploadedStyleReference(uploadedImageUrl: string) {
    setUploadedStyleReferences((prev) => {
      if (selectedStyleIds.length + prev.length >= adCount) {
        showToast(`You can select up to ${adCount} styles for ${adCount} ads`, "error");
        return prev;
      }

      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          styleType: "uploaded",
          uploadedImageUrl,
        },
      ];
    });

    if (errors.styles) {
      setErrors((current) => ({ ...current, styles: "" }));
    }
  }

  function removeUploadedStyleReference(id: string) {
    setUploadedStyleReferences((prev) => prev.filter((style) => style.id !== id));
  }

  const completedImages = generatedImages.filter((img) => img.status === "completed");
  const pendingImages = generatedImages.filter((img) => img.status === "pending");
  const failedImages = generatedImages.filter((img) => img.status === "failed");

  return (
    <div className="mx-auto max-w-4xl animate-fade-in">
      <div
        aria-live="polite"
        className={`pointer-events-none fixed left-1/2 top-4 z-50 transition-all duration-300 ${
          saveIndicator === "hidden"
            ? "-translate-x-1/2 -translate-y-4 opacity-0"
            : "-translate-x-1/2 translate-y-0 opacity-100"
        }`}
      >
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-lg backdrop-blur-xl ${
            saveIndicator === "saved"
              ? "border-success/25 bg-success/12 text-success"
              : "border-primary/20 bg-card/95 text-foreground"
          }`}
        >
          {saveIndicator === "saving" ? (
            <>
              <svg aria-hidden="true" className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="sr-only">Saving campaign</span>
            </>
          ) : saveIndicator === "saved" ? (
            <>
              <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              <span className="sr-only">Campaign saved</span>
            </>
          ) : null}
        </div>
      </div>

      {/* Toast */}
      <div
        aria-live="polite"
        className={`fixed right-6 top-6 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
          toastVisible ? "toast-enter" : toast ? "toast-exit" : "pointer-events-none opacity-0"
        } ${toast?.type === "error" ? "bg-error text-error-foreground" : "bg-success text-success-foreground"}`}
      >
        {toast?.message}
      </div>

      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => guardedPush("/campaign")}
          aria-label="Go back"
          className="rounded-xl p-2 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">
            {isEditing ? "Edit Campaign" : "New Campaign"}
          </h1>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              void saveCampaign({
                source: "manual",
                requireValidation: false,
              })
            }
            disabled={
              savedCampaignId
                ? !hasUnsavedChanges || !canAutoSave || saving || generating || activating
                : !canCreateDraft || saving || generating || activating
            }
            className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-150 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Saving…" : savedCampaignId ? "Save" : "Create"}
          </button>

          {savedCampaignId ? (
            <>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                campaignStatus === "active" ? "bg-success/10 text-success" :
                campaignStatus === "disabled" ? "bg-warning/10 text-warning" :
                "bg-muted text-muted-foreground"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${
                  campaignStatus === "active" ? "bg-success" :
                  campaignStatus === "disabled" ? "bg-warning" :
                  "bg-muted-foreground"
                }`} />
                {campaignStatus === "active" ? "Active" : campaignStatus === "disabled" ? "Disabled" : "Draft"}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={campaignStatus === "active"}
                aria-label="Toggle campaign status"
                onClick={handleToggleStatus}
                disabled={activating || saving || generating}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  campaignStatus === "active" ? "bg-success" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-150 ${
                    campaignStatus === "active" ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="space-y-8">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card text-card-foreground">
          <h2 className="mb-4 text-base font-semibold text-foreground">Basic Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="campaign-name" className="mb-1.5 block text-sm font-medium text-card-foreground">
                Campaign Name <span className="text-error">*</span>
              </label>
              <input
                id="campaign-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((p) => ({ ...p, name: "" }));
                }}
                placeholder={"e.g. Summer Sale 2026\u2026"}
                className={`w-full rounded-xl border px-3.5 py-2 text-sm shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  errors.name ? "border-error/50" : "border-input"
                }`}
              />
              {errors.name && <p className="mt-1 text-xs text-error">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="ad-count" className="mb-1.5 block text-sm font-medium text-card-foreground">
                Number of Ads <span className="text-error">*</span>
              </label>
              <input
                id="ad-count"
                type="number"
                min={1}
                value={adCount}
                onChange={(e) => handleAdCountChange(parseInt(e.target.value) || 1)}
                className={`w-full rounded-xl border px-3.5 py-2 text-sm shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  errors.adCount ? "border-error/50" : "border-input"
                }`}
              />
              {errors.adCount && <p className="mt-1 text-xs text-error">{errors.adCount}</p>}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-card text-card-foreground">
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <h2 className="mb-1 text-base font-semibold text-foreground">Select Products <span className="text-error">*</span></h2>
              <p className="text-sm text-muted-foreground">Choose the products to feature in this campaign.</p>
            </div>
            <span className="text-xs text-muted-foreground">
              {selectedProductIds.length}/{adCount} selected
            </span>
          </div>
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
                  const atLimit = !isSelected && selectedProductIds.length >= adCount;
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => toggleProduct(product.id)}
                      disabled={atLimit}
                      className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition-all duration-150 ${
                        isSelected
                          ? "border-primary bg-primary/8 shadow-[0_0_0_1px_rgba(91,91,214,0.15)]"
                          : atLimit
                            ? "cursor-not-allowed border-border bg-muted/50 opacity-40"
                            : "border-border bg-card text-card-foreground hover:border-muted-foreground/30 hover:shadow-card"
                      }`}
                    >
                      <div 
                        className="relative h-12 w-12 shrink-0 cursor-zoom-in overflow-hidden rounded-lg bg-muted transition-transform hover:scale-105"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImageUrl(product.imageUrl1);
                        }}
                      >
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

        <section className="rounded-2xl border border-border bg-card p-6 shadow-card text-card-foreground">
          <h2 className="mb-4 text-base font-semibold text-foreground">Targeting</h2>

          <div className="space-y-5">
            {/* Store Categories */}
            <div>
              <p className="mb-2 text-sm font-medium text-card-foreground">Store Categories</p>
              <TogglePills options={STORE_CATEGORIES} selected={storeCategories} onChange={setStoreCategories} label="Store Categories" />
            </div>

            {/* Product Tags */}
            <div>
              <p className="mb-2 text-sm font-medium text-card-foreground">Product Tags</p>
              {selectedProductIds.length === 0 ? (
                <p className="text-sm text-muted-foreground">Select products above to see their tags here.</p>
              ) : (
                <div className="space-y-2">
                  {productTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {productTags.map((tag) => {
                        const isCustom = customTags.includes(tag);
                        return (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 rounded-xl border border-primary bg-primary/10 px-3.5 py-1.5 text-sm font-medium text-primary"
                          >
                            {tag}
                            {isCustom && (
                              <button
                                type="button"
                                onClick={() => removeCustomTag(tag)}
                                aria-label={`Remove tag ${tag}`}
                                className="ml-0.5 rounded-full hover:text-primary/70 transition-colors"
                              >
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <input
                    type="text"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={handleCustomTagKeyDown}
                    placeholder="Add custom targeting tag..."
                    autoComplete="off"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
              )}
            </div>

            {/* Age Range */}
            <div>
              <p className="mb-2 text-sm font-medium text-card-foreground">Age Range</p>
              <div className="flex items-center gap-2">
                <label htmlFor="age-min" className="sr-only">Minimum age</label>
                <input
                  id="age-min"
                  type="number"
                  min={0}
                  max={120}
                  placeholder="Min"
                  value={ageMin}
                  autoComplete="off"
                  onChange={(e) => setAgeMin(e.target.value)}
                  className="w-24 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                <span className="text-muted-foreground" aria-hidden="true">—</span>
                <label htmlFor="age-max" className="sr-only">Maximum age</label>
                <input
                  id="age-max"
                  type="number"
                  min={0}
                  max={120}
                  placeholder="Max"
                  value={ageMax}
                  autoComplete="off"
                  onChange={(e) => setAgeMax(e.target.value)}
                  className="w-24 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <p className="mb-2 text-sm font-medium text-card-foreground">Gender</p>
              <TogglePills options={GENDER_OPTIONS} selected={gender} onChange={setGender} label="Gender" />
            </div>

            {/* Income Level */}
            <div>
              <p className="mb-2 text-sm font-medium text-card-foreground">Income Level</p>
              <TogglePills options={INCOME_LEVELS} selected={incomeLevel} onChange={setIncomeLevel} label="Income Level" />
            </div>

            {/* Shopping Behavior */}
            <div>
              <p className="mb-2 text-sm font-medium text-card-foreground">Shopping Behavior</p>
              <TogglePills options={SHOPPING_BEHAVIORS} selected={shoppingBehavior} onChange={setShoppingBehavior} label="Shopping Behavior" />
            </div>

            {/* Day of Week */}
            <div>
              <div className="mb-2 flex items-center gap-3">
                <p className="text-sm font-medium text-card-foreground">Day of Week</p>
                <button
                  type="button"
                  onClick={() => setTargetDays(ALL_DAY_VALUES)}
                  className="text-xs text-primary hover:underline"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setTargetDays([])}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Deselect All
                </button>
              </div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Day of Week">
                {DAYS_OF_WEEK.map(({ value, label }) => {
                  const isActive = targetDays.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() =>
                        setTargetDays((prev) =>
                          prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]
                        )
                      }
                      className={`rounded-xl border px-3.5 py-1.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        isActive
                          ? "border-primary bg-primary/10 text-primary shadow-[0_0_0_1px_rgba(91,91,214,0.15)]"
                          : "border-border bg-card text-muted-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-muted-foreground/30 hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time of Day */}
            <div>
              <p className="mb-2 text-sm font-medium text-card-foreground">Time of Day</p>
              <MutualExclusionPills
                options={TIME_OF_DAY_OPTIONS}
                selected={timeOfDay}
                onChange={setTimeOfDay}
                exclusiveOption="All Day"
                label="Time of Day"
              />
            </div>

            {/* Weather Conditions */}
            <div>
              <p className="mb-2 text-sm font-medium text-card-foreground">Weather Conditions</p>
              <MutualExclusionPills
                options={WEATHER_OPTIONS}
                selected={weather}
                onChange={setWeather}
                exclusiveOption="Any"
                label="Weather Conditions"
              />
            </div>

            {/* Location Targeting */}
            <div>
              <p className="mb-2 text-sm font-medium text-card-foreground">Location Targeting</p>
              <LocationTargeting locations={targetLocations} onChange={setTargetLocations} />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-card text-card-foreground">
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <h2 className="mb-1 text-base font-semibold text-foreground">Ad Text</h2>
              <p className="text-sm text-muted-foreground">Text to overlay on each generated ad image (e.g. &ldquo;50% OFF&rdquo;, &ldquo;New Arrival&rdquo;).</p>
            </div>
            <span className="text-xs text-muted-foreground">
              {activeAdTextCount}/{adCount} active
            </span>
          </div>
          {errors.adTexts && <p className="mb-3 text-xs text-error">{errors.adTexts}</p>}

          {selectedProductIds.length === 0 ? (
            <p className="text-sm text-muted-foreground">Select products above to add ad text.</p>
          ) : (
            <div className="space-y-5">
              {selectedProductIds.map((productId) => {
                const product = allProducts.find((p) => p.id === productId);
                if (!product) return null;
                const productEntries = adTexts.filter((t) => t.productId === productId);
                const hasActiveTextEntry = productEntries.some(
                  (entry) => entry.isEnabled && entry.text.trim() !== ""
                );
                return (
                  <div key={productId} className="rounded-xl border border-border bg-background p-4">
                    {/* Product header */}
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                          <Image
                            src={product.imageUrl1}
                            alt={product.name}
                            fill
                            sizes="32px"
                            loader={passthroughImageLoader}
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                        <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addAdText(productId)}
                        className="shrink-0 flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Add Text
                      </button>
                    </div>

                    {!hasActiveTextEntry && (
                      <div className="mb-3 rounded-lg border border-warning/20 bg-warning/10 px-3 py-2 text-xs text-warning">
                        No text entries. This product won&apos;t generate any ads.
                      </div>
                    )}

                    {/* Text entries */}
                    {productEntries.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Click &ldquo;Add Text&rdquo; to add one.</p>
                    ) : (
                      <div className="space-y-2">
                        {productEntries.map((entry) => {
                          const exceedsLimit = !entry.isEnabled && entry.text.trim() !== "";
                          return (
                            <div
                              key={entry.id}
                              className={`flex items-center gap-2 ${!entry.isEnabled ? "opacity-50" : ""}`}
                            >
                              <input
                                type="text"
                                value={entry.text}
                                onChange={(e) => updateAdText(entry.id, e.target.value)}
                                placeholder="e.g. 50% OFF, New Arrival, Summer Collection 2026"
                                autoComplete="off"
                                className="flex-1 rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                              />
                              {exceedsLimit && (
                                <span className="shrink-0 whitespace-nowrap rounded bg-warning/10 px-2 py-0.5 text-xs text-warning">
                                  Exceeds ad limit
                                </span>
                              )}
                              {/* Enable/disable toggle */}
                              <button
                                type="button"
                                role="switch"
                                aria-checked={entry.isEnabled}
                                aria-label={entry.isEnabled ? "Disable this entry" : "Enable this entry"}
                                onClick={() => toggleAdText(entry.id)}
                                className={`relative shrink-0 inline-flex h-5 w-9 items-center rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                                  entry.isEnabled ? "bg-primary" : "bg-muted"
                                }`}
                              >
                                <span
                                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-150 ${
                                    entry.isEnabled ? "translate-x-4" : "translate-x-0.5"
                                  }`}
                                />
                              </button>
                              {/* Remove button */}
                              <button
                                type="button"
                                onClick={() => removeAdText(entry.id)}
                                aria-label="Remove this entry"
                                className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-error/10 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                              >
                                <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-card text-card-foreground">
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <h2 className="mb-1 text-base font-semibold text-foreground">
                Style Selection <span className="text-error">*</span>
              </h2>
              <p className="text-sm text-muted-foreground">
                Choose one or more visual styles for your ad images.
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {totalStyleSelections}/{adCount} selected
            </span>
          </div>
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
                  <StyleCard
                    key={style.id}
                    style={style}
                    selected={isSelected}
                    onSelect={() => toggleStyle(style.id)}
                    selectFromHeader
                    onPreview={() => setPreviewStyle(style)}
                    previewTrigger="preview-pane"
                    showCheckbox
                  />
                );
              })}
            </div>
          )}

          <div className="mt-6 border-t border-border/50 pt-6">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground">
                Or upload a reference image
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                One-off style references are used only for this campaign and
                count toward the same style limit.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_1fr]">
              <div>
                <ImageDropzone
                  key={uploadedStyleReferences.length}
                  imageUrl={null}
                  onImageUploaded={addUploadedStyleReference}
                  aspectRatioClassName="aspect-[4/3]"
                  previewAlt="Uploaded style reference"
                />
              </div>

              {uploadedStyleReferences.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {uploadedStyleReferences.map((style, index) => (
                    <div
                      key={style.id}
                      className="group relative aspect-16/10 w-full overflow-hidden rounded-2xl border border-border bg-muted shadow-card"
                    >
                      <button
                        type="button"
                        onClick={() => setPreviewImageUrl(style.uploadedImageUrl)}
                        className="relative block h-full w-full cursor-pointer"
                      >
                        <Image
                          src={style.uploadedImageUrl}
                          alt={`Uploaded reference ${index + 1}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 320px"
                          loader={passthroughImageLoader}
                          unoptimized
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-4 text-left">
                          <p className="text-base font-semibold text-white">
                            Uploaded Reference {index + 1}
                          </p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeUploadedStyleReference(style.id)}
                        aria-label={`Remove uploaded reference ${index + 1}`}
                        className="absolute right-2 top-2 rounded-md bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      >
                        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 text-center text-sm text-muted-foreground">
                  Uploaded references will appear here and be included in style
                  validation and generation.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-card text-card-foreground">
          <div className="mb-6 flex flex-col gap-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Generate & Review</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Autosave keeps this draft updated. Generate ads from the latest saved state.
              </p>
            </div>

            <div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating || saving || !canGenerate}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all duration-150 hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100"
              >
                {generating ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating {generateDone}/{generateTotal}...
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
              {!canGenerate && !generating && generateHint && (
                <p className="mt-2 text-xs text-muted-foreground">{generateHint}</p>
              )}
            </div>
          </div>

          {/* Progress indicator during SSE generation */}
          {generating && generateTotal > 0 && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/8 px-4 py-3">
              <svg className="h-5 w-5 shrink-0 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-sm text-primary">
                Generating {generateDone}/{generateTotal} images...
              </p>
            </div>
          )}

          {/* Polling fallback progress for old-style pending images */}
          {!generating && pendingImages.length > 0 && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/8 px-4 py-3">
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

          {generatedImages.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-sm font-medium text-card-foreground">
                {completedImages.length} image{completedImages.length !== 1 && "s"} ready
                {pendingImages.length > 0 && `, ${pendingImages.length} generating`}
                {failedImages.length > 0 && `, ${failedImages.length} failed`}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {generatedImages.map((img) => (
                  <div key={img.id} className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted shadow-card">
                    {img.status === "completed" ? (
                      <>
                        <div 
                          className="relative h-full w-full cursor-pointer overflow-hidden rounded-lg"
                          onClick={() => setPreviewImageUrl(img.imageUrl)}
                        >
                          <Image
                            src={img.imageUrl}
                            alt="Generated ad"
                            fill
                            sizes="(min-width: 640px) 33vw, 50vw"
                            loader={passthroughImageLoader}
                            unoptimized
                            className="object-cover transition-transform duration-300 hover:scale-105"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(img.id)}
                          aria-label="Delete image"
                          className="absolute right-2 top-2 rounded-md bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </>
                    ) : img.status === "pending" ? (
                      <div className="flex h-full items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                          <svg className="h-6 w-6 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span className="text-xs text-muted-foreground">Generating...</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex h-full items-center justify-center">
                          <div className="flex flex-col items-center gap-2">
                            <svg className="h-6 w-6 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                            </svg>
                            <span className="text-xs text-muted-foreground">Failed</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(img.id)}
                          aria-label="Delete image"
                          className="absolute right-2 top-2 rounded-md bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </section>
      </div>
      <StylePreviewModal
        style={previewStyle}
        onClose={() => setPreviewStyle(null)}
      />

      <ImagePreviewModal 
        imageUrl={previewImageUrl} 
        onClose={() => setPreviewImageUrl(null)} 
      />
    </div>
  );
}

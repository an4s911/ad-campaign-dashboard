"use client";

import { useState, useEffect, useEffectEvent, useRef, KeyboardEvent } from "react";

interface Tag {
  name: string;
  selected: boolean;
}

interface TagSectionProps {
  imageUrls: Array<string | null | undefined>;
  onTagsChange: (tags: string[]) => void;
  initialTags?: string[];
}

export default function TagSection({ imageUrls, onTagsChange, initialTags = [] }: TagSectionProps) {
  const [tags, setTags] = useState<Tag[]>(() => initialTags.map((t) => ({ name: t, selected: true })));
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [customTag, setCustomTag] = useState("");
  const hasInitialTags = initialTags.length > 0;
  const initialTagsKey = initialTags.map((tag) => tag.trim().toLowerCase()).filter(Boolean).join("|");
  const activeImageUrls = imageUrls.filter((url): url is string => Boolean(url));
  const activeImageUrlsKey = activeImageUrls.join("|");
  const lastSuggestedKeyRef = useRef<string | null>(null);
  const analyzedImageUrlsRef = useRef<Set<string>>(new Set());
  const skippedInitialImagesRef = useRef(false);

  useEffect(() => {
    if (!hasInitialTags) return;

    setTags((prev) => {
      if (prev.length > 0) return prev;
      return initialTags.map((tag) => ({ name: tag, selected: true }));
    });
  }, [hasInitialTags, initialTags]);

  const reportTagsChange = useEffectEvent((nextTags: Tag[]) => {
    onTagsChange(nextTags.filter((tag) => tag.selected).map((tag) => tag.name));
  });

  async function fetchSuggestions(currentTags: string[]) {
    setSuggesting(true);
    try {
      const res = await fetch("/api/suggest-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentTags }),
      });
      if (res.ok) {
        const data = await res.json();
        const existingNames = new Set(currentTags);
        setSuggestions(data.tags.filter((suggestion: string) => !existingNames.has(suggestion)));
      }
    } catch (err) {
      console.error("Failed to fetch suggestions", err);
    } finally {
      setSuggesting(false);
    }
  }

  const fetchSuggestionsRef = useRef(fetchSuggestions);
  fetchSuggestionsRef.current = fetchSuggestions;

  function requestSuggestionsOnce(currentTags: string[]) {
    const normalizedTags = currentTags.map((tag) => tag.trim().toLowerCase()).filter(Boolean);
    const currentKey = normalizedTags.join("|");

    if (!currentKey) {
      setSuggestions([]);
      return;
    }

    if (lastSuggestedKeyRef.current === currentKey) {
      return;
    }

    lastSuggestedKeyRef.current = currentKey;
    void fetchSuggestionsRef.current(normalizedTags);
  }

  const analyzeImage = useEffectEvent(async (url: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      });
      if (res.ok) {
        const data = await res.json();
        const newTags = data.tags.map((name: string) => ({ name, selected: true }));
        let mergedTagNames: string[] = [];

        setTags((prev) => {
          const existingNames = new Set(prev.map((tag) => tag.name));
          const merged = [...prev];
          newTags.forEach((nt: Tag) => {
            if (!existingNames.has(nt.name)) {
              merged.push(nt);
            }
          });
          mergedTagNames = merged.filter((tag) => tag.selected).map((tag) => tag.name);
          return merged;
        });

        requestSuggestionsOnce(mergedTagNames);
      }
    } catch (err) {
      console.error("Failed to analyze image", err);
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    const currentImageUrls = activeImageUrlsKey ? activeImageUrlsKey.split("|") : [];

    if (currentImageUrls.length === 0) {
      analyzedImageUrlsRef.current.clear();
      skippedInitialImagesRef.current = false;
      return;
    }

    if (hasInitialTags && !skippedInitialImagesRef.current) {
      currentImageUrls.forEach((url) => analyzedImageUrlsRef.current.add(url));
      skippedInitialImagesRef.current = true;
      return;
    }

    currentImageUrls.forEach((url) => {
      if (analyzedImageUrlsRef.current.has(url)) {
        return;
      }

      analyzedImageUrlsRef.current.add(url);
      analyzeImage(url);
    });
  }, [activeImageUrlsKey, hasInitialTags]);

  // Report selected tags to parent
  useEffect(() => {
    reportTagsChange(tags);
  }, [tags]);

  useEffect(() => {
    if (!hasInitialTags || !initialTagsKey || lastSuggestedKeyRef.current === initialTagsKey) {
      return;
    }

    lastSuggestedKeyRef.current = initialTagsKey;
    void fetchSuggestionsRef.current(initialTagsKey.split("|"));
  }, [hasInitialTags, initialTagsKey]);

  function toggleTag(name: string) {
    setTags(prev => prev.map(t => t.name === name ? { ...t, selected: !t.selected } : t));
  }

  function addCustomTag(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && customTag.trim()) {
      e.preventDefault();
      const name = customTag.trim().toLowerCase();
      if (!tags.find(t => t.name === name)) {
        setTags(prev => [...prev, { name, selected: true }]);
      }
      setCustomTag("");
    }
  }

  function addSuggestion(name: string) {
    if (!tags.find(t => t.name === name)) {
      setTags(prev => [...prev, { name, selected: true }]);
    }
    setSuggestions(prev => prev.filter(s => s !== name));
  }

  if (activeImageUrls.length === 0 && tags.length === 0) return null;

  return (
    <div className="mt-3 space-y-3">
      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
          <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Analyzing image...
        </div>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <button
              key={tag.name}
              type="button"
              onClick={() => toggleTag(tag.name)}
              className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                tag.selected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground border border-border"
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      <input
        type="text"
        value={customTag}
        onChange={e => setCustomTag(e.target.value)}
        onKeyDown={addCustomTag}
        placeholder="Add custom tag..."
        className="w-full bg-background border border-input rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
      />

      {(suggesting || suggestions.length > 0) && (
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Suggested tags</label>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map(suggestion => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addSuggestion(suggestion)}
                className="px-2 py-0.5 rounded-full text-xs font-medium border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                + {suggestion}
              </button>
            ))}
            {suggesting && (
              <div className="flex items-center h-5">
                <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s] mx-0.5" />
                <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

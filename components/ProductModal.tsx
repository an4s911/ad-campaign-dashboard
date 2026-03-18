"use client";

import { useState, FormEvent, useEffect } from "react";
import ImageUpload from "@/components/ImageUpload";

interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl1: string;
  imageUrl2: string | null;
  isEnabled: boolean;
  createdAt: string;
}

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onSaved: (product: Product) => void;
}

export default function ProductModal({ product, onClose, onSaved }: ProductModalProps) {
  const isEditing = !!product;
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [imageUrl1, setImageUrl1] = useState<string | null>(product?.imageUrl1 ?? null);
  const [imageUrl2, setImageUrl2] = useState<string | null>(product?.imageUrl2 ?? null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

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
      const body = {
        name: name.trim(),
        description: description.trim(),
        imageUrl1,
        imageUrl2,
      };

      const url = isEditing ? `/api/products/${product.id}` : "/api/products";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const saved = await res.json();
        onSaved(saved);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {isEditing ? "Edit Product" : "Add Product"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
              }}
              placeholder="Product name"
              className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? "border-red-300 bg-red-50/50" : "border-gray-300"
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: "" }));
              }}
              placeholder="Product description"
              rows={3}
              className={`w-full resize-none rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? "border-red-300 bg-red-50/50" : "border-gray-300"
              }`}
            />
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
          </div>

          {/* Images */}
          <div className="grid grid-cols-2 gap-4">
            <ImageUpload
              label="Image 1"
              value={imageUrl1}
              required
              onChange={(url) => {
                setImageUrl1(url);
                if (errors.imageUrl1) setErrors((prev) => ({ ...prev, imageUrl1: "" }));
              }}
              error={errors.imageUrl1}
            />
            <ImageUpload
              label="Image 2"
              value={imageUrl2}
              onChange={setImageUrl2}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
            >
              {submitting
                ? "Saving..."
                : isEditing
                  ? "Update Product"
                  : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

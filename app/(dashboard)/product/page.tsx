"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ImagePreviewModal from "@/components/ui/ImagePreviewModal";

interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl1: string;
  imageUrl2: string | null;
  isEnabled: boolean;
  createdAt: string;
}

const passthroughImageLoader = ({ src }: { src: string }) => src;

export default function ProductPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  function showToast(message: string, type: "error" | "success") {
    setToast({ message, type });
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
    setTimeout(() => setToast(null), 3400);
  }

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) setProducts(await res.json());
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  async function handleToggleEnabled(e: React.MouseEvent, product: Product) {
    e.preventDefault();
    e.stopPropagation();
    const newEnabled = !product.isEnabled;
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, isEnabled: newEnabled } : p)));
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: newEnabled }),
      });
      if (!res.ok) {
        setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, isEnabled: !newEnabled } : p)));
        showToast("Failed to update status", "error");
      }
    } catch {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, isEnabled: !newEnabled } : p)));
      showToast("Failed to update status", "error");
    }
  }

  async function handleDelete(e: React.MouseEvent, product: Product) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
        showToast("Product deleted", "success");
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to delete product", "error");
      }
    } catch {
      showToast("Failed to delete product", "error");
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8 flex items-center justify-between">
          <div className="h-8 w-32 shimmer rounded-lg" />
          <div className="h-10 w-36 shimmer rounded-xl" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-18 shimmer rounded-xl" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Toast */}
      <div
        aria-live="polite"
        className={`fixed right-6 top-6 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
          toastVisible ? "toast-enter" : toast ? "toast-exit" : "pointer-events-none opacity-0"
        } ${toast?.type === "error" ? "bg-error text-error-foreground" : "bg-success text-success-foreground"}`}
      >
        {toast?.message}
      </div>

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">{products.length} product{products.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/product/new"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all duration-150 hover:brightness-110"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 shadow-card">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <svg aria-hidden="true" className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
          </div>
          <h3 className="mb-1 text-base font-semibold text-foreground">No products yet</h3>
          <p className="mb-5 text-sm text-muted-foreground">Add your first product to get started.</p>
          <Link
            href="/product/new"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-all duration-150 hover:brightness-110"
          >
            Add First Product
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="grid grid-cols-[48px_1fr_1.5fr_100px_120px] items-center gap-4 border-b border-border px-5 py-3 text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
              <span aria-label="Image" />
              <span>Name</span>
              <span>Description</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>
            <div className="stagger-children divide-y divide-border/60">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="grid grid-cols-[48px_1fr_1.5fr_100px_120px] items-center gap-4 px-5 py-3 transition-colors duration-150 hover:bg-muted/50"
                >
                  <button
                    type="button"
                    aria-label={`Preview ${product.name}`}
                    className="relative h-10 w-10 shrink-0 cursor-zoom-in overflow-hidden rounded-xl bg-muted transition-transform duration-150 hover:scale-105"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setPreviewImageUrl(product.imageUrl1);
                    }}
                  >
                    <Image
                      src={product.imageUrl1}
                      alt={product.name}
                      fill
                      sizes="40px"
                      loader={passthroughImageLoader}
                      unoptimized
                      className="object-cover"
                    />
                  </button>
                  <span className="truncate text-sm font-medium text-foreground">{product.name}</span>
                  <span className="truncate text-sm text-muted-foreground">
                    {product.description.length > 60 ? product.description.slice(0, 60) + "\u2026" : product.description}
                  </span>
                  <span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      product.isEnabled ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${product.isEnabled ? "bg-success" : "bg-muted-foreground"}`} aria-hidden="true" />
                      {product.isEnabled ? "Active" : "Disabled"}
                    </span>
                  </span>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => handleToggleEnabled(e, product)}
                      aria-label={product.isEnabled ? `Disable ${product.name}` : `Enable ${product.name}`}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {product.isEnabled ? (
                        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, product)}
                      aria-label={`Delete ${product.name}`}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors duration-150 hover:bg-error/8 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3 stagger-children">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="flex gap-3.5 rounded-2xl border border-border bg-card p-3.5 shadow-card transition-all duration-150 active:scale-[0.99]"
              >
                <button
                  type="button"
                  aria-label={`Preview ${product.name}`}
                  className="relative h-16 w-16 shrink-0 cursor-zoom-in overflow-hidden rounded-xl bg-muted"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPreviewImageUrl(product.imageUrl1);
                  }}
                >
                  <Image
                    src={product.imageUrl1}
                    alt={product.name}
                    fill
                    sizes="64px"
                    loader={passthroughImageLoader}
                    unoptimized
                    className="object-cover"
                  />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      product.isEnabled ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    }`}>
                      {product.isEnabled ? "Active" : "Off"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                  <div className="mt-2 flex gap-1">
                    <button
                      onClick={(e) => handleToggleEnabled(e, product)}
                      aria-label={product.isEnabled ? "Disable" : "Enable"}
                      className="rounded-lg p-1 text-muted-foreground active:bg-muted"
                    >
                      <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        {product.isEnabled ? (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                        ) : (
                          <>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </>
                        )}
                      </svg>
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, product)}
                      aria-label="Delete"
                      className="rounded-lg p-1 text-muted-foreground active:bg-error/10 active:text-error"
                    >
                      <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
      <ImagePreviewModal imageUrl={previewImageUrl} onClose={() => setPreviewImageUrl(null)} />
    </div>
  );
}

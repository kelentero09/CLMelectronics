"use client";

import { useState } from "react";
import Image from "next/image";
import { ProductImagePlaceholder } from "@/components/storefront/product-card";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  productName,
  referenceCode,
}: {
  images: { url: string; alt: string | null }[];
  productName: string;
  referenceCode: string;
}) {
  const [active, setActive] = useState(0);
  if (images.length === 0) {
    return (
      <div className="aspect-[4/3] overflow-hidden rounded-lg border border-slate-200">
        <ProductImagePlaceholder referenceCode={referenceCode} />
      </div>
    );
  }
  const current = images[Math.min(active, images.length - 1)];
  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-white">
        <Image
          src={current.url}
          alt={current.alt || productName}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
          className="object-contain"
        />
      </div>
      {images.length > 1 && (
        <div className="mt-2 grid grid-cols-5 gap-2" role="listbox" aria-label="Product images">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              role="option"
              aria-selected={i === active}
              aria-label={`View image ${i + 1}`}
              onClick={() => setActive(i)}
              className={cn(
                "aspect-[4/3] overflow-hidden rounded border bg-white",
                i === active ? "border-steel-500 ring-2 ring-steel-500/30" : "border-slate-200 hover:border-slate-400"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" loading="lazy" className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

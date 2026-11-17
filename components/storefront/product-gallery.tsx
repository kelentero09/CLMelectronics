"use client";

import { useCallback, useEffect, useRef, useState, ViewTransition } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { ProductImagePlaceholder } from "@/components/storefront/product-card";
import { cn } from "@/lib/utils";
import { isMediaUrl } from "@/lib/media";

export function ProductGallery({
  productId,
  images,
  productName,
  referenceCode,
}: {
  productId: string;
  images: { url: string; alt: string | null }[];
  productName: string;
  referenceCode: string;
}) {
  const [active, setActive] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const count = images.length;

  const go = useCallback(
    (delta: number) => setActive((i) => (count ? (i + delta + count) % count : 0)),
    [count]
  );

  if (count === 0) {
    return (
      <ViewTransition name={`product-${productId}`} share="morph" default="none">
        <div className="aspect-[4/3] overflow-hidden rounded-lg border border-slate-200">
          <ProductImagePlaceholder referenceCode={referenceCode} />
        </div>
      </ViewTransition>
    );
  }

  const current = images[Math.min(active, count - 1)];
  return (
    <div>
      <ViewTransition name={`product-${productId}`} share="morph" default="none">
        <div className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => setZoomOpen(true)}
            className="absolute inset-0 cursor-zoom-in"
            aria-label={`Enlarge image ${active + 1} of ${count}`}
          >
            <Image
              key={current.url}
              src={current.url} unoptimized={isMediaUrl(current.url)}
              alt={current.alt || productName}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
              className="animate-fade-in object-contain"
            />
          </button>
          <span className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/55 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <Maximize2 className="h-3 w-3" aria-hidden /> Click to zoom
          </span>
          {count > 1 && (
            <>
              <GalleryArrow side="left" onClick={() => go(-1)} />
              <GalleryArrow side="right" onClick={() => go(1)} />
            </>
          )}
        </div>
      </ViewTransition>
      {count > 1 && (
        <div className="mt-2 grid grid-cols-5 gap-2" role="listbox" aria-label="Product images">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              role="option"
              aria-selected={i === active}
              aria-label={`View image ${i + 1}`}
              onClick={() => setActive(i)}
              className={cn(
                "relative aspect-[4/3] overflow-hidden rounded border bg-white transition-[border-color,box-shadow] duration-150",
                i === active ? "border-steel-500 ring-2 ring-steel-500/30" : "border-slate-200 hover:border-slate-400"
              )}
            >
              <Image src={img.url} unoptimized={isMediaUrl(img.url)} alt="" fill sizes="120px" className="object-contain" />
            </button>
          ))}
        </div>
      )}
      {zoomOpen && (
        <Lightbox
          images={images}
          index={active}
          productName={productName}
          onIndex={setActive}
          onClose={() => setZoomOpen(false)}
        />
      )}
    </div>
  );
}

function GalleryArrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous image" : "Next image"}
      className={cn(
        "absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-1.5 text-navy-900 shadow transition-opacity duration-200 hover:bg-white sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100",
        side === "left" ? "left-2" : "right-2"
      )}
    >
      <Icon className="h-5 w-5" aria-hidden />
    </button>
  );
}

function Lightbox({
  images,
  index,
  productName,
  onIndex,
  onClose,
}: {
  images: { url: string; alt: string | null }[];
  index: number;
  productName: string;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const count = images.length;
  const img = images[index];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") onIndex((index - 1 + count) % count);
      if (e.key === "ArrowRight") onIndex((index + 1) % count);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, count, onIndex]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && dialogRef.current?.close()}
      aria-label={`${productName} images`}
      className="m-auto h-[90vh] w-[94vw] max-w-6xl animate-fade-in bg-transparent p-0 backdrop:bg-navy-950/85 backdrop:backdrop-blur-sm"
    >
      <div className="relative h-full w-full" onClick={(e) => e.target === e.currentTarget && dialogRef.current?.close()}>
        <Image
          key={img.url}
          src={img.url} unoptimized={isMediaUrl(img.url)}
          alt={img.alt || productName}
          fill
          sizes="94vw"
          className="animate-fade-in object-contain"
        />
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-navy-900 shadow hover:bg-white"
          aria-label="Close"
          autoFocus
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => onIndex((index - 1 + count) % count)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-navy-900 shadow hover:bg-white"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => onIndex((index + 1) % count)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-navy-900 shadow hover:bg-white"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" aria-hidden />
            </button>
            <p className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded bg-black/60 px-3 py-1 text-xs font-medium text-white tabular-nums">
              {index + 1} / {count}
            </p>
          </>
        )}
      </div>
    </dialog>
  );
}

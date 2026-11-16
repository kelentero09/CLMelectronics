import { ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/card";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AVAILABILITY_LABELS, CONDITION_LABELS } from "@/lib/catalog";
import { CompareCheckbox } from "./compare-checkbox";

export type CardProduct = {
  id: string;
  name: string;
  slug: string;
  referenceCode: string;
  condition: string | null;
  availability: string;
  manufacturer?: { name: string } | null | string | null;
  category?: { name: string } | null;
  model?: string | null;
  partNumber?: string | null;
  shortDescription?: string | null;
  images: { url: string; alt: string | null }[];
};

function availabilityStyle(availability: string) {
  if (availability === "IN_STOCK") return "bg-emerald-600 text-white border-transparent";
  if (availability === "LOW_STOCK") return "bg-amber-500 text-black border-transparent";
  if (availability === "SOLD") return "bg-zinc-900 text-white border-transparent";
  return "bg-white/90 text-slate-800 border-white/40";
}

export function ProductImagePlaceholder({ referenceCode }: { referenceCode: string }) {
  return (
    <div className="blueprint-grid flex h-full w-full flex-col items-center justify-center gap-1 bg-white p-3 text-center border border-slate-200">
      <p className="text-2xl font-bold tracking-wide text-navy-900">CLM</p>
      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-600 sm:text-[11px]">
        {referenceCode}
      </p>
    </div>
  );
}

/**
 * @param morph Give the image a shared view-transition name so it morphs into the
 *   product detail hero. Enable only where each product appears once per page.
 */
export function ProductCard({ product, morph = false }: { product: CardProduct; morph?: boolean }) {
  const primary = product.images?.[0]?.url || null;
  const manufacturer = typeof product.manufacturer === "string" ? product.manufacturer : product.manufacturer?.name;

  const image = primary ? (
    <Image
      src={primary}
      alt={product.images[0]?.alt || product.name}
      fill
      sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 400px"
      loading="lazy"
      className="object-contain p-2 transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:group-hover:scale-100"
    />
  ) : (
    <ProductImagePlaceholder referenceCode={product.referenceCode} />
  );

  return (
    <Card className="group relative flex flex-col overflow-hidden rounded-2xl transition-[box-shadow,transform,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-steel-500/30 hover:shadow-xl hover:shadow-navy-900/5 motion-reduce:hover:translate-y-0">
      <div className="relative aspect-[4/3] overflow-hidden border-b border-slate-100 bg-gradient-to-b from-white to-slate-50">
        <Link href={`/products/${product.slug}`} className="block h-full w-full" tabIndex={-1} aria-hidden="true">
          {morph ? (
            <ViewTransition name={`product-${product.id}`} share="morph" default="none">
              <div className="relative h-full w-full">{image}</div>
            </ViewTransition>
          ) : (
            image
          )}
        </Link>
        <div className="absolute left-2 top-2 z-10 flex max-w-[calc(100%-1rem)] flex-wrap gap-1 pointer-events-none">
          <Badge className={cn(availabilityStyle(product.availability))}>
            {AVAILABILITY_LABELS[product.availability] ?? product.availability}
          </Badge>
          {product.condition && (
            <Badge variant="outline" className="border-white/20 bg-black/55 text-white backdrop-blur">
              {CONDITION_LABELS[product.condition] ?? product.condition}
            </Badge>
          )}
        </div>
        <div className="pointer-events-auto absolute right-2 top-2 z-10">
          <CompareCheckbox productId={product.id} productName={product.name} />
        </div>
      </div>
      <CardContent className="flex flex-1 flex-col gap-1.5 p-3.5 sm:p-5">
        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-steel-600 sm:text-[11px]">
          {product.category?.name ?? "Catalog"}
          {product.partNumber ? ` • ${product.partNumber}` : ""}
        </p>
        <Link
          href={`/products/${product.slug}`}
          className="line-clamp-2 min-h-[2.2rem] text-[13px] font-bold leading-snug text-navy-900 transition-colors after:absolute after:inset-0 hover:text-steel-600 sm:min-h-[2.6rem] sm:text-[15px]"
        >
          {product.name}
        </Link>
        {product.shortDescription && (
          <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">{product.shortDescription}</p>
        )}
        <p className="truncate font-mono text-[10px] text-slate-400 sm:text-[11px]">
          {product.referenceCode}
          {product.model ? ` • ${product.model}` : ""}
          {manufacturer ? ` • ${manufacturer}` : ""}
        </p>
        <div className="pointer-events-none mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <span className="text-xs font-semibold text-slate-500">View details</span>
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-white transition-[background-color,transform] duration-200 group-hover:translate-x-0.5 group-hover:bg-steel-500"
          >
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

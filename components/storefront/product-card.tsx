import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/card";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AVAILABILITY_LABELS, CONDITION_LABELS } from "@/lib/catalog";

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
    <div className="blueprint-grid flex h-full w-full flex-col items-center justify-center gap-1 bg-navy-900 p-3 text-center">
      <p className="text-2xl font-bold tracking-wide text-white">CLM</p>
      <p className="font-mono text-[10px] uppercase tracking-widest text-accent-400 sm:text-[11px]">
        {referenceCode}
      </p>
    </div>
  );
}

export function ProductCard({ product }: { product: CardProduct }) {
  const primary = product.images?.[0]?.url || null;
  const manufacturer = typeof product.manufacturer === "string" ? product.manufacturer : product.manufacturer?.name;

  return (
    <Card className="group flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <Link href={`/products/${product.slug}`} className="block" aria-label={`View ${product.name}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-navy-900">
          {primary ? (
            <Image
              src={primary}
              alt={product.images[0]?.alt || product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 400px"
              loading="lazy"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <ProductImagePlaceholder referenceCode={product.referenceCode} />
          )}
          <div className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] flex-wrap gap-1">
            <Badge className={cn(availabilityStyle(product.availability))}>
              {AVAILABILITY_LABELS[product.availability] ?? product.availability}
            </Badge>
            {product.condition && (
              <Badge variant="outline" className="border-white/20 bg-black/55 text-white backdrop-blur">
                {CONDITION_LABELS[product.condition] ?? product.condition}
              </Badge>
            )}
          </div>
        </div>
      </Link>
      <CardContent className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-steel-600 sm:text-[11px]">
          {product.category?.name ?? "Catalog"}
          {product.partNumber ? ` • ${product.partNumber}` : ""}
        </p>
        <Link
          href={`/products/${product.slug}`}
          className="line-clamp-2 min-h-[2.2rem] text-[13px] font-semibold leading-tight hover:text-steel-600 sm:min-h-[2.6rem] sm:text-sm"
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
        <div className="mt-auto flex items-center justify-end border-t border-dashed pt-2 sm:pt-3">
          <Link
            href={`/products/${product.slug}`}
            className={buttonVariants({ size: "sm", className: "h-8 gap-1 px-3 text-[11px] font-bold uppercase tracking-wide" })}
          >
            Inquire <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

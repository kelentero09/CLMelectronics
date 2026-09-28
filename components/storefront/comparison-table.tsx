"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, X, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AVAILABILITY_LABELS, CONDITION_LABELS } from "@/lib/catalog";

type Spec = { key: string; value: string };

export type ComparisonProduct = {
  id: string;
  name: string;
  slug: string;
  referenceCode: string;
  model?: string | null;
  partNumber?: string | null;
  manufacturer?: string | null;
  shortDescription?: string | null;
  condition?: string | null;
  availability: string;
  specifications?: Spec[] | null;
  images: { url: string; alt: string | null }[];
};

function availabilityStyle(availability: string) {
  if (availability === "IN_STOCK") return "bg-emerald-600 text-white border-transparent";
  if (availability === "LOW_STOCK") return "bg-amber-500 text-black border-transparent";
  if (availability === "SOLD") return "bg-zinc-900 text-white border-transparent";
  return "bg-white/90 text-slate-800 border-white/40";
}

function getUniqueSpecKeys(products: ComparisonProduct[]): string[] {
  const allKeys = new Set<string>();
  products.forEach(product => {
    const specs = Array.isArray(product.specifications) ? product.specifications : [];
    specs.forEach(spec => allKeys.add(spec.key));
  });
  return Array.from(allKeys).sort();
}

function getValueForSpec(product: ComparisonProduct, key: string): string {
  const specs = Array.isArray(product.specifications) ? product.specifications : [];
  const spec = specs.find(s => s.key === key);
  return spec?.value || "-";
}

function getCellClass(value: string, allValues: string[]): string {
  const uniqueValues = new Set(allValues.filter(v => v !== "-"));
  if (uniqueValues.size <= 1) return "bg-slate-50";
  if (value === "-") return "bg-slate-100 text-slate-400";
  return "bg-amber-50 border-amber-200";
}

export function ComparisonTable({ products, onRemove }: { products: ComparisonProduct[]; onRemove?: (id: string) => void }) {
  const uniqueSpecKeys = getUniqueSpecKeys(products);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert("Comparison link copied to clipboard!");
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-slate-600">No products selected for comparison</p>
        <Link href="/products" className="inline-block mt-4 text-navy-900 hover:underline">
          Browse products to add to comparison
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          <Button onClick={handleShare} variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" /> Share Link
          </Button>
        </div>
        <Link href="/products">
          <Button variant="outline" size="sm" className="gap-2">
            Add More Products <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Product Header Row */}
      <div className="overflow-x-auto">
        <div className="min-w-[300px] sm:min-w-[600px]">
          <div className="grid gap-3 sm:gap-4" style={{ gridTemplateColumns: `repeat(${products.length}, minmax(150px, 1fr))` }}>
            {products.map(product => (
              <div key={product.id} className="relative">
                {onRemove && (
                  <button
                    onClick={() => onRemove(product.id)}
                    className="absolute top-2 right-2 z-10 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                    title={`Remove ${product.name} from comparison`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                
                <div className="border border-slate-200 rounded-lg p-3 sm:p-4 bg-white">
                  <div className="aspect-square sm:aspect-square mb-2 sm:mb-3 relative bg-slate-50 rounded overflow-hidden h-24 sm:h-32">
                    {product.images[0]?.url ? (
                      <Image
                        src={product.images[0].url}
                        alt={product.images[0].alt || product.name}
                        fill
                        className="object-contain"
                        sizes="(max-width: 640px) 30vw, 200px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xl sm:text-2xl font-bold text-navy-900">CLM</span>
                      </div>
                    )}
                  </div>
                  
                  <Link 
                    href={`/products/${product.slug}`}
                    className="font-semibold text-navy-900 hover:text-steel-600 line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] text-xs sm:text-sm"
                  >
                    {product.name}
                  </Link>
                  
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-1 font-mono">{product.referenceCode}</p>
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded ${availabilityStyle(product.availability)}`}>
                      {AVAILABILITY_LABELS[product.availability] ?? product.availability}
                    </span>
                    {product.condition && (
                      <span className="text-[10px] sm:text-xs border border-slate-200 px-2 py-0.5 rounded">
                        {CONDITION_LABELS[product.condition] ?? product.condition}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Specifications Comparison Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <div className="min-w-[300px] sm:min-w-[600px]">
          <table className="w-full border-collapse bg-white text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                <th className="w-32 sm:w-48 px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-navy-900 sticky left-0 bg-slate-100 text-[10px] sm:text-sm">
                  Specification
                </th>
                {products.map(product => (
                  <th key={product.id} className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-navy-900 text-[10px] sm:text-sm">
                    {product.name.substring(0, 12)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Basic Info Row */}
              <tr className="border-b border-slate-100">
                <td className="px-2 sm:px-4 py-1.5 sm:py-2.5 font-semibold text-navy-900 sticky left-0 bg-white text-[10px] sm:text-sm">Reference Code</td>
                {products.map(product => (
                  <td key={product.id} className="px-2 sm:px-4 py-1.5 sm:py-2.5 text-slate-600 font-mono text-[9px] sm:text-xs">
                    {product.referenceCode}
                  </td>
                ))}
              </tr>
              
              {products.some(p => p.manufacturer) && (
                <tr className="border-b border-slate-100">
                  <td className="px-2 sm:px-4 py-1.5 sm:py-2.5 font-semibold text-navy-900 sticky left-0 bg-slate-50 text-[10px] sm:text-sm">Manufacturer</td>
                  {products.map(product => (
                    <td key={product.id} className="px-2 sm:px-4 py-1.5 sm:py-2.5 text-slate-600 text-[10px] sm:text-sm">
                      {product.manufacturer || "-"}
                    </td>
                  ))}
                </tr>
              )}

              {products.some(p => p.model) && (
                <tr className="border-b border-slate-100">
                  <td className="px-2 sm:px-4 py-1.5 sm:py-2.5 font-semibold text-navy-900 sticky left-0 bg-white text-[10px] sm:text-sm">Model</td>
                  {products.map(product => (
                    <td key={product.id} className="px-2 sm:px-4 py-1.5 sm:py-2.5 text-slate-600 text-[10px] sm:text-sm">
                      {product.model || "-"}
                    </td>
                  ))}
                </tr>
              )}

              {products.some(p => p.partNumber) && (
                <tr className="border-b border-slate-100">
                  <td className="px-2 sm:px-4 py-1.5 sm:py-2.5 font-semibold text-navy-900 sticky left-0 bg-slate-50 text-[10px] sm:text-sm">Part Number</td>
                  {products.map(product => (
                    <td key={product.id} className="px-2 sm:px-4 py-1.5 sm:py-2.5 text-slate-600 font-mono text-[9px] sm:text-xs">
                      {product.partNumber || "-"}
                    </td>
                  ))}
                </tr>
              )}

              {/* Dynamic Specifications */}
              {uniqueSpecKeys.map((key, index) => {
                const values = products.map(p => getValueForSpec(p, key));
                return (
                  <tr key={key} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-2 sm:px-4 py-1.5 sm:py-2.5 font-semibold text-navy-900 sticky left-0 bg-inherit text-[10px] sm:text-sm">
                      {key}
                    </td>
                    {products.map(product => {
                      const value = getValueForSpec(product, key);
                      return (
                        <td 
                          key={product.id} 
                          className={`px-2 sm:px-4 py-1.5 sm:py-2.5 text-slate-600 text-[10px] sm:text-sm ${getCellClass(value, values)}`}
                        >
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
"use client";

import { Fragment, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Link2, MessageSquare, Plus, X } from "lucide-react";
import { toast } from "@/components/ui/toaster";
import { AVAILABILITY_LABELS, CONDITION_LABELS } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { isMediaUrl } from "@/lib/media";
import { SpecSheetIconButton } from "@/components/storefront/product-detail/download-spec-sheet";

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
  category?: { name: string } | null;
  specifications?: Spec[] | null;
  images: { url: string; alt: string | null }[];
};

const MAX_COMPARE = 4;
const EMPTY = "—";

type Row = { key: string; label: string; values: string[]; mono?: boolean; differs: boolean };

const norm = (v: string) => v.trim().toLowerCase();

function buildRow(key: string, label: string, values: (string | null | undefined)[], mono = false): Row {
  const vals = values.map((v) => (v && v.trim() ? v.trim() : EMPTY));
  const distinct = new Set(vals.map(norm));
  return { key, label, values: vals, mono, differs: vals.length > 1 && distinct.size > 1 };
}

/** Spec rows in first-seen order; keys matched case-insensitively across products. */
function buildSpecRows(products: ComparisonProduct[]): Row[] {
  const order: string[] = [];
  const labels = new Map<string, string>();
  for (const p of products) {
    for (const s of Array.isArray(p.specifications) ? p.specifications : []) {
      if (!s?.key?.trim()) continue;
      const k = norm(s.key);
      if (!labels.has(k)) {
        labels.set(k, s.key.trim());
        order.push(k);
      }
    }
  }
  return order.map((k) =>
    buildRow(
      `spec:${k}`,
      labels.get(k)!,
      products.map((p) => (Array.isArray(p.specifications) ? p.specifications : []).find((s) => s?.key && norm(s.key) === k)?.value)
    )
  );
}

function availabilityTone(a: string) {
  if (a === "IN_STOCK") return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  if (a === "LOW_STOCK") return "bg-amber-50 text-amber-800 ring-amber-600/20";
  if (a === "SOLD") return "bg-slate-900 text-white ring-slate-900";
  return "bg-slate-100 text-slate-700 ring-slate-300";
}

export function ComparisonTable({ products, onRemove }: { products: ComparisonProduct[]; onRemove?: (id: string) => void }) {
  const [diffOnly, setDiffOnly] = useState(false);

  const overview = useMemo(
    () => [
      buildRow("availability", "Availability", products.map((p) => AVAILABILITY_LABELS[p.availability] ?? p.availability)),
      buildRow("condition", "Condition", products.map((p) => (p.condition ? CONDITION_LABELS[p.condition] ?? p.condition : null))),
      buildRow("category", "Category", products.map((p) => p.category?.name)),
      buildRow("manufacturer", "Manufacturer", products.map((p) => p.manufacturer)),
      buildRow("model", "Model", products.map((p) => p.model)),
      buildRow("partNumber", "Part number", products.map((p) => p.partNumber), true),
      buildRow("referenceCode", "Reference code", products.map((p) => p.referenceCode), true),
    ].filter((r) => r.values.some((v) => v !== EMPTY)),
    [products]
  );
  const specRows = useMemo(() => buildSpecRows(products), [products]);
  const diffCount = [...overview, ...specRows].filter((r) => r.differs).length;
  const emptySlots = Math.max(0, MAX_COMPARE - products.length);
  const cols = products.length + emptySlots;

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Comparison link copied");
    } catch {
      toast.error("Could not copy the link. Copy it from the address bar instead.");
    }
  }

  if (products.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-slate-600">No products selected for comparison</p>
        <Link href="/products" className="mt-4 inline-block font-semibold text-steel-600 hover:underline">
          Browse products to add to comparison
        </Link>
      </div>
    );
  }

  const groups = [
    { title: "Overview", rows: overview },
    { title: "Specifications", rows: specRows },
  ].map((g) => ({ ...g, visible: diffOnly ? g.rows.filter((r) => r.differs) : g.rows }));

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <label className="inline-flex cursor-pointer select-none items-center gap-2.5 text-sm font-medium text-navy-900">
            <span className="relative inline-flex">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={diffOnly}
                onChange={(e) => setDiffOnly(e.target.checked)}
              />
              <span className="h-6 w-11 rounded-full bg-slate-300 transition-colors duration-200 peer-checked:bg-steel-500 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-steel-500" />
              <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-5" />
            </span>
            Show differences only
          </label>
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <span aria-hidden className="h-3 w-3 rounded-sm bg-amber-100 ring-1 ring-amber-300" />
            {diffCount === 0 ? "No differences found" : `${diffCount} row${diffCount === 1 ? "" : "s"} differ`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-navy-900 transition-colors hover:bg-slate-50"
          >
            <Link2 className="h-4 w-4" aria-hidden /> Copy link
          </button>
          {products.length < MAX_COMPARE && (
            <Link
              href="/products"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-navy-900 px-3 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
            >
              <Plus className="h-4 w-4" aria-hidden /> Add products
            </Link>
          )}
        </div>
      </div>

      {/* Table. Phones: narrow label column, ~11rem product columns, empty "add" slots hidden. */}
      {products.length > 1 && (
        <p className="flex items-center justify-end gap-1.5 text-xs font-medium text-slate-500 sm:hidden">
          Swipe to see all {products.length} products <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </p>
      )}
      <div className="overflow-x-auto overscroll-x-contain rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table
          className="w-full min-w-[calc(7rem+var(--pcols)*11rem)] table-fixed border-separate border-spacing-0 text-sm sm:min-w-[calc(13rem+var(--cols)*13rem)]"
          style={{ "--cols": cols, "--pcols": products.length } as React.CSSProperties}
        >
          <caption className="sr-only">Comparison of {products.length} products</caption>
          <colgroup>
            <col className="w-[7rem] sm:w-[13rem]" />
            {products.map((p) => (
              <col key={p.id} />
            ))}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <col key={`ec-${i}`} className="hidden sm:table-column" />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-20 border-b border-r border-slate-200 bg-slate-50 p-3 text-left align-bottom sm:p-4"
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 sm:text-xs sm:tracking-[0.18em]">
                  {products.length} of {MAX_COMPARE} selected
                </span>
              </th>
              {products.map((p) => (
                <th key={p.id} scope="col" className="border-b border-slate-200 p-3 text-left align-top font-normal sm:p-4">
                  <ProductHeader product={p} onRemove={onRemove} />
                </th>
              ))}
              {Array.from({ length: emptySlots }).map((_, i) => (
                <th key={`empty-${i}`} scope="col" className="hidden border-b border-slate-200 p-3 align-top font-normal sm:table-cell sm:p-4">
                  <Link
                    href="/products"
                    className="group flex h-full min-h-[260px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 text-sm font-semibold text-slate-400 transition-colors hover:border-steel-500/40 hover:text-steel-600"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 transition-colors group-hover:bg-steel-500/10">
                      <Plus className="h-5 w-5" aria-hidden />
                    </span>
                    Add a product
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <Fragment key={g.title}>
                <tr>
                  <th
                    scope="colgroup"
                    colSpan={cols + 1}
                    className="sticky left-0 border-b border-slate-200 bg-navy-950 px-4 py-2.5 text-left text-xs font-bold uppercase tracking-[0.18em] text-white"
                  >
                    {g.title}
                    <span className="ml-2 font-medium normal-case tracking-normal text-slate-400">
                      {g.visible.length} {g.visible.length === 1 ? "row" : "rows"}
                    </span>
                  </th>
                </tr>
                {g.visible.length === 0 ? (
                  <tr>
                    <td colSpan={cols + 1} className="border-b border-slate-100 px-4 py-6 text-center text-sm text-slate-500">
                      {g.rows.length === 0
                        ? g.title === "Specifications"
                          ? "None of these products have listed specifications yet."
                          : "No overview data."
                        : "All values in this section are the same."}
                    </td>
                  </tr>
                ) : (
                  g.visible.map((row) => (
                    <tr key={row.key} className="group/row">
                      <th
                        scope="row"
                        className={cn(
                          "sticky left-0 z-10 border-b border-r border-slate-200 px-3 py-3 text-left align-top text-xs font-semibold text-navy-900 transition-colors sm:px-4 sm:text-sm",
                          row.differs ? "bg-amber-50 shadow-[inset_3px_0_0_var(--color-amber-400)]" : "bg-white group-hover/row:bg-slate-50"
                        )}
                      >
                        {row.label}
                      </th>
                      {row.values.map((v, i) => (
                        <td
                          key={i}
                          className={cn(
                            "break-words border-b border-slate-100 px-3 py-3 align-top text-[13px] transition-colors sm:px-4 sm:text-sm",
                            row.mono && "font-mono text-xs",
                            v === EMPTY
                              ? "text-slate-300"
                              : row.differs
                                ? "bg-amber-50/60 font-medium text-navy-900"
                                : "text-slate-600 group-hover/row:bg-slate-50"
                          )}
                        >
                          {row.key === "availability" && v !== EMPTY ? (
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
                                availabilityTone(products[i].availability)
                              )}
                            >
                              {v}
                            </span>
                          ) : (
                            v
                          )}
                        </td>
                      ))}
                      {Array.from({ length: emptySlots }).map((_, i) => (
                        <td key={`e-${i}`} className="hidden border-b border-slate-100 sm:table-cell" />
                      ))}
                    </tr>
                  ))
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <p className="flex items-center gap-2 text-xs text-slate-500">
        <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
        Information and inquiry only. No pricing is shown. Request a quote from any product page.
      </p>
    </div>
  );
}

function ProductHeader({ product: p, onRemove }: { product: ComparisonProduct; onRemove?: (id: string) => void }) {
  const img = p.images[0];
  return (
    <div className="relative flex h-full flex-col">
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(p.id)}
          className="absolute -right-1 -top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          aria-label={`Remove ${p.name} from comparison`}
          title="Remove"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
      <Link
        href={`/products/${p.slug}`}
        className="relative block aspect-[4/3] overflow-hidden rounded-xl border border-slate-100 bg-gradient-to-b from-white to-slate-50"
        tabIndex={-1}
        aria-hidden="true"
      >
        {img?.url ? (
          <Image src={img.url} unoptimized={isMediaUrl(img.url)} alt="" fill sizes="220px" className="object-contain p-2" />
        ) : (
          <span className="flex h-full items-center justify-center text-xl font-bold tracking-widest text-slate-300">CLM</span>
        )}
      </Link>
      {p.category?.name && (
        <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-steel-600">{p.category.name}</p>
      )}
      <Link
        href={`/products/${p.slug}`}
        className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-navy-900 transition-colors hover:text-steel-600"
      >
        {p.name}
      </Link>
      <p className="mt-1 font-mono text-[11px] text-slate-500">{p.referenceCode}</p>
      <div className="mt-auto flex gap-1.5 pt-3">
        <Link
          href={`/products/${p.slug}#inquire`}
          className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md bg-steel-500 px-2 text-xs font-semibold text-white transition-colors hover:bg-steel-600"
        >
          <MessageSquare className="h-3.5 w-3.5" aria-hidden /> Inquire
        </Link>
        <SpecSheetIconButton
          slug={p.slug}
          productName={p.name}
          className="inline-flex h-8 items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 text-slate-700 transition-colors hover:bg-slate-50 hover:text-navy-900 disabled:opacity-60"
        />
        <Link
          href={`/products/${p.slug}`}
          className="hidden h-8 items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 text-slate-700 transition-colors hover:bg-slate-50 hover:text-navy-900 sm:inline-flex"
          aria-label={`View ${p.name}`}
          title="View details"
        >
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

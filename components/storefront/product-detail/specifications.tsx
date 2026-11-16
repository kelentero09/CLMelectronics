"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Copy, ListChecks, MessageSquare, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Spec = { key: string; value: string };

const COLLAPSED_COUNT = 12;
const SEARCH_THRESHOLD = 8;
/** Below this many specs a single column reads better than a half-empty grid. */
const TWO_COLUMN_MIN = 6;

export function Specifications({
  specs,
  productName,
  referenceCode,
}: {
  specs: Spec[];
  productName: string;
  referenceCode: string;
}) {
  const clean = useMemo(() => specs.filter((s) => s.key?.trim() && s.value?.trim()), [specs]);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? clean.filter((s) => s.key.toLowerCase().includes(q) || s.value.toLowerCase().includes(q))
    : clean;
  const collapsible = !q && filtered.length > COLLAPSED_COUNT;
  const visible = collapsible && !expanded ? filtered.slice(0, COLLAPSED_COUNT) : filtered;
  const twoCol = clean.length >= TWO_COLUMN_MIN;

  async function copyAll() {
    const text = [`${productName} (${referenceCode})`, ...clean.map((s) => `${s.key}: ${s.value}`)].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked: nothing to do.
    }
  }

  return (
    <section aria-labelledby="specs-title" className="mt-16 scroll-mt-24" id="specifications">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.2em] text-steel-600">
            <span aria-hidden className="h-px w-6 bg-steel-500" />
            Technical data
          </p>
          <h2 id="specs-title" className="mt-2 flex items-center gap-3 text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">
            Specifications
            {clean.length > 0 && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-semibold tabular-nums text-slate-600">
                {clean.length}
              </span>
            )}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {clean.length > 0 && (
            <button
              type="button"
              onClick={copyAll}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-navy-900 transition-colors hover:bg-slate-50"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
              <span aria-live="polite">{copied ? "Copied" : "Copy specs"}</span>
            </button>
          )}
        </div>
      </div>

      {clean.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-steel-600 shadow-sm ring-1 ring-slate-200">
            <ListChecks className="h-5 w-5" aria-hidden />
          </span>
          <p className="font-semibold text-navy-900">Detailed specifications are available on request</p>
          <p className="max-w-md text-sm text-slate-600">
            Send an inquiry with reference <span className="font-mono font-semibold text-navy-900">{referenceCode}</span> and
            CLM will share the technical details.
          </p>
          <a href="#inquire" className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-steel-600 hover:text-navy-900">
            <MessageSquare className="h-4 w-4" aria-hidden /> Request specifications
          </a>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {clean.length > SEARCH_THRESHOLD && (
            <div className="border-b border-slate-200 bg-slate-50/70 p-3">
              <label className="relative block sm:max-w-sm">
                <span className="sr-only">Filter specifications</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Filter ${clean.length} specifications…`}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-9 text-sm placeholder:text-slate-400 focus:border-steel-500"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-navy-900"
                    aria-label="Clear filter"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                )}
              </label>
            </div>
          )}

          {visible.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500" role="status">
              No specifications match “{query}”.
            </p>
          ) : (
            <dl className={cn("grid", twoCol && "lg:grid-cols-2")}>
              {visible.map((spec, i) => (
                <div
                  key={`${spec.key}-${i}`}
                  className={cn(
                    "grid gap-4 border-slate-100 px-5 py-3.5 text-sm transition-colors hover:bg-steel-500/[0.03]",
                    twoCol
                      ? "grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
                      : "grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:grid-cols-[16rem_minmax(0,1fr)]",
                    "border-b last:border-b-0",
                    twoCol
                      ? cn(
                          "lg:[&:nth-child(odd)]:border-r",
                          // Odd count: last item spans both columns instead of leaving an empty cell.
                          visible.length % 2 === 1 && i === visible.length - 1 && "lg:col-span-2 lg:border-r-0",
                          // Zebra by visual row on desktop (pairs) and by item on mobile.
                          Math.floor(i / 2) % 2 === 1 ? "lg:bg-slate-50/70" : "lg:bg-white",
                          i % 2 === 1 ? "max-lg:bg-slate-50/70" : "max-lg:bg-white"
                        )
                      : i % 2 === 1
                        ? "bg-slate-50/70"
                        : "bg-white"
                  )}
                >
                  <dt className="font-semibold text-navy-900">
                    <Highlight text={spec.key} query={q} />
                  </dt>
                  <dd className="break-words text-slate-700">
                    <Highlight text={spec.value} query={q} />
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {collapsible && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="flex w-full items-center justify-center gap-1.5 border-t border-slate-200 bg-slate-50/70 py-3 text-sm font-semibold text-steel-600 transition-colors hover:bg-slate-100 hover:text-navy-900"
            >
              {expanded ? "Show fewer" : `Show all ${filtered.length} specifications`}
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", expanded && "rotate-180")} aria-hidden />
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const i = text.toLowerCase().indexOf(query);
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-amber-100 px-0.5 text-inherit">{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}

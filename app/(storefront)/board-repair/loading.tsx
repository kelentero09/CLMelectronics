import { Loader2 } from "lucide-react";

export default function BoardRepairLoading() {
  return (
    <div aria-label="Loading board repair records">
      {/* Hero spacer keeps layout stable while the page streams in */}
      <div className="blueprint-grid bg-navy-950">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
          <div className="mt-3 h-9 w-2/3 max-w-md animate-pulse rounded bg-white/10" />
          <div className="mt-3 h-5 w-full max-w-2xl animate-pulse rounded bg-white/10" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <p role="status" className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-navy-900">
          <Loader2 className="h-5 w-5 animate-spin text-steel-600" aria-hidden="true" />
          Loading board repair records…
        </p>
        {/* Stat cards skeleton */}
        <div className="mt-4 grid gap-4 sm:grid-cols-3" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mx-auto h-8 w-20 animate-pulse rounded bg-slate-200" />
              <div className="mx-auto mt-2 h-4 w-40 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
        {/* Filters skeleton */}
        <div className="mt-8 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3 sm:p-5" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-slate-200" />
          ))}
        </div>
        {/* Table skeleton */}
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white" aria-hidden="true">
          <div className="h-12 animate-pulse bg-navy-950/90" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 border-t border-slate-200 px-4 py-4">
              <div className="h-5 w-24 animate-pulse rounded bg-slate-200" />
              <div className="h-5 w-32 animate-pulse rounded bg-slate-100" />
              <div className="hidden h-5 flex-1 animate-pulse rounded bg-slate-100 sm:block" />
              <div className="h-5 w-16 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </div>
        <div className="py-10" />
      </div>
    </div>
  );
}

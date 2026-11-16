import { HeaderSkeleton } from "@/components/storefront/header-skeleton";

/** Category page skeleton. */
export default function CategoryLoading() {
  return (
    <div role="status" aria-label="Loading category">
    <HeaderSkeleton />
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="aspect-[4/3] skeleton" />
            <div className="space-y-2 p-3 sm:p-4">
              <div className="h-3 w-2/3 rounded skeleton" />
              <div className="h-4 w-full rounded skeleton" />
              <div className="h-3 w-1/2 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
    </div>
  );
}

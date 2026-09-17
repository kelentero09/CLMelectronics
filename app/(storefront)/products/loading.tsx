/**
 * Instant loading skeleton for /products (and detail pages). Shows
 * immediately on navigation while the server streams the real catalog,
 * so filter/search clicks feel instant instead of a blank wait.
 */
export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-6 sm:px-6" aria-label="Loading products">
      <div className="h-8 w-48 rounded bg-slate-200" />
      <div className="mt-4 flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-9 w-28 shrink-0 rounded-full bg-slate-200" />
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="hidden rounded-lg border border-slate-200 bg-white p-4 lg:block">
          <div className="h-4 w-24 rounded bg-slate-200" />
          <div className="mt-3 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-7 rounded bg-slate-100" />
            ))}
          </div>
        </div>
        <div>
          <div className="flex gap-2">
            <div className="h-10 flex-1 rounded-md bg-slate-200" />
            <div className="h-10 w-24 rounded-md bg-slate-200" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <div className="aspect-[4/3] bg-slate-200" />
                <div className="space-y-2 p-3 sm:p-4">
                  <div className="h-3 w-2/3 rounded bg-slate-200" />
                  <div className="h-4 w-full rounded bg-slate-200" />
                  <div className="h-3 w-1/2 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

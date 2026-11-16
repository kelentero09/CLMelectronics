/** Category page skeleton. */
export default function CategoryLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6" role="status" aria-label="Loading category">
      <div className="h-3 w-40 rounded skeleton" />
      <div className="mt-3 h-8 w-64 rounded skeleton" />
      <div className="mt-2 h-4 w-96 max-w-full rounded skeleton" />
      <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-3">
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
  );
}

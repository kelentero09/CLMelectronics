/** Comparison page skeleton. */
export default function CompareLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8" role="status" aria-label="Loading comparison">
      <div className="h-9 w-72 rounded skeleton" />
      <div className="mt-2 h-4 w-40 rounded skeleton" />
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[4/3] rounded-lg skeleton" />
            <div className="h-4 w-3/4 rounded skeleton" />
            {Array.from({ length: 5 }).map((__, j) => (
              <div key={j} className="h-3 w-full rounded bg-slate-100" />
            ))}
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** Admin pages skeleton (shown inside the admin shell while data loads). */
export default function AdminLoading() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading">
      <div className="h-7 w-48 rounded skeleton" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg skeleton" />
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-slate-100 p-4 last:border-0">
            <div className="h-10 w-14 rounded skeleton" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded skeleton" />
              <div className="h-3 w-1/4 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

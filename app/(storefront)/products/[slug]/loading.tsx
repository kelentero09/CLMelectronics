/** Product detail skeleton: mirrors the real layout to avoid layout shift. */
export default function ProductDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6" role="status" aria-label="Loading product">
      <div className="h-3 w-56 rounded skeleton" />
      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        <div>
          <div className="aspect-[4/3] rounded-lg skeleton" />
          <div className="mt-2 grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded skeleton" />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="h-6 w-20 rounded-full skeleton" />
            <div className="h-6 w-16 rounded-full skeleton" />
          </div>
          <div className="h-8 w-4/5 rounded skeleton" />
          <div className="h-4 w-32 rounded skeleton" />
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-20 rounded skeleton" />
                <div className="h-4 w-28 rounded skeleton" />
              </div>
            ))}
          </div>
          <div className="h-4 w-full rounded skeleton" />
          <div className="h-4 w-11/12 rounded skeleton" />
          <div className="h-4 w-3/4 rounded skeleton" />
          <div className="flex gap-3 pt-2">
            <div className="h-10 w-56 rounded-md skeleton" />
            <div className="h-10 w-48 rounded-md skeleton" />
          </div>
        </div>
      </div>
      <span className="sr-only">Loading product…</span>
    </div>
  );
}

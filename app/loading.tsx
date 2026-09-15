export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6" aria-label="Loading">
      <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
      <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[4/3] animate-pulse rounded-lg bg-slate-200" />
        ))}
      </div>
    </div>
  );
}

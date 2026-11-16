/** Skeleton matching CatalogHeader / PageHero so loading → content doesn't shift layout. */
export function HeaderSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div className="bg-navy-950">
      <div className={`mx-auto max-w-7xl px-4 sm:px-6 ${tall ? "py-10 sm:py-20 lg:py-24" : "py-10 sm:py-12"}`}>
        <div className="h-3 w-40 rounded bg-white/10" />
        <div className="mt-5 h-9 w-72 max-w-full rounded bg-white/15" />
        <div className="mt-4 h-4 w-[28rem] max-w-full rounded bg-white/10" />
      </div>
    </div>
  );
}

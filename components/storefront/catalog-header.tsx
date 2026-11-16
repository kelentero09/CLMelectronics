import { Breadcrumbs, DarkBackdrop, TextLink } from "@/components/storefront/blocks";

/** Compact dark header for catalog listing pages. */
export function CatalogHeader({
  title,
  description,
  count,
  crumbs,
  action,
}: {
  title: string;
  description?: string;
  count?: number;
  crumbs: { label: string; href?: string }[];
  action?: { href: string; label: string };
}) {
  return (
    <section className="relative isolate overflow-hidden bg-navy-950" aria-label="Catalog header">
      <DarkBackdrop />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <Breadcrumbs items={crumbs} dark />
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <h1 className="flex flex-wrap items-center gap-3 text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {title}
              {typeof count === "number" && count > 0 && (
                <span className="rounded-full bg-white/10 px-3 py-1 align-middle text-sm font-semibold tabular-nums text-slate-200 ring-1 ring-white/15">
                  {count} item{count === 1 ? "" : "s"}
                </span>
              )}
            </h1>
            {description && <p className="mt-3 text-pretty leading-relaxed text-slate-300">{description}</p>}
          </div>
          {action && (
            <TextLink href={action.href} dark className="shrink-0">
              {action.label}
            </TextLink>
          )}
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl animate-fade-up px-4 py-20 text-center">
      <p className="text-6xl font-bold tracking-tight text-navy-900">404</p>
      <h1 className="mt-2 text-xl font-bold text-navy-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">
        The page or product you are looking for does not exist or is no longer published.
        Try searching the catalog by name, reference code or part number.
      </p>
      <form action="/products" method="get" role="search" className="mx-auto mt-6 flex max-w-md gap-2">
        <input
          name="q"
          aria-label="Search products"
          placeholder="Search products…"
          maxLength={100}
          className="h-10 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm placeholder:text-slate-400 focus:border-steel-500"
        />
        <button type="submit" className={buttonVariants()}>
          <Search aria-hidden /> Search
        </button>
      </form>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/products" className={buttonVariants({ variant: "outline" })}>
          Browse catalog
        </Link>
        <Link href="/" className={buttonVariants({ variant: "ghost" })}>
          Home
        </Link>
        <Link href="/contact" className={buttonVariants({ variant: "ghost" })}>
          Contact CLM
        </Link>
      </div>
    </div>
  );
}

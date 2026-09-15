"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-xl font-bold text-navy-900">Something went wrong</h1>
      <p className="mt-2 text-sm text-slate-500">Please try again. If the problem persists, contact CLM directly.</p>
      <div className="mt-6 flex justify-center gap-2">
        <button type="button" onClick={reset} className={buttonVariants()}>
          Try Again
        </button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Back to Catalog
        </Link>
      </div>
    </div>
  );
}

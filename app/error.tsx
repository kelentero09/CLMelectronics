"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl animate-fade-up px-4 py-20 text-center" role="alert">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
        <AlertTriangle className="h-7 w-7" aria-hidden />
      </div>
      <h1 className="mt-4 text-xl font-bold text-navy-900">Something went wrong</h1>
      <p className="mt-2 text-sm text-slate-500">
        Please try again. If the problem persists, contact CLM directly.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-slate-400">Reference: {error.digest}</p>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={reset} className={buttonVariants()}>
          Try again
        </button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Back to home
        </Link>
        <Link href="/contact" className={buttonVariants({ variant: "ghost" })}>
          Contact CLM
        </Link>
      </div>
    </div>
  );
}

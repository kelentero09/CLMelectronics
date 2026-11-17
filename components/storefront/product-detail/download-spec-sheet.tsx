"use client";

import { useState } from "react";
import { FileDown, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadSpecSheet, SpecSheetError } from "@/lib/pdf/download";

const FALLBACK_ERROR = "Failed to generate spec sheet. Please try again.";

function useSpecSheetDownload(slug: string) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await downloadSpecSheet(slug);
    } catch (err) {
      setError(err instanceof SpecSheetError ? err.message : FALLBACK_ERROR);
      if (!(err instanceof SpecSheetError)) console.error("[spec-sheet]", err);
    } finally {
      setPending(false);
    }
  }
  return { pending, error, run };
}

export function DownloadSpecSheet({
  slug,
  productName,
  className = "",
}: {
  slug: string;
  productName: string;
  className?: string;
}) {
  const { pending, error, run } = useSpecSheetDownload(slug);

  return (
    <div className={className}>
      <Button
        type="button"
        onClick={run}
        disabled={pending}
        variant="outline"
        className="gap-2"
        aria-label={`Download ${productName} specification sheet as PDF`}
        aria-busy={pending}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <FileText className="h-4 w-4" aria-hidden />
        )}
        {pending ? "Generating…" : "Download Spec Sheet"}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Compact icon button (comparison table). Errors are shown as a toast. */
export function SpecSheetIconButton({ slug, productName, className = "" }: { slug: string; productName: string; className?: string }) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending) return;
    setPending(true);
    try {
      await downloadSpecSheet(slug);
    } catch (err) {
      toast.error(err instanceof SpecSheetError ? err.message : FALLBACK_ERROR);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-busy={pending}
      className={className}
      aria-label={`Download ${productName} spec sheet (PDF)`}
      title="Download spec sheet (PDF)"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <FileDown className="h-4 w-4" aria-hidden />}
    </button>
  );
}

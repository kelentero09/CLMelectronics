"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DownloadSpecSheet({
  slug,
  productName,
  className = "",
}: {
  slug: string;
  productName: string;
  className?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/products/${encodeURIComponent(slug)}/spec-sheet`);
      if (res.status === 429) throw new Error("Too many downloads. Please wait a minute and try again.");
      if (!res.ok) throw new Error("Failed to generate spec sheet. Please try again.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}-spec-sheet.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate spec sheet. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={className}>
      <Button
        type="button"
        onClick={handleDownload}
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

"use client";

import { useState } from "react";
import { generateSpecSheet } from "@/app/actions/pdf";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DownloadSpecSheet({
  productId,
  productName,
  className = "",
}: {
  productId: string;
  productName: string;
  className?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setPending(true);
    setError(null);
    try {
      const arrayBuffer = await generateSpecSheet(productId);
      const url = URL.createObjectURL(new Blob([new Uint8Array(arrayBuffer)], { type: "application/pdf" }));
      const a = document.createElement("a");
      const safeName = productName
        .replace(/[^a-z0-9\s-]/gi, "")
        .replace(/\s+/g, "-")
        .toLowerCase()
        .substring(0, 80);
      a.href = url;
      a.download = `${safeName}-spec-sheet.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setError("Failed to generate spec sheet. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (error) {
    return (
      <div className="text-red-600 text-sm" role="alert">
        {error}
      </div>
    );
  }

  return (
    <Button
      type="button"
      onClick={handleDownload}
      disabled={pending}
      variant="outline"
      className={`gap-2 ${className}`}
      aria-label={`Download ${productName} specification sheet as PDF`}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating…
        </>
      ) : (
        <>
          <FileText className="h-4 w-4" />
          Download Spec Sheet
        </>
      )}
    </Button>
  );
}
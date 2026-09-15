"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toaster";
import { setPrimaryImage, deleteImage } from "@/app/actions/products";
import { Button } from "@/components/ui/button";

export function ProductImagesManager({ images }: { images: { id: string; url: string; alt: string | null; isPrimary: boolean }[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function run(id: string, action: "primary" | "delete", label: string) {
    if (action === "delete" && !window.confirm(`Delete this image (${label})?`)) return;
    setPending(id);
    const result = action === "primary" ? await setPrimaryImage(id) : await deleteImage(id);
    setPending(null);
    if (result.ok) {
      toast.success(action === "primary" ? "Primary image set" : "Image deleted");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  if (images.length === 0) return <p className="text-sm text-slate-500">No images yet. Add some with the form above.</p>;

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {images.map((img) => (
        <li key={img.id} className="rounded-lg border border-slate-200 bg-white p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.url} alt={img.alt || "Product image"} loading="lazy" className="aspect-[4/3] w-full rounded object-contain" />
          <p className="mt-1 truncate text-center text-[11px] font-semibold">
            {img.isPrimary ? <span className="text-emerald-600">★ Primary</span> : <span className="text-slate-400">—</span>}
          </p>
          <div className="mt-1 flex gap-1">
            {!img.isPrimary && (
              <Button size="sm" variant="outline" className="flex-1" disabled={pending === img.id} onClick={() => run(img.id, "primary", img.alt || "")}>
                Set primary
              </Button>
            )}
            <Button size="sm" variant="danger" className="flex-1" disabled={pending === img.id} onClick={() => run(img.id, "delete", img.alt || "")}>
              Delete
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

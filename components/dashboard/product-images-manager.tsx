"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "@/components/ui/toaster";
import { setPrimaryImage, deleteImage, moveImage } from "@/app/actions/products";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";

type ImageRow = { id: string; url: string; alt: string | null; isPrimary: boolean };

export function ProductImagesManager({ images }: { images: ImageRow[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function run(id: string, action: "primary" | "delete", label: string) {
    if (
      action === "delete" &&
      !(await confirmDialog({
        title: "Delete this image?",
        description: label
          ? `"${label}" will be removed from the product and storage.`
          : "The image will be removed from the product and storage.",
        confirmLabel: "Delete image",
        tone: "danger",
      }))
    )
      return;
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

  async function move(id: string, direction: "up" | "down") {
    setPending(id);
    const result = await moveImage(id, direction);
    setPending(null);
    if (result.ok) router.refresh();
    else toast.error(result.error);
  }

  if (images.length === 0) return <p className="text-sm text-slate-500">No images yet. Add some with the form above.</p>;

  return (
    <>
      <p className="mb-2 text-xs text-slate-500">
        Gallery order follows this list (the primary image is always shown first). Use the arrows to reorder.
      </p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((img, i) => (
          <li
            key={img.id}
            className="rounded-lg border border-slate-200 bg-white p-2 transition-opacity duration-150 aria-busy:opacity-60"
            aria-busy={pending === img.id}
          >
            <div className="relative aspect-[4/3] w-full">
              <Image src={img.url} alt={img.alt || "Product image"} fill sizes="(max-width: 640px) 50vw, 200px" className="rounded object-contain" />
            </div>
            <div className="mt-1 flex items-center justify-between gap-1">
              <button
                type="button"
                onClick={() => move(img.id, "up")}
                disabled={i === 0 || pending !== null}
                className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-navy-900 disabled:opacity-30"
                aria-label={`Move image ${i + 1} earlier`}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <p className="truncate text-center text-[11px] font-semibold">
                {img.isPrimary ? <span className="text-emerald-600">★ Primary</span> : <span className="text-slate-400">#{i + 1}</span>}
              </p>
              <button
                type="button"
                onClick={() => move(img.id, "down")}
                disabled={i === images.length - 1 || pending !== null}
                className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-navy-900 disabled:opacity-30"
                aria-label={`Move image ${i + 1} later`}
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
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
    </>
  );
}

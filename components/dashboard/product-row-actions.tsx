"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toaster";
import { togglePublish, softDeleteProduct, restoreProduct } from "@/app/actions/products";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";

export function PublishToggle({ id, published }: { id: string; published: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function run() {
    setPending(true);
    const result = await togglePublish(id, !published);
    setPending(false);
    if (result.ok) {
      toast.success(published ? "Unpublished" : "Published");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }
  return (
    <Button size="sm" variant={published ? "secondary" : "primary"} disabled={pending} onClick={run}>
      {published ? "Unpublish" : "Publish"}
    </Button>
  );
}

export function DeleteRestoreButtons({ id, deleted }: { id: string; deleted: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function run() {
    if (!deleted && !(await confirmDialog({ title: "Delete this product?", description: "It will be hidden from the catalog. You can restore it later.", confirmLabel: "Delete", tone: "danger" }))) return;
    setPending(true);
    const result = deleted ? await restoreProduct(id) : await softDeleteProduct(id);
    setPending(false);
    if (result.ok) {
      if (deleted) {
        toast.success("Product restored");
      } else {
        toast.success("Product deleted", {
          action: {
            label: "Undo",
            onClick: async () => {
              const undo = await restoreProduct(id);
              if (undo.ok) {
                toast.success("Product restored");
                router.refresh();
              } else {
                toast.error(undo.error);
              }
            },
          },
        });
      }
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }
  return (
    <Button size="sm" variant={deleted ? "primary" : "danger"} disabled={pending} onClick={run}>
      {deleted ? "Restore" : "Delete"}
    </Button>
  );
}

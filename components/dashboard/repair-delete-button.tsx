"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toaster";
import { deleteBoardRepair } from "@/app/actions/board-repairs";
import { buttonVariants } from "@/components/ui/button";

export function RepairDeleteButton({ id, board }: { id: string; board: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Delete "${board}"? This cannot be undone.`)) return;
    setPending(true);
    try {
      const result = await deleteBoardRepair(id);
      if (result.ok) {
        toast.success("Repair record deleted");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Could not delete. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button type="button" disabled={pending} onClick={handleDelete} className={buttonVariants({ variant: "outline", size: "sm" })}>
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}

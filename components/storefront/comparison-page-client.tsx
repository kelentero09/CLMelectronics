"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ComparisonTable, type ComparisonProduct } from "./comparison-table";
import { readCompareIds, writeCompareIds } from "@/lib/compare-store";

export function ComparisonPageClient({ products }: { products: ComparisonProduct[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleRemove = (id: string) => {
    const currentIds = searchParams.get("ids")?.split(",").filter(Boolean) || [];
    const newIds = currentIds.filter((existingId) => existingId !== id);
    // Keep the floating comparison bar in sync with the table.
    writeCompareIds(readCompareIds().filter((existingId) => existingId !== id));

    if (newIds.length === 0) {
      router.push("/products");
    } else {
      router.replace(`/compare?ids=${newIds.join(",")}`, { scroll: false });
    }
  };

  return <ComparisonTable products={products} onRemove={handleRemove} />;
}

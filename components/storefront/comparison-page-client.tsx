"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ComparisonTable, type ComparisonProduct } from "./comparison-table";

export function ComparisonPageClient({ products }: { products: ComparisonProduct[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleRemove = (id: string) => {
    const currentIds = searchParams.get("ids")?.split(",").filter(Boolean) || [];
    const newIds = currentIds.filter((existingId) => existingId !== id);
    
    if (newIds.length === 0) {
      router.push("/products");
    } else {
      router.push(`/compare?ids=${newIds.join(",")}`);
    }
  };

  return <ComparisonTable products={products} onRemove={handleRemove} />;
}
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/dashboard/product-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Add Product" };

export default async function NewProductPage() {
  let categories: { id: string; name: string }[] = [];
  try {
    categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  } catch (e) {
    console.error("Categories query failed", e);
  }
  return (
    <div>
      <h1 className="text-xl font-bold text-navy-900">Add Product</h1>
      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
        <ProductForm mode="create" categories={categories} />
      </div>
    </div>
  );
}

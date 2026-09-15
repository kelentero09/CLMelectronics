import { prisma } from "@/lib/db";
import { CategoryManager, type CategoryRow } from "@/components/dashboard/category-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  let categories: CategoryRow[] = [];
  try {
    categories = await prisma.category.findMany({
      include: { _count: { select: { products: { where: { deletedAt: null } } } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  } catch (e) {
    console.error("Admin categories query failed", e);
  }
  return (
    <div>
      <h1 className="text-xl font-bold text-navy-900">Categories</h1>
      <p className="mt-1 text-sm text-slate-500">
        The five core slugs (equipment, spare-parts, manufacturing-consumables, esd-materials,
        office-supplies) appear in public URLs — renaming them will break links.
      </p>
      <div className="mt-4">
        <CategoryManager initial={categories} />
      </div>
    </div>
  );
}

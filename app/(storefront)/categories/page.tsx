import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type CategoryCard = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: { products: number };
};

export const metadata = {
  title: "Categories",
  description: "Browse CLM product categories: equipment, spare parts, manufacturing consumables, ESD materials, and office supplies.",
};

export default async function CategoriesPage() {
  let categories: CategoryCard[] = [];
  try {
    categories = await prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        _count: { select: { products: { where: { published: true, deletedAt: null } } } },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  } catch (e) {
    console.error("Categories query failed", e);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold uppercase tracking-tight text-navy-900 sm:text-3xl">Categories</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <Link key={c.id} href={`/categories/${c.slug}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent>
                <h2 className="font-bold text-navy-900">{c.name}</h2>
                {c.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{c.description}</p>}
                <p className="mt-2 text-xs font-semibold text-steel-600">
                  {c._count.products} product{c._count.products === 1 ? "" : "s"} →
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-slate-500">Categories are not available yet.</p>
        )}
      </div>
    </div>
  );
}

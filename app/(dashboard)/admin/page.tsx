import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminHomePage() {
  let stats = { products: 0, published: 0, categories: 0, inquiriesNew: 0 };
  let recent: { id: string; name: string; referenceCode: string; updatedAt: Date }[] = [];
  try {
    const [products, published, categories, inquiriesNew, recentRows] = await Promise.all([
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.product.count({ where: { published: true, deletedAt: null } }),
      prisma.category.count({ where: { isActive: true } }),
      prisma.inquiry.count({ where: { status: "NEW" } }),
      prisma.product.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true, referenceCode: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
    ]);
    stats = { products, published, categories, inquiriesNew };
    recent = recentRows;
  } catch (e) {
    console.error("Admin dashboard query failed", e);
  }

  const cards: [string, number, string][] = [
    ["Products", stats.products, "/admin/products"],
    ["Published", stats.published, "/admin/products"],
    ["Categories", stats.categories, "/admin/categories"],
    ["New Inquiries", stats.inquiriesNew, "/admin/inquiries"],
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-navy-900">Dashboard</h1>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value, href]) => (
          <Link key={label} href={href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent>
                <p className="text-3xl font-bold text-navy-900">{value}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <h2 className="mt-8 text-sm font-bold uppercase tracking-wider text-slate-500">Recently updated</h2>
      <Card>
        <ul className="divide-y divide-slate-100">
          {recent.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="min-w-0">
                <span className="block truncate font-semibold text-navy-900">{p.name}</span>
                <span className="font-mono text-xs text-slate-400">{p.referenceCode}</span>
              </span>
              <Link href={`/admin/products/${p.id}/edit`} className="shrink-0 font-semibold text-steel-600 hover:underline">
                Edit
              </Link>
            </li>
          ))}
          {recent.length === 0 && <li className="px-4 py-6 text-sm text-slate-500">No products yet.</li>}
        </ul>
      </Card>
    </div>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/db";
import { InquiriesManager, type InquiryRow } from "@/components/dashboard/inquiries-manager";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Inquiries" };

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status && ["NEW", "CONTACTED", "COMPLETED"].includes(sp.status) ? sp.status : "";
  let inquiries: InquiryRow[] = [];
  const counts = { NEW: 0, CONTACTED: 0, COMPLETED: 0 };
  try {
    const where = status ? { status: status as never } : {};
    const [rows, grouped] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        select: { id: true, name: true, email: true, phone: true, company: true, message: true, status: true, productRef: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.inquiry.groupBy({ by: ["status"], _count: true }),
    ]);
    inquiries = rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
    for (const g of grouped) {
      if (g.status in counts) counts[g.status as keyof typeof counts] = g._count;
    }
  } catch (e) {
    console.error("Admin inquiries query failed", e);
  }

  const tabs = [
    { label: `All`, value: "" },
    { label: `New (${counts.NEW})`, value: "NEW" },
    { label: `Contacted (${counts.CONTACTED})`, value: "CONTACTED" },
    { label: `Completed (${counts.COMPLETED})`, value: "COMPLETED" },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-navy-900">Inquiries</h1>
      <div className="mt-3 flex flex-wrap gap-1" role="tablist" aria-label="Filter by status">
        {tabs.map((t) => (
          <Link
            key={t.label}
            role="tab"
            aria-selected={(status || "") === t.value}
            href={t.value ? `/admin/inquiries?status=${t.value}` : "/admin/inquiries"}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), (status || "") === t.value && "bg-navy-900 text-white")}
          >
            {t.label}
          </Link>
        ))}
      </div>
      <div className="mt-4">
        <InquiriesManager initial={inquiries} />
      </div>
    </div>
  );
}

"use server";

import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/authz";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export type StorageStats = {
  database: {
    totalSize: string;
    totalSizeBytes: number;
    tables: Array<{
      name: string;
      size: string;
      sizeBytes: number;
      rowCount: number;
    }>;
  };
  storage: {
    bucket: string;
    totalSize: string;
    totalSizeBytes: number;
    fileCount: number;
  };
  inquiries: {
    total: number;
    new: number;
    contacted: number;
    completed: number;
    oldCount: number; // Inquiries older than 90 days
  };
  products: {
    total: number;
    published: number;
    unpublished: number;
    withImages: number;
    totalImages: number;
  };
};

export async function getStorageStats(): Promise<{ ok: true; data: StorageStats } | { ok: false; error: string }> {
  try {
    await requireAdmin();

    // Get row counts for key tables
    const [inquiryCounts, productCounts, imageCounts] = await Promise.all([
      prisma.inquiry.groupBy({ by: ["status"], _count: true }),
      prisma.product.count({ where: { published: true } }),
      prisma.productImage.count(),
    ]);

    // Get table row counts
    const tableRowCounts = await Promise.all([
      prisma.inquiry.count(),
      prisma.product.count(),
      prisma.productImage.count(),
      prisma.category.count(),
      prisma.boardRepair.count(),
      prisma.siteContent.count(),
      prisma.user.count(),
    ]);

    // Get old inquiries (older than 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const oldInquiryCount = await prisma.inquiry.count({
      where: { createdAt: { lt: ninetyDaysAgo } }
    });

    // D1 reports the database file size in the metadata of any query result.
    let dbSizeBytes = 0;
    try {
      const { env } = await getCloudflareContext({ async: true });
      const res = await env.DB.prepare("SELECT 1").run();
      dbSizeBytes = Number(res.meta?.size_after ?? 0);
    } catch (e) {
      console.warn("[storage stats] D1 size unavailable", e instanceof Error ? e.message : e);
    }

    // Uploaded images (stored in D1, table media_files).
    let storageStats = { bucket: "media_files (D1)", totalSize: "Unknown", totalSizeBytes: 0, fileCount: 0 };
    try {
      const agg = await prisma.mediaFile.aggregate({ _sum: { size: true }, _count: true });
      const totalSize = agg._sum.size ?? 0;
      storageStats = { ...storageStats, totalSize: formatBytes(totalSize), totalSizeBytes: totalSize, fileCount: agg._count };
    } catch (e) {
      unstable_rethrow(e);
      console.error("Storage stats failed", e);
    }

    // D1 doesn't expose per-table sizes; row counts are shown instead.
    const tables = [
      { name: "inquiries", size: "—", sizeBytes: 0, rowCount: tableRowCounts[0] },
      { name: "products", size: "—", sizeBytes: 0, rowCount: tableRowCounts[1] },
      { name: "product_images", size: "—", sizeBytes: 0, rowCount: tableRowCounts[2] },
      { name: "categories", size: "—", sizeBytes: 0, rowCount: tableRowCounts[3] },
      { name: "board_repairs", size: "—", sizeBytes: 0, rowCount: tableRowCounts[4] },
      { name: "site_contents", size: "—", sizeBytes: 0, rowCount: tableRowCounts[5] },
      { name: "users", size: "—", sizeBytes: 0, rowCount: tableRowCounts[6] },
    ];

    // Process inquiry counts
    const inquiryStats = {
      total: tableRowCounts[0],
      new: inquiryCounts.find(c => c.status === "NEW")?._count || 0,
      contacted: inquiryCounts.find(c => c.status === "CONTACTED")?._count || 0,
      completed: inquiryCounts.find(c => c.status === "COMPLETED")?._count || 0,
      oldCount: oldInquiryCount
    };

    // Process product stats
    const productStats = {
      total: tableRowCounts[1],
      published: productCounts,
      unpublished: tableRowCounts[1] - productCounts,
      withImages: await prisma.product.count({
        where: { images: { some: {} } }
      }),
      totalImages: tableRowCounts[2]
    };

    return {
      ok: true,
      data: {
        database: {
          totalSize: dbSizeBytes ? formatBytes(dbSizeBytes) : "Unknown",
          totalSizeBytes: dbSizeBytes,
          tables
        },
        storage: storageStats,
        inquiries: inquiryStats,
        products: productStats
      }
    };
  } catch (e) {
    unstable_rethrow(e);
    console.error("[storage stats]", e);
    return { ok: false, error: "Failed to get storage statistics" };
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/** Retention window must be a sane positive integer (prevents negative values deleting everything). */
function clampDays(days: unknown): number {
  const n = Math.floor(Number(days));
  if (!Number.isFinite(n)) return 90;
  return Math.min(3650, Math.max(30, n));
}

export async function cleanupOldInquiries(days: number = 90): Promise<{ ok: true; deleted: number } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - clampDays(days));
    
    // Delete completed inquiries older than specified days
    const result = await prisma.inquiry.deleteMany({
      where: {
        status: "COMPLETED",
        createdAt: { lt: cutoffDate }
      }
    });
    
    console.log(`[storage cleanup] Deleted ${result.count} inquiries older than ${days} days`);
    
    return { ok: true, deleted: result.count };
  } catch (e) {
    unstable_rethrow(e);
    console.error("[storage cleanup]", e);
    return { ok: false, error: "Failed to cleanup old inquiries" };
  }
}

export async function deleteInquiryById(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    
    await prisma.inquiry.delete({
      where: { id }
    });
    
    return { ok: true };
  } catch (e) {
    unstable_rethrow(e);
    console.error("[inquiry delete]", e);
    return { ok: false, error: "Failed to delete inquiry" };
  }
}

export async function exportInquiriesToArchive(days: number = 90): Promise<{ 
  ok: true; 
  archived: number; 
  data: string;
} | { ok: false; error: string }> {
  try {
    await requireAdmin();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - clampDays(days));
    
    // Get inquiries to archive
    const inquiries = await prisma.inquiry.findMany({
      where: {
        status: "COMPLETED",
        createdAt: { lt: cutoffDate }
      },
      include: {
        product: {
          select: {
            name: true,
            referenceCode: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    
    if (inquiries.length === 0) {
      return { ok: true, archived: 0, data: "[]" };
    }
    
    // Format for archive
    const archiveData = inquiries.map(inq => ({
      archivedAt: new Date().toISOString(),
      originalId: inq.id,
      name: inq.name,
      email: inq.email,
      phone: inq.phone,
      company: inq.company,
      message: inq.message,
      status: inq.status,
      productRef: inq.productRef,
      product: inq.product ? {
        name: inq.product.name,
        referenceCode: inq.product.referenceCode
      } : null,
      originalCreatedAt: inq.createdAt.toISOString()
    }));
    
    const jsonData = JSON.stringify(archiveData, null, 2);
    
    // Delete exactly the rows that were exported (no race with newly completed rows)
    await prisma.inquiry.deleteMany({
      where: { id: { in: inquiries.map((i) => i.id) } },
    });
    
    console.log(`[storage archive] Archived ${inquiries.length} inquiries older than ${days} days`);
    
    return { ok: true, archived: inquiries.length, data: jsonData };
  } catch (e) {
    unstable_rethrow(e);
    console.error("[storage archive]", e);
    return { ok: false, error: "Failed to archive inquiries" };
  }
}
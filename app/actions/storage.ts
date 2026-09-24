"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/authz";
import { createSupabaseServiceClient } from "@/lib/auth";

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

    // Get database table sizes
    const tableStats = await prisma.$queryRaw<Array<{ tablename: string; size: string }>>`
      SELECT 
        tablename,
        pg_size_pretty(pg_total_relation_size('public.' || tablename)) as size
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size('public.' || tablename) DESC
    `;

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

    // Calculate total database size
    const totalDbSize = await prisma.$queryRaw<Array<{ size: string }>>`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `;

    // Get storage bucket stats
    let storageStats = { bucket: "product-images", totalSize: "Unknown", totalSizeBytes: 0, fileCount: 0 };
    try {
      const supabase = createSupabaseServiceClient();
      const { data: bucketData, error } = await supabase.storage.from("product-images").list("clm", { limit: 1000 });
      
      if (!error && bucketData) {
        const totalSize = bucketData.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
        storageStats = {
          bucket: "product-images",
          totalSize: formatBytes(totalSize),
          totalSizeBytes: totalSize,
          fileCount: bucketData.length
        };
      }
    } catch (e) {
      console.error("Storage stats failed", e);
    }

    // Format table data
    const tables = [
      { name: "inquiries", size: "Unknown", sizeBytes: 0, rowCount: tableRowCounts[0] },
      { name: "products", size: "Unknown", sizeBytes: 0, rowCount: tableRowCounts[1] },
      { name: "product_images", size: "Unknown", sizeBytes: 0, rowCount: tableRowCounts[2] },
      { name: "categories", size: "Unknown", sizeBytes: 0, rowCount: tableRowCounts[3] },
      { name: "board_repairs", size: "Unknown", sizeBytes: 0, rowCount: tableRowCounts[4] },
      { name: "site_contents", size: "Unknown", sizeBytes: 0, rowCount: tableRowCounts[5] },
      { name: "users", size: "Unknown", sizeBytes: 0, rowCount: tableRowCounts[6] },
    ];

    // Map actual table sizes
    tableStats.forEach((stat) => {
      const table = tables.find(t => t.name === stat.tablename);
      if (table) {
        table.size = stat.size;
        table.sizeBytes = parseSize(stat.size);
      }
    });

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
          totalSize: totalDbSize[0]?.size || "Unknown",
          totalSizeBytes: parseSize(totalDbSize[0]?.size || "0 MB"),
          tables
        },
        storage: storageStats,
        inquiries: inquiryStats,
        products: productStats
      }
    };
  } catch (e) {
    console.error("[storage stats]", e);
    return { ok: false, error: "Failed to get storage statistics" };
  }
}

function parseSize(sizeStr: string): number {
  const match = sizeStr.match(/(\d+(?:\.\d+)?)\s*(KB|MB|GB)/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  switch (unit) {
    case "KB": return value * 1024;
    case "MB": return value * 1024 * 1024;
    case "GB": return value * 1024 * 1024 * 1024;
    default: return 0;
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

export async function cleanupOldInquiries(days: number = 90): Promise<{ ok: true; deleted: number } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
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
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
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
      originalCreatedAt: inq.createdAt.toISOString(),
      originalUpdatedAt: inq.updatedAt.toISOString()
    }));
    
    const jsonData = JSON.stringify(archiveData, null, 2);
    
    // Delete archived inquiries from database
    await prisma.inquiry.deleteMany({
      where: {
        status: "COMPLETED",
        createdAt: { lt: cutoffDate }
      }
    });
    
    console.log(`[storage archive] Archived ${inquiries.length} inquiries older than ${days} days`);
    
    return { ok: true, archived: inquiries.length, data: jsonData };
  } catch (e) {
    console.error("[storage archive]", e);
    return { ok: false, error: "Failed to archive inquiries" };
  }
}
import { getStorageStats, exportInquiriesToArchive } from "@/app/actions/storage";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StorageManager } from "@/components/dashboard/storage-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Storage Dashboard" };

export default async function StorageDashboardPage() {
  const result = await getStorageStats();

  if (!result.ok) {
    return (
      <div>
        <h1 className="text-xl font-bold text-navy-900">Storage Dashboard</h1>
        <div className="mt-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {result.error}
        </div>
      </div>
    );
  }

  const stats = result.data;

  return (
    <div>
      <h1 className="text-xl font-bold text-navy-900">Storage Dashboard</h1>
      <p className="mt-1 text-sm text-slate-600">
        Monitor database and storage usage to optimize performance and stay within limits.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Database Size</p>
            <p className="text-2xl font-bold text-navy-900">{stats.database.totalSize}</p>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">PostgreSQL database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Storage Size</p>
            <p className="text-2xl font-bold text-navy-900">{stats.storage.totalSize}</p>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">{stats.storage.fileCount} files in {stats.storage.bucket}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Products</p>
            <p className="text-2xl font-bold text-navy-900">{stats.products.total}</p>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">{stats.products.published} published • {stats.products.totalImages} images</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Inquiries</p>
            <p className="text-2xl font-bold text-navy-900">{stats.inquiries.total}</p>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">{stats.inquiries.oldCount} older than 90 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <p className="text-sm font-bold text-navy-900">Database Tables</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.database.tables.map((table) => (
                <div key={table.name} className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <p className="text-sm font-medium text-navy-900">{table.name}</p>
                    <p className="text-xs text-slate-500">{table.rowCount.toLocaleString()} rows</p>
                  </div>
                  <Badge variant={table.sizeBytes > 10 * 1024 * 1024 ? "warning" : "default"}>
                    {table.size}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-sm font-bold text-navy-900">Inquiry Status</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <p className="text-sm font-medium text-navy-900">New</p>
                <Badge variant="warning">{stats.inquiries.new}</Badge>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <p className="text-sm font-medium text-navy-900">Contacted</p>
                <Badge variant="default">{stats.inquiries.contacted}</Badge>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <p className="text-sm font-medium text-navy-900">Completed</p>
                <Badge variant="success">{stats.inquiries.completed}</Badge>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <p className="text-sm font-medium text-navy-900">Old (90+ days)</p>
                <Badge variant={stats.inquiries.oldCount > 100 ? "warning" : "muted"}>
                  {stats.inquiries.oldCount}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-sm font-bold text-navy-900">Product Statistics</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <p className="text-sm font-medium text-navy-900">Published</p>
                <Badge variant="success">{stats.products.published}</Badge>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <p className="text-sm font-medium text-navy-900">Unpublished</p>
                <Badge variant="muted">{stats.products.unpublished}</Badge>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <p className="text-sm font-medium text-navy-900">With Images</p>
                <Badge variant="default">{stats.products.withImages}</Badge>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <p className="text-sm font-medium text-navy-900">Total Images</p>
                <Badge variant="default">{stats.products.totalImages}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

          <Card>
            <CardHeader>
              <p className="text-sm font-bold text-navy-900">Storage Recommendations</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-xs text-slate-600">
                {stats.inquiries.oldCount > 50 && (
                  <div className="rounded border border-amber-200 bg-amber-50 p-2">
                    <p className="font-semibold text-amber-900">⚠️ High Inquiry Count</p>
                    <p className="mt-1">Consider archiving or deleting {stats.inquiries.oldCount} old inquiries to save database space.</p>
                  </div>
                )}
                {stats.database.totalSizeBytes > 400 * 1024 * 1024 && (
                  <div className="rounded border border-red-200 bg-red-50 p-2">
                    <p className="font-semibold text-red-900">⚠️ Database Near Limit</p>
                    <p className="mt-1">Database is approaching 500MB limit. Implement cleanup strategies immediately.</p>
                  </div>
                )}
                {stats.products.totalImages > 2000 && (
                  <div className="rounded border border-blue-200 bg-blue-50 p-2">
                    <p className="font-semibold text-blue-900">💡 Image Storage Growing</p>
                    <p className="mt-1">Current images optimized to 600px/70% quality. For 10K+ products, consider external CDN.</p>
                  </div>
                )}
                <div className="rounded border border-green-200 bg-green-50 p-2">
                  <p className="font-semibold text-green-900">✓ Aggressive Optimization Active</p>
                  <p className="mt-1">Images: 600px max, 70% quality. Inquiries: 500char limit, fixed fields.</p>
                </div>
              </div>
            </CardContent>
          </Card>

        <StorageManager oldInquiryCount={stats.inquiries.oldCount} />
      </div>
    </div>
  );
}
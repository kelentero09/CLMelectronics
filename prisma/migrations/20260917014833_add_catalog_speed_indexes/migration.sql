-- DropIndex
DROP INDEX "products_categoryId_idx";

-- DropIndex
DROP INDEX "products_published_deletedAt_idx";

-- CreateIndex
CREATE INDEX "products_categoryId_published_deletedAt_idx" ON "products"("categoryId", "published", "deletedAt");

-- CreateIndex
CREATE INDEX "products_published_deletedAt_createdAt_idx" ON "products"("published", "deletedAt", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "products_published_deletedAt_manufacturer_idx" ON "products"("published", "deletedAt", "manufacturer");

-- Speed up case-insensitive substring search (ILIKE '%…%') on the catalog.
-- B-tree indexes can't serve leading-wildcard matches, so add trigram GIN
-- indexes; Postgres combines them with BitmapOr across the OR search terms.
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE INDEX IF NOT EXISTS "products_name_trgm_idx" ON "products" USING GIN ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "products_referenceCode_trgm_idx" ON "products" USING GIN ("referenceCode" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "products_model_trgm_idx" ON "products" USING GIN ("model" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "products_partNumber_trgm_idx" ON "products" USING GIN ("partNumber" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "products_manufacturer_trgm_idx" ON "products" USING GIN ("manufacturer" gin_trgm_ops);

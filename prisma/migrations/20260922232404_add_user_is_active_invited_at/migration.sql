-- DropIndex
DROP INDEX "products_manufacturer_trgm_idx";

-- DropIndex
DROP INDEX "products_model_trgm_idx";

-- DropIndex
DROP INDEX "products_name_trgm_idx";

-- DropIndex
DROP INDEX "products_partNumber_trgm_idx";

-- DropIndex
DROP INDEX "products_referenceCode_trgm_idx";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "invitedAt" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

/**
 * Script to re-optimize existing product images with new aggressive settings
 * Run with: npx tsx scripts/reoptimize-images.ts
 */
import { prisma } from "@/lib/db";
import { convertToWebP, deleteProductImage, uploadProductImage, storagePathFromUrl, getPublicImageUrl } from "@/lib/storage";
import sharp from "sharp";

async function reoptimizeImages() {
  console.log("Starting image re-optimization...");
  
  const images = await prisma.productImage.findMany({
    include: { product: { select: { id: true, name: true } } }
  });
  
  console.log(`Found ${images.length} images to re-optimize`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const image of images) {
    try {
      // Download current image
      const response = await fetch(image.url);
      if (!response.ok) {
        console.error(`Failed to download image ${image.id}: ${response.statusText}`);
        errorCount++;
        continue;
      }
      
      const buffer = Buffer.from(await response.arrayBuffer());
      
      // Re-optimize with new settings
      const optimizedBuffer = await sharp(buffer)
        .rotate()
        .resize({ width: 600, height: 600, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 70, effort: 4 })
        .toBuffer();
      
      // Delete old image from storage
      const oldPath = storagePathFromUrl(image.url);
      if (oldPath) {
        try {
          await deleteProductImage(oldPath);
        } catch (e) {
          console.warn(`Failed to delete old image ${image.id}:`, e);
        }
      }
      
      // Upload re-optimized image
      const { publicUrl } = await uploadProductImage({
        file: new File([optimizedBuffer], `reoptimized-${image.id}.webp`, { type: 'image/webp' }),
        productId: image.productId,
        customPath: oldPath || undefined
      });
      
      // Update database
      await prisma.productImage.update({
        where: { id: image.id },
        data: { url: publicUrl }
      });
      
      successCount++;
      console.log(`✓ Re-optimized image ${image.id} (${Math.round(buffer.length / 1024)}KB → ${Math.round(optimizedBuffer.length / 1024)}KB)`);
      
    } catch (e) {
      console.error(`✗ Failed to re-optimize image ${image.id}:`, e);
      errorCount++;
    }
  }
  
  console.log(`\nRe-optimization complete: ${successCount} succeeded, ${errorCount} failed`);
}

reoptimizeImages()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Script failed:", e);
    process.exit(1);
  });
import cron from "node-cron";
import { prisma } from "../config/prisma";

export const cleanupTempMediaJob = cron.schedule("0 2 * * *", async () => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const tempMedia = await prisma.media.findMany({
      where: {
        createdAt: { lt: yesterday },
        OR: [
          { usedFor: "OTHER" }, // Or whatever enum mapping we define for TEMP
          { folder: { contains: "blog-platform/temp" } },
        ],
        // Safety checks to ensure it's truly unlinked
        postId: null,
      },
    });

    if (tempMedia.length === 0) {
      return;
    }

    console.log(`[CRON] Cleanup temp media started. Found ${tempMedia.length} unused assets.`);

    // TODO: If Cloudinary config is present, delete from Cloudinary API first
    // For now, we simply delete the database records safely

    let deletedCount = 0;
    for (const media of tempMedia) {
      await prisma.media.delete({
        where: { id: media.id },
      });
      deletedCount++;
    }

    console.log(`[CRON] Cleanup temp media completed. Deleted: ${deletedCount}`);
  } catch (error) {
    console.error("[CRON] Error in cleanupTempMediaJob:", error);
  }
}, { scheduled: false } as any);

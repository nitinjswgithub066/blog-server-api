import cron from "node-cron";
import { prisma } from "../config/prisma";

export const publishScheduledPostsJob = cron.schedule("*/5 * * * *", async () => {
  try {
    const scheduledPosts = await prisma.post.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { lte: new Date() },
      },
    });

    if (scheduledPosts.length === 0) {
      return;
    }

    console.log(`[CRON] Found ${scheduledPosts.length} scheduled posts to publish.`);

    let publishedCount = 0;

    for (const post of scheduledPosts) {
      await prisma.$transaction(async (tx) => {
        // 1. Update post status
        await tx.post.update({
          where: { id: post.id },
          data: {
            status: "PUBLISHED",
            publishedAt: new Date(),
          },
        });

        // 2. Create internal notification
        await tx.notification.create({
          data: {
            title: "Scheduled Post Published",
            message: `"${post.title}" has been published automatically.`,
            type: "SYSTEM",
          },
        });

        // TODO: 3. Create newsletter email queue item if newsletter is enabled
      });
      publishedCount++;
    }

    console.log(`[CRON] Scheduled posts published: ${publishedCount}`);
  } catch (error) {
    console.error("[CRON] Error in publishScheduledPostsJob:", error);
  }
}, { scheduled: false } as any);

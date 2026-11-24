import cron from "node-cron";
import { PostStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { createNotificationService } from "../modules/notifications/notification.service";

export const draftReminderJob = cron.schedule("0 */6 * * *", async () => {
  try {
    const oldDrafts = await prisma.post.count({
      where: {
        status: PostStatus.DRAFT,
        updatedAt: {
          lte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      },
    });

    if (oldDrafts === 0) return;

    await createNotificationService({
      type: "draft",
      title: "Draft reminder",
      message: `${oldDrafts} draft${oldDrafts === 1 ? " is" : "s are"} waiting to be finished.`,
      metadata: { job: "draftReminder", count: oldDrafts },
    });
  } catch (error) {
    console.error("[CRON] Error in draftReminderJob:", error);
  }
}, { scheduled: false } as any);

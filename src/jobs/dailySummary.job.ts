import cron from "node-cron";
import { prisma } from "../config/prisma";
import { createNotificationService } from "../modules/notifications/notification.service";

export const dailySummaryJob = cron.schedule("0 8 * * *", async () => {
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    const summary = await prisma.analytics.aggregate({
      where: {
        date: {
          gte: start,
          lt: end,
        },
      },
      _sum: {
        views: true,
        clicks: true,
        shares: true,
      },
    });

    await createNotificationService({
      type: "system",
      title: "Daily summary",
      message: `Yesterday: ${summary._sum.views || 0} views, ${summary._sum.clicks || 0} clicks, ${summary._sum.shares || 0} shares.`,
      metadata: { job: "dailySummary", date: start.toISOString().slice(0, 10) },
    });
  } catch (error) {
    console.error("[CRON] Error in dailySummaryJob:", error);
  }
}, { scheduled: false } as any);

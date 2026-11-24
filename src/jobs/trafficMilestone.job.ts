import cron from "node-cron";
import { PostStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { createNotificationService } from "../modules/notifications/notification.service";

const milestones = [1000, 10000, 50000, 100000];
const minimumMilestone = milestones[0] ?? 1000;

export const trafficMilestoneJob = cron.schedule("30 */3 * * *", async () => {
  try {
    const posts = await prisma.post.findMany({
      where: {
        status: PostStatus.PUBLISHED,
        views: { gte: minimumMilestone },
      },
      select: { id: true, title: true, views: true },
      take: 25,
      orderBy: { views: "desc" },
    });

    for (const post of posts) {
      const milestone = milestones.filter((value) => post.views >= value).at(-1);
      if (!milestone) continue;

      const existing = await prisma.notification.findFirst({
        where: {
          type: "traffic",
          title: "Traffic milestone",
          message: { contains: post.id },
        },
      });

      if (existing) continue;

      await createNotificationService({
        type: "traffic",
        title: "Traffic milestone",
        message: `${post.title} reached ${milestone.toLocaleString()} views. Post id: ${post.id}`,
        metadata: { job: "trafficMilestone", postId: post.id, milestone },
      });
    }
  } catch (error) {
    console.error("[CRON] Error in trafficMilestoneJob:", error);
  }
}, { scheduled: false } as any);

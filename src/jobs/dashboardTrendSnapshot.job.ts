import cron from "node-cron";
import { prisma } from "../config/prisma";
import { TrendSource } from "@prisma/client";

export const dashboardTrendSnapshotJob = cron.schedule("0 */6 * * *", async () => {
  try {
    console.log("[CRON] Starting dashboardTrendSnapshotJob...");

    // V1: Internal Analytics
    // Fetch categories and aggregate their post views, clicks, shares
    const categories = await prisma.category.findMany({
      include: {
        posts: {
          select: { views: true, clicks: true, shares: true },
        },
      },
    });

    if (categories.length === 0) {
      console.log("[CRON] No categories found for trend snapshot. Skipping.");
      return;
    }

    // Get the previous snapshot to calculate growth
    const previousSnapshots = await prisma.trendSnapshot.findMany({
      where: { source: TrendSource.INTERNAL_ANALYTICS },
      orderBy: { snapshotDate: "desc" },
      take: 20, // get enough to cover all categories from last run
    });

    const previousScores = new Map(previousSnapshots.map(s => [s.category, s.score]));

    // Calculate new scores
    for (const cat of categories) {
      const score = cat.posts.reduce(
        (sum, post) => sum + post.views + (post.clicks * 2) + (post.shares * 3), 0
      );

      const previousScore = previousScores.get(cat.name) || 0;
      let growth = 0;
      if (previousScore > 0) {
        growth = ((score - previousScore) / previousScore) * 100;
      } else if (score > 0) {
        growth = 100; // baseline if it just got its first interactions
      }

      const labelMap: Record<string, string> = {
        "Artificial Intelligence": "AI",
        "Web Development": "Web Dev",
        "Technology": "Tech",
        "Programming": "Programming",
        "Startups": "Startups",
      };
      const label = labelMap[cat.name] || (cat.name.split(" ")[0] || cat.name).slice(0, 10);

      await prisma.trendSnapshot.create({
        data: {
          source: TrendSource.INTERNAL_ANALYTICS,
          category: cat.name,
          categorySlug: cat.slug,
          label,
          score,
          growth,
        },
      });
    }

    console.log("[CRON] dashboardTrendSnapshotJob completed successfully.");
  } catch (error) {
    console.error("[CRON] dashboardTrendSnapshotJob failed:", error);
  }
}, { scheduled: false } as any);

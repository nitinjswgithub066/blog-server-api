import cron from 'node-cron';
import { prisma } from '../config/prisma';

export const blogPerformanceRollupJob = cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Running Blog Performance Rollup...');
    try {
      // 1. Get current date (start of hour)
      const now = new Date();
      now.setMinutes(0, 0, 0);
      const date = new Date(now);
      date.setHours(0, 0, 0, 0); // start of day for 'date' field
      const hour = now.getHours();

      // 2. Fetch posts with views/clicks to aggregate
      const posts = await prisma.post.findMany({
        where: {
          status: 'PUBLISHED'
        },
        select: {
          id: true,
          categoryId: true,
          views: true,
          clicks: true,
          shares: true,
          readingTime: true
        }
      });

      // 3. For V1, we assume total views/clicks are current point-in-time totals.
      // A more robust system would diff against the previous hour, but we'll store snapshots.
      let totalViews = 0;
      let totalClicks = 0;
      let totalShares = 0;

      for (const post of posts) {
        totalViews += post.views;
        totalClicks += post.clicks;
        totalShares += post.shares;

        // Upsert hourly row for post (optional, depending on granularity needed)
        // Here we just insert/update a single rollup for the whole blog per hour to keep it simple,
        // or per post. Let's do per post to match the Analytics model.
        
        const existingAnalytics = await prisma.analytics.findFirst({
          where: {
            date: date,
            hour: hour,
            postId: post.id,
            source: 'INTERNAL_ANALYTICS'
          }
        });

        if (existingAnalytics) {
          await prisma.analytics.update({
            where: { id: existingAnalytics.id },
            data: {
              views: post.views,
              clicks: post.clicks,
              shares: post.shares,
              readingTime: post.readingTime,
              updatedAt: new Date()
            }
          });
        } else {
          await prisma.analytics.create({
            data: {
              date: date,
              hour: hour,
              views: post.views,
              clicks: post.clicks,
              shares: post.shares,
              readingTime: post.readingTime,
              source: 'INTERNAL_ANALYTICS',
              postId: post.id,
              categoryId: post.categoryId
            }
          });
        }
      }

      console.log("[CRON] Blog Performance Rollup complete. Analyzed " + posts.length + " posts.");
      
      // TODO: Implement Google Search Console sync
      // TODO: Implement Google Analytics (GA4) sync

    } catch (error) {
      console.error('[CRON] Blog Performance Rollup failed:', error);
    }
  });

import { sendPendingEmailsJob } from "./sendPendingEmails.job";
import { publishScheduledPostsJob } from "./publishScheduledPosts.job";
import { cleanupTempMediaJob } from "./cleanupTempMedia.job";
import { analyticsRollupJob } from "./analyticsRollup.job";
import { keepAliveJob } from "./keepAlive.job";
import { dashboardTrendSnapshotJob } from "./dashboardTrendSnapshot.job";
import { blogPerformanceRollupJob } from "./blogPerformanceRollup.job";
import { cleanupDeletedPostsJob } from "./cleanupDeletedPosts.job";

let jobsStarted = false;

export const startCronJobs = () => {
  if (jobsStarted) {
    return;
  }
  // Only start cron jobs if explicitly enabled and not in test environment
  if (process.env.NODE_ENV === "test") {
    console.log("[CRON] Skipped initialization (Test Environment).");
    return;
  }

  if (process.env.ENABLE_CRON_JOBS === "false") {
    console.log("[CRON] Skipped initialization (ENABLE_CRON_JOBS=false).");
    return;
  }

  try {
    sendPendingEmailsJob.start();
    publishScheduledPostsJob.start();
    cleanupTempMediaJob.start();
    analyticsRollupJob.start();
    dashboardTrendSnapshotJob.start();
    blogPerformanceRollupJob.start();
    cleanupDeletedPostsJob.start();
    
    if (process.env.ENABLE_DB_KEEP_ALIVE === "true") {
      keepAliveJob.start();
      console.log("[CRON] Database keep-alive job initialized.");
    }

    jobsStarted = true;

    console.log("[CRON] Cron jobs initialized successfully.");
  } catch (error) {
    console.error("[CRON] Failed to initialize cron jobs:", error);
  }
};

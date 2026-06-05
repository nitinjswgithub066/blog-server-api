import { sendPendingEmailsJob } from "./sendPendingEmails.job";
import { publishScheduledPostsJob } from "./publishScheduledPosts.job";
import { cleanupTempMediaJob } from "./cleanupTempMedia.job";
import { analyticsRollupJob } from "./analyticsRollup.job";

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
    
    jobsStarted = true;

    console.log("[CRON] Cron jobs initialized successfully.");
  } catch (error) {
    console.error("[CRON] Failed to initialize cron jobs:", error);
  }
};

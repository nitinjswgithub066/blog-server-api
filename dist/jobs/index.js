"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCronJobs = void 0;
const sendPendingEmails_job_1 = require("./sendPendingEmails.job");
const publishScheduledPosts_job_1 = require("./publishScheduledPosts.job");
const cleanupTempMedia_job_1 = require("./cleanupTempMedia.job");
const analyticsRollup_job_1 = require("./analyticsRollup.job");
let jobsStarted = false;
const startCronJobs = () => {
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
        sendPendingEmails_job_1.sendPendingEmailsJob.start();
        publishScheduledPosts_job_1.publishScheduledPostsJob.start();
        cleanupTempMedia_job_1.cleanupTempMediaJob.start();
        analyticsRollup_job_1.analyticsRollupJob.start();
        jobsStarted = true;
        console.log("[CRON] Cron jobs initialized successfully.");
    }
    catch (error) {
        console.error("[CRON] Failed to initialize cron jobs:", error);
    }
};
exports.startCronJobs = startCronJobs;
//# sourceMappingURL=index.js.map
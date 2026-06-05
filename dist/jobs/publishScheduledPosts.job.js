"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishScheduledPostsJob = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_1 = require("../config/prisma");
exports.publishScheduledPostsJob = node_cron_1.default.schedule("*/5 * * * *", async () => {
    try {
        const scheduledPosts = await prisma_1.prisma.post.findMany({
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
            await prisma_1.prisma.$transaction(async (tx) => {
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
    }
    catch (error) {
        console.error("[CRON] Error in publishScheduledPostsJob:", error);
    }
}, { scheduled: false });
//# sourceMappingURL=publishScheduledPosts.job.js.map
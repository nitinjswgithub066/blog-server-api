"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupTempMediaJob = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_1 = require("../config/prisma");
exports.cleanupTempMediaJob = node_cron_1.default.schedule("0 2 * * *", async () => {
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const tempMedia = await prisma_1.prisma.media.findMany({
            where: {
                createdAt: { lt: yesterday },
                OR: [
                    { usedFor: "OTHER" }, // Or whatever enum mapping we define for TEMP
                    { folder: { contains: "blog-platform/temp" } },
                ],
                // Safety checks to ensure it's truly unlinked
                postId: null,
            },
        });
        if (tempMedia.length === 0) {
            return;
        }
        console.log(`[CRON] Cleanup temp media started. Found ${tempMedia.length} unused assets.`);
        // TODO: If Cloudinary config is present, delete from Cloudinary API first
        // For now, we simply delete the database records safely
        let deletedCount = 0;
        for (const media of tempMedia) {
            await prisma_1.prisma.media.delete({
                where: { id: media.id },
            });
            deletedCount++;
        }
        console.log(`[CRON] Cleanup temp media completed. Deleted: ${deletedCount}`);
    }
    catch (error) {
        console.error("[CRON] Error in cleanupTempMediaJob:", error);
    }
}, { scheduled: false });
//# sourceMappingURL=cleanupTempMedia.job.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPendingEmailsJob = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_1 = require("../config/prisma");
const email_service_1 = require("../emails/email.service");
exports.sendPendingEmailsJob = node_cron_1.default.schedule("* * * * *", async () => {
    try {
        // Process limited batch size (e.g., 10 emails) to avoid overloading the server/provider
        const pendingEmails = await prisma_1.prisma.emailQueue.findMany({
            where: {
                status: "PENDING",
                OR: [
                    { scheduledFor: null },
                    { scheduledFor: { lte: new Date() } },
                ],
                attempts: { lt: prisma_1.prisma.emailQueue.fields.maxAttempts },
            },
            take: 10,
            orderBy: { createdAt: "asc" },
        });
        if (pendingEmails.length === 0) {
            return;
        }
        console.log(`[CRON] Send pending emails started. Found ${pendingEmails.length} emails.`);
        for (const email of pendingEmails) {
            // Safety check: ensure attempts haven't exceeded maxAttempts due to race conditions
            if (email.attempts >= email.maxAttempts) {
                await prisma_1.prisma.emailQueue.update({
                    where: { id: email.id },
                    data: { status: "FAILED" },
                });
                continue;
            }
            await email_service_1.emailService.processPendingEmail(email);
        }
        console.log(`[CRON] Send pending emails completed.`);
    }
    catch (error) {
        console.error("[CRON] Error in sendPendingEmailsJob:", error);
        // Do not crash server
    }
}, { scheduled: false });
//# sourceMappingURL=sendPendingEmails.job.js.map
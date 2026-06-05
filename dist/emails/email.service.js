"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const prisma_1 = require("../config/prisma");
exports.emailService = {
    /**
     * Queue an email to be sent later by the cron job
     */
    async queueEmail(options) {
        try {
            await prisma_1.prisma.emailQueue.create({
                data: {
                    toEmail: options.to,
                    subject: options.subject,
                    htmlBody: options.html,
                    textBody: options.text || null,
                    type: options.type,
                    scheduledFor: options.scheduledFor || null,
                },
            });
            console.log(`[EMAIL SERVICE] Email queued successfully for ${options.to}`);
        }
        catch (error) {
            console.error("[EMAIL SERVICE] Error queuing email:", error);
            // Safe fail - don't crash the server
        }
    },
    /**
     * Attempt to send an email immediately
     */
    async sendEmailNow(options) {
        try {
            // TODO: Implement actual SMTP/Provider (e.g. Resend, SendGrid) credentials check here
            const isProviderConfigured = false;
            if (!isProviderConfigured) {
                console.warn(`[EMAIL SERVICE] Warning: Email provider not configured. Skipping email to ${options.to}`);
                return "NOT_CONFIGURED";
            }
            console.log(`[EMAIL SERVICE] Email sent successfully to ${options.to}`);
            return true;
        }
        catch (error) {
            console.error("[EMAIL SERVICE] Error sending email now:", error);
            return false;
        }
    },
    /**
     * Process a single pending email from the queue
     */
    async processPendingEmail(emailQueueRecord) {
        try {
            const sent = await this.sendEmailNow({
                to: emailQueueRecord.toEmail,
                subject: emailQueueRecord.subject,
                html: emailQueueRecord.htmlBody,
                text: emailQueueRecord.textBody,
                type: emailQueueRecord.type,
            });
            if (sent === "NOT_CONFIGURED") {
                // Leave status as PENDING and do not increment attempts
                await prisma_1.prisma.emailQueue.update({
                    where: { id: emailQueueRecord.id },
                    data: { lastError: "Email provider not configured, skipping pending emails" },
                });
            }
            else if (sent === true) {
                await prisma_1.prisma.$transaction([
                    prisma_1.prisma.emailQueue.update({
                        where: { id: emailQueueRecord.id },
                        data: { status: "SENT", sentAt: new Date() },
                    }),
                    prisma_1.prisma.emailLog.create({
                        data: {
                            toEmail: emailQueueRecord.toEmail,
                            subject: emailQueueRecord.subject,
                            type: emailQueueRecord.type,
                            status: "SENT",
                            sentAt: new Date(),
                            provider: "PLACEHOLDER", // Replace with real provider
                        },
                    }),
                ]);
            }
            else {
                // Actual failure
                await prisma_1.prisma.emailQueue.update({
                    where: { id: emailQueueRecord.id },
                    data: {
                        attempts: { increment: 1 },
                        status: emailQueueRecord.attempts + 1 >= emailQueueRecord.maxAttempts ? "FAILED" : "PENDING",
                        lastError: "Email sending failed",
                    },
                });
            }
        }
        catch (error) {
            console.error(`[EMAIL SERVICE] Failed to process email queue record ${emailQueueRecord.id}:`, error);
            await prisma_1.prisma.emailQueue.update({
                where: { id: emailQueueRecord.id },
                data: {
                    attempts: { increment: 1 },
                    lastError: error.message || "Unknown error",
                },
            });
        }
    },
};
//# sourceMappingURL=email.service.js.map
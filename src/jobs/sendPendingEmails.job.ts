import cron from "node-cron";
import { prisma } from "../config/prisma";
import { emailService } from "../emails/email.service";

export const sendPendingEmailsJob = cron.schedule("* * * * *", async () => {
  try {
    // Process limited batch size (e.g., 10 emails) to avoid overloading the server/provider
    const pendingEmails = await prisma.emailQueue.findMany({
      where: {
        status: "PENDING",
        OR: [
          { scheduledFor: null },
          { scheduledFor: { lte: new Date() } },
        ],
        attempts: { lt: prisma.emailQueue.fields.maxAttempts },
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
        await prisma.emailQueue.update({
          where: { id: email.id },
          data: { status: "FAILED" },
        });
        continue;
      }

      await emailService.processPendingEmail(email);
    }

    console.log(`[CRON] Send pending emails completed.`);
  } catch (error) {
    console.error("[CRON] Error in sendPendingEmailsJob:", error);
    // Do not crash server
  }
}, { scheduled: false } as any);

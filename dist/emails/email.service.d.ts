import { EmailType } from "@prisma/client";
import { SendEmailOptions } from "./email.types";
export declare const emailService: {
    /**
     * Queue an email to be sent later by the cron job
     */
    queueEmail(options: SendEmailOptions & {
        type: EmailType;
        scheduledFor?: Date;
    }): Promise<void>;
    /**
     * Attempt to send an email immediately
     */
    sendEmailNow(options: SendEmailOptions): Promise<boolean | "NOT_CONFIGURED">;
    /**
     * Process a single pending email from the queue
     */
    processPendingEmail(emailQueueRecord: any): Promise<void>;
};
//# sourceMappingURL=email.service.d.ts.map
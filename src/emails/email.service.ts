import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { EmailQueue, EmailType, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { SendEmailOptions } from "./email.types";

type SendEmailResult =
  | { status: "SENT"; providerMessageId?: string }
  | { status: "NOT_CONFIGURED" };

let cachedTransporter: Transporter | null = null;
let warnedMissingConfig = false;

const isSmtpConfigured = () => {
  return (
    process.env.EMAIL_PROVIDER === "smtp" &&
    !!process.env.SMTP_HOST &&
    !!process.env.SMTP_PORT &&
    !!process.env.SMTP_SECURE &&
    !!process.env.SMTP_USER &&
    !!process.env.SMTP_PASS &&
    !!process.env.EMAIL_FROM
  );
};

const getTransporter = () => {
  if (!isSmtpConfigured()) {
    if (!warnedMissingConfig) {
      console.warn("[EMAIL SERVICE] SMTP is not fully configured. Pending emails will remain queued.");
      warnedMissingConfig = true;
    }
    return null;
  }

  if (cachedTransporter) return cachedTransporter;

  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return cachedTransporter;
};

const buildLastError = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "Email sending failed";
};

export const emailService = {
  async queueEmail(options: SendEmailOptions & { type: EmailType; scheduledFor?: Date }) {
    try {
      await prisma.emailQueue.create({
        data: {
          toEmail: options.to,
          toName: options.toName || null,
          replyToEmail: options.replyTo || null,
          subject: options.subject,
          htmlBody: options.html,
          textBody: options.text || null,
          type: options.type,
          scheduledFor: options.scheduledFor || null,
        },
      });
      console.log(`[EMAIL SERVICE] Email queued successfully for ${options.to}`);
    } catch (error) {
      console.error("[EMAIL SERVICE] Error queuing email:", error);
    }
  },

  async sendEmailNow(options: SendEmailOptions): Promise<SendEmailResult> {
    const transporter = getTransporter();
    if (!transporter) {
      return { status: "NOT_CONFIGURED" };
    }

    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: options.toName ? { name: options.toName, address: options.to } : options.to,
      replyTo: options.replyTo,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log(`[EMAIL SERVICE] Email sent successfully to ${options.to}`);
    return { status: "SENT", providerMessageId: result.messageId };
  },

  async processPendingEmail(emailQueueRecord: EmailQueue) {
    try {
      const sendOptions: SendEmailOptions = {
        to: emailQueueRecord.toEmail,
        subject: emailQueueRecord.subject,
        html: emailQueueRecord.htmlBody,
        type: emailQueueRecord.type,
      };

      if (emailQueueRecord.toName) sendOptions.toName = emailQueueRecord.toName;
      if (emailQueueRecord.replyToEmail) sendOptions.replyTo = emailQueueRecord.replyToEmail;
      if (emailQueueRecord.textBody) sendOptions.text = emailQueueRecord.textBody;

      const sent = await this.sendEmailNow(sendOptions);

      if (sent.status === "NOT_CONFIGURED") {
        return;
      }

      await prisma.$transaction([
        prisma.emailQueue.update({
          where: { id: emailQueueRecord.id },
          data: { status: "SENT", sentAt: new Date(), lastError: null },
        }),
        prisma.emailLog.create({
          data: {
            toEmail: emailQueueRecord.toEmail,
            replyToEmail: emailQueueRecord.replyToEmail,
            subject: emailQueueRecord.subject,
            type: emailQueueRecord.type,
            status: "SENT",
            sentAt: new Date(),
            provider: "SMTP",
            providerMessageId: sent.providerMessageId || null,
          },
        }),
      ]);
    } catch (error) {
      const lastError = buildLastError(error);
      const nextAttempts = emailQueueRecord.attempts + 1;
      const nextStatus = nextAttempts >= emailQueueRecord.maxAttempts ? "FAILED" : "PENDING";

      const operations: Prisma.PrismaPromise<any>[] = [
        prisma.emailQueue.update({
          where: { id: emailQueueRecord.id },
          data: {
            attempts: nextAttempts,
            status: nextStatus,
            lastError,
          },
        }),
      ];

      if (nextStatus === "FAILED") {
        operations.push(
          prisma.emailLog.create({
            data: {
              toEmail: emailQueueRecord.toEmail,
              replyToEmail: emailQueueRecord.replyToEmail,
              subject: emailQueueRecord.subject,
              type: emailQueueRecord.type,
              status: "FAILED",
              provider: "SMTP",
              errorMessage: lastError,
            },
          })
        );
      }

      await prisma.$transaction(operations);
      console.error(`[EMAIL SERVICE] Failed to process email queue record ${emailQueueRecord.id}:`, lastError);
    }
  },
};

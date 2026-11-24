import { ContactStatus, EmailType } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { emailService } from "../../emails/email.service";
import { createNotificationService } from "../notifications/notification.service";

export type CreateContactMessagePayload = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  pageUrl?: string;
  ipAddress?: string;
  userAgent?: string;
};

const getAdminAlertEmail = () =>
  process.env.ADMIN_ALERT_EMAIL || process.env.ADMIN_EMAIL || process.env.EMAIL_FROM || process.env.SMTP_USER;

export const createContactMessageService = async (payload: CreateContactMessagePayload) => {
  const name = payload.name?.trim();
  const email = payload.email?.trim().toLowerCase();
  const subject = payload.subject?.trim();
  const message = payload.message?.trim();

  if (!name) throw new Error("Name is required.");
  if (!email) throw new Error("Email is required.");
  if (!subject) throw new Error("Subject is required.");
  if (!message) throw new Error("Message is required.");

  const contactMessage = await prisma.contactMessage.create({
    data: {
      name,
      email,
      subject,
      message,
      pageUrl: payload.pageUrl || null,
      ipAddress: payload.ipAddress || null,
      userAgent: payload.userAgent || null,
    },
  });

  await createNotificationService({
    type: "contact",
    title: "New contact message received",
    message: `${name} sent: ${subject}`,
    metadata: { contactMessageId: contactMessage.id, email },
  });

  const adminEmail = getAdminAlertEmail();
  if (adminEmail) {
    await emailService.queueEmail({
      to: adminEmail,
      replyTo: email,
      subject: "New contact message received",
      html: `
        <h2>New contact message received</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p>${message.replace(/\n/g, "<br />")}</p>
      `,
      text: `New contact message received\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
      type: EmailType.CONTACT_ALERT,
    });
  }

  return contactMessage;
};

export const getContactMessagesService = async () =>
  prisma.contactMessage.findMany({
    where: { isArchived: false } as any,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

export const getContactMessageByIdService = async (id: string) =>
  prisma.contactMessage.findUnique({ where: { id } });

export const getUnreadContactMessageCountService = async () =>
  prisma.contactMessage.count({
    where: {
      status: ContactStatus.UNREAD,
      isArchived: false,
    } as any,
  });

export const markContactMessageReadService = async (id: string) =>
  prisma.contactMessage.update({
    where: { id },
    data: { status: ContactStatus.READ },
  });

export const markAllContactMessagesReadService = async () =>
  prisma.contactMessage.updateMany({
    where: {
      status: ContactStatus.UNREAD,
      isArchived: false,
    } as any,
    data: { status: ContactStatus.READ },
  });

export const archiveContactMessageService = async (id: string) =>
  prisma.contactMessage.update({
    where: { id },
    data: { isArchived: true } as any,
  });

export const restoreContactMessageService = async (id: string) =>
  prisma.contactMessage.update({
    where: { id },
    data: { isArchived: false } as any,
  });

export const deleteContactMessageService = async (id: string) =>
  prisma.contactMessage.delete({ where: { id } });
